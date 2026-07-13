---
title: Santis OS Canonical Domain Contract
version: 1.0
status: FROZEN
authority: Santis OS Architecture Authority
effective_date: 2026-07-13
scope: Global
change_policy: RFC + Architecture Review + Version Increment
---

# Canonical Domain Contract v1.0

## Purpose

This document is the single vocabulary for booking, guard, priority, progress and visual-state concepts across Airtable mappings, backend services, domain schemas and frontend projections.

## Enumerations

### BookingStatus

`DRAFT | PENDING | CONFIRMED | CHECKED_IN | IN_PROGRESS | COMPLETED | CANCELLED | NO_SHOW`

### ServiceCategory

`CLASSIC | RITUAL | MEDICAL | HAMAM | SKINCARE | PREMIUM_SIGNATURE`

### GuardState

`NOT_EVALUATED | PASS | WARNING | FAIL | OVERRIDDEN`

### ActionPriority

`P0 | P1 | P2 | P3 | P4 | P5`

### GuestPriority

`NONE | VIP | SIGNATURE`

### ProgressState

`NOT_APPLICABLE | NOT_STARTED | NORMAL | DELAY_WARNING | CRITICAL_DELAY | COMPLETED`

## Canonical booking fields

Identity and isolation:

- `Booking_ID`
- `Tenant_Link`
- `Location_Link`
- `Environment`

Scheduling and execution:

- `Scheduled_Start`
- `Scheduled_End`
- `Planned_Duration_Minutes`
- `Actual_Start`
- `Actual_End`
- `Pause_Minutes`
- `Extension_Minutes`

Assignments and commercial state:

- `Client_Link`
- `Service_Link`
- `Therapist_Link`
- `Room_Link`
- `Payment_Status`
- `Payment_Authorization_Status`
- `Guest_Tier`
- `VIP`
- `Manual_Lock`

## Resolver outputs

### VisualState

```json
{
  "statusKey": "IN_PROGRESS",
  "categoryKey": "PREMIUM_SIGNATURE",
  "guestPriority": "VIP",
  "actionPriority": "P0",
  "progressPercent": 67,
  "progressState": "NORMAL",
  "badges": []
}
```

### ActionPriorityResult

```json
{
  "highest_priority": "P0",
  "reasons": []
}
```

### GuardResult

```json
{
  "guard": "ConflictGuard",
  "state": "FAIL",
  "code": "CONFLICT_HARD_OVERLAP",
  "evaluatedAt": "2026-07-13T09:00:00Z",
  "ruleVersion": "1.0"
}
```

## Formula agreement

All modules use exactly:

```text
Effective_Elapsed = Current_Time - Actual_Start - Pause_Minutes
Progress = Effective_Elapsed / (Planned_Duration_Minutes + Extension_Minutes)
Expected_End = Actual_Start + Planned_Duration_Minutes + Pause_Minutes + Extension_Minutes
```

Duration arithmetic is performed in minutes using timezone-aware timestamps. Missing `Actual_Start` makes progress `NOT_STARTED` or `NOT_APPLICABLE`; it must never fall back to `Scheduled_Start`.

## Authority boundaries

- Source systems store canonical facts and links.
- Domain resolvers calculate guard, progress, visual and priority outputs.
- Frontend renders outputs and submits authorized commands.
- Frontend does not calculate status colors, guard outcomes, priority or Expected_End.
- Airtable formula/cache fields, when used, are projections and not independent semantic authorities.

## Compatibility

Any implementation using different enum values, formulas or priority meanings is non-conformant until migrated through an approved versioned contract.