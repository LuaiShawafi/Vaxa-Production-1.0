# Canonical Business Rules

## Planning and timing

1. Planned, expected, scheduled, and actual are distinct values.
2. SKU stage durations are planning/reference parameters, not hard deadlines.
3. A batch may be assessed early and moved early if authorized/appropriate; reason and audit are required when this represents an override.
4. A batch may remain in a stage beyond expected timing and receive a reassessment date.
5. DTM is derived from configured Germination + Nursery + Growing durations.
6. DTM must not be automatically changed because an individual batch was extended.
7. Actual stage duration is recorded on the batch/event history.
8. If one stage takes longer, the next stage can have fewer actual days while the configured stage duration remains unchanged.
9. Master timing updates apply only to batches currently in the affected stage as the live stage parameter; batches already past that stage keep the historical applicable duration/snapshot.

## Batch identity

- Visible batch number: `DDMM + original assigned room/pool`.
- Examples: `2707410` (27 July / Pool 410), `2707402` (27 July / Room 402), `2606410` (26 June / Pool 410).
- Numeric batch values can be shared by different SKUs; operational identity is SKU + batch number.
- Database identity must be immutable UUID.
- Batch number is available for planning/preparation so labels can be prepared.
- Planned/reserved identity can change before execution if destination changes; preserve revision history.
- Once execution starts, official batch identity is locked; subsequent changes are controlled events.
- Destination room/pool is encoded in the batch number and is read-only to production workers.

## Batch splitting and genealogy

- Pre-execution plan branching is handled at the plan level: create separate linked plan items rather than one plan item with multiple destinations.
- Physical batch splits are created only when physical material diverges.
- A partial work session alone is not a split.
- Different float types require batch split/child portions.
- Remaining material sent back to Nursery or redirected to a different pool requires authorized destination decision and child portion/genealogy when physical identity diverges.
- Child identifiers may use suffixes such as `2707414-A`, `2707414-B`.
- The original parent remains traceable.
- Same batch normally moves through stages together; partial movement is an exception.
- On partial harvest, remaining pool material keeps original identity/lineage while harvested material gets child/portion records as needed.

## Users and responsibility

- Users can have department/team attributes.
- Shared 402 devices display workers assigned to 402/Cultivation as appropriate.
- Production worker selection is name-based in V1; no PIN/password/badge required at shared stations.
- Worker records physical facts and executes assigned work.
- CS, CL, and Cultivation Manager hold the relevant authority for planning/master-data/destination decisions described in this pack.
- For destination changes after a physical partial completion, CS/CL/TL confirmation is required.

## Seeding

- Every seeded batch records actual production event data.
- Required lots must be selected before completion can commit.
- Primary/preferred lots are preselected by authorized planning/production staff.
- Workers can change preselected lots when reality differs, but a reason is required.
- Multiple seed lots can be used in one production batch/event; allocation quantity is recorded per lot.
- Lot allocation totals must equal actual produced quantity.

## Seeding quantity deviations

If actual quantity differs from plan, completion is allowed only after explicit deviation confirmation.

V1 reasons:
- Seed shortage
- Material shortage
- Equipment problem
- Change in plans
- Other (free text required)

## Preselected lot change reasons

- Lot empty / insufficient quantity
- Lot unavailable
- Material quality issue
- Test
- Change in production plan
- Other (free text required)

`Test` does not require additional text.

## Materials and BOM

Operational BOMs exist separately for:
- PROD BOM
- FG BOM

BC remains ERP/accounting/consumption system of record.

A SKU can be Active while its BOM is empty, but production is blocked until BOM is Ready.

BOM quantity is theoretical material quantity per one production unit. Decimal quantities are allowed.

BOM changes require authorization and a reason, are audited, and take effect for new production. Started runs/batches retain applicable BOM snapshots.

## Seed and material master

### SKU
- unique fixed code, uppercase/validated
- duplicate blocked even if discontinued
- description/category editable by authorized users, audited
- SKU code/identity determines production type/PU/PL/TR behavior rather than separate editable workflow fields
- lifecycle Active/Discontinued
- discontinued SKUs hidden from normal selection but searchable/history-visible
- reactivation requires reason
- notes and attachments supported with permissions/audit

### Seed variety
Reusable across SKUs; each SKU can have distinct seed consumption configuration.

### Seed lot
- seed variety
- lot number
- supplier
- production date
- delivery date
- status: Available / Finished / Discontinued
- comments/dated observations
- optional photos/documents
- activated/created metadata
- forward/reverse usage/history

A new lot becomes selectable only after authorized creation and explicit activation.

### Materials
Central Material Master:
- name
- category
- unit of measure
- lifecycle Active/Inactive
- create/edit/deactivate/reactivate by authorized users
- delete only if never referenced

Packaging/material conversions are preset; workers do not calculate them.

## Tasks

Generic Tasks is separate from Production. Production should not depend on Tasks.

Task hierarchy:
Organization → Department → Team → Task List → permissions → tasks/subtasks

Team tasks and production tasks may appear together in a worker's My Day experience.

V1 task statuses: Draft, Open, In Progress, Completed, Skipped, Cancelled. Upcoming/Due Today/Overdue are derived states.

## Issues and deviations

Deviation = specific planned/actual difference.

Issue = broader operational problem.

Issue workflow:
Reported → Assigned → Investigating → Action Taken → Resolved → Closed

Issues can have text, photos, videos, timestamps, reporter/action/resolution attribution.

## BC boundary

BC is the ERP/accounting/consumption system of record until exact field ownership and integration are explicitly defined.

Current operational assumptions:
- current production is posted in BC as PROD
- each seeded batch has its own PROD Assembly Order
- PROD and FG SKUs have BOMs in BC
- Herbs/Salad TLs post FG Assembly Orders
- 402 CS/TL posts microgreen-box FG Assembly Orders and PROD Assembly Orders
- weekly plans are currently mass-uploaded/manually edited in BC today

Do not make the first 402 vertical slice depend on live BC integration.
