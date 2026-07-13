---
title: Santis OS Guard Visual Contract
version: 1.0
status: FROZEN
authority: Santis OS Architecture Authority
effective_date: 2026-07-13
scope: Global
change_policy: RFC + Architecture Review + Version Increment
---

# Guard Visual Contract v1.0

## Principle

Guard `PASS` produces no visual output. The system remains silent unless operator attention is required.

## Canonical guard states

`NOT_EVALUATED | PASS | WARNING | FAIL | OVERRIDDEN`

- `NOT_EVALUATED`: evaluation has not completed; no normal badge. Stale evaluation is emitted separately as a Data Quality reason.
- `PASS`: invisible.
- `WARNING`: attention may be required; warning badge and Action Center reason when actionable.
- `FAIL`: action required; fail badge and Action Center reason.
- `OVERRIDDEN`: an audited disposition attached to an underlying WARNING or FAIL. Override never rewrites historical state to PASS.

## Visual mapping

| Guard | WARNING icon | FAIL icon | Canonical FAIL priority |
|---|---|---|---|
| Conflict Guard | ⚠️ | ❗ | `P0` hard / `P1` operational |
| Branch Guard | ⚠️ | 🚫 | `P1` |
| Capability Guard | ⚠️ | 🚫 | `P1` |
| Payment Guard | 💳 | 💳 | `P2` |
| Quarantine Guard | ⚠️ | ⛔ | `P0` |
| Manual Lock | — | 🔒 | `P3` |
| Data Quality | ? | ⛔ | `P5`, or escalated by explicit rule |

Badge color, accessible label and tooltip text come from the canonical guard result, not from frontend inference.

## Badge ordering

1. Severity: `FAIL`, then `WARNING`.
2. Guard order: Quarantine, Conflict, Branch, Capability, Payment, Manual Lock, Data Quality.
3. Duplicate guard/type combinations are collapsed by stable reason code.

## Ayşe Yılmaz fixture

- Conflict Guard: `FAIL`, `CONFLICT_HARD_OVERLAP`, `P0`, badge ❗.
- Payment Guard: `FAIL`, `PAYMENT_AUTH_FAILED`, `P2`, badge 💳.
- VIP Guest Priority: `P4`, ⭐ frame treatment; this is not a guard badge.

Canonical badge order: `❗ 💳`.

## Override audit contract

Every override records:

- booking and guard identity;
- original state and reason code;
- override decision and reason;
- approver identity and role;
- approval timestamp;
- expiry timestamp when applicable;
- previous and resulting action disposition;
- correlation ID and rule version.

Overrides are immutable audit events. They may be superseded only by a new event. An override does not delete the original FAIL/WARNING and does not silently convert it to PASS.

## Accessibility

Icons are supplementary. Every badge must expose a textual label containing guard, severity and concise reason. Critical meaning must not depend on color alone.