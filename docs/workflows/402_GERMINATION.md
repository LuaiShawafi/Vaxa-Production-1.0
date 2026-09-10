# 402 Germination Workflow — V1

## Dashboard behavior

402 dashboard shows `Germination → Nursery` as an open list containing batches that require attention on the current/selected workday.

Each item may include:
- Batch
- SKU
- Seeded date
- Expected assessment date
- Current/actual germination day vs expected duration
- Current location
- Info
- Move to Nursery
- Extend Germination

A `View all germination` action opens the full stage list, including batches not due for action today.

## Move to Nursery

This is a single operational decision, not a two-step Ready → Move workflow.

Worker presses `Move to Nursery`.

System:
- confirms the move
- records worker and timestamp
- records actual germination duration
- changes batch stage to Nursery
- calculates expected nursery completion date using applicable SKU Nursery Days

No nursery location is required in V1.

## Extend Germination

Worker presses `Extend Germination`.

Choices:
- +1 day
- +2 days
- +3 days
- Custom

System calculates the new assessment date automatically.

The batch stays in Germination.

Example:
- configured germination: 4 days
- original assessment: Sep 11
- extension: +1
- next assessment: Sep 12
- actual germination duration may become 5 days

Do not increase the batch/SKU DTM simply because the stage was extended.

## Expected vs actual timeline

For each batch, history should be able to show:
- expected stage duration/date
- actual stage entry/exit date
- actual duration
- extension decisions
- assessment results/transition worker

Example:
Expected Germination: 4 days
Actual Germination: 5 days

The SKU remains configured at 4 days. The batch records 5 actual days.

## DTM rule

If the batch spends an extra day in Germination, that day is not automatically added to DTM. Downstream actual stage durations may consequently be shorter while the original DTM planning value remains unchanged.
