# Product foundation implementation plan

Use installed Superpowers executing-plans or subagent-driven-development as available. Work on feat/product-foundation; inspect actual PR and Git state first. No merge without authorization.

## M00.1 Recovery and prerequisites
- [x] Harden framework verifier with regression fixtures (8 passed; see evidence/M00.1-framework.md).
- [ ] Run framework verifier and inspect its result; fix problems.
- [ ] Load installed Superpowers; record availability.
- [x] Implement read-only prerequisite checker and test its error handling in isolated environment (evidence: docs/superpowers/evidence/M00.1-preflight.md).
- [ ] Run `python3 scripts/preflight.py` on target machine. Inspect node -v, pnpm -v, docker info, supabase --version, git status and available ports. Verify package compatibility with official docs; pin versions and commit lockfile. If Docker or CLI missing, report exact blocker, do not switch to cloud.

## M00.2 Monorepo

Draft source may be prepared while target preflight is blocked; prerequisite checks still gate package resolution, local startup, verification and milestone closeout. No move to M01.
- [x] Draft minimal web/API source and workspace manifests; verify dependency-free API health/config tests (3 passed).
- [x] Draft worker probe contract and unit tests (5 pass), BullMQ adapter and smoke source, local Redis Compose; integration verification pending.
- [ ] Verify pnpm workspace and Turbo tasks. Minimal Next.js App Router web, Nest API, worker package and shared config only as needed. Strict TypeScript, lint/format. Implement health and worker heartbeat with RED/GREEN where behavioral. No placeholder ERP.
- [ ] Run install, typecheck, lint, tests and build; record evidence.

## M00.3 Local infrastructure
- [ ] Initialize local Supabase (verify CLI help/docs), private app schema/migration strategy; local Redis compose bound to loopback. Validate env server/client separation. Start services and check connectivity. No real data/secrets.
- [ ] Document startup/setup/status/stop, migration and synthetic seed; destructive reset needs confirmation.

## M00.4 Smoke
- [ ] Add integration smoke for API DB/Redis/storage/worker health and Playwright web→API. Test failure paths. Record exact SHA and exit codes.

## M00.5 Closeout
- [ ] Review independently where available, resolve Critical/Important findings, run all applicable verification on final head. Update ledger, traceability, test matrix, progress and PR. Wait for explicit merge authorization; after integration verify main before activating M01.
