# Test Strategy

## Goal

Protect the production domain from subtle data-integrity errors while allowing rapid UI iteration.

## Domain/unit tests

Test at the service/domain level:

### Seeding
- start requires/records worker
- shared-device worker must belong to relevant team
- participants can be added
- actual quantity defaults to planned
- quantity mismatch requires deviation
- missing required lot blocks completion
- lot allocations must reconcile to actual quantity
- changing preselected lot requires reason
- `Other` reason requires text
- `Test` requires no text
- successful commit completes task and creates production event
- successful commit moves batch to Germination
- expected date is calculated from applicable SKU duration
- DTM is unchanged by individual batch extension

### Germination
- due-date calculation
- extension choices
- custom extension
- reassessment date changes
- move to Nursery records actual duration
- SKU timing remains unchanged

### Delivery
- one Delivery can contain many batches
- sending records per-batch sent quantity
- receiving records per-batch received quantity
- one receiver can confirm whole delivery
- receipt does not start transplanting

### Transplanting
- available = received minus completed actuals where applicable
- default float type comes from configuration
- float-type change requires reason
- one transplant event cannot contain multiple float types
- partial work does not create child batch
- resume adds additional quantity
- reaching full available quantity completes
- divergence to a different destination requires controlled disposition

## E2E tests

At minimum:
1. Normal 35-tray seed from dashboard to Germination.
2. Two seed lots: 25 + 10.
3. Quantity deviation: 35 planned / 33 actual / seed shortage.
4. Lot substitution requiring reason.
5. Germination +1 day extension.
6. Nursery move.
7. 402 send delivery.
8. Pool receiving whole delivery.
9. 402 partial transplant 10/20, then resume to 20/20.

## Visual/UX review

Use Playwright screenshots for major worker screens at desktop and production-floor viewport sizes. Check:
- clear stage labeling
- action discoverability
- minimum touch targets
- error clarity
- no unnecessary scrolling on common actions

## Test data

Use deterministic seeded fixtures for:
- 402 users
- Pool users
- PU/PL/TR SKUs
- seed lots/material lots
- batches with different states
- deliveries
- deviations
- partial transplant scenario

Never use real employee identity data in development/test fixtures.
