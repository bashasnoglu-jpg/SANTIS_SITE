# Booking Writer Contract

**Document:** Santis OS Architecture Book  
**Volume:** 2 – Technical Architecture  
**Version:** 0.9-RC2  
**Status:** Normative Draft  
**Production Authority:** No

---

# Purpose

This document defines the normative architecture and safety contract for the Santis OS canonical booking writer.

The booking writer is responsible for converting an authorized booking command into exactly one authoritative booking outcome.

The writer MUST preserve tenant isolation, resource integrity, idempotency, auditability and atomicity.

This document does not grant production approval. Production authority requires the acceptance evidence defined herein.

---

# Scope

This contract applies to:

- `CreateBookingCommand`
- canonical booking creation
- idempotency claim handling
- replay and conflict decisions
- booking persistence
- resource reservation integration
- audit and trace evidence
- transactional outbox publication
- Airtable projection handoff

This contract does not define payment capture, commission accrual or package consumption internals. Those capabilities are owned by their respective bounded contexts.

---

# Normative Outcomes

The writer MUST return exactly one terminal outcome:

| Outcome | Meaning |
|---|---|
| `CREATED` | A new canonical booking was committed. |
| `REPLAYED` | The same completed command was submitted again and the original result was returned. |
| `IDEMPOTENCY_CONFLICT` | The same idempotency identity was reused with a different canonical payload. |
| `REJECTED` | Authorization, validation, LOCK-59, availability or policy checks failed before commit. |
| `FAILED` | An internal failure occurred and no partial canonical state was committed. |

The writer MUST NOT report success unless the canonical booking transaction has committed.

---

# BW-01 — Single Canonical Write Path

All production booking creation MUST pass through the canonical booking writer.

The following are prohibited:

- direct inserts into canonical booking tables by UI clients
- direct Airtable-to-PostgreSQL booking mutation
- automation bypass of authorization or domain validation
- raw SQL booking creation from AI or external integration clients
- alternate writers that do not share the same idempotency and audit contract

Airtable MAY create a booking request or display a projection, but MUST NOT become an independent production booking authority after backend cutover.

---

# BW-02 — Command Contract

`CreateBookingCommand` MUST include, at minimum:

```text
command_id
idempotency_key
contract_version
actor_id
actor_type
tenant_id
location_id
requested_start_at
requested_end_at OR requested_duration_minutes
client_id OR approved guest draft reference
service_id
therapist_id when explicitly selected
room_id when explicitly selected
source_channel
trace_id
submitted_at
```

Optional fields MAY include:

```text
notes
requested_status
package_entitlement_id
payment_intent_reference
group_id
segment_definitions
metadata
```

The command MUST NOT trust tenant, location, actor or authorization claims supplied only by the client.

The backend MUST derive or verify the authorized execution context before mutation.

---

# BW-03 — Canonical Payload

Before idempotency comparison, the command MUST be normalized into a canonical payload.

Canonicalization MUST define deterministic treatment for:

- object key ordering
- omitted fields
- explicit `null`
- `undefined` or non-serializable values
- date-time normalization
- timezone handling
- string normalization
- numeric representation
- list ordering where order is semantically irrelevant

The resulting fingerprint MUST be generated from the canonical payload and contract version.

Equivalent commands MUST produce the same fingerprint.

Semantically different commands MUST produce different fingerprints.

---

# BW-04 — Durable Idempotency

Critical booking idempotency MUST be enforced in PostgreSQL.

Redis or in-memory caches MAY accelerate lookup but MUST NOT be the authority.

A durable claim MUST be unique on:

```text
(tenant_id, command_type, idempotency_key)
```

Recommended conceptual schema:

```sql
CREATE TABLE booking_idempotency_claims (
  tenant_id uuid NOT NULL,
  command_type text NOT NULL,
  idempotency_key text NOT NULL,
  payload_fingerprint text NOT NULL,
  contract_version text NOT NULL,
  status text NOT NULL,
  booking_id uuid,
  result_payload jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id, command_type, idempotency_key)
);
```

The production schema MAY differ, but MUST preserve equivalent guarantees.

---

# BW-05 — Idempotency Decision Rules

For a new claim:

```text
claim absent
→ create claim
→ continue execution
```

For an existing completed claim with the same fingerprint:

```text
same key + same fingerprint
→ return original result
→ outcome = REPLAYED
→ create no new booking
```

For an existing claim with a different fingerprint:

```text
same key + different fingerprint
→ outcome = IDEMPOTENCY_CONFLICT
→ zero booking mutation
```

For an existing incomplete claim:

```text
claim exists + booking_id is null + terminal result absent
→ fail closed
→ controlled recovery or investigation
```

The writer MUST NOT guess whether an incomplete claim succeeded.

---

# BW-06 — Transaction Boundary

The following operations MUST occur in one PostgreSQL transaction where technically applicable:

1. establish transaction-local security context
2. validate authorized tenant and location scope
3. create or resolve the idempotency claim
4. validate the canonical command
5. execute LOCK-59 guards
6. validate booking lifecycle rules
7. reserve required resources
8. create the canonical booking
9. bind the booking ID to the idempotency claim
10. write mandatory audit evidence
11. insert required outbox events
12. commit

If any mandatory step fails before commit, the transaction MUST roll back.

No partial booking, resource claim, outbox event or completed idempotency result may remain after rollback.

---

# BW-07 — Authorization and LOCK-59

Before canonical mutation, the writer MUST verify:

- authenticated actor identity
- active tenant membership
- authorized location access
- permitted booking action
- exact tenant ownership of all referenced records
- exact location compatibility of branch-scoped records
- production/non-production boundary
- therapist ownership and eligibility
- room ownership and eligibility
- service availability within scope

LOCK-59 rejection MUST produce zero canonical mutation.

UI filtering or Airtable views MUST NOT be accepted as security evidence.

---

# BW-08 — Availability and Resource Claims

A booking MUST NOT reach a confirmed or equivalent resource-owning state unless required therapist, room and other exclusive resources have been safely claimed.

Resource claims MUST be concurrency-safe.

Approved implementation mechanisms MAY include:

- PostgreSQL exclusion constraints
- resource occupancy tables
- transactional row locking
- serializable execution for narrowly defined operations
- advisory locks where ownership and release semantics are explicit

Application-only overlap checks are insufficient as the sole production guarantee.

If a resource claim fails, booking creation MUST be rejected or retained only in an explicitly non-owning draft/request state.

---

# BW-09 — Booking State Creation

The writer MUST create the booking in a state permitted by the booking state machine.

A client MUST NOT arbitrarily assign privileged lifecycle states.

Examples:

- `Draft` MAY be created without resource ownership if the domain contract permits it.
- `Hold` MUST have an expiry policy and concurrency-safe claims.
- `Confirmed` MUST satisfy required resource and policy checks.
- `CheckedIn` or `Completed` MUST NOT be accepted as initial states unless an approved migration/import contract explicitly permits it.

---

# BW-10 — Database Constraints

Database constraints MUST protect invariants that can be expressed structurally.

At minimum, the production design SHOULD include:

- non-null tenant ownership
- tenant-aware foreign keys where applicable
- unique idempotency claims
- valid lifecycle state constraints
- optimistic concurrency versioning
- resource overlap enforcement
- immutable booking identifier

Application validation MUST complement, not replace, database constraints.

---

# BW-11 — Optimistic Concurrency

Canonical bookings MUST carry an aggregate or row version when later updates are allowed.

Updates MUST compare the expected version.

A stale update MUST fail with a stable concurrency error and MUST NOT silently overwrite newer state.

Recommended result:

```text
BOOKING_VERSION_CONFLICT
```

---

# BW-12 — Audit Evidence

Every terminal writer result MUST produce sufficient evidence to identify:

- command ID
- idempotency key reference or protected derivative
- payload fingerprint
- contract version
- actor ID and actor type
- tenant ID
- location ID
- trace ID
- writer version or commit SHA
- start and completion timestamps
- result classification
- booking ID when created or replayed
- rejection or error code
- mutation count where measured

Audit evidence MUST NOT expose secrets or unnecessary personal data.

---

# BW-13 — Transactional Outbox

When booking creation publishes domain events, the outbox record MUST be inserted in the same transaction as the booking.

A committed booking MUST NOT depend on a separate non-transactional event write.

Initial events MAY include:

```text
booking.created
booking.confirmed
```

The selected event MUST reflect the actual committed lifecycle state.

Outbox publication failure after commit MUST NOT roll back the already committed booking. It MUST be handled by durable retry or replay from outbox evidence.

---

# BW-14 — Projection Handoff

Airtable and other read models MUST consume committed canonical results.

Projection payloads SHOULD include:

```text
source_system
source_record_id
source_version
projected_at
projection_contract_version
projection_status
trace_id
```

Projection failure MUST NOT change canonical booking state.

Projection retries MUST be idempotent.

---

# BW-15 — Retry, Replay and Recovery

Blind retry is prohibited.

A retry MAY occur only with:

- the same idempotency identity
- the same canonical fingerprint
- bounded backoff
- preserved trace or causation evidence

Replay MUST use durable command or claim evidence.

An incomplete claim MUST enter a controlled recovery path and MUST NOT be automatically converted to success.

---

# BW-16 — Fault Injection Requirements

The writer MUST be tested with controlled failures at, at minimum:

- after idempotency claim creation
- after resource claim creation
- after booking insert
- after idempotency claim binding
- after audit insert
- after outbox insert
- immediately before commit
- immediately after commit but before response delivery

Expected guarantees:

- failures before commit produce zero partial canonical state
- failures after commit return the original result on replay
- no duplicate booking is created
- no orphan resource claim remains
- no false success is reported

---

# BW-17 — Stable Result and Error Codes

The writer MUST return stable machine-readable codes.

Minimum result codes:

```text
BOOKING_CREATED
BOOKING_REPLAYED
IDEMPOTENCY_CONFLICT
IDEMPOTENCY_CLAIM_INCOMPLETE
AUTHENTICATION_REQUIRED
AUTHORIZATION_DENIED
TENANT_CONTEXT_INVALID
LOCATION_CONTEXT_INVALID
LOCK59_REJECTED
SERVICE_SCOPE_INVALID
THERAPIST_SCOPE_INVALID
ROOM_SCOPE_INVALID
RESOURCE_CONFLICT
BOOKING_VALIDATION_FAILED
BOOKING_VERSION_CONFLICT
INTERNAL_TRANSACTION_FAILED
```

Human-readable messages MAY change without changing the stable code.

---

# BW-18 — Concurrency Acceptance

Production acceptance MUST demonstrate that concurrent identical commands create exactly one booking.

Minimum acceptance scenario:

```text
20–25 simultaneous requests
same tenant
same command type
same idempotency key
same canonical fingerprint
```

Expected result:

```text
1 CREATED
remaining requests REPLAYED or safely resolved to the same booking
canonical booking count = 1
resource claim count = expected single set
partial writes = 0
```

A second scenario MUST demonstrate:

```text
same idempotency key
different canonical fingerprint
```

Expected result:

```text
IDEMPOTENCY_CONFLICT
canonical mutation = 0 for conflicting request
```

---

# BW-19 — Negative Acceptance Matrix

The writer MUST reject and preserve zero canonical mutation for:

- missing idempotency key
- malformed command contract
- inactive tenant membership
- unauthorized location
- cross-tenant client reference
- cross-location therapist
- cross-location room
- invalid environment boundary
- unavailable therapist
- unavailable room
- invalid service scope
- stale aggregate version where applicable
- unsupported lifecycle state
- incomplete idempotency claim without approved recovery

Each test MUST record stable error code, trace ID and mutation evidence.

---

# BW-20 — Production Gate

The booking writer MUST remain `ACCEPTANCE PENDING` until all of the following are complete:

- canonical command contract approved
- durable PostgreSQL idempotency implemented
- concurrency acceptance passed
- same-key/different-payload conflict passed
- zero partial-write fault-injection evidence passed
- LOCK-59 negative matrix passed
- resource claim contract passed
- RLS test harness passed
- outbox proof-of-concept passed
- audit evidence verified
- projection contract verified
- rollback and recovery runbook approved
- independent reviewer sign-off recorded

Documentation completion alone MUST NOT grant production authority.

---

# Current Architecture Status

| Capability | Status |
|---|---|
| Airtable booking request model | Prototyped |
| Canonical booking contract | Normative Design |
| Durable PostgreSQL idempotency | Acceptance Pending |
| Concurrent single-winner guarantee | Acceptance Pending |
| LOCK-59 integration | Partial Runtime Evidence |
| Resource claim enforcement | Normative Design |
| Transactional outbox | Normative Design |
| Airtable projection | Transitional / Contract Pending |
| Production authority | Not Approved |

---

# Summary

The Santis OS booking writer is the sole intended canonical path for production booking creation.

It MUST produce one authoritative outcome, preserve durable idempotency, enforce LOCK-59, claim resources safely, commit atomically, emit durable audit and outbox evidence, and create no partial or duplicate canonical state.

Until the production gate is satisfied, the writer remains an acceptance-pending capability.

---

End of Document
