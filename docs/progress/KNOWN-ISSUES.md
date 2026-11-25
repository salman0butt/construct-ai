# Known issues

- Important / BLOCKED: Local terminal connector returned tunnel-client not seen for 300 seconds. Restore local connection or clone branch and execute locally. No target-machine runtime or dependency checks performed. Isolated prerequisite checker tests passed; the isolated environment lacks pnpm, Docker, Supabase CLI and Redis.
- Important / OPEN: Superpowers skills loaded in this session; target-machine installation and full execution workspace not verified. Load applicable installed skills on local agent; document if unavailable.
- Important / OPEN: Original chat PRD consolidated into requirement baseline; compare detailed prior PRD if needed before implementing each capability.
- Important / OPEN: provisional web/API/worker manifests and source are not installed or framework-tested. No lockfile yet. Verify supported patched versions, peer compatibility, package policy, build and runtime on target. Redis Compose and BullMQ integration smoke not run. Supabase init, database/Prisma and storage readiness pending. No product-domain implementation exists yet. No CI, independent review, database migrations or local service verification. Do not mark M00 complete.

- Important / OPEN: local config guard verified as a standalone diagnostic only; not a runtime authorization or connectivity check. Actual CLI-generated Supabase config, Prisma and storage setup pending; do not infer readiness. BullMQ v6 requires explicit ioredis, added provisional range but registry resolution unverified.

- Important / OPEN: PostgreSQL diagnostic SQL not executed; isolated runner has no psql or local database. Six fixture tests cover the diagnostic, not actual schema/role security. Install a trusted local psql client and run db:check after provisioning private schema/roles and pgvector; verify RLS separately when tenant tables exist.

- Important / OPEN: Prisma 7 workspace source, config, schema and transactional smoke are draft; packages not resolved, client not generated, migration not created/applied, permissions not verified. Dedicated empty shadow DB and distinct actual login privileges must be verified before migration. No hosted service changes.
