# Planning Model

## Planning flow

Sales forecast → Cultivation Management decides weekly production plan → plan is distributed to relevant team operational views → teams execute and report actuals.

Seeding often repeats week to week and is adjusted to forecast/cultivation decisions.

Transplanting and Harvest planning select actual eligible batches rather than simply copying a quantity line.

## Weekly plan views

- Seeding Plan
- Transplanting Plan
- Harvest Plan
- Surplus

Separate operational stage views are preferred over one combined Production Tasks table.

## Batch candidate selection

For transplanting/harvest planning, the planner can:
- see eligible batches expected to reach the relevant stage by planned date
- receive oldest/most-ready-first (FIFO-like) suggestions
- choose another eligible batch if operationally appropriate

For V1, the recommendation is a suggestion, not a hard lock.

## Quantities: trays vs units

Planner may plan by trays or units.

- Trays → units automatically.
- Units → system calculates required trays.
- If the result is non-integer, show the exact difference and require planner approval of the final tray count. Never silently round.

No planning buffer percentage in V1.

## Revisions

Weekly plan revisions preserve the original and revision history.

Significant plan edits require a reason.

Comments do not require a reason.

## Plan branching

Before execution, if one intended plan item needs multiple destinations, create separate linked plan items/descendants. Do not represent multiple destinations in one plan item.

## Batch creation from planning

A plan item normally produces one batch identity, but the data model supports zero-to-many batches/descendants.

Batch number should be available early enough for labels to be prepared.

## Label/batch continuity

The physical label follows the batch through seeding, germination, nursery and pool/growing.

If a partial harvest occurs:
- original label stays with the remaining pool portion
- new child/portion label travels with harvested material

Exact harvest-label field content remains to be defined.

## Routine pool movement

Routine positional moves inside a pool to correct placement do not need digital recording.
