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
