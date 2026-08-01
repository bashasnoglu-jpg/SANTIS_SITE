# Runbook — Booking Writer Unavailable

**Status:** Normative Draft  
**Production Authority:** No

## Trigger

Use when canonical booking commands fail, time out or cannot safely prove transaction integrity.

## Immediate Actions

1. Declare incident severity from impact.
2. Disable or pause booking mutations; keep read-only operations available where safe.
3. Do not create bookings directly in Airtable or PostgreSQL.
4. Capture deployment SHA, error codes, trace IDs and database health.
5. Verify application role, migrations, transaction context and idempotency store.

## Diagnosis

Check:

- database connectivity and lock waits,
- RLS/context errors,
- idempotency claim failures,
- availability dependency,
- recent deployments or migrations,
- error-budget and latency dashboards.

## Recovery

- Roll back only when schema compatibility is proven.
- Otherwise apply a controlled forward fix.
- Replay requests only from durable evidence with the original idempotency identity.

## Verification

Before reopening writes, prove:

- one canonical booking for one key,
- zero partial writes,
- LOCK-59 negative test passes,
- availability claim integrity,
- outbox event creation,
- audit evidence exists.

## Forbidden

- Raw booking creation.
- New fixture creation to hide runtime failure.
- Blind retry with a new idempotency key.
