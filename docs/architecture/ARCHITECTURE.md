# Application Architecture

## Recommended stack

- Next.js + TypeScript
- PostgreSQL
- Prisma
- Tailwind CSS
- shadcn/ui or equivalent controllable components
- Zod
- Vitest
- Playwright
- Git/GitHub

## Architectural boundaries

### Presentation
Next.js routes, server/client components, forms, tables, production-floor views.

### Application/domain layer
Use explicit services/use cases for actions such as:
- start production task
- complete seeding
- allocate lot
- change preselected lot
- move batch to Nursery
- extend stage
- send delivery
- receive delivery
- start transplant
- record partial transplant
- resume transplant
- create controlled batch split/disposition

Do not bury domain rules only in React components.

### Persistence
PostgreSQL + Prisma. Persist current operational state for fast reads and immutable/append-only event history for traceability.

### Validation
Zod for input validation. Domain services enforce authorization and business invariants even when UI validation is bypassed.

## First implementation target

The first real end-to-end slice should be:

`402 Dashboard → Seed Today → Start → Select Worker → Complete → Participants → Actual Quantity → Lots → Review → Commit → Germination`

## Suggested route map

Exact URL naming can change, but a clear structure should exist:

```text
/                         main app dashboard
/402                      402 team production dashboard
/402/seeding              full seeding stage view
/402/germination          full germination stage view
/402/nursery              full nursery view
/402/transplanting        402 transplanting view
/402/outgoing              402 send-for-transplanting view
/batches/:id              batch detail/history
/deliveries/:id           delivery detail/receiving
/admin/...                authorized master data/admin
/tasks/...                generic Tasks module
```

## Device/session model

V1 must support shared production devices without requiring a user login.

The device itself can have a production-area/team context (e.g. 402), while worker identity is selected at start. Store the selected user on the production task/event.

Do not build a permanent “switch worker after every action” requirement.

## Transactions / idempotency

Production commits must be transactional. Avoid creating an event but failing to update the task or batch stage.

Client retries must not double-complete a production event. Use idempotency keys or equivalent server-side protection for commit operations.

## Audit and correction

Use explicit audit records for changes that affect planning, traceability, identity, BOMs, lots, or destination. Corrections preserve original state/event history.

## BC integration

No live BC dependency for the first vertical slice. Create an integration boundary/interface for future BC synchronization without making local execution depend on it.
