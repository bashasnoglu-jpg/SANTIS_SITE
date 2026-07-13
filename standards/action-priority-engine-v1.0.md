# Santis OS Action Priority Engine v1.0

Status: Canonical production standard

## Purpose

Visual layers explain what is happening. The Action Center explains what must be done.

## Priority scale

| Priority | Meaning |
|---|---|
| P0 | Safety, quarantine failure, or critical hard conflict |
| P1 | Branch failure or therapist capability failure |
| P2 | Payment authorization or payment completion failure |
| P3 | Timing delay beyond configured threshold |
| P4 | VIP or Signature attention workflow |
| P5 | Informational or low-risk follow-up |

## Resolution algorithm

1. Evaluate every applicable guard and operational signal.
2. Preserve every WARNING and FAIL reason.
3. Select the numerically highest priority reason as `highestPriority`.
4. Keep all same-priority reasons; never collapse them into one generic message.
5. Sort Action Center records by priority, SLA breach, age, and scheduled start.
6. Re-evaluate after every state-changing action.

A P0 reason MUST NOT hide P2 or P4 reasons. Highest priority controls ordering and primary emphasis; all reasons remain available.

## Canonical reason structure

Each reason contains:

- code
- priority
- source
- severity
- message
- action
- detectedAt
- metadata

Reason codes are stable machine identifiers. Human-readable messages may be localized.

## Action Center record

A record contains:

- bookingId
- tenantId
- locationId
- environment
- highestPriority
- reasons
- status
- ownerId
- createdAt
- updatedAt
- acknowledgedAt
- resolvedAt
- snoozedUntil
- slaDueAt

## State model

- OPEN
- ACKNOWLEDGED
- IN_PROGRESS
- SNOOZED
- RESOLVED
- DISMISSED_WITH_OVERRIDE

Resolution and override are distinct. A guard failure is never silently rewritten to PASS.

## Suggested actions

Auto-suggestions are advisory until explicitly enabled by a later enforcement phase. Initial production scope is read-only suggestions plus operator acknowledgement, assignment, and resolution.

## Shadow evaluation metrics

Before live enforcement, record:

- true positives
- false positives
- false negatives
- time to detection
- time to acknowledgement
- time to resolution
- guard evaluation freshness

Accuracy targets are pilot acceptance criteria, not assumptions. They must be demonstrated with Budva evidence before multi-location rollout.

## Governance

Priority mappings are system-controlled and versioned. Any threshold or mapping change requires actor, timestamp, previous value, new value, reason, environment, and location scope.