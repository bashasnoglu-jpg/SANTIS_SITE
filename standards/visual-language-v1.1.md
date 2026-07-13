# Santis OS Visual Language v1.1

Status: Canonical production standard

## Core principle

Each visual layer answers exactly one question:

| Layer | Question | Visibility |
|---|---|---|
| Background | What operational state is the booking in? | Always |
| Left category strip | What service family is this? | Always |
| Guard badges | Which problems need attention? | WARNING/FAIL only |
| Priority frame | Does the guest or incident require priority handling? | VIP/Signature/P0/P1 only |
| Progress | How far has the service progressed? | IN_PROGRESS only |

The frontend MUST NOT calculate colors, guard severity, action priority, or progress policy. It renders semantic keys resolved by the canonical domain layer.

## Operational status keys

- DRAFT
- CONFIRMED
- CHECKED_IN
- IN_PROGRESS
- COMPLETED
- CANCELLED
- NO_SHOW

Recommended tokens:

- DRAFT: `#F5F5F5`
- CONFIRMED: `#FFFFFF`
- CHECKED_IN: `#E3F2FD`
- IN_PROGRESS: `#EEEEEE`
- COMPLETED: `#E8F5E9`
- CANCELLED: `#FAFAFA`
- NO_SHOW: `#FFEBEE`

These mappings are system-locked.

## Service category keys

- CLASSIC
- RITUAL
- MEDICAL
- HAMAM
- SKINCARE
- PREMIUM_SIGNATURE

Category color is represented by a 4px left strip, never by replacing the operational background.

## Guest priority keys

- NONE
- VIP
- SIGNATURE

VIP and Signature may use approved frame tokens. P0/P1 uses a 3px top incident strip and MUST NOT replace the operational background.

## Guard badge rule

- PASS: invisible
- WARNING: visible warning badge
- FAIL: visible fail badge
- OVERRIDDEN: visible only where the operator needs audit awareness
- NOT_EVALUATED: visible only when this state itself requires intervention

## Progress model

Progress is visible only for `IN_PROGRESS`.

```text
Expected_End = Actual_Start
             + Planned_Duration
             + Pause_Minutes
             + Extension_Minutes

Effective_Elapsed = Current_Time
                  - Actual_Start
                  - Pause_Minutes

Progress = Effective_Elapsed
         / (Planned_Duration + Extension_Minutes)
```

Required source fields:

- Scheduled_Start
- Scheduled_End
- Actual_Start
- Actual_End
- Planned_Duration_Minutes
- Pause_Minutes
- Extension_Minutes

Display policy:

- 0-100%: normal progress
- 101-115%: delayed
- >115%: critical delay

When progress exceeds 100%, the UI should prefer elapsed/remaining delay language over an oversized percentage.

## BookingVisualState contract

The canonical output must include:

- statusKey
- categoryKey
- guestPriority
- actionPriority
- progressPercent
- progressState
- badges
- topIncidentStrip

## Accessibility

Color must never be the only signal. Status, badges, and severity require text, iconography, aria-labels, or equivalent accessible metadata.

## Governance

Operational status and P0/P1 tokens are locked globally. Authorized administrators may only map services to approved category keys. All changes require audit metadata.