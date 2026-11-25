# Local setup

Clone and check out feat/product-foundation. Read CODEX-START-HERE.md. Web/API/worker source scaffold drafted; actual dependency installation and runtime verification pending. Verify prerequisites: Node supported LTS, pnpm, Docker runtime, Supabase CLI, Redis (local or compose). Ollama optional. Do not use cloud services. Run `python3 scripts/verify_autonomous_framework.py` to validate repository governance once cloned. Follow M00 plan for setup scripts; pnpm scripts are drafted but unverified.

## Prerequisite diagnostics

From the repository root run:

```bash
python3 scripts/verify_autonomous_framework.py
python3 -m unittest discover -s tests -v
python3 scripts/preflight.py
```

The preflight checker is read-only and exits nonzero when required tools are missing or Docker is unavailable. Resolve failures and inspect port warnings. Verify local Docker context, supported Node/package versions, and actual Supabase ports before starting services. Ollama is optional. A successful check is not a successful application build.

## Draft web/API workspace

After successful target preflight and Superpowers recovery, confirm Node 24 and package manager compatibility. Verify candidate dependency ranges against registry and security advisories, pin direct versions and run `pnpm install` to generate a real lockfile (do not invent one). Then run `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build`, and `pnpm dev`. Open http://127.0.0.1:3000; API liveness is http://127.0.0.1:4000/api/v1/health. Do not interpret liveness as database/worker readiness. The worker source is present; real queue processing, local database, and all domain features remain unverified or pending.

## Redis and worker round-trip (draft)

Confirm Docker context is local and port 6379 is free. If using a native local Redis instance, ensure it is bound to loopback and configured with noeviction. Otherwise from repo root:

```bash
docker compose -f infrastructure/docker-compose.yml config --quiet
docker compose -f infrastructure/docker-compose.yml up -d redis
docker compose -f infrastructure/docker-compose.yml exec redis redis-cli ping
```

Expect PONG. After verifying and installing dependencies, start `pnpm dev` in one terminal, then `pnpm smoke:worker` in another. Expect Worker round-trip verified only after the queue returns the same synthetic UUID. Stop the dev processes with Ctrl-C. Stop Redis using `docker compose -f infrastructure/docker-compose.yml stop redis` (no volume deletion). Supabase CLI: inspect help, initialize locally with `supabase init` if config is absent, start with `supabase start`, inspect `supabase status` and stop with `supabase stop`. Do not link a hosted project, share local keys or reset any database. Commit the generated config and actual lockfile only after local verification. Database schema, Prisma, pgvector and storage readiness remain pending.
