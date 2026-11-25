import contextlib
import io
import unittest
from unittest.mock import patch
from test_preflight import preflight


class PreflightReviewTests(unittest.TestCase):
    def run_gate(self, node_version='v24.1.0', psql_available=True):
        def probe(name, command):
            if command[0] == 'node':
                return preflight.Check(name, 'PASS', node_version)
            if command[0] == 'psql' and not psql_available:
                return preflight.Check(name, 'FAIL', 'psql not found on PATH')
            return preflight.Check(name, 'PASS', 'available')

        output = io.StringIO()
        with patch.object(preflight, 'probe', side_effect=probe), \
                patch.object(preflight, 'port_check', side_effect=lambda port: preflight.Check(str(port), 'PASS', 'available')), \
                contextlib.redirect_stdout(output):
            code = preflight.main()
        return code, output.getvalue()

    def test_supported_node_and_psql_pass(self):
        code, output = self.run_gate()
        self.assertEqual(code, 0)
        self.assertIn('PostgreSQL client', output)

    def test_wrong_node_major_fails(self):
        for version in ('v22.16.0', 'v25.0.0', 'v240.0.0'):
            with self.subTest(version=version):
                code, output = self.run_gate(node_version=version)
                self.assertEqual(code, 1)
                self.assertIn('FAIL     Node:', output)

    def test_unrecognized_or_prerelease_node_version_fails(self):
        for version in ('available', 'v24.0.0-rc.1', 'v24.invalid'):
            with self.subTest(version=version):
                self.assertEqual(self.run_gate(node_version=version)[0], 1)

    def test_missing_postgresql_client_fails(self):
        code, output = self.run_gate(psql_available=False)
        self.assertEqual(code, 1)
        self.assertIn('FAIL     PostgreSQL client:', output)
