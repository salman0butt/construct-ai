# Requirements traceability

| Requirement | Milestone | Spec | Implementation | Tests | Verification | Status |
|---|---|---|---|---|---|---|
| R00 | M00 | M00 foundation | scripts/preflight.py; governance verifier; draft web/API/worker workspaces and Redis Compose; local configuration guard; read-only DB diagnostic; draft Prisma workspace; HTTP smoke diagnostic; readiness endpoint draft; worker lease; Storage round-trip smoke; Swagger/OpenAPI draft; browser E2E draft; shared database config guard review fix; frontend redirect boundary; preflight runtime/client gate correction | tests/test_preflight.py; tests/test_framework.py; apps/api/test/health.test.ts; apps/worker/test/foundation.test.ts; tests/local-config.test.ts; tests/test_db_readiness.py; packages/database/test/connections.test.ts; tests/http-smoke.test.mjs; apps/api/test/readiness.test.ts; apps/api/test/readiness-local.test.ts; apps/worker/test/heartbeat.test.ts; apps/api/test/heartbeat.test.ts; tests/storage-smoke.test.mjs; tests/e2e/*.spec.ts (not run); tests/config-review.test.ts; tests/web-health.test.ts; tests/test_preflight_review.py | 5 prior preflight, 8 prior framework fixture and 3 API, 5 worker and 11 local config and 6 DB diagnostic and 7 Prisma connection-selection and 7 HTTP fixture and 13 readiness/local probe, 5 heartbeat and 5 Storage fixture tests passed in separate isolated runs; fresh combined 56 Node + 19 Python passed on 27 matching base blobs; 24 fresh focused config/connection tests including 6 new; 28 fresh focused tests including 4 new frontend HTTP fixture tests; 9 fresh focused preflight tests including 4 new; historical combined evidence, runtime and E2E pending | ACTIVE |
| R01 | M01 | Pending activation | Pending | Pending | Not run | PLANNED |
| R02 | M01 | Pending activation | Pending | Pending | Not run | PLANNED |
| R03 | M02 | Pending activation | Pending | Pending | Not run | PLANNED |
| R04 | M02, M04, M07 | Pending activation | Pending | Pending | Not run | PLANNED |
| R05 | M03 | Pending activation | Pending | Pending | Not run | PLANNED |
| R06 | M04, M06 | Pending activation | Pending | Pending | Not run | PLANNED |
| R07 | M02, M04, M07 | Pending activation | Pending | Pending | Not run | PLANNED |
| R08 | M05 | Pending activation | Pending | Pending | Not run | PLANNED |
| R09 | M05, M06 | Pending activation | Pending | Pending | Not run | PLANNED |
| R10 | M06 | Pending activation | Pending | Pending | Not run | PLANNED |
| R11 | M03, M08 | Pending activation | Pending | Pending | Not run | PLANNED |
| R12 | M07, M08 | Pending activation | Pending | Pending | Not run | PLANNED |
| R13 | M02, M05, M09 | Pending activation | Pending | Pending | Not run | PLANNED |
| R14 | M02 | Pending activation | Pending | Pending | Not run | PLANNED |
| R15 | M01, M04, M09 | Pending activation | Pending | Pending | Not run | PLANNED |
| R16 | M09 | Pending activation | Pending | Pending | Not run | PLANNED |
| R17 | M09 | Pending activation | Pending | Pending | Not run | PLANNED |
| R18 | M10 | Pending activation | Pending | Pending | Not run | PLANNED |
