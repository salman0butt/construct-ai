# Test matrix

| Gate | Scope | State |
|---|---|---|
| Preflight checker | missing tools, timeout, versions, Redis alternative, exit status | 5 tests passed in isolated Python 3.13.5; target checks pending |
| Framework verifier | governance, traceability and current ledger | 8 fixture tests passed; actual checkout run pending |
| API liveness/port unit | pure TypeScript | 3/3 isolated Node tests passed |
| Lint/typecheck/build | all workspaces | scripts drafted; dependency install and actual run pending |
| Unit | deterministic finance/permissions/AI schemas | planned |
| Integration | DB/queue/auth/tenancy/approval recovery | planned |
| E2E | invoice-to-approval, RAG, Atlas, tenant isolation | planned |
| AI eval | extraction/RAG/tools/guardrails | planned |
