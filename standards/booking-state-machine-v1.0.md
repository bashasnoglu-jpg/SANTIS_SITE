---
title: Santis OS Booking State Machine
version: 1.0
status: FROZEN
authority: Santis OS Architecture Authority
effective_date: 2026-07-13
scope: Global
change_policy: RFC + Architecture Review + Version Increment
---

# Booking State Machine v1.0

## Canonical states

`DRAFT | PENDING | CONFIRMED | CHECKED_IN | IN_PROGRESS | COMPLETED | CANCELLED | NO_SHOW`

## Canonical transitions

| From → To | Trigger | Mandatory checks | Allowed actors | Event |
|---|---|---|---|---|
| `DRAFT → PENDING` | Booking request submitted | Branch and minimum data validation; capability when assignment exists | Customer, Reception | `BOOKING_REQUESTED` |
| `PENDING → CONFIRMED` | Confirmation decision and required payment condition satisfied | Payment policy, Conflict, Branch, Capability | System, Reception | `BOOKING_CONFIRMED` |
| `CONFIRMED → CHECKED_IN` | Guest arrival recorded | Conflict and Branch re-evaluation | Reception | `GUEST_CHECKED_IN` |
| `CHECKED_IN → IN_PROGRESS` | Actual service start recorded | Capability, Branch and active Conflict re-evaluation | Therapist, Reception | `SERVICE_STARTED` |
| `IN_PROGRESS → COMPLETED` | Actual service end recorded | Completion data validation | Therapist, Reception | `SERVICE_COMPLETED` |
| `DRAFT/PENDING/CONFIRMED/CHECKED_IN → CANCELLED` | Authorized cancellation | Cancellation policy | Reception, Supervisor, permitted System flow | `BOOKING_CANCELLED` |
| `CONFIRMED → NO_SHOW` | Configured no-show threshold expires without check-in | Current status and threshold validation | System | `NO_SHOW_DETECTED` |

`IN_PROGRESS`, `COMPLETED`, `CANCELLED` and `NO_SHOW` are not silently moved to another terminal state. Corrections require an explicit corrective event and audit record.

## Transition transaction

Every accepted transition performs one logical transaction:

1. validate current state and actor permission;
2. validate canonical transition preconditions;
3. evaluate all applicable guards;
4. persist the state transition and immutable event;
5. resolve `VisualState`, `ProgressState` and `ActionPriority`;
6. create, update or close Action Center projections as required.

A guard failure may block a transition or allow it with an explicit audited override, according to the guard enforcement policy active for the environment.

## Time contract

```text
Expected_End = Actual_Start + Planned_Duration + Pause_Minutes + Extension_Minutes
Effective_Elapsed = Current_Time - Actual_Start - Pause_Minutes
Progress = Effective_Elapsed / (Planned_Duration + Extension_Minutes)
```

`Actual_Start` is written by the accepted `SERVICE_STARTED` transition, not inferred from scheduled time or card color.

## UI restriction

Frontend requests transitions but does not authorize them locally. Frontend must not infer state from colors, time passage or button history. It renders the canonical state and resolver outputs returned by the domain layer.