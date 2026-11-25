# M00 — Product foundation

Status: **ACTIVE**
Dependencies: None
Requirements: R00

## Scope
Recovery framework; local prerequisites; pnpm/Turbo scaffold; web/API/worker; local infra; smoke tests; documentation.

## Iterations
- [ ] M00.1 Recovery framework and prerequisite verification
- [ ] M00.2 Monorepo and executable application skeleton
- [ ] M00.3 Local PostgreSQL/Auth/Storage and Redis
- [ ] M00.4 Health/smoke tests and developer scripts
- [ ] M00.5 Review, verification and integration

## Exit gate
Deliver scope with tests and requirement evidence; no Critical/Important findings; fresh exact-head local verification; update traceability and integrate only with explicit authorization. No deployment.

## Evidence
Repository initialization and framework drafted; no runtime evidence yet.

Preflight checker implemented with 5 passing isolated unit tests. Actual target-machine preflight and installed Superpowers remain unverified. See `docs/superpowers/evidence/M00.1-preflight.md`.

Governance verifier: eight isolated regression tests passed; actual checkout and target runtime remain pending. See `docs/superpowers/evidence/M00.1-framework.md`.

M00.2 preparation: web/API and workspace source drafted with three passing isolated health/config tests. No package installation or runtime verification. M00.1 still open; M00.2 not complete. Evidence: `docs/superpowers/evidence/M00.2-api-source.md`.

M00.2 reversible preparation: BullMQ worker, local Redis Compose and bounded round-trip smoke drafted. Five isolated worker unit tests passed; real queue, container, full suite and target installation not verified. See `docs/superpowers/evidence/M00.2-worker-source.md`. M00.1/M00.2 remain open.

M00.3 reversible preparation: local environment guard and CLI tested, Supabase setup and migration ownership documented, explicit BullMQ v6 ioredis dependency added. Eleven isolated unit tests passed. Actual local service initialization and dependency resolution remain blocked. See `docs/superpowers/evidence/M00.3-local-config.md`.

M00.3 preparation: read-only local database diagnostic with six passing isolated regression tests, actual missing-client failure verified. No real PostgreSQL query or Prisma migration performed. Evidence: `docs/superpowers/evidence/M00.3-db-readiness.md`.

M00.3 preparation: Prisma v7 workspace, private synthetic probe model, adapter and smoke drafted; seven connection-selection tests passed. Client generation, actual migration, grants and smoke remain pending. Evidence: `docs/superpowers/evidence/M00.3-prisma-source.md`.

M00.4 preparation: HTTP smoke diagnostic checks existing API liveness and web status. Seven real loopback fixture tests passed; actual applications unavailable. See `docs/superpowers/evidence/M00.4-http-smoke.md`. M00.4 stays open.

M00.4 preparation: unified readiness core, loopback service adapters and Nest 200/503 endpoint drafted. Thirteen isolated tests passed (including Storage HTTP fixtures). No actual Nest service or dependency integration verified. Worker registration is not heartbeat. See `docs/superpowers/evidence/M00.4-readiness.md`.

M00.4 preparation: worker heartbeat lease and local-only Storage round-trip diagnostic; 10 isolated tests passed. Actual Redis renewal/expiry, BullMQ adapter and Supabase Storage execution pending. See `docs/superpowers/evidence/M00.4-heartbeat-storage.md`.

M00.4 preparation: Swagger/OpenAPI configuration and Playwright scenarios drafted. Fresh combined dependency-free suite passed 75 tests; all 27 reconstructed files matched the base Git tree. Actual Swagger and browser tests not run. See `docs/superpowers/evidence/M00.4-swagger-e2e.md`. M00 stays open.

M00.5 partial author review: aligned root configuration guard with Prisma migration boundary; six new regressions and 18 existing focused tests passed. No independent review or actual runtime gates completed. Evidence: `docs/superpowers/evidence/M00.5-config-review.md`.
