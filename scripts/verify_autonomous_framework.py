"""Check durable governance structure; does not verify application behavior."""
from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
required = [
    "README.md", "AGENTS.md", "CODEX-START-HERE.md", "docs/PRD.md",
    "docs/ARCHITECTURE.md", "docs/AUTONOMOUS-DEVELOPMENT.md",
    "docs/progress/STATUS.md", "docs/progress/KNOWN-ISSUES.md",
    "docs/progress/TEST-MATRIX.md", "docs/milestones/CURRENT.md",
    "docs/requirements/TRACEABILITY.md", "docs/iterations/ITERATION-ROADMAP.md",
]
errors = [f"Missing {p}" for p in required if not (ROOT / p).is_file()]
if not errors:
    status = (ROOT / "docs/progress/STATUS.md").read_text()
    if len(re.findall(r"^Exact next work:", status, re.M)) != 1:
        errors.append("STATUS must have exactly one Exact next work: field")
    if "CI status:" not in status:
        errors.append("Missing verification status")
    current = (ROOT / "docs/milestones/CURRENT.md").read_text()
    for target in re.findall(r"\]\(([^)]+)\)", current):
        if not (ROOT / "docs/milestones" / target).is_file():
            errors.append(f"Broken current milestone link: {target}")
    trace = (ROOT / "docs/requirements/TRACEABILITY.md").read_text()
    prd = (ROOT / "docs/PRD.md").read_text()
    for req in set(re.findall(r"\*\*(R\d{2}) ", prd)):
        if f"| {req} |" not in trace:
            errors.append(f"Unmapped requirement {req}")
if errors:
    print("\n".join(errors), file=sys.stderr)
    sys.exit(1)
print("Governance structure verified; runtime checks are separate.")
