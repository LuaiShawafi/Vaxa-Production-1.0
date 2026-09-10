# Master Data, Timing, BOM and Material Rules

## SKU lifecycle and identity

- SKU/item code is unique and fixed after creation.
- Normalize to uppercase and validate format.
- Duplicate creation is blocked even if a prior SKU is discontinued.
- Authorized users can edit description and category; changes are audited.
- Category is a controlled list with one primary category.
- Lifecycle: Active / Discontinued.
- Discontinued SKUs are hidden from ordinary selection but remain searchable/history-visible.
- Reactivation requires a reason and is audited.
- Notes are readable to users with access and editable only by authorized users; edits audited.
- Attachments/photos/documents can be supported with permission and upload/delete audit.

## Production type

Growing Method and Production Type are not free independent fields in V1. SKU identity/code determines the applicable PU, PL or TR workflow/format.

## Seed configuration

- Primary seed variety is editable by authorized users and audited.
- Seed substitutes are approved alternative seed varieties.
- Authorized users can add/remove/promote substitutes; audit all changes.
- Actual substitute usage requires selecting the approved substitute and physical lot, with a reason because it differs from primary.
- If a substitute lacks SKU-specific consumption configuration, do not silently borrow the primary rate.
- Seed Variety Master is reusable across SKUs; each SKU may have its own rate.

### Seed calculation

Seeds-per-Unit and Seed Measure are paired editable/audited values. UI should read naturally, e.g. `5 g/unit` or `5 seeds/unit`.

## Timing/capacity fields

Authorized users may edit and audit:
- Germination Days
- Nursery Days
- Growing Days
- Nursery Density
- Final Density
- Units per Bench
- Average Unit Weight
- Seeds per Unit
- Seed Measure

DTM Total is derived:
`Germination + Nursery + Growing`

Growing SQM is derived according to the provided workbook formula and is not editable.

Harvests per Year is derived from the current workbook logic (`Y1 / Growing Days`); the exact meaning/value of the Y1 constant is not yet confirmed. Keep it a derived/reference value.

Average Unit Weight is a live reference for planning/calculation only and does not rewrite actual production history.

Conversion Target is excluded from V1.

Planning buffer percentage was removed from V1.

## Timing change behavior

A timing update applies to new calculations/currently applicable stage context as defined in the implementation. A batch that has already passed a stage must retain the historical duration/snapshot applicable when it was in that stage.

## BOM rules

Maintain two operational BOM types:
- PROD BOM — production recipe
- FG BOM — finished-goods recipe

They are separate from BC. BC remains ERP/accounting/consumption system of record until integration ownership is defined.

Exactly one active operational BOM per SKU per type.

A SKU can be Active while BOM is empty. The UI must show `BOM Required`; production is blocked until BOM is Ready.

### PROD BOM examples

PU:
- punnets
- substrate mats
- seed
- 42 units/punnets per PU tray
- 2 mats per punnet → 84 mats per PU tray

TR:
- one unit/flat tray
- 2 large substrate mats
- seed

PL:
- plug tray (192 plugs)
- seed per plug/unit
- 16-hole floats for salad
- 48-hole floats for herbs/other PL

### FG BOM example

A microgreen mix box can combine:
- 4 × PU_RED_SHISO
- 4 × PU_GREEN_RADISH
- 4 × PU_MUSTARD
- 4 × PU_RED_RADISH

It is one combined packing batch with component quantities.

### BOM lifecycle

BOM changes (add/remove/replace/change quantity) require authorization and a predefined reason + optional/required explanation where configured. Audit old/new values, user and timestamp.

Changes are immediate for new production. Started runs/batches retain the applicable BOM snapshot. A partially executed batch does not silently switch to a new BOM.

## Materials

402 preparation often happens 1–2 working days ahead as temporary WIP.

PU prep: substrate mats into punnets on trays; seed added on seeding day.

TR prep: larger mats into trays; seed added on seeding day.

Physical preparation can combine material lots in a single prep run. Record actual lot allocations to production quantity rather than assuming the latest active lot was used.

Detailed inventory depletion is intentionally out of scope for the first implementation.

## Active/preferred vs available lots

- Seeds: one active/preferred lot, but other eligible lots may remain selectable.
- Plug trays: one active/preferred lot, with older lots retained as history/available where valid.
- Substrate/punnets: available-lot list; older lots remain selectable/history-visible.
- Active/preferred is not the same as only selectable.

## Lot activation

A new physical lot must be created by an authorized user and explicitly activated before it becomes selectable. Status changes are restricted to authorized users.

Seed lot statuses are exactly:
- Available
- Finished
- Discontinued

Do not introduce extra lot statuses without an explicit product decision.

Quality observations are restricted to CS/CL/Cultivation Manager as appropriate.

Detailed depletion is not required initially. Actual production usage is recorded in execution events.
