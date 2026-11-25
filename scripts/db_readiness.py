"""Read-only local PostgreSQL foundation diagnostic; no migrations or writes."""
import json
import os
import re
import subprocess
import tempfile
from pathlib import Path
from urllib.parse import unquote, urlsplit

CHECKS = (
    'schema_exists', 'vector_installed', 'restricted_role',
    'schema_usage', 'browser_roles_denied',
)

# Catalog-only query; schema privilege checks include inherited and PUBLIC grants.
SQL = """
WITH app AS (
    SELECT oid, nspowner FROM pg_catalog.pg_namespace WHERE nspname = 'construct_ai'
)
SELECT pg_catalog.json_build_object(
    'schema_exists', EXISTS (SELECT 1 FROM app),
    'vector_installed', EXISTS (SELECT 1 FROM pg_catalog.pg_extension WHERE extname = 'vector'),
    'restricted_role', NOT EXISTS (
        SELECT 1 FROM pg_catalog.pg_roles r
        WHERE (r.rolsuper OR r.rolbypassrls OR r.rolcreaterole OR r.rolcreatedb OR r.rolreplication)
          AND pg_catalog.pg_has_role(r.oid, 'MEMBER')
    ) AND EXISTS (
        SELECT 1 FROM app WHERE NOT pg_catalog.pg_has_role(nspowner, 'MEMBER')
          AND NOT pg_catalog.has_schema_privilege(oid, 'CREATE')
    ),
    'schema_usage', EXISTS (SELECT 1 FROM app WHERE pg_catalog.has_schema_privilege(oid, 'USAGE')),
    'browser_roles_denied', (
        SELECT count(*) = 2 AND coalesce(bool_and(
            NOT pg_catalog.has_schema_privilege(r.oid, app.oid, 'USAGE')
            AND NOT pg_catalog.has_schema_privilege(r.oid, app.oid, 'CREATE')
        ), false)
        FROM app CROSS JOIN pg_catalog.pg_roles r
        WHERE r.rolname IN ('anon', 'authenticated')
    )
);
"""


def local_connection(uri):
    if not uri or re.search(r'[\s\\#]', uri):
        return None
    try:
        url = urlsplit(uri)
        if (url.scheme not in ('postgres', 'postgresql') or
                url.hostname not in ('127.0.0.1', 'localhost') or
                not url.port or ('?' in uri and url.query != 'schema=construct_ai')):
            return None
        user = unquote(url.username or '', errors='strict')
        password = unquote(url.password or '', errors='strict')
        database = url.path.removeprefix('/')
        if (not re.fullmatch(r'[A-Za-z_][A-Za-z0-9_-]*', user) or
                not re.fullmatch(r'[A-Za-z0-9_-]+', database) or
                not password or re.search(r'[\x00-\x1f\x7f]', password)):
            return None
        return str(url.port), database, user, password
    except (ValueError, UnicodeError):
        return None


def fail(reason):
    return {'ready': False, 'failed': [reason]}


def check_database(uri):
    connection = local_connection(uri)
    if connection is None:
        return fail('invalid_local_database_url')
    port, database, user, password = connection
    try:
        with tempfile.TemporaryDirectory(prefix='construct-db-') as directory:
            path = Path(directory) / 'pgpass'
            escaped = password.replace('\\', '\\\\').replace(':', '\\:')
            fd = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
            with os.fdopen(fd, 'w', encoding='utf-8') as stream:
                stream.write(f'127.0.0.1:{port}:{database}:{user}:{escaped}\n')
            env = {
                'PATH': os.environ.get('PATH', os.defpath), 'LC_ALL': 'C',
                'PGHOST': '127.0.0.1', 'PGHOSTADDR': '127.0.0.1',
                'PGPORT': port, 'PGDATABASE': database, 'PGUSER': user,
                'PGPASSFILE': str(path), 'PGCONNECT_TIMEOUT': '3',
                'PGSSLMODE': 'disable',
                'PGOPTIONS': '-c default_transaction_read_only=on -c statement_timeout=5000 -c search_path=pg_catalog',
            }
            result = subprocess.run(
                ['psql', '-X', '-w', '-q', '-A', '-t', '-v', 'ON_ERROR_STOP=1', '-c', SQL],
                env=env, capture_output=True, text=True, timeout=10, check=False,
            )
    except FileNotFoundError:
        return fail('psql_unavailable')
    except (OSError, subprocess.TimeoutExpired, UnicodeError):
        return fail('database_probe_failed')
    if result.returncode != 0:
        return fail('database_query_failed')
    try:
        values = json.loads(result.stdout)
    except (ValueError, TypeError):
        return fail('invalid_probe_response')
    if (not isinstance(values, dict) or set(values) != set(CHECKS) or
            any(type(values[key]) is not bool for key in CHECKS)):
        return fail('invalid_probe_response')
    failed = [key for key in CHECKS if not values[key]]
    return {'ready': not failed, 'failed': failed}


if __name__ == '__main__':
    outcome = check_database(os.environ.get('DATABASE_URL'))
    print(json.dumps(outcome))
    raise SystemExit(0 if outcome['ready'] else 1)
