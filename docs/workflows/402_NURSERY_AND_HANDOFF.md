# 402 Nursery and Inter-Team Handoff — V1

## Two different operational paths

When nursery work reaches transplanting, 402 can either:

1. Transplant the batch itself.
2. Prepare trays and send them to another team for transplanting.

Do not combine these into one ambiguous action.

## Path A — 402 transplanting

For batches whose destination/work belongs to 402, the batch becomes available in the dedicated `Transplanting — 402` work list.

See `402_TRANSPLANTING.md`.

## Path B — Send for Transplanting

For batches that will be transplanted by another team (e.g. Pool Team):

`Nursery → Prepare/Send → In Transit → Delivery → Received → Available for Transplanting`

The plan already defines destination. Workers do not select destination during send.

## Send workflow

402 sees:
- batch
- SKU
- planned quantity
- destination from plan/batch

Worker confirms:
- actual trays sent

No need to re-enter or choose destination.

The system creates/updates a Delivery containing one or more batches to the receiving team.

Record sender, time, batch, sent quantity and any deviation when applicable.

## Delivery model

A delivery represents a physical handoff and can contain multiple batches.

Example:
- Batch A — 35 trays
- Batch B — 20 trays
- Batch C — 40 trays

Receiving team can confirm the complete delivery in one action.

## Receiving

One worker can receive the whole delivery.

For each Delivery Item, receiver confirms actual received quantity.

Then `Confirm Delivery` records:
- receiver
- delivery timestamp
- received quantity per batch
- discrepancies/deviations per batch where necessary

Receiving does not start transplanting.

After receipt, each batch is independently available to be started in the receiving team's transplanting workflow.
