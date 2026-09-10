# Tasks, Issues and Permissions Summary

## Generic Tasks module

Tasks is a company-wide module separate from Production. Production should not depend on it.

Hierarchy:
`Organization → Department → Team → Task List → Task List Permissions → Tasks/Subtasks`

Task lists can have managers and members with explicit permissions:
- View
- Create
- Edit
- Complete
- Manage Tasks
- Manage Members
- Manage List

Default bundles:
- Member
- Task Manager
- List Manager

Custom permission combinations may be added later.

Task statuses:
- Draft
- Open
- In Progress
- Completed
- Skipped
- Cancelled

Derived time state:
- Upcoming
- Due Today
- Overdue

Supported behaviors:
- one-time tasks
- recurring tasks
- recurrence template edits affect future occurrences only
- subtasks
- comments
- photos/videos
- attachments on occurrence/subtask rather than recurring template
- assignment to team, individual, or team + responsible person

Categories:
Cleaning, Maintenance, Inspection, Production, Inventory, Safety, Administrative, Training, Other.

Optional generic links may reference batch, pool, room, material lot, issue, etc., without making Production depend on Tasks.

My Day may combine Production work and Team Tasks.

Future Microsoft To Do integration is possible; native Tasks first.

## Production Task

Production Task is distinct from generic Task and is operational work derived from a plan/batch. It can be surfaced in the same operational experience but should not be conflated in the data model.

## Permissions

The permission system should be server-enforced. UI hiding alone is insufficient.

Typical authority boundaries:
- Workers: execute work and report actuals.
- CS: cultivation specialist responsibilities, including authorized production/master-data actions as configured.
- CL: cultivation leader responsibilities, including planning and controlled production decisions.
- CM: cultivation manager authority over master data/configuration and controlled changes.
- TL: team leader execution oversight and specific confirmation/disposition actions as defined by workflow.

Exact organization-wide permission matrix remains a configurable implementation artifact; do not invent permissions outside confirmed workflow decisions.

## Issues and deviations

Deviation:
- specific difference between plan/expected and actual
- structured reason
- explanation when required
- timestamp and actor

Issue:
- broader operational problem
- severity
- evidence
- assignment/resolution workflow

Issue flow:
`Reported → Assigned → Investigating → Action Taken → Resolved → Closed`

Four severity levels are planned, but exact labels remain open.
