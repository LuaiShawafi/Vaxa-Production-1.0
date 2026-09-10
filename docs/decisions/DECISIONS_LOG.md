# Confirmed Decisions Log

This file consolidates decisions made during product discovery. Treat these as confirmed unless superseded by a later dated decision.

## Product architecture

- 402 is the first full vertical slice because it spans many production responsibilities.
- Plans are production-wide; team dashboards are filtered team-specific work surfaces.
- 402 dashboard is distinct from the main Växa-wide dashboard.
- Main dashboard emphasizes overall production, issues, deviations, previous-day resolution and attention.
- 402 dashboard emphasizes today's work and operational information.

## 402 dashboard UX

- Do not require workers to click separate cards/pages just to reveal today's lists.
- Put stage-specific work lists directly on the 402 dashboard.
- Main sections include Today's Plan, Seed Today, Germination → Nursery, Nursery, Transplanting — 402, Send for Transplanting, Flat Tray Harvest, Microgreen Packing, Other Tasks.
- Each stage may have `View all` for the full list.

## Seeding

- Start button is on the list row.
- Info button provides more batch information without starting.
- Start opens worker-name selection on shared device.
- Start asks only for worker identity.
- Completion asks for participants, actual quantity, traceability lots and deviation data as needed.
- Initiating worker is preselected as a participant; additional participants can be added.
- Preselected active lots are provided by authorized staff.
- Worker can change lot allocation and add additional lots.
- Lot allocation is quantity-based and must reconcile to actual production.
- If actual quantity differs from plan, worker can proceed only through explicit deviation reporting.
- Seeding quantity deviation reasons: seed shortage, material shortage, equipment problem, change in plans, other.
- Preselected lot change reasons: lot empty/insufficient quantity, lot unavailable, material quality issue, test, change in production plan, other.
- Test does not need extra explanation.
- Other requires explanation.
- Review step precedes final commit.
- Successful completion uses a quick checkmark animation, then returns to useful work automatically.
- Successful seeding automatically moves batch to Germination.

## Timing / DTM

- DTM stays consistent for planning.
- Stage extension does not automatically add days to DTM.
- Expected and actual timelines can be shown side by side.
- Example: expected germination 4 days, actual 5; configured nursery remains 11 days while that batch could have actual nursery duration of 10 days.
- SKU configured duration does not become 10; actual batch duration is the 10-day observation.

## Germination

- Worker sees batch, SKU, seeded date, expected date, day/duration, location, Info.
- Actions are Move to Nursery and Extend Germination.
- No separate Ready then Move step.
- Extension options: +1/+2/+3/Custom.
- Extension automatically recalculates next assessment date.
- Nursery location is not required in V1.

## Nursery / handoff

- There are two distinct paths from Nursery:
  1. 402 performs transplanting.
  2. 402 prepares/sends batch to another team.
- Destination is already determined by the plan/batch and is not selected by the worker.
- Send action asks 402 only to confirm actual trays sent.
- Inter-team handoffs are modeled as Deliveries.
- A Delivery can contain multiple batches.
- Receiving team confirms quantity per batch and one worker can confirm the whole Delivery.
- Receiving is distinct from transplanting. Receipt makes batches available for transplanting but does not start it.

## Transplanting

- 402 actual transplanting has its own view/workflow.
- Worker sees planned trays and available trays; full history is available separately.
- Destination is read-only context from batch identity.
- Float type is defaulted from configuration but worker can change it.
- A single batch cannot use multiple float types in one transplant event.
- Different float types require a batch split/genealogy.
- Worker records physical transplant quantity, normally in trays; float count/units can be calculated from configuration.
- Whole-batch completion is the common case.
- Partial transplant is allowed; worker can record part of the available quantity.
- Normal partial execution leaves the batch In Progress with progress such as 10/20.
- Resume records additional quantity and accumulates progress.
- Paused means explicitly stopped pending a decision/intervention.
- Partial execution alone does not create a child batch.
- If remaining material goes back to Nursery or another pool/destination, CS/CL/TL confirms disposition and physical divergence creates child genealogy as appropriate.

## Destination and authorization

- Destination room/pool is encoded in visible batch identity from seeding.
- Worker does not select/change destination.
- CS/CL/CM control destination changes.
- For partial-transplant remaining material, CS/CL/TL confirmation is required for new destination/disposition.

## Next steps

- First actual build: database-backed 402 vertical slice.
- Do not make first slice depend on live BC.
- Harvest/packing, surplus, logistics, issue severity, and BC integration details remain later definitions.
