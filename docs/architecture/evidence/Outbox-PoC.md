# Transactional Outbox Proof of Concept Evidence

**Document:** Santis OS Production Readiness Evidence Pack  
**Version:** 0.9-RC2  
**Evidence Type:** Event Delivery Integrity  
**Status:** NOT_STARTED  
**Production Authority:** No

---

## Purpose

Prove that canonical mutation and event intent are committed atomically and that event delivery remains safe under retries, duplicate delivery and worker failure.

## Scope

- canonical booking transaction
- outbox insertion
- worker claim/publish lifecycle
- at-least-once delivery
- consumer idempotency
- retry and dead-letter handling

## Architecture References

- `../adr/ADR-005-transactional-outbox.md`
- `../volume-2-technical-architecture/06-transactional-outbox.md`
- `../volume-2-technical-architecture/07-event-envelope.md`
- `../contracts/event-envelope-contract.md`

## Acceptance Criteria

Required scenarios:

1. successful booking and outbox insert in one transaction,
2. booking failure rolls back outbox insert,
3. outbox failure rolls back booking insert,
4. worker publishes a committed event,
5. worker crash after external publish but before acknowledgement,
6. duplicate delivery does not duplicate consumer effect,
7. transient failure enters bounded retry,
8. permanent failure enters dead-letter or operator workflow,
9. per-aggregate ordering and version-gap detection work where required.

Expected invariants:

- no committed booking without required outbox event,
- no committed success event for a rolled-back booking,
- duplicate delivery produces one business effect,
- worker recovery preserves evidence.

## Evidence Required

- GitHub Actions Run ID
- verified commit SHA
- outbox schema version
- booking/outbox SQL outputs
- worker logs
- consumer receipt/deduplication outputs
- retry and dead-letter evidence
- event envelope examples

## Execution Procedure

1. Apply schema and start an isolated worker.
2. Execute success and rollback scenarios.
3. Inject worker failure at documented checkpoints.
4. Restart the worker and observe redelivery.
5. Deliver the same `event_id` more than once to the consumer.
6. Verify one business effect and preserved receipt evidence.
7. Record backlog, lag and state transitions.

## Observed Results

| Scenario | Expected | Observed | Result |
|---|---|---|---|
| Booking + outbox atomic success | both committed | PENDING | NOT_RUN |
| Booking rollback | neither committed | PENDING | NOT_RUN |
| Outbox failure | neither committed | PENDING | NOT_RUN |
| Worker publish | delivered | PENDING | NOT_RUN |
| Crash-before-ack recovery | safe redelivery | PENDING | NOT_RUN |
| Duplicate consumer delivery | one business effect | PENDING | NOT_RUN |
| Transient retry | bounded retry | PENDING | NOT_RUN |
| Permanent failure | dead-letter/operator evidence | PENDING | NOT_RUN |
| Ordering/version gap | detected/controlled | PENDING | NOT_RUN |

## Evidence Links

- Workflow run: PENDING
- SQL transcript: PENDING
- Worker logs: PENDING
- Consumer deduplication artifact: PENDING

## Decision

```yaml
Status: NOT_STARTED
Decision: BLOCKED
Reason: Transactional outbox proof has not yet been executed and attached.
Production Authority: No
```

## Production Gate

Transactional Outbox MAY be marked `PASS` only when atomicity, safe redelivery and consumer idempotency are demonstrated on the verified commit.

---

End of Document
