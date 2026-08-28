# Runbook — Database Failover

**Status:** Normative Draft  
**Production Authority:** No

## Trigger

Use when the primary PostgreSQL instance is unavailable, corrupted or unsafe to continue serving canonical traffic.

## Immediate Actions

1. Declare incident and freeze canonical writes.
2. Identify last verified healthy commit and replication position.
3. Preserve database, infrastructure and deployment evidence.
4. Confirm the failover target is isolated from stale writers.

## Failover Preconditions

Before promotion, verify:

- replication/recovery status,
- expected data-loss window against RPO,
- application credentials and role separation,
- RLS policies and `FORCE ROW LEVEL SECURITY`,
- migration version,
- idempotency and outbox tables,
- audit continuity.

## Recovery

Promote only one authoritative writer. Rotate connection endpoints and credentials through approved configuration. Keep workers and external side effects paused until canonical integrity is verified.

## Verification

- own-tenant positive and cross-tenant negative tests pass,
- booking command and idempotent replay pass,
- resource claims are consistent,
- outbox resumes without loss or duplicate business effect,
- projections reconcile,
- achieved RPO/RTO are recorded.

## Forbidden

- Allowing two writable primaries.
- Reopening traffic before RLS and canonical-integrity checks.
- Treating an unverified replica as authoritative.
