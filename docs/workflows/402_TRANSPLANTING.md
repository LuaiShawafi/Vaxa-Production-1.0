# 402 Transplanting Workflow — V1

## Scope

This workflow is specifically for transplanting performed by 402, such as 402-owned/destination batches like chives.

The receiving Pool Team will later use the same production concepts but a different team dashboard and separate Delivery/Receive flow.

## Worker-facing screen

Keep the operational screen intentionally small.

Show:
- SKU / batch
- planned trays for transplanting
- available trays
- default/configured float type
- actual transplant quantity
- calculated units
- Info / batch history

Do not overwhelm the worker with planned/sent/received/transplanted history. Make full history one click away.

## Planned vs available

The useful numbers for the worker are:
- Planned: from the transplanting plan
- Available: based on actual quantity currently available to transplant

For a delivered batch, available is based on quantity actually received minus quantity already transplanted.

Example:
Planned 35 trays
Received 33 trays
Already transplanted 4 trays
Available 29 trays

The worker does not need to see all those historical numbers on the main screen.

## Destination

Destination room/pool is encoded in the batch identity from seeding.

Show destination as read-only context where useful.

Workers do not select the destination. Changes are controlled by CS/CL/CM according to business rules.

## Float type

The default float type comes from SKU/production configuration.

Worker can change the float type if needed.

A float-type change requires a reason and is audited.

A single transplant event cannot use multiple float types.

If multiple float types are physically required, create a batch split first. Example:
- parent 0909402
- 0909402-A → 16-hole
- 0909402-B → 48-hole

Child batches remain traceable to the parent.

## Quantity entry

The common case should be simple:

- worker enters/transfers actual transplant quantity in trays
- worker enters/uses number of floats as needed for physical record
- units are calculated automatically from float type and configured capacity

Do not ask the worker to calculate units manually.

The worker should be shown the planned tray quantity before recording actual transplanting.

## Start

For shared device:
- Start
- select worker name
- task becomes In Progress

Start should not ask for detailed transplant information.

## Partial transplant

The most common case is full batch completion.

But partial execution is supported.

Example:
- available 20 trays
- worker transplants 10
- records 10
- status becomes In Progress
- progress is 10/20

Do not automatically create a child batch simply because work was partial.

## Resume

Worker selects `Resume` later.

Worker records only the additional quantity completed in this session.

Example:
- session 1: +10, cumulative 10/20
- session 2: +10, cumulative 20/20

Underlying production events preserve session-level history while the UI shows simple cumulative progress.

## In Progress vs Paused

- `In Progress`: normal partial work remains.
- `Paused`: work is deliberately stopped pending a decision/intervention.

If 10/20 are done and the remaining 10 remain for the same planned destination, keep the batch in progress/available; no split is needed.

If the remaining 10 are to return to Nursery or go to another pool/destination, CS/CL/TL must confirm the disposition. Physical divergence then creates appropriate genealogy/child portion.

## Completion

If actual reaches the available quantity, the transplant event can complete normally.

If the worker records less than available, the review can say:

`Partial transplant — 10 of 20 available trays will be recorded. 10 remain.`

If the remaining quantity simply remains under the same batch/destination, the batch stays In Progress.

If a new destination/stage is decided, that is a controlled disposition workflow.
