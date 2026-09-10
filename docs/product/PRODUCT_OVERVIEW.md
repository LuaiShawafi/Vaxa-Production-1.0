# Product Overview

## Product goal

Create a production-management and traceability application for Växa Odling that replaces fragile/manual planning and execution workflows with a shared operational record while allowing BC to remain the ERP/accounting/consumption system of record until integration ownership is explicitly defined.

## Operating model

Sales forecast → Cultivation Management creates/adjusts weekly plan → department/team work surfaces execute the plan → actual production events and deviations are recorded → production continues through stages → harvest/processing/finished-goods activity is traceable back to source batches.

Daily morning meeting: TLs, CL, OL, and management discuss today's plan, previous-day deviations/issues, and resolution status. The main app dashboard supports this meeting. Team dashboards support production execution.

## Core concepts

- **SKU / Item:** production definition and master data.
- **Batch:** physical production identity; operational identity is SKU + visible batch number plus internal UUID.
- **Plan Item:** intended work in a plan.
- **Production Task:** actionable production work derived from planning.
- **Production Event:** what physically happened.
- **Delivery:** an inter-team handoff containing one or more batches.
- **Seed Lot / Material Lot:** traceability sources consumed/used by production.
- **BOM:** operational production and finished-goods recipes, separate from BC.
- **Issue:** broader operational problem requiring workflow.
- **Deviation:** structured difference between expected/planned and actual.

## Production lifecycle

Seeding → Germination → Nursery → Transplanting → Pool/Growing → Harvest → Processing/Packing → Finished/Completed

Not every batch passes through every activity in exactly the same department. 402 can perform several stages itself; Pool receives some 402-prepared batches and performs transplanting in pools; Herbs/Salad have their own downstream responsibilities.

## Weekly planning

Weekly planning is Excel-familiar and organized by Monday–Friday operational views:
- Weekly Seeding Overview
- Weekly Transplanting Overview
- Weekly Harvest Overview
- Weekly Surplus Overview

The app should preserve the team's mental model without copying every informal spreadsheet quirk.

## Main dashboard vs team dashboards

### Main app dashboard

Växa-wide management/operations awareness:
- overall plan
- active/unhandled issues and deviations
- previous-day resolutions
- important changes/exceptions
- high-level production status

### 402 production dashboard

402-only production workspace:
- today's plan
- work that needs to happen today
- stage-specific operational lists directly visible
- quick access to required production information

Team dashboards are assembled from shared production data. Plans are not duplicated per team.

## 402 responsibilities for V1

- Seeding
- Germination
- Nursery
- Some transplanting (e.g. chives) where destination/work belongs to 402
- Preparing/sending trays for transplanting by other teams
- Flat-tray product harvest
- PU microgreen box packing
- Other 402 operational tasks

## Broader team model

Later dashboards may include:
- Pool Team: incoming deliveries, transplanting, harvest, pool tasks.
- Harvest Team: transplanting visibility + harvest.
- Herbs: relevant transplanting, harvest, processing.
- Salad: relevant transplanting, harvest, processing.
- Logistics: dispatch/transport workflows.

The same production plans and batch records back these views.
