---
title: Santis OS Action Priority Engine
version: 1.0
status: FROZEN
authority: Santis OS Architecture Authority
effective_date: 2026-07-13
scope: Global
change_policy: RFC + Architecture Review + Version Increment
---

# Action Priority Engine v1.0

## Principle

Visual layers explain what is happening. Action Center explains what must be done. Frontend never calculates priority; it renders the resolver output.

## Priority scale

| Priority | Canonical meaning |
|---|---|
| `P0` | Safety, Quarantine FAIL, critical hard conflict |
| `P1` | Branch FAIL, Capability FAIL, operational conflict requiring immediate correction |
| `P2` | Payment FAIL |
| `P3` | Timing delay over configured threshold, manual lock requiring action |
| `P4` | VIP or Signature attention workflow |
| `P5` | Informational or data-quality follow-up |

## Resolution algorithm

1. Evaluate all applicable guards and operational signals.
2. Preserve every active non-PASS reason.
3. Map each reason code to one canonical priority and action code.
4. Sort reasons by priority, severity and deterministic source order.
5. Set `highest_priority` to the first reason's priority.
6. If no active reason exists, return `highest_priority = null` and an empty reasons array.

Higher-priority reasons never hide lower-priority reasons.

## Reason contract

```json
{
  "code": "CONFLICT_HARD_OVERLAP",
  "priority": "P0",
  "severity": "FAIL",
  "source": "ConflictGuard",
  "message": "Terapist Mehmet'in 12:00'da çakışan rezervasyonu var",
  "action": "RESOLVE_CONFLICT"
}
```

## ActionPriority output

```json
{
  "highest_priority": "P0",
  "reasons": [
    {
      "code": "CONFLICT_HARD_OVERLAP",
      "priority": "P0",
      "severity": "FAIL",
      "source": "ConflictGuard",
      "message": "Terapist Mehmet'in 12:00'da çakışan rezervasyonu var",
      "action": "RESOLVE_CONFLICT"
    },
    {
      "code": "PAYMENT_AUTH_FAILED",
      "priority": "P2",
      "severity": "FAIL",
      "source": "PaymentGuard",
      "message": "Provizyon başarısız",
      "action": "RETRY_PAYMENT"
    },
    {
      "code": "VIP_ATTENTION",
      "priority": "P4",
      "severity": "WARNING",
      "source": "GuestPriority",
      "message": "VIP çıkış protokolü başlatılmalı",
      "action": "START_VIP_EXIT_PROTOCOL"
    }
  ]
}
```

## Ayşe Yılmaz fixture

Input:

- ConflictGuard `FAIL`: `CONFLICT_HARD_OVERLAP` → `P0`
- PaymentGuard `FAIL`: `PAYMENT_AUTH_FAILED` → `P2`
- GuestPriority `VIP`: `VIP_ATTENTION` → `P4`

Resolved output:

- `highest_priority = P0`
- Reasons remain visible in order: P0, P2, P4.
- VisualState receives `actionPriority = P0` and badges for Conflict FAIL and Payment FAIL.

## Action Center contract

A read-only Action Center entry includes booking identity, location, current status, highest priority, all reasons, age, SLA state and resolver-generated suggestions. Suggestions are not executed automatically during Architecture Freeze, Shadow Evaluation or read-only rollout.

## Determinism

Given identical canonical booking input, guard results, rule version and evaluation time, the engine must produce identical reason codes, ordering and highest priority.