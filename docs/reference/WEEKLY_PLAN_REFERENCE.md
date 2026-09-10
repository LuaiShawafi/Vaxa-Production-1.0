# Weekly Plan Workbook Reference

The Excel weekly-plan workbook supplied during discovery is **read-only reference data**. The application must not modify it.

The workbook is useful for understanding the team's visual planning language and familiar weekly workflow, not for turning every informal spreadsheet cell into a business rule.

## Views studied

1. Weekly Seeding Overview
2. Weekly Transplanting Overview
3. Weekly Harvest Overview
4. Weekly Surplus Overview

The workbook uses a Monday–Friday planning layout.

## Seeding view

Typical planning context:
- Variety
- Units
- Trays
- Room
- Floats

## Transplanting view

Typical context:
- Variety
- Batch
- Units
- Trays
- Room
- Sign/comments

## Harvest view

Typical context:
- Variety
- FG
- SKU
- Units
- SRS
- Batch
- department/category sections such as Herbs/Lettuce/Food Service

## Surplus view

Typical context:
- Variety
- KG surplus
- Harvested
- Batch
- surplus waste/disposition context

## Interpretation constraints

- `strainers` in the workbook is a reminder to soak peashoot seeds for the next day's seeding, not a new TR-production workflow.
- Strings such as `35 trays / 420 floats / 400 floats` can be contradictory because workers use signature/comments areas for informal operational comments. Do not infer authoritative production rules from those strings.
- `SUNGARI` is a test lettuce variety without a SKU yet and is temporarily represented as `PL_HYDROLIQUE`. Do not redesign SKU logic around this temporary entry.
- Entries such as `36 rows`, `16X11 rows`, `11X23 rows`, `5.5 rows` are mostly instructions to the pool team, not necessarily structured database fields.

## App planning direction

The app should preserve the mental model and terminology where useful, while using explicit structured fields for authoritative data.

Weekly planning should support:
- recurring seeding plan copied from prior week then adjusted
- transplanting and harvest plans where planner chooses eligible actual batches
- oldest/most-ready-first suggestions for candidate batches
- planner can select another eligible batch
- planning by trays or units
- units → required trays; if non-integer, show difference and require planner approval of final tray count
- auditable revisions
- significant edits require reason
- comments do not require reason
