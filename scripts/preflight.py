#!/usr/bin/env python3
"""Read-only prerequisite checks; no installs, service starts or cloud calls."""
import re
import shutil
import socket
import subprocess
from dataclasses import dataclass


@dataclass(frozen=True)
class Check:
    name: str
    state: str
    detail: str


def probe(name, command, timeout=8):
    if not shutil.which(command[0]):
        return Check(name, 'FAIL', f'{command[0]} not found on PATH')
    try:
        result = subprocess.run(command, capture_output=True, text=True, timeout=timeout, check=False)
    except subprocess.TimeoutExpired:
        return Check(name, 'FAIL', 'command timed out')
    except OSError:
        return Check(name, 'FAIL', 'command could not be executed')
    if result.returncode != 0:
        return Check(name, 'FAIL', f'command exited {result.returncode}')
    lines = result.stdout.strip().splitlines()
    return Check(name, 'PASS', lines[0][:160] if lines else 'available')


def node_check():
    result = probe('Node', ['node', '-v'])
    if result.state != 'PASS':
        return result
    if not re.fullmatch(r'v24\.\d+\.\d+', result.detail):
        return Check('Node', 'FAIL', 'Node 24 stable is required by package.json engines')
    return result


def redis_check():
    native = probe('Redis', ['redis-server', '--version'])
    if native.state == 'PASS':
        return native
    compose = probe('Docker Compose', ['docker', 'compose', 'version'])
    if compose.state == 'PASS':
        return Check('Redis', 'PASS', 'Docker Compose available; Redis service not started')
    return Check('Redis', 'FAIL', 'install redis-server or Docker Compose')


def port_check(port):
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
            sock.bind(('127.0.0.1', port))
    except OSError:
        return Check(f'Port {port}', 'WARN', 'unavailable; inspect existing listener or choose another port')
    return Check(f'Port {port}', 'PASS', 'loopback available at check time')


def exit_code(checks):
    return int(any(check.state == 'FAIL' for check in checks))


def main():
    checks = [probe('Git', ['git', '--version']), node_check(),
              probe('pnpm', ['pnpm', '--version']), probe('Docker', ['docker', '--version']),
              probe('Docker daemon', ['docker', 'info', '--format', '{{.ServerVersion}}']),
              probe('Supabase CLI', ['supabase', '--version']),
              probe('PostgreSQL client', ['psql', '--version']), redis_check()]
    checks.extend(port_check(port) for port in (3000, 4000, 6379))
    ollama = probe('Ollama', ['ollama', '--version'])
    checks.append(ollama if ollama.state == 'PASS' else Check('Ollama', 'OPTIONAL', 'not required for mock mode'))
    for check in checks:
        print(f'{check.state:8} {check.name}: {check.detail}')
    print('Check package compatibility and actual Supabase ports separately. No services were started.')
    return exit_code(checks)


if __name__ == '__main__':
    raise SystemExit(main())
