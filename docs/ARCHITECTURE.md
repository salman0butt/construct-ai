# Architecture

TypeScript-first modular monolith + separate worker. apps/web (Next.js + Tailwind/shadcn, TanStack Query/Table, Zustand where needed, React Hook Form/Zod, Recharts, Vercel AI SDK library only); apps/api (NestJS REST, OpenAPI); apps/worker (BullMQ); packages/database, ai, contracts, shared, ui, config only as justified. PostgreSQL/Prisma/pgvector, local Supabase Auth/private Storage; Redis queue; LangChain.js/LangGraph.js; deterministic mock default; optional Ollama, explicit opt-in OpenAI/Gemini. Node PDF parser and Tesseract OCR.

Web → API → domain services → DB/storage/outbox → queue → worker → validated extraction or graph → approval → transactional business action. Worker and AI tools reuse authorized services, not arbitrary SQL. Use one migration authority for app schema, separate Supabase-owned schemas, limited runtime DB roles, explicit tenant authorization and RLS where exposed.

No deployment. Local ports proposed web 3000, API 4000, Redis 6379, Ollama 11434; Supabase ports from CLI. Validate versions/ports on target machine. No provider keys required for mock. On 16GB development machines keep concurrency bounded and local inference optional.

Decisions: modular monolith over microservices; TypeScript over polyglot by default; single assistant with tools over speculative multiagent; deterministic business logic over LLM arithmetic; local verification instead of cloud CI initially. See PRD and active specs for details.
