# Växa Production App — Engineering Starter Pack v0.1

## Purpose

This repository starter pack is the implementation source of truth for the first build of Växa Odling's production-management, planning, execution, and traceability application.

The first implementation target is the **402 Production vertical slice**. 402 is deliberately used as the first full test department because it spans seeding, germination, nursery, some transplanting, flat-tray harvest, and PU microgreen-box packing.

The application is not a generic SaaS task manager. It is a production operations system with team-specific work surfaces over shared production plans and traceability records.

## Source-of-truth order

1. `AGENTS.md` — non-negotiable engineering/domain rules for coding agents.
2. `CLAUDE.md` — agent handoff and review guidance for Claude Code and other agents.
3. `docs/decisions/DECISIONS_LOG.md` — confirmed decisions from product discovery.
4. `docs/domain/BUSINESS_RULES.md` — canonical domain rules.
5. `docs/domain/DOMAIN_MODEL.md` and `docs/architecture/DATA_MODEL.md` — domain/data structure.
6. `docs/workflows/402_SEEDING.md`, `402_GERMINATION.md`, `402_NURSERY_AND_HANDOFF.md`, `402_TRANSPLANTING.md` — executable workflow definitions.
7. `docs/ux/TEAM_DASHBOARDS.md` and `docs/ux/DESIGN_SYSTEM.md` — UI/UX direction.
8. `docs/product/PRODUCT_OVERVIEW.md` — product scope and operating model.
9. HTML references under `docs/reference/` — visual reference only; they are not the technical source of truth.

When an older document conflicts with this starter pack, the confirmed decisions in this pack take precedence.

## Recommended stack

- Next.js + TypeScript
- Tailwind CSS
- Component library with controllable styling (shadcn/ui is acceptable)
- PostgreSQL
- Prisma ORM
- Zod validation
- Vitest for unit/domain tests
- Playwright for browser/end-to-end tests
- Git + GitHub

The stack is a recommendation, not a reason to redesign the domain. Preserve the domain rules if the stack changes.

## V1 philosophy

Build a real database-backed application from the beginning. Do not create a throwaway mock data layer and plan to replace it later.

Build one thin, complete vertical slice first:

> 402 Dashboard → Seed Today → Start → worker selection → physical work → Complete → completion data → traceability → review → successful commit → automatic Germination transition.

Then add Germination and Nursery/Transplanting flows incrementally.

## First milestone acceptance criteria

A seeded development database should support at least these scenarios:

1. Normal seeding: 35 planned, 35 actual, planned lots used, two participants.
2. Two seed lots: 25 trays from Lot A + 10 trays from Lot B = 35 total.
3. Missing required lot: completion blocked.
4. Actual quantity lower than plan: deviation required and recorded.
5. Preselected lot changed: reason required and recorded.
6. Review step: all completion data visible before commit.
7. Successful commit: production event persisted, task completed, batch moves to Germination, expected next-stage date calculated.
8. DTM does not change because the individual batch was extended in a stage.

## Working with coding agents

Open this directory as the project context in Cursor, Codex, or Claude Code.

Before implementing anything, ask the agent to:

> Read `AGENTS.md`, `CLAUDE.md`, and all documents under `docs/`. Do not implement yet. Identify contradictions, missing technical dependencies, and propose the implementation plan for the first 402 Seeding vertical slice.

After review, implementation should happen in small, testable increments with the database schema and automated tests updated alongside the UI.

## Repository layout

```text
vaxa-production/
├── app/                         # Next.js routes and server UI
├── components/                  # shared UI components
├── lib/                         # domain services, validation, helpers
├── prisma/                      # schema + seed data
├── tests/
│   ├── unit/
│   └── e2e/
├── docs/
│   ├── architecture/
│   ├── decisions/
│   ├── domain/
│   ├── product/
│   ├── reference/
│   ├── ux/
│   └── workflows/
├── public/
├── AGENTS.md
├── CLAUDE.md
└── README.md
```
