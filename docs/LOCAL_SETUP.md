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

## Local environment validation

After the actual local Supabase CLI stack starts, copy .env.example to .env only if absent and populate real local values from the CLI; never commit or paste credentials into public logs. Use a separate migration and restricted runtime role when configured. Run `pnpm local:config` or `node --env-file-if-exists=.env --experimental-strip-types scripts/check-local-config.ts` from the root. The guard rejects hosted connection targets, dangerous PostgreSQL URI options, external providers/integrations and known public key leaks; it reports names only. It checks configuration syntax and key roles, not service connectivity, JWT signatures or authorization. It is not a universal runtime policy. See [local Supabase setup](../supabase/README.md). The ioredis dependency is explicit for BullMQ v6; verify all provisional versions before install.

## Database foundation diagnostic

After local Supabase initialization, Prisma schema creation, pgvector setup and role/grant verification, install a trusted local PostgreSQL client (`psql` on PATH). Run `pnpm db:check` from the root to load `.env` via Node and check the runtime DATABASE_URL, or run `python3 scripts/db_readiness.py` with the local DATABASE_URL already in the environment. Never paste real credentials into commands or logs. It uses a bounded read-only catalog query, checks the private schema, vector extension, restricted runtime role, schema usage and denied browser-role schema access. It does not create or modify anything. A success covers only these checks, not actual tenant RLS, storage or full readiness. Nonzero means resolve the indicated missing condition; do not substitute a superuser URL to pass. See [local Supabase setup](../supabase/README.md).

## Prisma workspace (draft)

Follow [database workspace instructions](../packages/database/README.md). Populate DATABASE_SHADOW_URL with a dedicated empty local database named construct_ai_shadow, owned by the distinct migration role; never use the app database as shadow. After verified install and actual local role setup, run pnpm db:validate, pnpm db:generate, review and apply real migration, pnpm db:check, pnpm --filter @construct-ai/database build and pnpm db:smoke. Do not reset any existing database. Prisma generation is required before database workspace typecheck/build. No migrations generated in this commit.

## HTTP smoke

After actual dependency installation, start the local API and web (`pnpm dev`) with matching ports. Run `pnpm smoke:http` from the root. Expect JSON with api and web both true only when the API liveness response matches the contract and server-rendered web status reports Responding. A nonzero exit means investigate the service or port; it is not a database or worker readiness check. The API port defaults to 4000 and the web port to 3000. Current web dev script uses port 3000, so leave WEB_PORT at 3000 unless you explicitly start web on another port. Run `pnpm test:http` to test the smoke diagnostic with loopback fixtures, not the actual app. Playwright and actual infrastructure readiness remain separate gates.

## API readiness (draft)

After initializing actual local Supabase, create an empty private bucket `construct-ai-foundation` using the local Studio. Do not create it in a hosted project. Copy `apps/api/.env.example` to `apps/api/.env` only if absent and fill actual local restricted DATABASE_URL, SUPABASE_URL and server-only SUPABASE_SECRET_KEY. Keep this file gitignored; never share its values, or pass migration/shadow credentials to the API or web. Start API from its workspace directory (pnpm dev runs workspace scripts); keep API_PORT/REDIS_URL consistent with web and worker. Check `GET http://127.0.0.1:4000/api/v1/health/ready`: 200 ready only when all four probes are up; 503 otherwise. Database probe checks read access to the synthetic foundation table, Redis PING, Storage private bucket metadata and BullMQ registered worker count. A registered worker does not prove freshness or successful job execution; continue to run db:check, db:smoke and smoke:worker. Actual object round-trip, heartbeat and integration failure/recovery gates remain pending. No secrets are included in the readiness result. This endpoint is local-only and not verified with installed frameworks yet.

## Worker heartbeat and Storage persistence (draft)

The worker renews a shared local lease every five seconds with a 15-second Redis TTL while running and not paused. API worker readiness requires both registered workers and a positive bounded remaining TTL; no explicit key deletion on shutdown, so allow 15 seconds to expire. This supersedes registration-only readiness above. This is a local presence signal, not processing proof. Stop all foundation workers, check readiness failure after expiry, restart and confirm recovery; run `pnpm smoke:worker` for actual job execution. Actual Redis/BullMQ verification remains pending.

Use a dedicated empty private unversioned `construct-ai-foundation` bucket in local Supabase, with local server-only credentials in root .env. Run `pnpm test:storage` for fixture tests; `pnpm smoke:storage` uploads one UUID-named synthetic text object without upsert, downloads and verifies bytes, deletes only that object and requires a subsequent 404. On nonzero exit inspect any reported cleanupObject in this local bucket; an ambiguous transport failure can leave a synthetic object. Do not use hosted services or real documents. Fixture coverage does not prove actual Storage API compatibility or tenant security.

## Swagger and browser E2E (draft)

After verified installation, build/start the local API on 127.0.0.1:4000 and web on 127.0.0.1:3000. Swagger UI: http://127.0.0.1:4000/docs; OpenAPI JSON: http://127.0.0.1:4000/docs-json. These are development-only routes bound to loopback. Install Chromium locally using `pnpm exec playwright install chromium` after confirming the pinned package. Run `pnpm e2e` with all dependencies healthy; it requires readiness HTTP 200. For `pnpm e2e:degraded`, intentionally stop a disposable foundation dependency (e.g. the worker, wait for the lease to expire) while leaving web and API running; it requires readiness 503. Restore the dependency and confirm healthy scenario again. For `pnpm e2e:outage`, stop only API and keep web running; browser must report Unavailable and direct API request must fail. Restore API and rerun healthy scenario. Commands assume the default ports and existing locally managed processes; they do not start, stop or delete services themselves. Never run against a hosted environment. Browser test output contains synthetic foundation data only. Swagger and Playwright packages remain unverified until installation and real execution.

### Configuration review correction

`pnpm local:config` now requires all three database URLs and uses the same parser and role/target validation as Prisma migration configuration. Missing or unsafe shadow URLs, same runtime/migration login, different database/port, missing passwords and known public shadow URL exposure fail early. This is still syntax/relationship validation, not proof of actual DB permissions or a dedicated empty shadow database. Never run migrations until the real local database and roles are verified.
