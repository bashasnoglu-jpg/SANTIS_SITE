# Module Communication Contract

**Document:** Santis OS Architecture Book  
**Volume:** 2 – Technical Architecture  
**Version:** 0.9-RC2  
**Status:** Normative Draft  
**Production Authority:** No

---

# Purpose

This document defines how bounded contexts and application modules communicate inside Santis OS.

The objective is to preserve canonical ownership, transaction integrity, tenant isolation, observability and future extractability without introducing premature distributed-system complexity.

---

# Core Rule

Modules MUST NOT communicate by directly reading or mutating another module's private tables.

Cross-module collaboration MUST use one of the following published mechanisms:

1. synchronous command interface,
2. synchronous query interface,
3. asynchronous domain or integration event.

The selected mechanism MUST match the required consistency and failure semantics.

---

# MC-01 — Canonical Ownership

Every canonical entity MUST have exactly one owning bounded context.

Only the owning context MAY:

- mutate the entity,
- enforce its lifecycle state machine,
- publish authoritative lifecycle events,
- define its canonical schema,
- approve repair or recovery operations.

A consuming module MUST NOT bypass the owner through SQL, ORM relations, database triggers, shared repositories or projection tables.

---

# MC-02 — Published Application Interfaces

Every synchronous cross-module interaction MUST use an explicitly published application interface.

A published interface MUST define:

- operation name,
- owner module,
- request and response contracts,
- authorization requirements,
- tenant and location scope,
- transaction semantics,
- timeout budget,
- stable error codes,
- retry ownership,
- idempotency requirements,
- versioning policy.

Internal persistence models MUST NOT leak through published interfaces.

---

# Communication Modes

## Synchronous Command

A synchronous command expresses an intention to change state and requires an immediate authoritative result.

It MUST be used when the caller cannot safely commit without the result or when a shared business invariant requires strong consistency.

Examples:

```text
Booking -> Availability.reserveResources(...)
Payments -> Accounting.postJournal(...)
```

Externally retriable commands MUST be idempotent.

## Synchronous Query

A synchronous query retrieves authoritative information without changing canonical business state.

Examples:

```text
Booking -> Identity.getAuthorizedContext(...)
Booking -> Catalog.getServiceDefinition(...)
```

A synchronous query MUST be side-effect free, tenant-scoped and contract-versioned.

## Asynchronous Event

An event describes a fact that has already committed.

Examples:

```text
booking.confirmed -> Notifications
booking.confirmed -> CRM
booking.confirmed -> Analytics
```

Events MUST NOT be used to request permission for a strong-consistency operation.

Events MUST comply with `07-event-envelope.md` and be persisted through the transactional outbox where required.

---

# Module Communication Matrix

The following matrix is normative for the initial modular-monolith architecture.

| From | To | Type | Consistency | Allowed | Contract / Note |
|---|---|---|---|---|---|
| Booking | Identity | Query | Strong | Yes | Resolve trusted actor, tenant and location context |
| Booking | Availability | Command | Strong | Yes | `reserveResources()` / `releaseResources()` |
| Booking | Catalog | Query | Strong | Yes | Resolve service duration and resource requirements |
| Booking | Notifications | Event | Eventual | Yes | `booking.confirmed`, `booking.cancelled` |
| Booking | CRM | Event | Eventual | Yes | Guest timeline projection |
| Booking | Analytics | Event | Eventual | Yes | Operational read models |
| Booking | Airtable Projection | Event | Eventual | Yes | Non-authoritative projection only |
| Payments | Booking | Query | Strong | Yes | Validate canonical booking reference |
| Payments | Accounting | Command | Strong | Yes | Post balanced journal within approved boundary |
| Payments | Commission | Event | Eventual | Yes | `payment.recorded` where accounting policy permits |
| Availability | Booking | Direct table access | N/A | No | Published interface only |
| Notifications | Booking | Event response or command | Eventual | No | Delivery failure cannot mutate booking |
| Analytics | Any canonical module | Direct mutation | N/A | No | Read-model consumer only |
| AI Orchestration | Booking | Structured command | Strong at owner | Yes | Owner authorization and validation required |
| AI Orchestration | PostgreSQL | Direct SQL | N/A | No | Prohibited |
| React | Canonical database | Direct database access | N/A | No | Backend API only |
| Airtable | Canonical database | Direct mutation | N/A | No | Controlled command intake only |

Any additional interaction MUST be documented before implementation.

---

# Strong and Eventual Consistency Boundaries

Operations that jointly protect a business invariant MUST execute inside one defined strong-consistency boundary.

For canonical booking creation, the boundary MUST include, where applicable:

1. durable idempotency claim,
2. trusted authorization context,
3. LOCK-59 validation,
4. availability/resource claim,
5. booking canonical insert,
6. audit evidence,
7. outbox insert.

If any required step fails, the transaction MUST roll back.

Projection, notification, analytics and non-authoritative CRM enrichment MAY be eventually consistent.

A failed eventual consumer MUST NOT repair or mutate canonical state automatically.

---

# Normative Interaction Sequences

## CreateBooking

```text
React / Reception UI
  -> Backend API
  -> Authenticate actor
  -> Identity authorization query
  -> Begin PostgreSQL transaction
  -> Create or resolve idempotency claim
  -> LOCK-59 tenant/location validation
  -> Availability.reserveResources()
  -> Insert canonical booking
  -> Insert audit evidence
  -> Insert outbox event
  -> COMMIT
  -> Outbox worker publishes booking.created / booking.confirmed
  -> CRM, Notifications, Analytics and Airtable projections consume
```

A notification or projection failure MUST NOT roll back the committed booking.

## RecordPayment

```text
Reception UI / Payment Adapter
  -> Backend API
  -> Authenticate and authorize
  -> Begin transaction
  -> Resolve durable idempotency claim
  -> Validate canonical booking reference
  -> Record payment attempt/result
  -> Post required accounting entries through published interface
  -> Insert audit evidence
  -> Insert outbox event payment.recorded
  -> COMMIT
  -> Commission, CRM, Analytics and projection consumers process event
```

Provider calls MUST follow an approved payment workflow and MUST NOT create ambiguous partial financial state.

## BookingCancellation

```text
Reception UI
  -> Booking.CancelBookingCommand
  -> Authenticate and authorize
  -> Begin transaction
  -> Lock booking aggregate/version
  -> Validate cancellation policy
  -> Availability.releaseResources()
  -> Transition booking state
  -> Insert reversal/audit evidence where required
  -> Insert outbox event booking.cancelled
  -> COMMIT
  -> Notifications, CRM, Analytics and projections consume
```

## ProjectionUpdate

```text
Committed domain event
  -> Transactional outbox
  -> Publisher
  -> Projection consumer
  -> Validate event envelope and scope
  -> Check consumer idempotency
  -> Apply projection update
  -> Record source version and projected_at
  -> Mark reconciliation status
```

Projection processing MUST NOT call back into a canonical module to silently repair source state.

---

# Forbidden Communication Matrix

| Interaction | Status | Reason |
|---|---|---|
| Booking -> direct `payments` table mutation | Forbidden | Violates Payments ownership |
| Payments -> direct booking lifecycle update | Forbidden | Violates Booking ownership |
| React -> canonical PostgreSQL | Forbidden | Bypasses backend policy and audit |
| AI -> PostgreSQL or arbitrary SQL | Forbidden | Violates zero-trust tool boundary |
| Airtable automation -> canonical insert/update | Forbidden | Airtable is intake/projection/governance only |
| Projection -> canonical repair | Forbidden | Projection is non-authoritative |
| Notification -> booking update | Forbidden | Delivery status does not own booking lifecycle |
| Analytics -> operational mutation | Forbidden | Read-model context only |
| Database trigger -> foreign bounded-context mutation | Forbidden | Hidden coupling and ownership violation |
| Shared global repository -> multi-domain writes | Forbidden | Creates unbounded mutation authority |

Architecture tests SHOULD detect prohibited imports and dependency-direction violations.

---

# Initial Timeout Budget

The following values are **Initial Engineering Targets**, not production-proven SLOs.

| Interaction | Initial target | Hard rule |
|---|---:|---|
| Identity authorization query | <= 100 ms P95 | MUST fail closed on timeout |
| Catalog authoritative query | <= 100 ms P95 | MUST NOT infer missing service data |
| Availability command | <= 250 ms P95 | MUST return deterministic conflict or timeout |
| Booking command end-to-end | <= 750 ms P95 | Excludes asynchronous projections |
| Payment command excluding external customer interaction | <= 1,000 ms P95 | Financial integrity takes priority |
| Policy evaluation | <= 50 ms P95 | Timeout denies protected action |
| Airtable projection | <= 30 seconds P95 | Canonical success remains valid |
| Analytics projection | <= 60 seconds P95 | Lag MUST be observable |

Timeouts MUST be configurable, observable and shorter than the caller's total deadline.

No module MAY wait indefinitely for a lock, dependency, queue response or policy decision.

---

# Error Ownership Matrix

The module that owns the rejected invariant MUST own the stable error code.

| Error code | Owner module | Retryable | Required behaviour |
|---|---|---:|---|
| `AUTHENTICATION_REQUIRED` | Identity | No | Reject |
| `AUTHORIZATION_DENIED` | Identity / protected owner | No | Fail closed and audit where required |
| `TENANT_SCOPE_MISMATCH` | Protected owner / LOCK-59 | No | Zero mutation |
| `LOCATION_SCOPE_MISMATCH` | Protected owner / LOCK-59 | No | Zero mutation |
| `RESOURCE_UNAVAILABLE` | Availability | No unless new user intent | Return deterministic conflict |
| `RESOURCE_CLAIM_TIMEOUT` | Availability | Conditionally | Backend-owned bounded retry only |
| `IDEMPOTENCY_CONFLICT` | Command owner / idempotency subsystem | No | Reject and preserve evidence |
| `COMMAND_IN_PROGRESS` | Command owner | Conditionally | Poll or bounded retry using same key |
| `PAYMENT_DECLINED` | Payments | No automatic retry | Require explicit policy/user action |
| `PROJECTION_LAG` | Projection owner | Yes | Worker retry/replay; canonical state unchanged |
| `OUTBOX_BACKLOG` | Platform/outbox owner | Yes | Alert and drain safely |
| `INTERNAL_INTEGRITY_FAILURE` | Owning module | No blind retry | Roll back, alert and preserve evidence |

A caller MUST NOT replace an owner error with a misleading generic success or local guess.

---

# Retry Ownership

Retry responsibility MUST be explicit.

| Failure | Retry owner | Rule |
|---|---|---|
| User-facing command request lost before response | Client MAY resubmit | MUST reuse the same idempotency key |
| Identity query transient timeout | Backend command handler | At most bounded retry within request deadline; otherwise fail closed |
| Availability transient lock/serialization failure | Backend command handler | Bounded retry with same command identity; business conflict is not retryable |
| PostgreSQL transaction serialization failure | Application transaction coordinator | Bounded retry of the whole transaction, not individual writes |
| Outbox publish failure | Outbox worker | Bounded backoff; event remains durable |
| Projection consumer failure | Consumer worker | Idempotent retry or controlled replay |
| Notification provider failure | Notification worker | Provider-specific bounded retry/dead-letter |
| Payment provider uncertainty | Payments workflow | MUST reconcile provider evidence; MUST NOT blindly charge again |
| Authorization denial or LOCK-59 mismatch | Nobody | MUST NOT retry automatically |

React MUST NOT coordinate retries across multiple canonical modules.

Workers MUST NOT invent a new idempotency identity during retry or replay.

---

# Transaction Boundary

## MUST occur inside the canonical transaction where applicable

- durable idempotency claim creation or resolution,
- trusted transaction context setup,
- owner-side authorization needed to protect the mutation,
- LOCK-59 scope validation,
- availability/resource claim,
- canonical aggregate mutation,
- concurrency/version check,
- required audit evidence,
- transactional outbox insert.

## MUST NOT occur inside the canonical database transaction

- email delivery,
- SMS delivery,
- WhatsApp delivery,
- push notification delivery,
- Airtable projection write,
- analytics aggregation,
- long-running AI inference,
- uncontrolled external webhook delivery,
- non-transactional reporting refresh.

External payment-provider interaction requires a dedicated approved workflow; it MUST NOT be hidden inside a long-lived transaction holding operational locks.

A participating in-process module MUST NOT independently commit or publish before the parent transaction commits.

---

# Failure Propagation

Strong-consistency dependency failure MUST fail closed and roll back the parent transaction.

Eventual-consistency consumer failure MAY enter retry, replay or dead-letter handling without invalidating the producer's committed canonical transaction.

API responses SHOULD distinguish:

- canonical command result,
- asynchronous delivery state,
- projection state where operationally relevant.

---

# Tenant, Location and Authorization Scope

Every cross-module request MUST carry or derive trusted actor, tenant and location context.

The owning module MUST re-enforce authorization for its protected action or resource.

A prior caller-side authorization check MAY optimize the path but MUST NOT replace owner-side enforcement.

Automation, background workers and AI orchestration MUST use the same published policy path as human-originated operations.

---

# Observability

Every interaction MUST preserve:

- `trace_id`,
- `correlation_id`,
- `causation_id` or parent span,
- owner module,
- stable result/error code,
- tenant scope where safe.

Metrics SHOULD include latency, timeout count, retry count, errors by code, projection lag, outbox backlog and dead-letter count.

Logs MUST minimize PII.

---

# Versioning and Contract Tests

Published command, query and event contracts MUST be versioned.

Breaking changes REQUIRE a new contract version, migration plan, compatibility review, contract tests, sunset date and architecture approval.

Every published interface MUST have tests for:

- valid request and response,
- invalid input,
- unauthorized actor,
- wrong tenant and location,
- timeout behaviour,
- retry classification,
- idempotent replay where applicable,
- stable error ownership,
- version compatibility,
- trace propagation,
- absence of foreign-table mutation.

---

# Airtable and AI Boundaries

Airtable is an external projection, controlled command-intake and governance adapter. It MUST NOT become canonical authority or mutate PostgreSQL directly.

AI Orchestration MAY use approved query interfaces and submit structured commands within granted scope. It MUST NOT execute SQL, access private tables or bypass human approval requirements.

---

# Related ADRs

This contract is governed by and MUST remain consistent with:

- `ADR-001-modular-monolith-first.md`
- `ADR-002-postgresql-canonical-authority.md`
- `ADR-003-airtable-projection-governance.md`
- `ADR-004-durable-postgresql-idempotency.md`
- `ADR-005-transactional-outbox.md`
- `ADR-006-lock59-defense-in-depth.md`
- `ADR-010-no-direct-ai-database-access.md`

Where an ADR and this contract conflict, the conflict MUST be resolved through architecture review rather than silent implementation divergence.

---

# Production Acceptance Gate

A communication path MUST NOT be marked `PRODUCTION APPROVED` until:

- owner and consumer are documented,
- communication mode and consistency model are selected,
- transaction boundary is explicit,
- timeout and retry ownership are defined,
- error ownership is defined,
- tenant/location scope is enforced,
- tracing is verified,
- contract and failure tests pass,
- recovery behaviour is demonstrated,
- no direct foreign-table mutation exists.

Documentation approval alone does not grant production authority.

---

# Current Architecture Status

| Capability | Status |
|---|---|
| Bounded-context ownership | Normative Design |
| Communication matrix | Normative Design |
| Sequence contracts | Normative Design |
| Timeout budgets | Initial Engineering Targets |
| Error/retry ownership | Normative Design |
| Cross-module contract test suite | Acceptance Pending |
| Production approval | Not Approved |

---

# Summary

Santis OS modules collaborate through explicit application contracts rather than shared mutable persistence.

Strong-consistency decisions use bounded synchronous interfaces and atomic transactions. Committed facts use asynchronous events and rebuildable projections.

Every interaction MUST preserve canonical ownership, tenant isolation, deterministic failure behaviour, explicit retry ownership, observability and future module extractability.

---

End of Document
