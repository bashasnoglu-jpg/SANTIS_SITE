---
title: Santis OS Visual Language
version: 1.1
status: FROZEN
authority: Santis OS Architecture Authority
effective_date: 2026-07-13
scope: Global
change_policy: RFC + Architecture Review + Version Increment
---

# Visual Language v1.1

## Canonical principle

Santis OS'un görsel dili, kullanıcı arayüzü değil; Domain Engine'in deterministik çıktısıdır.

UI renk üretmez, öncelik belirlemez, guard hesaplamaz veya ilerleme formülü çalıştırmaz. Yalnızca canonical `VisualState` ve `ActionPriority` çıktılarını render eder.

## Five-layer model

| Layer | Question answered | Visibility |
|---|---|---|
| Background | Rezervasyon hangi operasyon durumunda? | Her zaman |
| Left strip | Hangi hizmet ailesi? | Her zaman |
| Badges | Hangi sorunlar var? | Yalnızca WARNING veya FAIL |
| Frame | Misafir önceliği nedir? | VIP, Signature veya P0/P1 |
| Progress | Hizmet ne kadar ilerledi? | Yalnızca `IN_PROGRESS` |

## Layer 1 — Operational background

```css
--booking-status-draft-bg: #F5F5F5;
--booking-status-pending-bg: #FFF8E1;
--booking-status-confirmed-bg: #FFFFFF;
--booking-status-checked-in-bg: #E3F2FD;
--booking-status-in-progress-bg: #EEEEEE;
--booking-status-completed-bg: #E8F5E9;
--booking-status-cancelled-bg: #FAFAFA;
--booking-status-no-show-bg: #FFEBEE;
```

Canonical mapping:

`DRAFT | PENDING | CONFIRMED | CHECKED_IN | IN_PROGRESS | COMPLETED | CANCELLED | NO_SHOW`

Cancelled cards use subdued text and strike-through treatment. Background color never communicates service category, guest tier or guard severity.

## Layer 2 — Service category strip

The left strip is 4 px wide.

| Category | Token value |
|---|---:|
| `CLASSIC` | `#4B4F52` |
| `RITUAL` | `#243B65` |
| `MEDICAL` | `#167C80` |
| `HAMAM` | `#675080` |
| `SKINCARE` | `#58715C` |
| `PREMIUM_SIGNATURE` | `#7A263A` |

## Layer 3 — Guard badges

Only `WARNING` and `FAIL` produce normal guard badges. `PASS` is invisible. `NOT_EVALUATED` is not shown as a normal badge; stale or missing evaluation becomes a Data Quality reason through the Action Priority Engine. `OVERRIDDEN` preserves the underlying result and may add a small audited override marker.

| Guard | WARNING | FAIL |
|---|---|---|
| Conflict | ⚠️ | ❗ |
| Branch | ⚠️ | 🚫 |
| Capability | ⚠️ | 🚫 |
| Payment | 💳 | 💳 |
| Quarantine | ⚠️ | ⛔ |
| Manual Lock | — | 🔒 |
| Data Quality | ? | ⛔ |

Badge order is deterministic: severity (`FAIL` before `WARNING`), then canonical guard order: Quarantine, Conflict, Branch, Capability, Payment, Manual Lock, Data Quality.

## Layer 4 — Progress

Progress is visible only when `statusKey = IN_PROGRESS` and `Actual_Start` exists.

```text
Effective_Elapsed = Current_Time - Actual_Start - Pause_Minutes
Progress = Effective_Elapsed / (Planned_Duration + Extension_Minutes)
Expected_End = Actual_Start + Planned_Duration + Pause_Minutes + Extension_Minutes
```

Display behavior:

- `0–100%`: elapsed / total and normal progress fill.
- `101–115%`: elapsed / total plus delay duration.
- `>115%`: critical delay presentation; percentage may be omitted in favor of explicit overdue minutes.
- The resolver clamps the progress-bar fill to 100%; raw progress remains available in canonical output.

## Layer 5 — Priority frame

| Condition | Treatment |
|---|---|
| `guestPriority = VIP` | Gold frame `#C8A96A` and ⭐ |
| `guestPriority = SIGNATURE` | Platinum frame `#AEB4BD` and 💎 |
| `actionPriority = P0` or `P1` | 3 px critical top strip `#B42318` |
| None | No frame |

The P0/P1 top strip never replaces the operational background. When guest and action priority coexist, the guest frame remains and the critical top strip is layered above it.

## Canonical VisualState contract

```json
{
  "statusKey": "IN_PROGRESS",
  "categoryKey": "PREMIUM_SIGNATURE",
  "guestPriority": "VIP",
  "actionPriority": "P0",
  "progressPercent": 67,
  "progressState": "NORMAL",
  "badges": [
    { "type": "CONFLICT", "severity": "FAIL" },
    { "type": "PAYMENT", "severity": "FAIL" }
  ]
}
```

## Ayşe Yılmaz fixture

```text
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┃  P0 top strip
┃▌ ⭐ AYŞE YILMAZ              ❗ 💳    ┃
┃▌ 11:00–12:30          60 / 90 dk       ┃
┃▌ █████████████░░░░░░░  67%              ┃
┃▌ Mehmet                                ┃
┃▌ Premium Signature Bali Masajı         ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
```

Resolved meaning: `IN_PROGRESS` background, `PREMIUM_SIGNATURE` strip, VIP frame, P0 top strip, Conflict FAIL, Payment FAIL, and Actual_Start-based 67% progress.

## Governance

Operational status, action priority and guard tokens are locked. Service-to-category assignment may be managed only by System Admin within the approved canonical category palette.