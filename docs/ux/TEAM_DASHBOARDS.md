# Team Dashboards

## Principle

Production plans are shared across the organization. Dashboards are **team-specific operational views** of those plans.

Do not duplicate the underlying plan for each team.

## Main dashboard

The main app dashboard is a management/operations overview for the whole production system.

Primary purpose:
> What is happening across Växa, and what needs attention?

Show:
- overall today's production picture
- active/unhandled issues and deviations
- recent resolutions (especially previous working day)
- important changes/exceptions
- high-level status by area/team

Do not use this as the worker's production-floor screen.

## 402 dashboard

Primary purpose:
> What does 402 need to do today, and what information do 402 workers need during the day?

The dashboard itself should show relevant lists directly. Avoid a card-only navigation pattern that forces a worker to click into every stage before seeing work.

Suggested sections:

### Today's Plan
All work 402 is expected to handle today, regardless of specific stage.

### Seed Today
Batches scheduled to be seeded today.

Common row actions:
- Start
- Info

### Germination → Nursery
Batches in germination that require today's assessment/action.

Actions:
- Move to Nursery
- Extend Germination
- Info
- View all germination

### Nursery
Today's relevant nursery work.

Action:
- View all nursery

### Transplanting — 402
Only transplanting work physically performed by 402.

### Send for Transplanting
Nursery batches 402 prepares and sends to another team.

This is a handoff workflow, not transplant execution.

### Flat Tray Harvest
402-owned flat-tray harvest work. Detailed execution still needs definition.

### Microgreen Box Packing
402-owned PU microgreen-box packing. Detailed execution still needs definition.

### Other Tasks
Generic/team tasks relevant to 402.

### Quick Access
Allow fast lookup into:
- batches
- seed lots
- materials/material lots
- SKUs
- production history

## Visibility principle

The dashboard should filter work by responsibility, not by arbitrary database objects.

Examples:
- A pool-bound batch prepared by 402 appears in 402 `Send for Transplanting`, then appears in Pool incoming Delivery/Receiving.
- A chives batch destined to 402 appears in `Transplanting — 402`.
- A pool-bound batch should not appear in 402's actual transplant queue.

## Stage-specific full lists

The dashboard is not required to show every batch. It shows the subset needing attention today.

Every operational stage should expose a `View all` path to a full stage management screen.

## UI tone

- Practical
- calm
- professional
- modern
- low cognitive load
- no dashboard vanity metrics
- production-floor friendly
- Excel-familiar where planning tables are concerned
