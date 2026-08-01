# ADR-004 — Durable PostgreSQL Idempotency

**Status:** Accepted for target architecture  
**Decision Type:** Transaction Integrity  
**Production Authority:** No  
**Review Trigger:** Command execution or persistence model change

## Context

Externally retriable commands can be delivered more than once because of client retries, network timeouts, worker replay, webhook redelivery or process failure. Duplicate execution can create duplicate bookings, repeated package consumption or repeated financial effects.

Redis or in-memory deduplication alone cannot provide durable protection across restart, cache eviction, TTL expiry or failover.

## Decision

PostgreSQL SHALL be the durable idempotency authority for every externally retriable state-changing command.

The uniqueness boundary MUST include:

```text
tenant_id + command_type + idempotency_key
```

Each claim MUST retain:

- canonical payload fingerprint,
- command contract version,
- processing status,
- authoritative result or resource identifier,
- timestamps,
- trace and actor evidence where applicable.

Required behaviour:

- same key + same fingerprint + completed result -> return the original result,
- same key + different fingerprint -> `IDEMPOTENCY_CONFLICT`,
- concurrent same command -> one authoritative winner,
- incomplete/ambiguous claim -> fail closed and enter controlled recovery.

Redis MAY cache a completed result, but cache loss MUST NOT remove the PostgreSQL guarantee.

## Transaction Rule

For atomic commands, idempotency claim resolution, canonical mutation, audit evidence and outbox insert MUST participate in the approved transaction boundary.

A failed transaction MUST NOT leave a completed claim pointing to missing canonical state.

## Consequences

### Positive

- prevents duplicate canonical effects,
- supports safe client resubmission,
- creates durable replay evidence,
- protects financial and operational integrity.

### Negative

- claim retention and cleanup require policy,
- payload canonicalization must remain stable,
- incomplete claims require recovery tooling,
- command handlers must preserve the same identity across retries.

## Retention

Financial and legally significant command claims SHOULD be retained according to accounting and audit policy.

Non-financial claims MAY use an approved retention period only when expiration cannot re-enable an unsafe duplicate business effect.

## Alternatives Considered

### Redis-only idempotency

Rejected as the canonical guarantee because it is not durable enough for critical mutations.

### Client-side duplicate prevention

Rejected because clients are not authoritative and may retry unpredictably.

### Natural-key checks only

Rejected because they do not reliably distinguish replay from payload conflict and may not cover all command types.

## Evidence Required

- same-key/same-payload replay acceptance,
- same-key/different-payload conflict acceptance,
- 20–25 concurrent request test,
- fault injection after claim and before commit,
- zero partial-write proof,
- incomplete-claim recovery runbook.

## Related Documents

- `volume-2-technical-architecture/03-booking-writer.md`
- `volume-2-technical-architecture/04-idempotency-contract.md`
- `volume-2-technical-architecture/08-module-communication.md`

---

End of ADR
