# Transactional Outbox Contract

**Document:** Santis OS Architecture Book  
**Volume:** 2 – Technical Architecture  
**Version:** 0.9-RC2  
**Status:** Normative Draft  
**Production Authority:** No

---

# Purpose

This document defines the normative contract for publishing domain events without creating a dual-write failure between canonical PostgreSQL state and external consumers.

The transactional outbox is the required publication boundary for domain events produced by canonical state changes.

---

# TO-01 — Atomic Event Recording

A domain event MUST be written to the outbox in the same PostgreSQL transaction as the canonical state change that caused it.

The platform MUST NOT:

- commit canonical state and publish an event in a separate non-atomic step
- publish an event before the canonical transaction commits
- rely on in-memory event buffers as durable evidence
- publish directly from the request handler without an outbox record

If the canonical transaction rolls back, the related outbox record MUST also roll back.

---

# TO-02 — Delivery Semantics

The outbox publisher SHALL provide **at-least-once delivery**.

Exactly-once delivery across process and network boundaries MUST NOT be claimed.

Consumers MUST therefore be idempotent by `event_id` or by a stronger domain-specific deduplication key.

Duplicate delivery MUST NOT create duplicate business effects.

---

# TO-03 — Event Envelope

Every outbox record MUST contain at least:

| Field | Requirement |
|---|---|
| `event_id` | Globally unique immutable identifier |
| `event_type` | Stable semantic event name, for example `booking.created` |
| `schema_version` | Event payload contract version |
| `aggregate_type` | Owning aggregate type |
| `aggregate_id` | Owning aggregate identifier |
| `aggregate_version` | Aggregate version after the committed mutation |
| `tenant_id` | Tenant ownership boundary where applicable |
| `location_id` | Operational location scope where applicable |
| `occurred_at` | Business event time |
| `recorded_at` | Outbox persistence time |
| `actor_id` | Actor that caused the mutation |
| `trace_id` | End-to-end trace identifier |
| `causation_id` | Command or event that directly caused this event |
| `correlation_id` | Workflow-level correlation identifier |
| `payload` | Versioned event data |

Sensitive personal data MUST NOT be duplicated into the envelope unless explicitly required by an approved data contract.

---

# TO-04 — Event Naming and Versioning

Event names MUST describe completed facts.

Examples:

- `booking.created`
- `booking.confirmed`
- `booking.cancelled`
- `payment.recorded`
- `package.entitlement_consumed`

Event names MUST NOT include implementation-specific version suffixes such as `_v1` or `_v2`.

Versioning MUST use the `schema_version` field.

Backward-compatible changes SHOULD add optional fields.

Breaking changes MUST include:

- a new schema version
- a consumer migration plan
- contract tests
- a defined sunset date
- an upcaster or explicit compatibility strategy where required

Long-lived dual publication of semantically equivalent event versions SHOULD be avoided.

---

# TO-05 — Outbox Table

A reference PostgreSQL structure MAY use the following shape:

```sql
CREATE TABLE outbox_events (
  event_id uuid PRIMARY KEY,
  event_type text NOT NULL,
  schema_version integer NOT NULL,
  aggregate_type text NOT NULL,
  aggregate_id uuid NOT NULL,
  aggregate_version bigint NOT NULL,
  tenant_id uuid,
  location_id uuid,
  occurred_at timestamptz NOT NULL,
  recorded_at timestamptz NOT NULL DEFAULT now(),
  actor_id uuid,
  trace_id uuid NOT NULL,
  causation_id uuid,
  correlation_id uuid,
  payload jsonb NOT NULL,
  publication_status text NOT NULL DEFAULT 'PENDING',
  attempt_count integer NOT NULL DEFAULT 0,
  available_at timestamptz NOT NULL DEFAULT now(),
  claimed_at timestamptz,
  claimed_by text,
  published_at timestamptz,
  last_error_code text,
  last_error_detail text
);

CREATE INDEX outbox_events_pending_idx
ON outbox_events (available_at, recorded_at)
WHERE publication_status IN ('PENDING', 'RETRY');
```

The final DDL MUST be reviewed against the implemented worker and retention policy before production approval.

---

# TO-06 — Publication State Machine

The outbox publication lifecycle SHALL use explicit states.

Recommended states:

```text
PENDING
→ CLAIMED
→ PUBLISHED
```

Failure paths:

```text
CLAIMED
→ RETRY
→ CLAIMED

RETRY
→ DEAD_LETTER
```

A stale `CLAIMED` record MUST be recoverable after a bounded lease timeout.

A worker crash MUST NOT permanently orphan an event.

---

# TO-07 — Worker Claiming

Concurrent publishers MUST NOT process the same outbox row as independent work at the same time.

Workers SHOULD claim records through a bounded database lease using a pattern such as:

```sql
SELECT event_id
FROM outbox_events
WHERE publication_status IN ('PENDING', 'RETRY')
  AND available_at <= now()
ORDER BY recorded_at
FOR UPDATE SKIP LOCKED
LIMIT $1;
```

The claim and transition to `CLAIMED` MUST occur in one transaction.

Worker identity and claim time MUST be recorded.

---

# TO-08 — Publish and Mark Behaviour

The worker MUST publish only committed outbox records.

After successful broker or destination acknowledgement, the worker SHALL mark the event `PUBLISHED` and set `published_at`.

If the process crashes after external publication but before marking the row `PUBLISHED`, the event MAY be delivered again.

Consumers MUST tolerate this duplicate delivery.

The publisher MUST NOT delete an outbox record immediately after publication.

---

# TO-09 — Retry Policy

Blind retry is prohibited.

Retry MAY occur only with:

- the same immutable `event_id`
- bounded exponential backoff
- a maximum attempt policy
- stable error classification
- preserved failure evidence

Transient failures MAY move an event to `RETRY`.

Permanent contract, authorization or payload failures MUST move the event to `DEAD_LETTER` or quarantine without infinite retry.

---

# TO-10 — Consumer Idempotency

Every consumer that creates a business effect MUST record processed event identity durably.

A reference structure MAY use:

```sql
CREATE TABLE consumed_events (
  consumer_name text NOT NULL,
  event_id uuid NOT NULL,
  processed_at timestamptz NOT NULL DEFAULT now(),
  result_code text,
  PRIMARY KEY (consumer_name, event_id)
);
```

The consumer's canonical mutation and `consumed_events` insert SHOULD occur in the same transaction where technically possible.

If the event has already been processed, the consumer MUST return a deterministic replay outcome and MUST NOT repeat the business effect.

---

# TO-11 — Ordering

Global event ordering MUST NOT be assumed.

Consumers MAY rely on per-aggregate ordering only when `aggregate_version` is present and enforced.

A consumer receiving aggregate version `N+1` before `N` MUST:

- defer processing
- request reconciliation
- or rebuild from an authoritative source

It MUST NOT silently apply an invalid transition.

Cross-aggregate ordering MUST NOT be treated as guaranteed.

---

# TO-12 — Tenant Isolation

Outbox records MUST preserve tenant and location scope where applicable.

Workers MUST NOT publish an event under a tenant context different from the canonical record that produced it.

Consumers MUST validate event scope before applying a mutation.

Cross-tenant event application MUST fail closed and produce zero canonical mutation.

---

# TO-13 — Payload Rules

Event payloads MUST contain facts required by consumers, not arbitrary database snapshots.

Payloads SHOULD be minimal, explicit and versioned.

Payloads MUST NOT:

- expose secrets
- include credentials
- copy unnecessary PII
- contain mutable URLs as the sole evidence source
- require consumers to infer tenant ownership

Consumers needing additional current data SHOULD use an authorized query interface rather than direct table access.

---

# TO-14 — Projection Consumers

Airtable, analytics and read-model consumers MAY rebuild their projections from durable events and canonical query APIs.

Projection failure MUST NOT roll back committed canonical state.

Projection consumers MUST expose:

- source event ID
- source aggregate version
- projected timestamp
- reconciliation status
- last error code

A projection MUST NOT become a substitute canonical authority.

---

# TO-15 — Observability

The outbox subsystem MUST expose at least:

- pending event count
- oldest pending event age
- publication latency P50/P95/P99
- retry count
- dead-letter count
- publication failure rate
- duplicate delivery rate where measurable
- consumer lag
- stale claim count

Every publication attempt MUST retain `trace_id`, `event_id` and stable error classification.

---

# TO-16 — Backlog and Recovery

An outbox backlog MUST NOT be repaired by deleting unpublished events.

Recovery SHALL prefer:

1. correcting the publisher or dependency failure
2. resuming publication with original event identities
3. replaying from durable outbox evidence
4. reconciling consumers against canonical state

Manual mutation of event payloads is prohibited unless performed through an approved, audited repair procedure.

---

# TO-17 — Retention

Published events MUST be retained long enough to support:

- incident investigation
- consumer replay
- projection recovery
- contractual audit requirements

Retention duration SHALL be defined by data classification and regulatory requirements.

Archival MUST preserve event identity, envelope, payload integrity and publication evidence.

---

# TO-18 — Fault Injection

The implementation MUST be tested at these failure points:

- after canonical mutation but before outbox insert
- after outbox insert but before transaction commit
- after commit but before worker claim
- after claim but before publish
- after external publish but before marking `PUBLISHED`
- during consumer processing before commit
- after consumer commit but before acknowledgement

Expected result:

- no committed canonical mutation without a committed outbox event
- no event for a rolled-back canonical mutation
- no lost committed event
- duplicate delivery may occur but duplicate business effect does not

---

# TO-19 — Acceptance Matrix

| Scenario | Expected result |
|---|---|
| Canonical transaction commits | One durable outbox row exists |
| Canonical transaction rolls back | No outbox row exists |
| Two workers claim concurrently | Each row has at most one active lease |
| Worker crashes after publish | Event may redeliver; consumer effect remains single |
| Consumer receives same event twice | Second handling is deterministic replay |
| Event payload schema unsupported | Fail closed; dead-letter or quarantine |
| Tenant scope mismatch | Rejected with zero mutation |
| Backlog resumes after outage | Original event IDs are preserved |
| Aggregate versions arrive out of order | Deferred or reconciled; no invalid transition |

---

# TO-20 — Stable Error Codes

The subsystem SHOULD use stable error codes including:

```text
OUTBOX_EVENT_INVALID
OUTBOX_SCHEMA_UNSUPPORTED
OUTBOX_CLAIM_CONFLICT
OUTBOX_CLAIM_STALE
OUTBOX_PUBLISH_TRANSIENT_FAILURE
OUTBOX_PUBLISH_PERMANENT_FAILURE
OUTBOX_MAX_ATTEMPTS_EXCEEDED
OUTBOX_TENANT_SCOPE_MISMATCH
OUTBOX_AGGREGATE_VERSION_GAP
CONSUMER_EVENT_ALREADY_PROCESSED
CONSUMER_PROCESSING_FAILED
```

Human-readable error text MAY change; stable error codes MUST remain machine-compatible within the contract version.

---

# Prohibited Patterns

The following patterns are prohibited:

- direct event publication from request handlers without an outbox row
- deleting pending events to clear backlog
- consumer side effects without durable deduplication
- assuming global event order
- treating a broker acknowledgement as canonical transaction success
- mutating canonical state from Airtable projection callbacks
- infinite retry without dead-letter handling
- changing `event_id` during retry or replay

---

# Production Acceptance Gate

Transactional outbox publication MUST remain **Production Not Approved** until evidence proves:

- atomic canonical mutation and outbox insertion
- recovery from all required fault-injection points
- idempotent consumer processing
- tenant-scope validation
- backlog recovery without event loss
- aggregate ordering handling
- observability dashboards and alerts
- dead-letter runbook
- retention and archival policy

---

# Current Status

```text
Architecture: NORMATIVE DESIGN
Proof of Concept: REQUIRED
Shadow Verification: NOT COMPLETE
Production Approval: NO
```

This document defines the required target behaviour. It does not claim that the current runtime implementation already satisfies the contract.

---

End of Document
