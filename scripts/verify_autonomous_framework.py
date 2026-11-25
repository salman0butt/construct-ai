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
    next_items = re.findall(r"^Exact next work:([^\n]*)", status, re.M)
    if len(next_items) != 1 or not next_items[0].strip():
        errors.append("STATUS must have exactly one nonempty Exact next work: field")
    if "CI status:" not in status:
        errors.append("Missing verification status")
    current = (ROOT / "docs/milestones/CURRENT.md").read_text()
    status_id = re.search(r"^Current milestone: (M\d{2})\b", status, re.M)
    current_id = re.search(r"^(M\d{2})\b", current, re.M)
    if not status_id or not current_id or status_id[1] != current_id[1]:
        errors.append("Current milestone mismatch between STATUS and CURRENT")
    for target in re.findall(r"\]\(([^)]+)\)", current):
        if not (ROOT / "docs/milestones" / target).is_file():
            errors.append(f"Broken current milestone link: {target}")
    trace = (ROOT / "docs/requirements/TRACEABILITY.md").read_text()
    prd = (ROOT / "docs/PRD.md").read_text()
    requirements = set(re.findall(r"\*\*(R\d{2}) ", prd))
    if not requirements:
        errors.append("No requirement IDs in PRD")
    mapped = set()
    milestones = {p.name.split("-")[0] for p in (ROOT / "docs/milestones").glob("M[0-9][0-9]-*.md")}
    for line in trace.splitlines():
        row = re.match(r"^\|\s*(R\d{2})\s*\|([^|]*)\|", line)
        if not row:
            continue
        req, references = row.groups()
        if req in mapped:
            errors.append(f"Duplicate traceability mapping {req}")
        mapped.add(req)
        if req not in requirements:
            errors.append(f"Unknown requirement {req}")
        ids = [item.strip() for item in references.split(",")]
        for milestone in ids:
            if milestone not in milestones:
                errors.append(f"Unknown milestone {milestone} for {req}")
    for req in sorted(requirements - mapped):
        errors.append(f"Unmapped requirement {req}")
if errors:
    print("\n".join(errors), file=sys.stderr)
    sys.exit(1)
print("Governance structure verified; runtime checks are separate.")
