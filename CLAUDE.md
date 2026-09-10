# CLAUDE.md — Växa Production App

Claude Code should treat this repository as a real production-management product specification. The canonical instructions live in `AGENTS.md`; this file provides agent-specific operating guidance.

## Before coding

Read:
- `AGENTS.md`
- `docs/decisions/DECISIONS_LOG.md`
- `docs/domain/BUSINESS_RULES.md`
- the workflow file relevant to the feature
- `docs/architecture/DATA_MODEL.md`
- `docs/ux/DESIGN_SYSTEM.md`

If there is a conflict, confirmed decisions in `docs/decisions/DECISIONS_LOG.md` and `AGENTS.md` win.

## Preferred implementation approach

Use small vertical slices. Keep UI, domain validation, persistence, and tests aligned.

Do not implement the entire production application in one pass. The first target is the 402 Seeding workflow end-to-end.

## Review behavior

Before making large changes:
1. State the affected domain entities.
2. State the state transitions.
3. Identify what is an actual event vs mutable current state.
4. Check whether the change affects auditability or genealogy.
5. Check whether the worker is being asked for information already known by the system.

## UX review questions

For production-floor UI, verify:
- Can a worker understand the current task without opening a separate page?
- Is Start lightweight?
- Is Complete where detailed data is collected?
- Are required errors actionable?
- Are plan values kept distinct from actual values?
- Are uncommon exceptions hidden until needed?
- Does the workflow avoid unnecessary typing?
- Does a successful action return the worker to useful work quickly?

## Data integrity review

Always test:
- missing required lot
- quantity mismatch
- lot substitution
- stage extension
- partial execution
- repeat/resume
- controlled destination change
- genealogy creation only when physical divergence occurs

## Do not do

- Do not make the current HTML prototypes the application architecture.
- Do not replace PostgreSQL with a mock-only data store.
- Do not silently invent business rules.
- Do not allow workers to edit plan/master data just because it makes a form easier.
- Do not collapse all production work into a single generic task table.
