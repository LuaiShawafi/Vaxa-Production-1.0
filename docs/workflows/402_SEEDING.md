# 402 Seeding Workflow — V1

## Purpose

Allow 402 workers to execute seeding tasks quickly while capturing complete traceability and preserving the difference between planned and actual production.

## Dashboard entry

The 402 dashboard shows `Seed Today` as an open operational list. Do not force the worker to navigate to a separate section just to see today's seed work.

Each row should contain enough context to understand the task and have:
- Start button
- Info button

The row itself does not start the task.

## Start

Worker taps `Start`.

On a shared production device:
1. Show the 402-eligible worker list derived from users/team membership.
2. Worker selects their name.
3. Task starts.

Only the worker name is requested at Start. Do not ask for quantity, lots, or other completion details at this point.

Record:
- initiating worker
- start timestamp
- task in progress

No permanent personal login is required for V1 shared stations.

## During execution

Worker physically performs seeding. The task remains In Progress.

## Complete

Worker taps `Complete`.

### Step A — Participants and quantity

Show:
- initiating worker already selected
- option to add participants
- planned quantity
- actual quantity initially prefilled to planned quantity

Example:
`Planned: 35 trays`
`Actual: 35 trays`

Worker can change actual quantity.

### Step B — Traceability lots

Preselected/active lots configured by authorized production staff should already appear.

For each required traceability category, show the preselected lot and a quantity allocation that initially equals actual production quantity.

Example:
- Seed Lot RDR-2026-041 — 35 trays
- Substrate Lot SUB-2026-018 — 35 trays
- Punnet Lot PUN-2026-007 — 35 trays

Worker can:
- change allocation quantity
- add another lot
- select the actual lot

For seed lots, multiple lots are allowed. Each seed lot gets a tray allocation.

### Allocation reconciliation

The sum of required lot allocations must equal actual production quantity. Example:
- Lot A = 25
- Lot B = 10
- Actual = 35
- Allocation = 35/35 → valid

If allocation does not reconcile, show the exact short/excess amount and block completion.

### Preselected lot change

Changing a preselected lot requires a reason.

Reasons:
- Lot empty / insufficient quantity
- Lot unavailable
- Material quality issue
- Test
- Change in production plan
- Other → free-text explanation required

`Test` requires no additional text.

### Quantity deviation

If actual quantity differs from plan, ask for explicit confirmation to proceed with a deviation.

Example:
`Planned 35 trays`
`Actual 33 trays`

Prompt:
`Quantity differs from plan. Complete with a deviation?`

Reasons:
- Seed shortage
- Material shortage
- Equipment problem
- Change in plans
- Other → free-text explanation required

Never overwrite the planned quantity.

## Review

Final review is read-only and shows:
- batch/SKU
- planned quantity
- actual quantity
- participants
- all lot allocations
- deviation indicators
- any lot-change reasons

A prominent final button commits the production event.

## Commit behavior

On successful commit:
- persist production event
- persist participant records
- persist lot allocations
- persist deviations/reasons
- complete the production task
- update batch stage to Germination
- record actual seeding timestamp
- calculate expected germination assessment date from applicable SKU germination duration
- preserve DTM planning values

Show a short checkmark/success animation and automatically return to the useful list/dashboard. Do not add a separate success page with a Done button.

## Failure behavior

If required information is missing, do not commit. Show inline/actionable errors.

Examples:
- Seed lot required.
- Lot allocation totals are 2 trays short.
- Other reason requires an explanation.

Never silently invent or round data to make validation pass.
