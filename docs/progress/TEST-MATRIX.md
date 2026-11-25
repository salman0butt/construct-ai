# Test matrix

| Gate | Scope | State |
|---|---|---|
| Preflight checker | missing tools, timeout, versions, Redis alternative, exit status | 5 tests passed in isolated Python 3.13.5; target checks pending |
| Framework verifier | governance, traceability and current ledger | 8 fixture tests passed; actual checkout run pending |
| API liveness/port unit | pure TypeScript | 3/3 isolated Node tests passed |
| Worker probe contract | local Redis URL validation and synthetic job handling | 5/5 isolated Node tests passed; BullMQ adapter pending |
| Redis/BullMQ round-trip | queue, separate worker, nonce result, bounded failure | smoke source drafted; not run |
| Lint/typecheck/build | all workspaces | scripts drafted; dependency install and actual run pending |
| Unit | deterministic finance/permissions/AI schemas | planned |
| Integration | DB/queue/auth/tenancy/approval recovery | planned |
| E2E | invoice-to-approval, RAG, Atlas, tenant isolation | planned |
| AI eval | extraction/RAG/tools/guardrails | planned |

| Local configuration guard | loopback endpoint checks, key roles, flags and public secret leaks | 11/11 isolated Node tests; CLI valid and invalid exit paths checked; actual environment pending |

| Database foundation diagnostic | local connection, read-only query invocation, five required checks, fail-closed parsing and error redaction | 6/6 isolated tests with subprocess mocked; actual CLI exits 1 for missing psql; SQL integration pending |

| Prisma connection selection | runtime/migration role separation, local target and isolated shadow, credential-safe failure | 7/7 isolated tests passed; Prisma client and migration pending |
| Prisma persistence smoke | synthetic transactional create/read/delete | source prepared; not run |

| HTTP smoke diagnostic | real loopback fixtures for API contract, web status, invalid responses, timeout and redirect rejection | 7/7 tests passed; actual application command exit 1; browser E2E pending |

| Readiness coordinator and local probe boundary | required checks, timeout/abort, concurrent deduplication, local DB/Redis config, private bucket metadata fixture and redirect rejection | 13/13 isolated tests; actual Nest/pg/Redis/Storage/worker registration unverified |

| Worker lease | publish 15s TTL contract, paused/stopped behavior, deduplication, renewal recovery, count and TTL validation | 5/5 isolated tests; actual Redis/BullMQ integration pending |
| Storage synthetic round-trip | private bucket, upload/download byte equality, exact-object cleanup, failed cleanup, hosted/key rejection | 5/5 real HTTP fixture tests; actual local Supabase not run |

| Combined dependency-free suite | all existing Node and Python tests | 56 Node + 19 Python passed together in isolated reconstruction; 27 files matched base tree |
| Swagger/OpenAPI | live UI and generated JSON, 200/503 contracts | source and browser assertions drafted; not run |
| Browser E2E | healthy/degraded infrastructure, desktop/mobile liveness, stopped API | scenario source drafted; real local services and Playwright package required; not run |

| Configuration review regressions | shadow URL, role separation, same database, required password, public leak prevention | 6 new tests; RED 5 fail/1 pass; focused GREEN 24/24 including 18 existing tests; full suite not rerun |

| Frontend network boundary | correct liveness, redirect rejection with no destination request, wrong identity, HTTP errors and malformed input | RED 1 fail/3 pass; GREEN 4/4; combined focused suite 28/28; pnpm test unavailable exit 127 |

| Preflight review regression | supported Node release, wrong major, prerelease/malformed output, missing psql | RED 8 failing assertions/subtests; GREEN 9/9 methods (4 new, 5 existing); live isolated preflight exit 1 |
