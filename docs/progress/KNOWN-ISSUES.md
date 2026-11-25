# Known issues

- Important / BLOCKED: Local terminal connector returned tunnel-client not seen for 300 seconds. Restore local connection or clone branch and execute locally. No target-machine runtime or dependency checks performed. Isolated prerequisite checker tests passed; the isolated environment lacks pnpm, Docker, Supabase CLI and Redis.
- Important / OPEN: Superpowers skills loaded in this session; target-machine installation and full execution workspace not verified. Load applicable installed skills on local agent; document if unavailable.
- Important / OPEN: Original chat PRD consolidated into requirement baseline; compare detailed prior PRD if needed before implementing each capability.
- Important / OPEN: provisional web/API/worker manifests and source are not installed or framework-tested. No lockfile yet. Verify supported patched versions, peer compatibility, package policy, build and runtime on target. Redis Compose and BullMQ integration smoke not run. Supabase init, database/Prisma and storage readiness pending. No product-domain implementation exists yet. No CI, independent review, database migrations or local service verification. Do not mark M00 complete.
