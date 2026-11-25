# AGENTS.md — ConstructAI

## Mission
Implement docs/PRD.md through small, dependency-ordered, independently reviewed and verified milestones. Git is durable execution memory; do not rely on chat history.

## Mandatory recovery before any write
1. Load installed Superpowers using-superpowers; if unavailable record it, never claim invocation.
2. Read CODEX-START-HERE.md, this file, docs/AUTONOMOUS-DEVELOPMENT.md.
3. Inspect git status, default/active refs and SHAs, recent commits, branches/worktrees, open/draft PRs, reviews, blockers and exact-head verification.
4. Read progress STATUS and KNOWN-ISSUES, CURRENT and active ledger, PRD/TRACEABILITY, active spec and plan.
5. Reconcile against code/tests and evidence, avoid concurrent conflicting work, select highest priority unfinished task.
6. Inspect actual local prerequisites before package selection.

## Superpowers
Use applicable installed skills: brainstorming, writing-plans, using-git-worktrees, test-driven-development, systematic-debugging, executing-plans, subagent-driven-development, requesting-code-review, receiving-code-review, verification-before-completion, finishing-a-development-branch. Use independent review where available; if not available record limitation, do not invent review. Write designs in docs/superpowers/specs and executable plans in docs/superpowers/plans. Routine design decisions are authorized; do not skip rigor. No destructive reset or irreversible external action without explicit approval.

## Work selection
Broken main > failed active verification > Critical/Important review findings > unfinished active PR/task > milestone closeout > next milestone. One milestone at a time. One small vertical capability per iteration. No speculative abstractions, unnecessary agents or microservices.

## Non-negotiable
- Local-only: no hosting, cloud provisioning, real payments, live accounting/email integrations or external AI without explicit opt-in. Mock provider is labeled and deterministic. Use synthetic data.
- Auth and tenant/resource authorization in every service, tool, job, retrieval and storage path; RLS on exposed tables and appropriately scoped database roles; never assume Prisma inherits Supabase JWT context.
- Monetary arithmetic uses decimal or integer minor units; currency-aware totals; transactional state transitions and idempotent effects. At-least-once delivery, not exactly-once messaging.
- AI outputs are untrusted; schema/evidence validation, bounded execution, no unrestricted SQL or direct writes, no self-approval, no financial action without required approval.
- Immutable/versioned approval payload, recheck permission and business state, prevent duplicate execution, audit all outcomes.
- Never weaken tests or validation to pass gates. No secrets or sensitive documents committed.
- No fabricated RED/GREEN results, CI, reviews, runtime checks or completion.

## TDD and verification
For meaningful behavior: write failing test, observe genuine RED, minimal implementation, observe GREEN, refactor, run broader checks. Review correctness, security/tenancy, finance invariants, architecture, accessibility and AI quality as relevant. Critical/Important findings block completion. Record commands, outputs, exact commit, environment and limitations. Local lint/typecheck/tests/build/E2E and framework verifier as applicable; no CI/deployment required unless later authorized. If CI exists, only exact-head checks count.

## Git policy
Focused branches and meaningful commits; draft PR for unverified work. AUTO_CREATE_PR=true; AUTO_UPDATE_PR=true; AUTO_MERGE=false. Do not merge without explicit authorization. No force push or bypass protections. Reconcile progress docs with actual branch/PR state; record exactly one Exact next work: item. Never advance milestone without evidence and integration.

## End of session
Record actual head/PR, checks, blockers, next action and traceability; push safe changes. If blocked, complete remaining safe work and document exact recovery step.
