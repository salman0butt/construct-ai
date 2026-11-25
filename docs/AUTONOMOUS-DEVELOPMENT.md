# Autonomous development

Adapted from the workflow observed in salman0butt/hire-evidence (AGENTS, CODEX-START-HERE, milestone ledgers, progress and traceability). No product code copied.

Recovery precedence: actual Git graph/ref → source and tests at relevant SHA → fresh exact-head local/CI evidence → PR/reviews → progress docs → older chat. Read-only recovery before writes. Reuse existing branch and active task; no duplicate PR or concurrent conflicting work. Record unavailable tools and blockers. Pre-authorized routine design/plan decisions do not waive review, TDD or verification.

States: PLANNED, ACTIVE, BLOCKED, VERIFYING, VERIFIED, COMPLETE (integrated and verified), DEFERRED. Use stable requirement IDs; never silently discard requirements. Each milestone has dependency, spec, plan, tasks, acceptance, evidence and one next work item. Closeout requires applicable fresh tests, review and integration authorization. No cloud deployment/CI assumed.

Verification: record environment, command, exit code, exact revision, output summary, unrun checks. If a code or relevant doc change invalidates evidence, rerun. Do not fabricate passing checks. If exact SHA cannot be embedded in its own commit, record it in PR/evidence note and reconcile on next recovery.
