# Local setup

Clone and check out feat/product-foundation. Read CODEX-START-HERE.md. Actual app scaffolding and installation pending. Verify prerequisites: Node supported LTS, pnpm, Docker runtime, Supabase CLI, Redis (local or compose). Ollama optional. Do not use cloud services. Run `python3 scripts/verify_autonomous_framework.py` to validate repository governance once cloned. Follow M00 plan for setup scripts; pnpm commands are not available until scaffolded.

## Prerequisite diagnostics

From the repository root run:

```bash
python3 scripts/verify_autonomous_framework.py
python3 -m unittest discover -s tests -v
python3 scripts/preflight.py
```

The preflight checker is read-only and exits nonzero when required tools are missing or Docker is unavailable. Resolve failures and inspect port warnings. Verify local Docker context, supported Node/package versions, and actual Supabase ports before starting services. Ollama is optional. A successful check is not a successful application build.
