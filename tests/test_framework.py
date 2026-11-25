import shutil
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

SCRIPT = Path(__file__).resolve().parents[1] / 'scripts/verify_autonomous_framework.py'


class FrameworkTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        for path in ('README.md', 'AGENTS.md', 'CODEX-START-HERE.md',
                     'docs/ARCHITECTURE.md', 'docs/AUTONOMOUS-DEVELOPMENT.md',
                     'docs/progress/KNOWN-ISSUES.md', 'docs/progress/TEST-MATRIX.md',
                     'docs/iterations/ITERATION-ROADMAP.md'):
            self.put(path, '# Test fixture\n')
        self.put('docs/PRD.md', '- **R00 Foundation:** example\n')
        self.put('docs/progress/STATUS.md', 'Current milestone: M00 — Foundation\nCI status: NOT RUN\nExact next work: verify setup\n')
        self.put('docs/milestones/CURRENT.md', 'M00 — Foundation (ACTIVE).\nLedger: [M00](M00-foundation.md).\nSpec: [spec](../superpowers/specs/foundation.md).\nPlan: [plan](../superpowers/plans/foundation.md).\n')
        self.put('docs/milestones/M00-foundation.md', '# M00 — Foundation\n')
        self.put('docs/superpowers/specs/foundation.md', '# Spec\n')
        self.put('docs/superpowers/plans/foundation.md', '# Plan\n')
        self.row = '| R00 | M00 | Spec | Pending | Pending | Not run | ACTIVE |\n'
        self.put('docs/requirements/TRACEABILITY.md', self.row)
        (self.root / 'scripts').mkdir()
        shutil.copyfile(SCRIPT, self.root / 'scripts/verify_autonomous_framework.py')

    def put(self, path, text):
        target = self.root / path
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(text, encoding='utf-8')

    def run_checker(self):
        return subprocess.run([sys.executable, str(self.root / 'scripts/verify_autonomous_framework.py')], capture_output=True, text=True, check=False)

    def assert_rejected(self, message):
        result = self.run_checker()
        self.assertNotEqual(result.returncode, 0, result.stdout)
        self.assertIn(message, result.stderr)

    def test_valid(self):
        self.assertEqual(self.run_checker().returncode, 0)

    def test_duplicate_mapping(self):
        self.put('docs/requirements/TRACEABILITY.md', self.row * 2)
        self.assert_rejected('Duplicate traceability')

    def test_nonexistent_milestone(self):
        self.put('docs/requirements/TRACEABILITY.md', self.row.replace('M00', 'M99'))
        self.assert_rejected('Unknown milestone M99')

    def test_stale_current_milestone(self):
        self.put('docs/progress/STATUS.md', 'Current milestone: M01 — Wrong\nCI status: NOT RUN\nExact next work: verify setup\n')
        self.assert_rejected('Current milestone mismatch')

    def test_missing_plan_link(self):
        (self.root / 'docs/superpowers/plans/foundation.md').unlink()
        self.assert_rejected('Broken current milestone link')

    def test_empty_next_work(self):
        self.put('docs/progress/STATUS.md', 'Current milestone: M00 — Foundation\nCI status: NOT RUN\nExact next work:   \n')
        self.assert_rejected('nonempty Exact next work')

    def test_unmapped_requirement(self):
        self.put('docs/requirements/TRACEABILITY.md', '')
        self.assert_rejected('Unmapped requirement R00')

    def test_empty_prd(self):
        self.put('docs/PRD.md', '# Empty\n')
        self.assert_rejected('No requirement IDs')
