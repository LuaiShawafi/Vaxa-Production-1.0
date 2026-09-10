# Implementation Brief — First 402 Slice

## Agent task

Do not implement until you have read the entire starter pack.

Your immediate job is to build the smallest complete, real-database-backed version of:

> 402 Dashboard → Seed Today → Start → Select Worker → Complete → Completion Details → Review → Commit → Germination

## Required user story

A 402 worker opens the shared 402 production station. They see today's work. A seeding row contains enough information to identify the batch, a `Start` button, and an `Info` button.

They press Start, select their name, and begin physical work.

At completion, the system asks for:
- additional participants
- actual tray quantity
- preselected seed/material/punnet lots
- allocation quantities
- deviation reason if actual differs from planned
- reason if a preselected lot is changed

The worker reviews the final summary and commits.

On commit, the system creates the production event, stores traceability, completes the production task, changes the batch to Germination, and calculates the expected Germination assessment date from the SKU's current applicable timing.

## Non-functional expectations

- transactional commit
- idempotent completion
- server-side domain validation
- auditability
- responsive/touch-friendly worker UI
- no mock-only persistence
- seeded realistic demo data

## Seeded demo data suggestion

Create a 402 team with 4–6 demo workers. Seed a few SKUs:
- PU_RED_RADISH
- PU_GREEN_RADISH
- PU_MUSTARD
- PL_CHIVES
- PL_LETTUCE
- TR_MUSTARD

Create seed/material lots and at least six plan items, including:
- normal 35-tray seed
- a batch due for germination assessment
- a nursery batch
- a 402 transplant batch such as chives
- an outgoing pool-bound batch
- a partially progressed scenario fixture

Use synthetic names and data.

## Deliverable

A developer can clone/install/run the project and exercise the full normal and exception seeding paths against PostgreSQL locally.
