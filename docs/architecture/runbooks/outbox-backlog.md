# Runbook — Outbox Backlog

**Status:** Normative Draft  
**Production Authority:** No

## Trigger

Use when pending outbox count, oldest-event age or dead-letter volume exceeds target.

## Immediate Actions

1. Confirm canonical commits remain safe.
2. Measure backlog by event type, tenant scope and consumer.
3. Pause non-critical producers if backlog threatens storage or recovery.
4. Preserve failed payload metadata and error codes without exposing unnecessary PII.

## Diagnosis

Check worker health, claim leases, database locks, schema compatibility, external dependency health, retry storms and poison events.

## Recovery

- Restart workers from durable state.
- Reclaim expired leases safely.
- Retry only transient failures with bounded backoff.
- Dead-letter permanent failures with evidence.
- Replay idempotently after correction.

## Verification

Oldest-event age returns within target, aggregate ordering gaps are resolved, consumers reconcile and no event was lost or processed with duplicate business effect.

## Forbidden

- Deleting pending events to reduce metrics.
- Marking events published without delivery evidence.
