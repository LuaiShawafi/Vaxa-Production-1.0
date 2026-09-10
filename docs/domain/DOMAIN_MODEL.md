# Domain Model

## Core entities

### Organization
Top-level company context. Owns departments, users, teams, task lists, production configuration.

### Department
Examples: Cultivation/402 context, Pool, Herbs, Salad, Logistics, Management.

### Team
Operational group such as 402 or Pool Team. A user may belong to multiple teams.

### User
Identity record used for permissions and worker attribution. V1 shared-device production uses team-filtered user selection.

### SKU
Stable product/item definition. Holds category, lifecycle, seed configuration, timing parameters, density/capacity/reference values, BOM links, notes and attachments.

### Seed Variety
Reusable seed identity.

### Seed Lot
Physical seed lot tied to a seed variety, supplier, dates, status and history.

### Material
Reusable material master identity.

### Material Lot
Physical traceability lot for a material when lot-level traceability is configured.

### BOM
Operational recipe. Two types: PROD and FG. One active operational BOM per SKU/type.

### Production Plan
Weekly planning container. Revisions preserve history.

### Plan Item
A planned unit of work/requirement with SKU, quantity, date, stage/work type, intended team/destination as applicable. Pre-execution plan branches create separate linked plan items.

### Batch
Physical production identity linked to SKU, visible batch number, internal UUID, lifecycle/stage, parent/child genealogy, plan origin, and destination identity.

### Production Task
Actionable team work derived from a Plan Item where appropriate. Status: planned/open/in progress/completed/cancelled. Overdue is derived. `Completed with deviation` is represented as completed + deviation records, not a separate fundamental lifecycle requirement.

### Production Event
Immutable record of physical action. Holds event type, actor/participants, timestamps, quantities, lot allocations, deviations, relevant configuration snapshot and links to task/batch/delivery as appropriate.

### Delivery
Inter-team handoff. Can contain multiple Delivery Items. One receiving worker can confirm the entire delivery.

### Delivery Item
Links a batch/portion to a delivery with sent/received quantities and discrepancy/deviation information.

### Deviation
Structured record of planned/expected vs actual difference, reason, explanation where required, user and timestamp.

### Issue
Broader operational problem with workflow and severity.

### Attachment / Comment
Evidence and notes associated with appropriate domain records.

## Relationship outline

```text
Organization
├── Departments
│   └── Teams
│       └── Users
├── SKUs
│   ├── Seed Config
│   ├── Timing/Density/Capacity
│   └── BOMs (PROD, FG)
├── Seed Varieties
│   └── Seed Lots
├── Materials
│   └── Material Lots
└── Production
    ├── Plans
    │   └── Plan Items
    │       └── Production Tasks
    │           └── Production Events
    ├── Batches
    │   └── Batch Genealogy / Portions
    └── Deliveries
        └── Delivery Items → Batches/Portions
```

## State vs event

Current state should be derived/maintained for fast UI, but the underlying history must be event-backed. A correction must preserve the original and corrected records rather than erasing the original.

## Production state transitions

Typical batch lifecycle:
`Planned → Seeded → Germination → Nursery → Transplanting/Transfer → Growing → Harvest → Processing/Packing → Completed`

Some team workflows are views over these states rather than unique batch stages. For example, `In Transit` is a handoff state between 402 and the receiving team.
