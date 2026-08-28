# Runbook — Projection Lag

**Status:** Normative Draft  
**Production Authority:** No

## Trigger

Use when Airtable, analytics or query-model projections exceed approved freshness targets.

## Immediate Actions

1. Confirm canonical PostgreSQL operations remain healthy.
2. Measure oldest outbox event, consumer lag and failed-event count.
3. Do not modify canonical state to repair a projection.
4. Mark affected interfaces as stale when users could make incorrect decisions.

## Diagnosis

Check worker availability, claim leases, dead letters, schema-version errors, rate limits, external API failures and tenant-scope rejection.

## Recovery

- Resume consumers from durable checkpoints.
- Replay events idempotently.
- Rebuild disposable projections when safer than incremental repair.
- Reconcile source ID, source version and projected version.

## Verification

Projection P95 delay returns within target, no version gaps remain, canonical counts reconcile and no duplicate external effects occurred.

## Forbidden

- Back-writing from Airtable or analytics into canonical tables.
- Skipping failed events without evidence and approval.
