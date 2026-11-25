# Product foundation design

Goal: reproducible local-first monorepo with minimal Next.js UI, Nest health API, independent worker and local Supabase/Redis. No product feature or deployment. Compared Next-only vs separate Nest: choose Nest for explicit domain boundaries and worker reuse as approved PRD. No speculative packages; create shared packages when used. Use supported LTS Node and pinned package manager after actual compatibility check. Prisma migrations own app tables; verify local Supabase CLI docs, not guessed flags. Local-only default provider mock.

Acceptance: prerequisite record; lockfile; strict typecheck, lint, build, test and smoke; localhost service health DB/Redis/storage/worker; documented startup/stop; no secret tracking. Framework recovery verified. Review security and resource usage. Superpowers invocation/independent review pending local agent availability.
