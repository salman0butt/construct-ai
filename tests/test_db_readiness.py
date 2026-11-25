import importlib.util
import json
import os
import subprocess
import unittest
from pathlib import Path
from unittest.mock import patch

spec = importlib.util.spec_from_file_location('db_readiness', Path(__file__).resolve().parents[1] / 'scripts/db_readiness.py')
db = importlib.util.module_from_spec(spec)
spec.loader.exec_module(db)

URI = 'postgresql://app:local%3Asecret@localhost:54322/postgres?schema=construct_ai'
GREEN = dict(schema_exists=True, vector_installed=True, restricted_role=True, schema_usage=True, browser_roles_denied=True)


class DatabaseReadinessTests(unittest.TestCase):
    def test_nonlocal_or_ambiguous_uri_never_launches_psql(self):
        for uri in (None, 'postgresql://app:pw@evil.test:5432/db',
                    'postgresql://app:pw@localhost:54322/db?host=evil.test',
                    'postgresql://app:pw@localhost:54322/db#x',
                    'postgresql://app:pw@localhost:0/db',
                    'postgresql://app:pw@localhost:54322/db?schema=public',
                    'postgresql://app:p%0Aw@localhost:54322/db'):
            with self.subTest(uri=uri), patch.object(db.subprocess, 'run') as run:
                result = db.check_database(uri)
                self.assertFalse(result['ready'])
                run.assert_not_called()

    def test_query_uses_read_only_local_connection_and_private_password_file(self):
        seen = []
        def run(argv, **kwargs):
            env = kwargs['env']
            self.assertEqual(env['PGHOSTADDR'], '127.0.0.1')
            self.assertEqual(env['PGPORT'], '54322')
            self.assertEqual(env['PGUSER'], 'app')
            self.assertEqual(env['PGDATABASE'], 'postgres')
            self.assertIn('default_transaction_read_only=on', env['PGOPTIONS'])
            self.assertNotIn('PGSERVICE', env)
            self.assertNotIn('PGPASSWORD', env)
            self.assertNotIn('local:secret', ' '.join(argv))
            self.assertIn('-X', argv)
            self.assertIn('-w', argv)
            self.assertEqual(kwargs['timeout'], 10)
            path = Path(env['PGPASSFILE'])
            seen.append(path)
            self.assertEqual(path.stat().st_mode & 0o777, 0o600)
            self.assertEqual(path.read_text(), '127.0.0.1:54322:postgres:app:local\\:secret\n')
            return subprocess.CompletedProcess(argv, 0, json.dumps(GREEN), '')
        with patch.dict(os.environ, {'PGSERVICE': 'remote', 'PGPASSWORD': 'other-secret'}), patch.object(db.subprocess, 'run', side_effect=run):
            self.assertTrue(db.check_database(URI)['ready'])
        self.assertEqual(len(seen), 1)
        self.assertFalse(seen[0].exists())

    def test_every_required_check_must_be_true(self):
        for field in GREEN:
            with self.subTest(field=field), patch.object(db.subprocess, 'run', return_value=subprocess.CompletedProcess([], 0, json.dumps({**GREEN, field: False}), '')):
                result = db.check_database(URI)
                self.assertFalse(result['ready'])
                self.assertIn(field, result['failed'])

    def test_malformed_result_fails_closed(self):
        for value in ('not-json', '{}', '[]', json.dumps({**GREEN, 'schema_exists': 'true'}), json.dumps({**GREEN, 'extra': True})):
            with self.subTest(value=value), patch.object(db.subprocess, 'run', return_value=subprocess.CompletedProcess([], 0, value, '')):
                self.assertFalse(db.check_database(URI)['ready'])

    def test_query_error_does_not_expose_stderr(self):
        with patch.object(db.subprocess, 'run', return_value=subprocess.CompletedProcess([], 2, '', 'local:secret')):
            result = db.check_database(URI)
            self.assertFalse(result['ready'])
            self.assertNotIn('local:secret', json.dumps(result))

    def test_missing_client_and_timeout_fail_closed(self):
        for error in (FileNotFoundError(), subprocess.TimeoutExpired(['psql'], 10)):
            with self.subTest(error=error), patch.object(db.subprocess, 'run', side_effect=error):
                self.assertFalse(db.check_database(URI)['ready'])


if __name__ == '__main__':
    unittest.main()
