# Local Supabase foundation

The directory is reserved for the actual CLI-generated config. No hosted project is linked. Do not fabricate config.toml or local service credentials.

On the target machine confirm Docker is a local context, review supabase --version and supabase init/start/status --help, then initialize this repository with supabase init if config.toml is missing. Confirm host exposure is loopback-only and ports do not conflict before starting containers. Start with supabase start and inspect supabase status locally. Do not share status output containing credentials. Store the local URLs and keys in a gitignored root .env. Run pnpm local:config before proceeding.

Migration authority: Prisma owns application tables in the dedicated construct_ai schema; Supabase CLI owns its generated infrastructure and platform-managed schemas (auth/storage). Do not duplicate application table migrations in both tools. Design an explicit local migration/privileged role and restricted runtime role; no browser database access. Verify schema exposure, grants and RLS before adding tenant data. Keep buckets private; add project/tenant policies alongside actual document features, not speculative permissions. Do not reset the database without confirmation.

Prisma v7 uses prisma.config.ts for migration connection configuration and a compatible PostgreSQL adapter for runtime clients. Resolve and pin supported Prisma, adapter and pg versions against the registry, generate real client output and migrations in the local environment. Do not use a placeholder migration or mark pgvector installed until a real query confirms it. No database or storage has been initialized by this commit.
