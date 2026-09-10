# Technical Data Model — V1 Direction

This is the conceptual schema for the first implementation. Exact Prisma naming can be chosen during implementation, but the semantics should remain stable.

## Identity and organization

### User
- id UUID PK
- name
- email/username as applicable
- active
- created_at
- updated_at

### Team
- id UUID PK
- department_id FK
- name
- active

### UserTeam
- user_id FK
- team_id FK
- active
- effective_from / effective_to optional

### Role / Permission
Implement role-based permissions with explicit domain actions. Avoid encoding permissions only in UI visibility.

## Master data

### SKU
- id UUID PK
- code unique, normalized uppercase
- description
- category_id
- lifecycle Active/Discontinued
- primary_seed_variety_id
- notes
- configuration fields
- created_by / updated_by / timestamps

### SKUSeedConfig
- sku_id
- seed variety
- seeds_or_qty per unit
- measure
- substitute/primary relationship as appropriate
- active/effective timestamps

### SeedVariety
- id UUID
- name
- active

### SeedSubstitute
- sku_id
- seed_variety_id
- relationship metadata
- effective dates/audit

### SeedLot
- id UUID
- seed_variety_id
- lot_number
- supplier_name
- production_date
- delivery_date
- status: Available / Finished / Discontinued
- comments
- created/activated metadata

### Material
- id UUID
- name
- category
- unit_of_measure
- lifecycle Active/Inactive

### MaterialLot
- id UUID
- material_id
- lot_number
- status
- supplier/date metadata as later defined

### BOM
- id UUID
- sku_id
- type enum PROD | FG
- active
- readiness derived
- created/updated metadata

### BOMLine
- bom_id
- material_id / component SKU where FG requires SKU component
- quantity_per_unit decimal
- unit_of_measure
- order/index

A PROD BOM may reference seeds/materials according to implementation semantics. An FG BOM may reference component SKUs.

## Planning

### ProductionPlan
- id UUID
- plan_type / week
- status Draft/Published/etc. only if required by implementation
- revision_of_id nullable
- created_by
- published_by
- timestamps

### PlanItem
- id UUID
- plan_id
- parent_plan_item_id nullable for linked/revised/branched planning
- sku_id
- planned_date
- work_type/stage
- planned_quantity
- quantity_uom
- destination_identity (room/pool as planned)
- assigned_team_id where applicable
- comments
- revision metadata

Important: do not model multiple destinations in one plan item; create linked descendants/items.

## Batches

### Batch
- id UUID PK
- parent_batch_id nullable
- sku_id
- visible_batch_number
- original_assigned_destination
- current_stage
- current_status
- origin_plan_item_id
- official_identity_locked_at nullable
- created_at
- updated_at

Visible batch number remains historical truth. Child batch/portion IDs may append suffixes. Keep a parent relation and reason/type for genealogy.

### BatchGenealogyEvent
- id UUID
- parent_batch_id
- child_batch_id
- quantity
- quantity_uom
- reason/type
- actor
- timestamp
- notes

## Production execution

### ProductionTask
- id UUID
- plan_item_id nullable
- batch_id nullable
- task_type
- assigned_team_id
- status planned/open/in_progress/completed/cancelled
- started_at / completed_at
- starter_user_id
- completion metadata

### ProductionTaskParticipant
- task_id / event_id
- user_id
- role/participant metadata

### ProductionEvent
- id UUID
- batch_id
- production_task_id nullable
- event_type
- initiated_by_user_id
- occurred_at / started_at / completed_at as appropriate
- planned_quantity snapshot
- actual_quantity
- quantity_uom
- stage_before / stage_after
- status
- deviation summary
- configuration snapshot references

### ProductionEventLotAllocation
- event_id
- lot_id
- lot_type (SEED / MATERIAL)
- quantity
- quantity_uom
- change_from_preselected boolean
- change_reason nullable
- notes nullable

## Delivery / handoff

### Delivery
- id UUID
- from_team_id
- to_team_id
- planned_date
- sent_at
- received_at
- sent_by_user_id
- received_by_user_id
- status

### DeliveryItem
- delivery_id
- batch_id
- sent_quantity
- received_quantity
- quantity_uom
- discrepancy_deviation_id nullable

A delivery can contain many batches and can be confirmed by one receiver in one action.

## Deviations and issues

### Deviation
- id UUID
- type
- batch/event/task/delivery context
- planned_value
- actual_value
- reason_code
- explanation nullable
- created_by
- created_at

### Issue
- id UUID
- severity
- status Reported/Assigned/Investigating/Action Taken/Resolved/Closed
- title
- description
- reported_by
- assigned_to
- timestamps

## Audit

Create an append-only audit record for operational changes that require traceability, including:
- plan changes
- destination changes
- SKU/master-data changes
- BOM changes
- lot activation/status changes
- preselected lot changes during execution
- controlled batch split/destination decisions
- corrections

## Important implementation invariant

The system must be able to answer:

> For this finished/harvested/processed quantity, which plan item, batch lineage, production events, workers, seed lots, material lots, deliveries, and deviations contributed to it?
