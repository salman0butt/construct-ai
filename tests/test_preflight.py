import importlib.util
import subprocess
import sys
import unittest
from pathlib import Path
from unittest.mock import patch

spec = importlib.util.spec_from_file_location('preflight', Path(__file__).resolve().parents[1] / 'scripts' / 'preflight.py')
preflight = importlib.util.module_from_spec(spec)
sys.modules[spec.name] = preflight
spec.loader.exec_module(preflight)


class PreflightTests(unittest.TestCase):
    @patch.object(preflight.shutil, 'which', return_value=None)
    def test_missing_tool_fails_without_running(self, _which):
        with patch.object(preflight.subprocess, 'run') as run:
            self.assertEqual(preflight.probe('node', ['node', '-v']).state, 'FAIL')
            run.assert_not_called()

    @patch.object(preflight.shutil, 'which', return_value='/bin/tool')
    @patch.object(preflight.subprocess, 'run')
    def test_nonzero_and_timeout_fail(self, run, _which):
        run.return_value = subprocess.CompletedProcess([], 1, '', 'secret')
        result = preflight.probe('docker', ['docker', 'info'])
        self.assertEqual(result.state, 'FAIL')
        self.assertNotIn('secret', result.detail)
        run.side_effect = subprocess.TimeoutExpired([], 5)
        self.assertEqual(preflight.probe('docker', ['docker', 'info']).state, 'FAIL')

    @patch.object(preflight.shutil, 'which', return_value='/bin/tool')
    @patch.object(preflight.subprocess, 'run')
    def test_success_reports_version(self, run, _which):
        run.return_value = subprocess.CompletedProcess([], 0, 'v22.16.0\n', '')
        self.assertEqual(preflight.probe('node', ['node', '-v']).detail, 'v22.16.0')

    def test_optional_and_warning_do_not_fail_gate(self):
        self.assertEqual(preflight.exit_code([preflight.Check('port', 'WARN', 'busy'), preflight.Check('ollama', 'OPTIONAL', 'absent')]), 0)
        self.assertEqual(preflight.exit_code([preflight.Check('node', 'FAIL', 'missing')]), 1)

    def test_redis_can_use_compose(self):
        with patch.object(preflight, 'probe', side_effect=[preflight.Check('redis', 'FAIL', 'missing'), preflight.Check('compose', 'PASS', 'v2')]):
            self.assertEqual(preflight.redis_check().state, 'PASS')
        with patch.object(preflight, 'probe', side_effect=[preflight.Check('redis', 'FAIL', 'missing'), preflight.Check('compose', 'FAIL', 'missing')]):
            self.assertEqual(preflight.redis_check().state, 'FAIL')


if __name__ == '__main__':
    unittest.main()
