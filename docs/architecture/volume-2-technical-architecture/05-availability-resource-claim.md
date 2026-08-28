# Availability and Resource Claim Contract

**Document:** Santis OS Architecture Book  
**Volume:** 2 – Technical Architecture  
**Version:** 0.9-RC2  
**Status:** Normative Draft  
**Production Authority:** No

---

# Purpose

This document defines the normative contract for therapist, room and other time-bound operational resource claims in Santis OS.

The purpose of the Availability context is not only to answer whether a resource appears free. It MUST prevent conflicting canonical allocations under concurrent execution.

A visual schedule, Airtable filter or client-side availability calculation MUST NOT be treated as an authoritative claim.

---

# Scope

This contract applies to resources whose use is constrained by time, tenant, location or capability, including:

- therapists
- rooms
- equipment
- service segments
- lockers or cabins where exclusive occupancy is required
- future capacity-controlled operational resources

Inventory quantities, package entitlements and financial balances are outside this contract unless explicitly linked through a separate approved ADR.

---

# Normative Rules

## ARC-01 — Availability Is Not Authority

A resource availability query is informational.

A resource is authoritative only after a claim has been accepted inside a protected transaction boundary.

The system MUST distinguish:

- `AVAILABLE` — no conflict was observed at query time
- `CLAIMED` — an authoritative claim was committed
- `UNAVAILABLE` — a conflicting authoritative claim exists
- `UNKNOWN` — availability could not be proven

`UNKNOWN` MUST fail closed for booking confirmation.

---

## ARC-02 — Exact Resource Identity

Every resource claim MUST use immutable exact identifiers.

Names, display labels, branch codes and Airtable view membership MUST NOT be used as canonical resource identity.

A claim MUST include, where applicable:

- `tenant_id`
- `location_id`
- `resource_type`
- `resource_id`
- `start_at`
- `end_at`
- `claim_status`
- `booking_id` or `booking_request_id`
- `service_segment_id` where applicable
- `trace_id`
- `contract_version`

---

## ARC-03 — Tenant and Location Isolation

The claimed resource MUST belong to the same tenant and location as the booking command.

A cross-tenant or cross-location resource reference MUST be rejected before canonical mutation.

Rejection MUST produce zero resource claims and zero booking mutation.

---

## ARC-04 — Valid Time Interval

Every claim MUST use an explicit half-open interval:

```text
[start_at, end_at)
```

The following rules are mandatory:

- `start_at` MUST be earlier than `end_at`.
- Timestamps MUST be stored as `timestamptz` or an equivalent timezone-safe representation.
- Location timezone MAY be used for presentation, but canonical comparison MUST use normalized absolute timestamps.
- Adjacent claims where one ends exactly when the next begins MAY be permitted unless cleaning, reset or preparation buffers apply.

---

## ARC-05 — Buffer Inclusion

Operational buffers MUST be part of the authoritative occupancy interval when they prevent reuse.

Examples include:

- room cleaning time
- equipment reset time
- therapist transition time
- preparation time

The system MUST NOT display a buffer separately while omitting it from conflict enforcement.

---

## ARC-06 — Strong Consistency for Exclusive Resources

Exclusive resource claims MUST use strong consistency.

The final conflict decision MUST be enforced by PostgreSQL constraints, transactional locking or another architecture-reviewed database mechanism.

Application-only pre-checks are insufficient because two concurrent requests may observe the same resource as available.

---

# Recommended Persistence Model

The target architecture SHOULD use a dedicated resource-occupancy table rather than embedding all conflict rules directly in the booking row.

Example:

```sql
CREATE TABLE availability.resource_claims (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL,
  location_id uuid NOT NULL,
  resource_type text NOT NULL,
  resource_id uuid NOT NULL,
  booking_id uuid,
  booking_request_id uuid,
  service_segment_id uuid,
  start_at timestamptz NOT NULL,
  end_at timestamptz NOT NULL,
  claim_status text NOT NULL,
  hold_expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by_actor_id uuid NOT NULL,
  trace_id uuid NOT NULL,
  contract_version integer NOT NULL,
  CHECK (start_at < end_at),
  CHECK (claim_status IN (
    'HELD',
    'CONFIRMED',
    'CHECKED_IN',
    'RELEASED',
    'EXPIRED',
    'CANCELLED'
  ))
);
```

Resource type SHOULD be constrained by an enum, lookup table or equivalent controlled contract.

---

# Overlap Enforcement

## PostgreSQL Exclusion Constraint Candidate

For exclusive therapist claims, the following pattern is a strong implementation candidate:

```sql
CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE availability.resource_claims
ADD CONSTRAINT resource_claim_no_overlap
EXCLUDE USING gist (
  tenant_id WITH =,
  location_id WITH =,
  resource_type WITH =,
  resource_id WITH =,
  tstzrange(start_at, end_at, '[)') WITH &&
)
WHERE (
  claim_status IN ('HELD', 'CONFIRMED', 'CHECKED_IN')
);
```

This pattern MUST be validated against real Santis OS requirements before production approval, including:

- group reservations
- multi-therapist services
- couple treatments
- segment-based services
- resources that allow controlled overlap
- capacity greater than one
- room-type substitution
- cleaning and transition buffers

An exclusion constraint MUST NOT be adopted blindly if a resource supports capacity greater than one or policy-based overlap.

---

# Capacity-Controlled Resources

Resources with capacity greater than one MUST NOT use a simple exclusive overlap rule.

Examples include:

- hammam zones
- shared relaxation spaces
- group rooms
- shared equipment pools

These resources SHOULD use one of the following reviewed models:

1. capacity bucket per interval
2. resource-unit expansion
3. slot claim table
4. serializable aggregate counter

The chosen mechanism MUST guarantee that committed occupancy never exceeds configured capacity.

---

# Claim Lifecycle

The normative lifecycle is:

```text
REQUESTED
→ HELD
→ CONFIRMED
→ CHECKED_IN
→ RELEASED
```

Alternative terminal paths:

```text
HELD → EXPIRED
HELD → CANCELLED
CONFIRMED → CANCELLED
CHECKED_IN → RELEASED
```

`REQUESTED` MAY exist only as application state and MUST NOT block resources unless persisted as an authoritative hold.

---

# Hold Semantics

Temporary holds MAY be used when operationally required.

A hold MUST include:

- owner command identity
- expiry timestamp
- resource identity
- booking request identity
- tenant and location scope

Expired holds MUST cease blocking resources through a deterministic process.

Hold expiry MUST NOT depend solely on a best-effort background worker. Query and claim logic MUST treat an expired hold as non-blocking according to canonical database time.

The release or expiration process MUST be idempotent.

---

# Booking Transaction Boundary

For booking creation that requires guaranteed therapist or room allocation, the following operations MUST be part of one atomic transaction or an equivalent strongly consistent boundary:

1. establish authorized tenant/location transaction context
2. claim durable idempotency identity
3. validate LOCK-59 context
4. validate resource ownership and capability
5. create authoritative resource claim
6. create booking or booking segment
7. write audit evidence
8. write outbox event
9. complete idempotency claim
10. commit

If any step fails, the entire transaction MUST roll back.

A booking MUST NOT be reported as confirmed when required resource claims were not committed.

---

# Capability and Shift Validation

A free resource is not necessarily eligible.

Before claim creation, the system MUST validate applicable constraints including:

- therapist active status
- therapist tenant and location ownership
- therapist shift coverage
- therapist-service authorization
- room active status
- room type compatibility
- room capacity
- environment or deployment boundary
- service segment requirements

A claim MUST fail closed if required capability evidence is missing or stale.

---

# Multi-Resource Booking

When a booking requires multiple resources, all required claims MUST succeed atomically.

Examples:

- therapist + room
- two therapists + one room
- therapist + equipment
- couple treatment with two rooms or two stations

Partial allocation is prohibited unless the domain contract explicitly defines a resumable draft state that is invisible to Live operations.

Resources SHOULD be claimed in a deterministic order to reduce deadlock risk.

Recommended ordering:

```text
tenant_id
→ location_id
→ resource_type
→ resource_id
→ start_at
```

Deadlock retry MAY occur only with the original idempotency identity and bounded retry policy.

---

# Booking Modification

Changing a booking's time or assigned resource MUST NOT release the existing claim before the replacement claim is secured unless the user explicitly accepts loss of the original allocation.

The preferred modification flow is:

1. validate current aggregate version
2. attempt replacement claims
3. update booking
4. release superseded claims
5. write audit and outbox records
6. commit atomically

If replacement fails, the original booking and claims MUST remain unchanged.

---

# Cancellation and Release

Booking cancellation MUST release active claims through an idempotent domain command.

Release MUST preserve historical evidence.

Claims SHOULD transition to `CANCELLED` or `RELEASED`; historical claim records SHOULD NOT be physically deleted during normal operations.

---

# Segment-Based Services

Multi-step treatments MUST use segment-native claims when different therapists, rooms or time intervals apply.

A parent booking MUST NOT hide resource-level conflicts that exist at segment level.

Each segment claim MUST reference:

- parent booking
- segment identity
- resource identity
- segment time interval
- required capability contract

---

# Read Models and Schedule UI

Schedule projections MAY combine booking, shift and resource-claim information for display.

The React schedule and Airtable projections MUST NOT become conflict authority.

Drag-and-drop or reschedule actions MUST submit a command to the backend and wait for canonical acceptance.

Optimistic UI MAY be used, but it MUST visibly revert if the claim is rejected.

---

# Stable Decision Codes

The Availability context MUST return stable machine-readable codes.

Minimum catalogue:

```text
RESOURCE_AVAILABLE
RESOURCE_CLAIMED
RESOURCE_CONFLICT
RESOURCE_NOT_FOUND
RESOURCE_TENANT_MISMATCH
RESOURCE_LOCATION_MISMATCH
RESOURCE_INACTIVE
RESOURCE_CAPABILITY_MISMATCH
RESOURCE_SHIFT_MISMATCH
RESOURCE_CAPACITY_EXCEEDED
INVALID_TIME_INTERVAL
HOLD_EXPIRED
HOLD_NOT_OWNED
CLAIM_ALREADY_RELEASED
RESOURCE_CLAIM_CONCURRENCY_CONFLICT
RESOURCE_CLAIM_CONTEXT_MISSING
```

User-facing messages MAY be localized separately.

---

# Audit Requirements

Every successful claim, release, expiration and rejected claim attempt MUST produce evidence containing:

- actor identity
- command identity
- tenant and location context
- resource identity
- interval
- decision code
- booking or request identity
- trace ID
- contract version
- timestamp

Rejected cross-tenant and cross-location attempts MUST be recorded as security-relevant events without exposing foreign resource details.

---

# Failure Behaviour

Availability failure mode is `Fail Closed` for confirmation and canonical assignment.

If the Availability module is unavailable:

- new confirmed bookings requiring claims MUST be rejected or retained as non-authoritative drafts
- existing confirmed bookings MUST remain intact
- the system MUST NOT guess availability
- the UI MAY degrade to read-only schedule mode

---

# Concurrency Acceptance Matrix

| Scenario | Expected Result |
|---|---|
| Two concurrent commands claim same exclusive therapist and interval | Exactly one claim commits |
| Two concurrent commands claim same room and interval | Exactly one claim commits |
| Adjacent intervals without buffer | Both MAY commit |
| Adjacent intervals with required buffer overlap | One MUST fail |
| Same request replayed with same idempotency key | Original result returned |
| Same key with changed resource or time | `IDEMPOTENCY_CONFLICT` |
| Multi-resource booking where one resource conflicts | Zero new claims and zero booking mutation |
| Wrong tenant resource | Reject; zero mutation |
| Wrong location resource | Reject; zero mutation |
| Expired hold exists | New claim MAY succeed after canonical expiry evaluation |
| Stale aggregate version during reschedule | Reject; original claims preserved |

---

# Fault Injection Requirements

The implementation MUST support controlled failure tests at these points:

- after availability pre-check
- after first resource claim
- after all claims but before booking insert
- after booking insert but before outbox insert
- before commit
- after commit before response delivery

Acceptance evidence MUST prove:

- no orphan claims after rollback
- no confirmed booking without required claims
- replay returns original committed result
- partial multi-resource claims do not remain

---

# Performance and Indexing

Index design MUST be derived from real query patterns.

Likely supporting indexes include:

```sql
CREATE INDEX resource_claim_lookup_idx
ON availability.resource_claims (
  tenant_id,
  location_id,
  resource_type,
  resource_id,
  start_at,
  end_at
)
WHERE claim_status IN ('HELD', 'CONFIRMED', 'CHECKED_IN');
```

Performance MUST be verified with representative data using:

```sql
EXPLAIN (ANALYZE, BUFFERS)
```

Performance optimization MUST NOT weaken overlap enforcement.

---

# Prohibited Patterns

The following patterns are prohibited:

- client-side conflict checks as final authority
- direct writes from React or Airtable to canonical claims
- resource matching by name
- releasing current claims before replacement succeeds
- non-transactional multi-resource allocation
- deleting claim history to resolve conflicts
- silently overriding exclusion violations
- bypassing capability or shift checks
- accepting `UNKNOWN` as available

---

# Production Acceptance Gates

This contract MUST remain `Production Not Approved` until all of the following are evidenced:

1. exact tenant/location/resource ownership enforcement
2. therapist and room conflict prevention under concurrency
3. multi-resource atomicity
4. hold expiry correctness
5. reschedule preservation of original claims on failure
6. segment-level conflict enforcement
7. zero orphan claim proof under fault injection
8. zero confirmed booking without required claim proof
9. stable decision-code contract tests
10. representative performance benchmark
11. independent architecture and database review
12. rollback and recovery procedure

---

# Current Architecture Status

```text
Contract: NORMATIVE DESIGN
Airtable Selector Guards: PROTOTYPED / PARTIAL RUNTIME EVIDENCE
PostgreSQL Resource Claims: ACCEPTANCE PENDING
Exclusion Constraint Strategy: DESIGN CANDIDATE
Production Approval: NO
```

This document does not declare the current scheduler or LOCK-59 implementation production-safe.

---

# Summary

Availability is a transactionally protected operational capability, not a visual schedule calculation.

A resource is considered reserved only after an authoritative claim is committed under the correct tenant and location context.

Santis OS MUST guarantee that concurrent commands cannot create conflicting canonical resource assignments.

---

End of Document
