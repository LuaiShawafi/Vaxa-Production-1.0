# Implementation Roadmap

## Phase 0 — Repository foundation

1. Create Next.js/TypeScript project.
2. Configure Tailwind + component primitives.
3. Configure PostgreSQL + Prisma.
4. Configure Zod.
5. Configure Vitest/Playwright.
6. Add lint/typecheck/build scripts.
7. Add `AGENTS.md` / `CLAUDE.md` and docs.
8. Establish environment variables and development DB.

## Phase 1 — Identity and master data foundation

Implement minimum viable:
- users
- departments
- teams
- user-team membership
- roles/permissions skeleton
- SKU
- seed variety
- seed lot
- material
- material lot
- BOM skeleton

Seed realistic 402 test data.

## Phase 2 — Planning/batch foundation

Implement:
- weekly production plan
- plan items
- batch creation
- batch number generation
- destination identity
- batch genealogy skeleton
- production task
- production event
- audit log

## Phase 3 — 402 Seeding vertical slice

Implement fully:
- 402 dashboard
- Seed Today
- Start
- shared-device worker selection
- Complete flow
- participant selection
- actual quantity
- preselected lots
- multiple seed-lot allocations
- reconciliation validation
- quantity deviations
- lot-change reasons
- review
- transactional commit
- automatic Germination transition
- expected date calculation
- DTM preservation

## Phase 4 — Germination

Implement:
- expected-date queue
- Move to Nursery
- Extend +1/+2/+3/Custom
- actual stage duration
- expected vs actual timeline
- reassessment queue
- history

## Phase 5 — Nursery and handoff

Implement:
- Nursery view
- 402 transplanting eligibility
- Send for Transplanting
- Delivery creation
- in-transit state
- receiving-team Delivery view
- one-action whole-delivery receiving
- per-batch received quantities
- discrepancies

## Phase 6 — 402 Transplanting

Implement:
- planned vs available
- default float type
- float-type override + reason
- tray quantity
- float/unit calculation
- Start/Resume
- partial completion
- In Progress vs Paused
- cumulative progress
- controlled disposition request for remaining material
- authorized destination change / genealogy

## Phase 7 — Other 402 workflows

Define and implement:
- flat tray harvest
- microgreen box packing
- other 402 tasks

## Phase 8 — Main dashboard and issues

Implement whole-production dashboard and issue/deviation management after the production slice is stable.

## Phase 9 — Other teams

Use the shared production model to build:
- Pool Team
- Herbs
- Salad
- Harvest
- Logistics

Team-specific dashboards should be configuration/views over shared data, not duplicated production models.
