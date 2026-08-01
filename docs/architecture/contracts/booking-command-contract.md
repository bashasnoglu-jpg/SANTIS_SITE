# Booking Command Contract

**Document:** Santis OS Architecture Book  
**Version:** 0.9-RC2  
**Status:** Normative Draft  
**Production Authority:** No

## Purpose

This contract defines the authoritative command interface for creating and changing bookings.

## BCC-01 — Canonical Entry Point

Booking mutations MUST enter through published Booking application commands. React, Airtable, automation, AI and integration adapters MUST NOT write canonical booking tables directly.

## BCC-02 — Required Command Envelope

Every externally retriable booking command MUST include:

- `command_id`
- `command_type`
- `contract_version`
- `idempotency_key`
- `actor_id` and `actor_type`
- trusted or derivable `tenant_id`
- trusted or derivable `location_id`
- `trace_id`
- `correlation_id`
- payload

`CreateBookingCommand` MUST additionally include requested time interval, service identity, resource requirements and guest/customer reference where applicable.

## BCC-03 — Trusted Context

The handler MUST authenticate the actor, resolve membership and authorize location scope. Client-supplied tenant/location values MUST NOT be trusted independently.

## BCC-04 — Validation Order

The command handler MUST perform, in a deterministic order:

1. contract validation,
2. authentication and authorization,
3. idempotency claim,
4. LOCK-59 tenant/location/resource validation,
5. service and resource capability validation,
6. availability claim,
7. booking aggregate creation or transition,
8. audit evidence,
9. outbox event creation,
10. commit.

A failure before commit MUST produce zero canonical booking and resource mutations.

## BCC-05 — Atomicity

For booking creation, the idempotency claim, resource claims, booking record, audit evidence and outbox event MUST commit atomically where they protect the same invariant.

External notifications and projections MUST NOT execute inside this transaction.

## BCC-06 — Idempotency Outcomes

The command MUST return one of:

- `CREATED`
- `REPLAYED`
- `IDEMPOTENCY_CONFLICT`
- `REJECTED`
- `FAILED`

Same key plus same canonical fingerprint MUST return the original outcome. Same key plus different fingerprint MUST fail closed.

## BCC-07 — Concurrency

Concurrent equivalent requests MUST produce one booking only. Concurrent conflicting resource requests MUST produce at most one successful resource claim.

## BCC-08 — Lifecycle Commands

Supported lifecycle commands MAY include:

- `CreateBooking`
- `ConfirmBooking`
- `RescheduleBooking`
- `CancelBooking`
- `CheckInBooking`
- `CompleteBooking`
- `MarkNoShow`

Each command MUST declare allowed source states, target state, required authorization and side effects.

## BCC-09 — Stable Errors

The owner module MUST return stable codes including, where applicable:

- `AUTHORIZATION_DENIED`
- `TENANT_SCOPE_MISMATCH`
- `LOCATION_SCOPE_MISMATCH`
- `RESOURCE_UNAVAILABLE`
- `RESOURCE_SCOPE_MISMATCH`
- `INVALID_STATE_TRANSITION`
- `STALE_AGGREGATE_VERSION`
- `IDEMPOTENCY_CONFLICT`
- `CANONICAL_WRITE_FAILED`

## BCC-10 — Events

Successful committed transitions MUST publish facts through the transactional outbox, such as:

- `booking.created`
- `booking.confirmed`
- `booking.rescheduled`
- `booking.cancelled`
- `booking.checked_in`
- `booking.completed`

Events MUST comply with the Event Envelope Contract.

## Acceptance Tests

The contract test suite MUST cover valid creation, replay, fingerprint conflict, wrong tenant, wrong location, unauthorized actor, resource overlap, stale version, fault injection and 20–25 concurrent submissions.

## References

- ADR-004 — Durable PostgreSQL Idempotency
- ADR-005 — Transactional Outbox
- ADR-006 — LOCK-59 Defense-in-Depth Isolation
- `03-booking-writer.md`
- `05-availability-resource-claim.md`

---

End of Document
