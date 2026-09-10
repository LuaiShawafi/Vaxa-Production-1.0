# AGENTS.md — Växa Production App

These rules apply to all coding agents working on this repository.

## 1. Product identity

Build a **production operations and traceability application** for Växa Odling. Do not turn the product into a generic task-management SaaS.

Production planning is shared. Team dashboards are filtered operational views of shared plans.

The first full team implementation is **402**. 402 performs seeding, germination, nursery work, some transplanting such as chives, flat-tray harvest, and PU microgreen-box packing.

## 2. Absolute domain rules

### Planning vs reality

- Planned, Expected, Scheduled, and Actual are distinct concepts.
- Never overwrite planned values with actual values.
- A deviation records the difference between plan/expected and what physically happened.
- Expected biological dates are guidance/assessment dates, not hard deadlines.

### DTM

- DTM (Days To Maturity) is a planning parameter derived from SKU stage durations.
- A batch extension in one stage must **not automatically increase DTM**.
- Store actual stage duration separately from the configured stage duration.
- If one stage takes longer, the next stage may have fewer actual days while the configured duration remains unchanged.
- Historical applicable timing must be preserved for batches already past a stage.

### Batch identity and destination

- Operational identity is SKU + batch number; the database must also have an immutable internal UUID.
- Visible batch number follows the current rule: `DDMM + original assigned room/pool`.
- Examples: 27 July Pool 410 → `2707410`; 27 July Room 402 → `2707402`; 26 June Pool 410 → `2606410`.
- Destination room/pool is encoded by the batch number from seeding time.
- Destination changes after planning are controlled changes by CS, CL, or CM and must be audited.
- Once execution starts, official batch identity is locked; do not silently edit the visible batch number.

### Batch splitting / genealogy

- Partial execution alone does **not** create a child batch.
- Create a child batch/portion only when physical material diverges in destination, configuration, or other identity-defining way.
- A batch cannot use multiple float types in one transplant event. If different float types are needed, split the batch into child portions first.
- Example: `0909402-A` 16-hole and `0909402-B` 48-hole, both tracing to parent `0909402`.
- On partial harvest, preserve remaining material under its original lineage and create child/portion records for harvested material as needed.

### Worker vs authorized decisions

- Workers report what physically happened.
- CS, CL, and Cultivation Manager control authorized planning/master-data/destination decisions where specified.
- Workers must not silently change planned destination, configured master data, or production intent.
- For shared production devices, workers select their name from the users assigned to the relevant team. No PIN/password/badge is required in V1.

### Traceability

- Required traceability data must be complete before production completion is committed.
- Preselected/active lots are provided by authorized users when applicable, but workers can record reality when it differs.
- Changing a preselected lot requires a reason.
- Actual lot allocations must reconcile to actual produced quantity.
- A production run can use multiple seed lots; each allocation records quantity.

### Production event structure

- Plan Item = intended work.
- Production Task = actionable team work created from planning where appropriate.
- Production Event = what physically happened.
- Batch = production identity.
- One task can have multiple events; multiple workers can participate in an event.
- Starter/initiator and participant list must be retained.

## 3. 402 dashboard rules

The 402 dashboard is **not** the main Växa-wide dashboard.

Main app dashboard purpose:
- whole-production awareness
- today's overall production
- active/unhandled issues
- previous-day resolutions
- high-level exceptions and changes

402 dashboard purpose:
- show what 402 needs to do today
- provide operational production lists
- provide fast access to the information 402 needs during the day

The 402 dashboard should show relevant work as already-open sections/lists, not force navigation into one section at a time.

Typical 402 dashboard sections:
- Today's Plan
- Seed Today
- Germination → Nursery
- Nursery
- Transplanting — 402
- Send for Transplanting
- Flat Tray Harvest
- Microgreen Box Packing
- Other Tasks
- Quick access to batches, seed lots, materials, SKUs, etc.

Each stage section can expose a `View all` action for the complete stage list.

Do not create an ambiguous combined `Production Tasks` table where rows lack stage meaning.

## 4. Production execution UX

- Production-floor touch targets should be at least 44px; prefer 48px.
- Minimize typing.
- Show workers the minimum information needed for the current decision.
- Full history is available one click away rather than cluttering the work surface.
- Starting a task is intentionally lightweight.
- Completion is the point where detailed production/traceability data is committed.
- Use a short success animation/checkmark after successful completion; do not add a redundant success page with a Done button.

## 5. Shared-device identity

For V1 shared production devices:
- no personal login required
- Start → Select your name → Start
- user list comes from the database filtered by relevant team/department attributes
- the selected worker is the initiating worker
- at completion, the initiating worker is preselected and additional participants can be added

## 6. Seeding completion rules

Completion flow:
1. Start from list.
2. Select initiating worker.
3. Perform physical work.
4. Press Complete.
5. Confirm/add participants.
6. Confirm or change actual quantity.
7. Review preselected lots.
8. Adjust lot allocations or add lots as necessary.
9. Validate allocations against actual quantity.
10. Handle any deviation/lot-change reason.
11. Review summary.
12. Commit.
13. Batch moves to Germination automatically and expected next-stage date is calculated.

Normal seeding quantity deviations:
- Seed shortage
- Material shortage
- Equipment problem
- Change in plans
- Other (requires explanation)

Preselected-lot change reasons:
- Lot empty / insufficient quantity
- Lot unavailable
- Material quality issue
- Test
- Change in production plan
- Other (requires explanation)

`Test` does not require additional text.

## 7. Germination

A batch appears in the Germination → Nursery section when it reaches its expected assessment date.

Worker-facing information:
- batch
- SKU
- seeded date
- expected assessment date
- actual/current germination day vs expected duration
- current location
- info action

Actions:
- `Move to Nursery`
- `Extend Germination`
- `Info`

Extension:
- +1 day
- +2 days
- +3 days
- Custom

Extension changes the next assessment date and records actual stage duration. It does not rewrite SKU DTM.

Moving to Nursery does not require a nursery location in V1.

## 8. Nursery and inter-team handoff

From Nursery, 402 has two operational paths:

### 402 performs transplanting
For batches whose destination/work belongs to 402, the batch moves into the dedicated 402 transplanting workflow.

### 402 prepares and sends to another team
402 confirms the actual tray quantity sent. Destination is already defined by the plan/batch and is not selected by the worker.

Handoff lifecycle:
`Nursery → Send for Transplanting → In Transit → Delivery received → Available for transplanting → Transplanting`

Treat inter-team receipt as a **Delivery** containing multiple batches.

The receiving team can receive a whole delivery with one worker confirmation. Each batch retains its own sent and received quantity.

Receiving does not mean transplanting has started.

## 9. Transplanting

Worker-facing transplant screen should show only:
- SKU / batch
- planned quantity
- available quantity
- default/configured float type
- actual transplant quantity
- calculated float count/units as applicable
- info/history action

Do not overwhelm workers with planned/sent/received/transplanted history. Provide full history behind an action.

Float type:
- default comes from configuration
- worker can change it
- change requires a reason
- a batch may not mix float types in one transplant event
- different float types require batch split/genealogy

Partial transplant:
- worker records quantity completed in the current execution
- if less than available, status remains `In Progress` unless explicitly paused
- progress is shown as `completed / available`
- worker can later `Resume`
- on resume, record only the additional quantity for that session; system maintains cumulative progress
- a normal partial completion does not create a new child batch
- if remaining material physically diverges to a different destination/stage, CS/CL/TL confirmation is required and genealogy/child portion is created as appropriate
- `Paused` means work is deliberately stopped pending a decision/intervention; `In Progress` means ordinary partial work remains

Destination is read-only to the worker. Destination changes are controlled by CS/CL/CM.

## 10. Database/change rules

- Every operationally meaningful state transition should be auditable.
- Keep immutable production event records rather than mutating history into a current-state-only record.
- Preserve original planned values and corrections.
- Preserve material/lot snapshots applicable to started work.
- Do not silently cascade master-data changes onto started batches.
- Started/partially executed batches retain the applicable BOM/timing snapshot.

## 11. Do not invent missing business rules

If something is not defined in this starter pack, do not silently invent a business rule and treat it as confirmed. Mark it as an implementation question or use a reversible technical default clearly labeled as such.

Important areas still not fully defined:
- exact harvest execution workflow
- detailed flat-tray harvest data capture
- detailed microgreen box packing workflow
- surplus lifecycle/disposition
- final delivery/logistics workflow
- exact issue severity labels
- exact BC integration field ownership/connectors
- exact visual details for later teams

## 12. Coding workflow

For each feature:
1. Read the relevant docs.
2. Propose a small implementation plan.
3. Update schema/domain tests before or alongside UI where appropriate.
4. Implement the smallest complete slice.
5. Run typecheck/lint/unit tests.
6. Run e2e tests for user-critical workflows.
7. Verify responsive production-floor UI.
8. Document meaningful architectural decisions.
9. Never rewrite confirmed domain rules merely to make implementation easier.
