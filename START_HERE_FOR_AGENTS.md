# START HERE — Coding Agent Kickoff

Paste the following prompt into Cursor Agent, Codex, or Claude Code after opening the repository:

> Read `AGENTS.md`, `CLAUDE.md`, and all files under `docs/`. Treat the starter pack as the canonical product/domain specification. Do not implement yet.
>
> First, analyze the project for:
> 1. contradictions between requirements;
> 2. missing technical dependencies for the first 402 Seeding vertical slice;
> 3. data-integrity risks;
> 4. places where a UI decision would incorrectly encode a business rule;
> 5. schema relationships that need transactions or unique constraints;
> 6. the smallest implementation plan that gets a real PostgreSQL-backed 402 Seeding workflow working end-to-end.
>
> Produce:
> - proposed repository structure;
> - proposed Prisma schema/entity list;
> - application/domain service list;
> - route/component plan;
> - seed-data plan;
> - test plan;
> - unresolved questions only where the starter pack genuinely lacks a rule.
>
> Do not invent new business rules. Mark reversible technical defaults as technical defaults. Preserve all confirmed rules, especially DTM, destination identity, batch genealogy, traceability, and planned-vs-actual separation.

## After the agent proposes a plan

Approve implementation in small stages. The first coding request should be:

> Implement only the repository foundation, database schema for the first seeding slice, migrations, deterministic synthetic seed data, domain services, and tests. Do not implement the full UI yet. Run typecheck/lint/tests and report exactly what passed.

Then implement the UI against the real domain services.
