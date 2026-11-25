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
