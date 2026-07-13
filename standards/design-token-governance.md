---
title: Santis OS Design Token Governance
version: 1.0
status: FROZEN
authority: Santis OS Architecture Authority
effective_date: 2026-07-13
scope: Global
change_policy: RFC + Architecture Review + Version Increment
---

# Design Token Governance v1.0

## Principle

Operational tokens are global semantic contracts, not local decoration. Their meaning and value cannot be changed through tenant, branch or receptionist configuration.

## Governance matrix

| Token class | Locked | Configuration authority |
|---|---:|---|
| Booking status backgrounds | Yes | Architecture version change only |
| Action priority treatments | Yes | Architecture version change only |
| Guard icons and severity treatments | Yes | Architecture version change only |
| Progress behavior and thresholds | Yes | Rule/version change only |
| Guest priority frame treatments | Yes | Architecture version change only |
| Service category palette | Yes | Architecture version change only |
| Service-to-category assignment | No | System Admin, approved categories only |

A System Admin may assign a service to `CLASSIC`, `RITUAL`, `MEDICAL`, `HAMAM`, `SKINCARE` or `PREMIUM_SIGNATURE`; the admin may not enter arbitrary colors.

## Naming convention

```text
--booking-status-{status}-bg
--booking-category-{category}
--guest-priority-{tier}
--action-priority-{priority}
--guard-{guard}-{severity}
--booking-progress-{state}
```

Token consumers must reference semantic names. Hex values, RGB values and ad hoc class names must not be embedded in booking components.

## Source of truth

The approved token package/CSS file is generated or maintained from this frozen contract. Calendar, Action Center, mobile and preview surfaces consume the same token source.

## Change process

1. Open an RFC describing semantic and accessibility impact.
2. Identify affected components, locations and saved projections.
3. Review contrast, color-blind accessibility and non-color cues.
4. Obtain Architecture Authority approval.
5. Increment the governing standard version.
6. Update token source, fixtures and migration notes in one reviewed change.

## Multi-location consistency

Locked tokens have no tenant or location override. A white `CONFIRMED` card and a red `P0/P1` top strip carry identical meaning in Budva and every future location.

## Enforcement

CI or domain/UI contract tests should reject:

- unknown booking token names;
- raw operational colors inside booking components;
- arbitrary service category colors;
- frontend logic that maps domain state to independent visual meaning outside the canonical token resolver.