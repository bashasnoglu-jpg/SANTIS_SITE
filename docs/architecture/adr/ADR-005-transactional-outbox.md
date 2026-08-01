# ADR-005 — Transactional Outbox

**Status:** Proposed  
**Decision Type:** Architecture  
**Version:** 0.9-RC2  
**Production Authority:** No

## Context

Santis OS must publish domain and integration events without allowing canonical database state and downstream delivery state to diverge. Directly writing canonical state and then publishing to a broker or external system creates a dual-write failure mode: the database commit may succeed while event publication fails, or publication may occur before the transaction is durable.

## Decision

Santis OS SHALL use a PostgreSQL-backed Transactional Outbox for authoritative domain and integration events.

The canonical mutation and the corresponding outbox record MUST be written in the same PostgreSQL transaction.

The initial architecture MUST NOT require Kafka, a distributed event bus, or a separate message broker. A reliable worker MAY read committed outbox rows and deliver events to in-process consumers, external adapters, projections, or a future broker.

Delivery semantics SHALL be at-least-once. Consumers MUST therefore be idempotent.

## Normative Requirements

1. An event MUST NOT be published before the canonical transaction commits.
2. A canonical transaction that requires an event MUST fail if the outbox row cannot be written.
3. Outbox records MUST use the standard Event Envelope Contract.
4. Workers MUST claim rows safely, for example through `FOR UPDATE SKIP LOCKED` or an equivalent reviewed mechanism.
5. Worker crashes MUST NOT cause silent event loss.
6. Duplicate delivery MUST NOT cause duplicate business effects.
7. Per-aggregate ordering MUST be preserved where consumers depend on aggregate version order.
8. Failed deliveries MUST retain durable evidence and enter bounded retry or dead-letter handling.
9. Outbox backlog, oldest pending age, retry count and dead-letter count MUST be observable.
10. External adapters such as Airtable projection, notifications and analytics MUST consume committed outbox evidence rather than initiating canonical mutations.

## Alternatives Considered

### Direct publish after commit

Rejected because a process crash between commit and publish can permanently lose the event.

### Publish before commit

Rejected because consumers may observe a fact that later rolls back.

### Distributed transaction / two-phase commit

Rejected for the current phase because of operational complexity, availability cost and limited support across external systems.

### Immediate broker-first architecture

Deferred. A broker MAY be introduced later if throughput, isolation or organizational scaling justifies it.

## Consequences

### Positive

- Atomic relationship between canonical state and event intent.
- Recoverable delivery after worker failure.
- Supports Airtable, notifications and analytics as non-authoritative consumers.
- Enables future migration to a dedicated event bus without changing producer transaction semantics.

### Negative

- At-least-once delivery requires idempotent consumers.
- Outbox retention and cleanup require operational policy.
- Backlog monitoring and recovery runbooks become mandatory.
- Event ordering is guaranteed only within explicitly defined scopes.

## Evidence Required

This ADR MUST NOT be marked Accepted for production until evidence demonstrates:

- rollback produces neither canonical state nor outbox event,
- commit produces both canonical state and outbox event,
- worker crash after claim is recoverable,
- duplicate delivery is harmless,
- version gaps are detected where required,
- backlog alerting and recovery are tested,
- no critical event is lost during fault injection.

## Related Documents

- `volume-2-technical-architecture/06-transactional-outbox.md`
- `volume-2-technical-architecture/07-event-envelope.md`
- `volume-2-technical-architecture/08-module-communication.md`
- ADR-001 — Modular Monolith First
- ADR-002 — PostgreSQL as Canonical Authority

## Current Decision Status

**Normative Design / Production Not Approved**
