# Event Envelope Contract

**Document:** Santis OS Architecture Book  
**Volume:** 2 – Technical Architecture  
**Version:** 0.9-RC2  
**Status:** Normative Draft  
**Production Authority:** No

---

# Purpose

This document defines the mandatory envelope, naming, versioning, ordering, security, and compatibility rules for events produced by Santis OS.

The event envelope is the stable transport contract around an event payload. It MUST allow consumers to identify the fact, its source, tenant scope, aggregate order, causal chain, schema version, and audit context without interpreting domain-specific payload fields.

This document applies to:

- transactional outbox records;
- domain events;
- integration events;
- projection events;
- replayed events;
- events consumed by Airtable projections, notifications, analytics, CRM, and AI orchestration.

It does not authorize any event for production use by itself.

---

# Normative Language

The terms **MUST**, **MUST NOT**, **SHOULD**, **SHOULD NOT**, and **MAY** are normative.

---

# EV-01 — Events Describe Facts

An event MUST describe a fact that has already occurred.

Event names MUST use past-tense business language.

Valid examples:

- `booking.created`
- `booking.confirmed`
- `booking.cancelled`
- `payment.recorded`
- `package.entitlement_consumed`

Invalid examples:

- `create_booking`
- `confirm_booking`
- `process_payment`
- `reserve_room`

Commands describe intent. Events describe completed facts.

---

# EV-02 — Canonical Envelope

Every published event MUST use the following logical envelope:

```json
{
  "event_id": "018f5f90-3fc7-7d61-a3e1-6f28a5cb71e1",
  "event_type": "booking.created",
  "schema_version": 1,
  "aggregate_type": "booking",
  "aggregate_id": "018f5f8d-d86a-7c11-bc64-9e34d30e9af7",
  "aggregate_version": 1,
  "tenant_id": "018f5e01-4b40-79f1-a155-72df03a6de21",
  "location_id": "018f5e20-2648-7194-8eb7-3514261cb510",
  "occurred_at": "2026-08-01T10:15:24.381Z",
  "recorded_at": "2026-08-01T10:15:24.389Z",
  "actor_id": "018f5d42-b2f6-718a-a0dd-9b8f9c782d7c",
  "actor_type": "user",
  "trace_id": "5f6af9015cf34d70a9bc7ee7bf6c5b18",
  "correlation_id": "018f5f88-a906-777a-9f13-c8af68f8ea1c",
  "causation_id": "018f5f89-8992-76ef-83d9-3897ba0fe69c",
  "contract_version": "booking-event-contract/1.0",
  "data_classification": "operational",
  "payload": {}
}
```

Domain-specific data MUST be placed inside `payload`.

Consumers MUST NOT infer envelope fields from payload content.

---

# EV-03 — Required Fields

| Field | Requirement | Meaning |
|---|---|---|
| `event_id` | MUST | Globally unique immutable event identity |
| `event_type` | MUST | Stable dot-separated fact name |
| `schema_version` | MUST | Positive integer payload/envelope schema version |
| `aggregate_type` | MUST | Canonical aggregate category |
| `aggregate_id` | MUST | Canonical aggregate identity |
| `aggregate_version` | MUST | Monotonic version within the aggregate |
| `tenant_id` | MUST for tenant-scoped events | Tenant isolation boundary |
| `location_id` | MUST when location-scoped | Operational location boundary |
| `occurred_at` | MUST | Time the domain fact occurred |
| `recorded_at` | MUST | Time the event was durably recorded |
| `actor_id` | MUST when an actor exists | Human, system, or AI actor identity |
| `actor_type` | MUST | `user`, `system`, `worker`, `integration`, or `ai_agent` |
| `trace_id` | MUST | End-to-end technical trace identifier |
| `correlation_id` | MUST | Business workflow correlation identity |
| `causation_id` | SHOULD | Identifier of the command or event that caused this event |
| `contract_version` | MUST | Normative producing contract version |
| `data_classification` | MUST | Data handling category |
| `payload` | MUST | Domain-specific fact data |

Global catalogue events MAY omit `tenant_id` and `location_id` only when the event contract explicitly defines global scope.

---

# EV-04 — Event Identity

`event_id` MUST be unique across the Santis OS event history.

An event MUST retain the same `event_id` during:

- delivery retry;
- consumer retry;
- transport redelivery;
- dead-letter recovery;
- replay from the original durable event.

A retry or redelivery MUST NOT generate a new event identity.

A newly derived fact MUST receive a new event identity.

UUIDv7 or another sortable globally unique identifier SHOULD be used.

---

# EV-05 — Event Naming

Event types MUST:

- use lowercase characters;
- use dot-separated names;
- identify the owning bounded context or aggregate;
- describe a completed fact;
- remain stable across compatible schema changes.

Preferred pattern:

```text
<aggregate-or-context>.<past-tense-fact>
```

Examples:

```text
booking.created
booking.confirmed
availability.resources_reserved
payment.recorded
commission.accrued
projection.reconciliation_failed
```

Version suffixes such as `BookingCreated_v1` or `booking.created.v2` MUST NOT be used as the primary versioning mechanism.

---

# EV-06 — Schema Versioning

`schema_version` MUST be an integer beginning at `1`.

Backward-compatible changes MAY remain within the same schema version when they only:

- add optional fields;
- broaden non-breaking enumerations under an explicitly extensible contract;
- add metadata that older consumers safely ignore.

Breaking changes MUST increment `schema_version`.

Breaking changes include:

- removing a field;
- changing a field type;
- changing a field meaning;
- changing required/optional status in a breaking direction;
- narrowing an accepted enumeration;
- changing time, currency, or identifier semantics.

Every breaking version change MUST include:

1. consumer impact analysis;
2. migration plan;
3. contract tests;
4. upcaster or compatibility adapter when required;
5. sunset date for the previous version;
6. approved ADR when architectural behavior changes.

Producers SHOULD avoid long-term dual publication of semantically identical events.

---

# EV-07 — Aggregate Ordering

`aggregate_version` MUST be monotonically increasing for each `(tenant_id, aggregate_type, aggregate_id)` stream.

A consumer that requires ordered processing MUST:

- store the last successfully processed aggregate version;
- detect duplicate versions;
- detect version gaps;
- reject or quarantine out-of-order destructive processing;
- request replay or reconciliation when a gap exists.

The platform does not guarantee global ordering across unrelated aggregates.

Consumers MUST NOT depend on global event order.

---

# EV-08 — Time Semantics

All event timestamps MUST:

- use UTC;
- use ISO 8601/RFC 3339 representation when serialized;
- include timezone information;
- preserve sub-second precision where supported.

`occurred_at` represents domain time.

`recorded_at` represents durable persistence time.

`recorded_at` MUST NOT be earlier than the database transaction time that durably stores the outbox record.

Consumers MUST NOT substitute `recorded_at` for business-effective time when `occurred_at` is available.

---

# EV-09 — Causation and Correlation

`correlation_id` MUST identify the broader business workflow.

Examples:

- one booking creation attempt;
- one payment workflow;
- one package entitlement consumption;
- one reconciliation case.

`causation_id` SHOULD identify the immediately preceding command or event.

A causal chain MUST be traceable as:

```text
Command
→ Domain Event
→ Consumer Command
→ Derived Event
```

Derived events MUST preserve the original `correlation_id` unless a new independent workflow is intentionally started.

---

# EV-10 — Actor Context

Events MUST identify the effective actor where applicable.

Supported actor types:

```text
user
system
worker
integration
ai_agent
```

For delegated actions, the event SHOULD preserve both:

- effective actor;
- initiating principal.

AI-originated actions MUST be marked with `actor_type = ai_agent` even when a human later approves the command. Approval identity SHOULD be preserved separately in payload or audit evidence.

Sensitive credentials, session tokens, or authorization headers MUST NOT be included.

---

# EV-11 — Tenant and Location Scope

Tenant-scoped events MUST contain the authoritative `tenant_id` resolved by the backend.

The producer MUST NOT trust a tenant identifier supplied only by the client.

Location-scoped events MUST contain `location_id` when the domain fact belongs to a location.

Before publication, the producer MUST verify:

- aggregate tenant ownership;
- location ownership under the tenant;
- actor authorization context;
- LOCK-59 scope consistency where applicable.

A consumer MUST validate event scope before mutation.

Cross-tenant projection or mutation from one event is prohibited.

---

# EV-12 — Payload Rules

The payload MUST contain the minimum data necessary for the declared fact and approved consumers.

Payloads SHOULD prefer stable identifiers and immutable snapshots over display labels.

Payloads MUST NOT contain:

- database credentials;
- authentication tokens;
- secrets;
- raw payment card data;
- unnecessary personal data;
- unrestricted medical or wellness notes;
- internal exception stack traces.

Display names MAY be included only where an approved consumer requires an immutable historical snapshot.

Consumers MUST treat absent optional fields differently from explicit `null` when the contract defines that distinction.

---

# EV-13 — Data Classification

Every event MUST declare one data classification:

```text
public_reference
operational
pii_restricted
financial_restricted
security_restricted
```

The classification MUST govern:

- transport destination;
- retention;
- logging;
- consumer authorization;
- replay access;
- projection eligibility.

`pii_restricted`, `financial_restricted`, and `security_restricted` events MUST NOT be forwarded to general analytics or AI consumers without an approved minimization or redaction contract.

---

# EV-14 — Serialization

JSON is the default interoperable representation for v0.9-RC2.

Serialization MUST be deterministic for fingerprinting and contract testing.

Canonical serialization MUST define:

- UTF-8 encoding;
- stable property names;
- stable numeric representation;
- explicit UTC timestamp formatting;
- treatment of missing versus `null` fields;
- deterministic object-key ordering when hashing.

Consumers MUST NOT rely on JSON property order during normal parsing.

---

# EV-15 — Event Immutability

A durably recorded event MUST NOT be updated in place.

Incorrect facts MUST be corrected using a new event such as:

- `booking.corrected`;
- `payment.reversed`;
- `commission.reversed`;
- `projection.reconciled`.

A correcting event SHOULD reference the original `event_id` in its payload or dedicated correction metadata.

Deleting or overwriting event history to hide an error is prohibited.

---

# EV-16 — Delivery Semantics

Santis OS assumes **at-least-once delivery**.

Therefore:

- consumers MUST be idempotent;
- duplicate delivery MUST be safe;
- event identity MUST be used for consumer deduplication;
- an acknowledgement MUST occur only after the consumer's durable effect is committed;
- delivery failure MUST NOT mutate canonical producer state.

Exactly-once delivery MUST NOT be claimed unless formally proven for the complete producer, transport, and consumer chain.

---

# EV-17 — Consumer Processing Record

State-changing consumers MUST maintain durable processing evidence containing at least:

```text
consumer_name
event_id
event_type
schema_version
processing_status
attempt_count
first_seen_at
last_attempt_at
completed_at
error_code
trace_id
```

A uniqueness constraint SHOULD protect `(consumer_name, event_id)`.

The consumer MUST commit its business effect and processing record atomically where they share one database.

---

# EV-18 — Replay

Replay MUST originate from durable event evidence.

Replay MUST preserve:

- original `event_id`;
- original `occurred_at`;
- original aggregate version;
- original tenant and location scope;
- original payload and schema version.

Replay infrastructure MAY add transport metadata outside the canonical event envelope, but MUST NOT alter the historical fact.

Replay access MUST be authorized and audited.

Financial and security-restricted event replays SHOULD require explicit approval.

---

# EV-19 — Upcasting

Consumers MAY upcast an older event schema into an internal current representation.

An upcaster MUST:

- be deterministic;
- preserve original meaning;
- preserve the original envelope;
- not invent unavailable business facts;
- be covered by contract tests.

Upcasting MUST NOT rewrite the historical stored event.

---

# EV-20 — Unknown Events and Versions

A consumer receiving an unsupported event type or schema version MUST NOT guess.

The consumer MUST choose one documented behavior:

- safely ignore an event declared irrelevant;
- quarantine the event;
- stop the affected ordered stream;
- raise an operational alert.

A state-changing consumer MUST NOT process an unsupported schema partially.

---

# EV-21 — Error Codes

Envelope and contract validation SHOULD use stable codes including:

```text
EVENT_ENVELOPE_INVALID
EVENT_ID_MISSING
EVENT_TYPE_INVALID
EVENT_SCHEMA_UNSUPPORTED
EVENT_AGGREGATE_VERSION_GAP
EVENT_SCOPE_MISSING
EVENT_SCOPE_MISMATCH
EVENT_TENANT_MISMATCH
EVENT_LOCATION_MISMATCH
EVENT_PAYLOAD_INVALID
EVENT_DATA_CLASSIFICATION_VIOLATION
EVENT_DUPLICATE
EVENT_REPLAY_UNAUTHORIZED
EVENT_CAUSAL_CHAIN_INVALID
```

Human-readable messages MAY change. Stable error codes MUST remain contract-compatible.

---

# EV-22 — Contract Registry

Every production event type MUST have a registered contract containing:

- owner bounded context;
- event type;
- supported schema versions;
- payload schema;
- data classification;
- permitted consumers;
- ordering requirements;
- retention requirements;
- compatibility policy;
- sample fixtures;
- contract tests;
- deprecation status.

An unregistered event MUST NOT be promoted to production.

---

# EV-23 — Testing Requirements

The event envelope test suite MUST include:

1. required-field validation;
2. invalid event-name rejection;
3. unsupported schema rejection;
4. duplicate delivery handling;
5. aggregate version-gap handling;
6. tenant mismatch rejection;
7. location mismatch rejection;
8. missing correlation identity behavior;
9. deterministic serialization test;
10. PII/data-classification enforcement;
11. replay identity preservation;
12. upcaster determinism;
13. unknown-field backward compatibility;
14. `null` versus missing-field semantics;
15. consumer crash before and after durable commit.

Tests MUST use immutable fixtures committed to the repository.

---

# EV-24 — Acceptance Evidence

Production acceptance requires evidence of:

- contract registry entry;
- JSON schema or equivalent machine-readable schema;
- producer contract tests;
- consumer contract tests;
- duplicate-delivery safety;
- ordered-stream gap detection;
- tenant/location negative tests;
- replay tests;
- data-minimization review;
- observability dashboard or equivalent metrics;
- approved owner and reviewer.

Documentation alone is insufficient for production approval.

---

# Prohibited Patterns

The following patterns are prohibited:

- event types that describe commands rather than facts;
- mutable event history;
- new `event_id` values for transport retries;
- tenant identity derived from display text;
- event payloads containing secrets;
- consumers mutating foreign canonical state through direct SQL;
- reliance on global ordering;
- silent processing of unsupported schemas;
- dual publication without a migration and sunset plan;
- analytics or AI access to restricted payloads without an approved contract.

---

# Initial Event Catalogue

The following event types are initial candidates and remain subject to their owning context contracts:

| Event Type | Owner | Consistency |
|---|---|---|
| `booking.created` | Booking | Strong producer transaction |
| `booking.confirmed` | Booking | Strong producer transaction |
| `booking.cancelled` | Booking | Strong producer transaction |
| `availability.resources_reserved` | Availability | Strong producer transaction |
| `availability.resources_released` | Availability | Strong producer transaction |
| `payment.recorded` | Payments | Strong producer transaction |
| `payment.refunded` | Payments | Strong producer transaction |
| `package.entitlement_consumed` | Package | Strong producer transaction |
| `commission.accrued` | Commission | Policy-dependent |
| `notification.delivered` | Notifications | Eventual |
| `projection.reconciliation_failed` | Projection/Governance | Eventual |

Catalogue inclusion does not constitute production approval.

---

# Current Architecture Status

| Capability | Status |
|---|---|
| Canonical envelope | Normative Design |
| Event type catalogue | Draft |
| Machine-readable schemas | Not yet approved |
| Transactional outbox | Normative Design |
| Consumer deduplication | Acceptance Pending |
| Replay governance | Normative Design |
| Production event authority | Not Approved |

---

# Production Gate

Event publication MUST NOT be considered production-approved until:

- the owning bounded context is identified;
- the event contract is registered;
- the schema is machine-validated;
- producer and consumer contract tests pass;
- consumer idempotency is demonstrated;
- tenant/location isolation tests pass;
- replay and version-gap behavior are proven;
- restricted-data review is approved;
- operational metrics and alerts exist;
- architecture and security reviewers approve the evidence.

---

# Summary

The Santis OS event envelope provides a stable, tenant-aware, versioned, ordered, auditable, and replay-safe contract around domain facts.

Events MUST remain immutable facts. Delivery MAY repeat. Consumers MUST therefore be idempotent, scope-aware, schema-aware, and capable of detecting ordering gaps without guessing.

This document defines a normative design only and grants no production authority.

---

End of Document
