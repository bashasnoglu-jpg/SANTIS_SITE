# Module Communication Contract

**Document:** Santis OS Architecture Book  
**Volume:** 2 – Technical Architecture  
**Version:** 0.9-RC2  
**Status:** Normative Draft  
**Production Authority:** No

---

# Purpose

This document defines how bounded contexts and application modules communicate inside Santis OS.

The objective is to preserve module ownership, transaction integrity, tenant isolation, observability and future extractability without introducing premature distributed-system complexity.

This contract applies to:

- in-process module calls,
- synchronous application commands,
- synchronous queries,
- domain and integration events,
- background workers,
- projections,
- external adapters,
- AI-originated operations.

---

# Core Rule

Modules MUST NOT communicate by directly reading or mutating another module's private tables.

Cross-module collaboration MUST use one of the following published mechanisms:

1. synchronous command interface,
2. synchronous query interface,
3. asynchronous event.

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

A consuming module MUST NOT bypass the owner through SQL, ORM relations, database triggers or shared repository classes.

---

# MC-02 — Published Application Interfaces

Every cross-module synchronous interaction MUST use an explicitly published application interface.

A published interface MUST define:

- operation name,
- owner module,
- request contract,
- response contract,
- authorization requirements,
- tenant and location scope,
- transaction semantics,
- timeout budget,
- stable error codes,
- idempotency requirements,
- versioning policy.

Internal implementation types MUST NOT leak through the published interface.

---

# Communication Modes

## 1. Synchronous Command

A synchronous command expresses an intention to change state and requires an immediate authoritative result.

Examples:

```text
Booking
→ Availability.reserveResources(...)
```

```text
Payments
→ Accounting.postJournal(...)
```

A synchronous command MUST be used when:

- the caller cannot safely commit without the result,
- strong consistency is required,
- failure must abort the parent transaction or workflow,
- a resource claim or authorization decision is a prerequisite.

Externally retriable commands MUST be idempotent.

A synchronous command MUST NOT be disguised as a query.

---

## 2. Synchronous Query

A synchronous query retrieves authoritative information without changing canonical state.

Examples:

```text
Booking
→ Identity.getAuthorizedContext(...)
```

```text
Booking
→ Catalog.getServiceDefinition(...)
```

A synchronous query MUST:

- be side-effect free,
- declare its consistency level,
- enforce tenant and location scope,
- expose only the minimum required data,
- avoid returning another module's internal persistence model.

A query MUST NOT write audit, cache or operational state in a way that changes business behaviour, except for non-authoritative telemetry.

---

## 3. Asynchronous Event

An event describes a fact that has already occurred and committed.

Examples:

```text
BookingConfirmed
→ Notifications
→ CRM
→ Analytics
```

An asynchronous event SHOULD be used when:

- the producer has already completed its authoritative transaction,
- consumers may update projections independently,
- temporary consumer failure must not roll back the producer,
- eventual consistency is acceptable.

Events MUST NOT be used to ask another module for permission before committing a strong-consistency operation.

Events MUST comply with `07-event-envelope.md` and MUST be persisted using the transactional outbox where required.

---

# MC-03 — Strong Consistency Boundary

Operations that jointly protect a business invariant MUST execute inside one defined strong-consistency boundary.

For canonical booking creation, the boundary SHOULD include:

1. idempotency claim,
2. authorization and LOCK-59 validation,
3. availability/resource claim,
4. booking creation,
5. audit evidence,
6. outbox event creation.

If any required step fails, the transaction MUST roll back.

A module MUST NOT publish a success event before the authoritative transaction commits.

---

# MC-04 — Eventual Consistency Boundary

Projection, notification, analytics and non-authoritative CRM enrichment MAY be eventually consistent.

An eventually consistent consumer MUST:

- process events idempotently,
- tolerate duplicate delivery,
- detect version gaps where ordering matters,
- preserve failure evidence,
- support controlled replay,
- expose projection lag metrics.

A failed projection MUST NOT alter or repair canonical state automatically.

---

# MC-05 — No Shared Mutable Model

Modules MUST NOT share mutable domain entities.

The following patterns are prohibited:

- importing another module's ORM model for mutation,
- a global repository that writes all domains,
- shared tables with multiple business owners,
- database triggers that mutate a foreign bounded context,
- direct cross-context `UPDATE`, `INSERT` or `DELETE`,
- frontend code that coordinates canonical writes across modules.

Shared immutable primitives and value contracts MAY be used when ownership is unambiguous.

Examples include:

- UUID types,
- money value objects,
- time interval value objects,
- event envelope definitions,
- error envelope definitions.

---

# MC-06 — Transaction Participation

A module MAY participate in another module's database transaction only through an approved in-process application interface.

Transaction participation MUST be explicit.

The callee MUST NOT:

- commit independently,
- begin an unrelated nested transaction,
- publish an event before parent commit,
- hide irreversible external side effects inside the transaction.

External network calls SHOULD NOT occur while holding database locks unless an approved ADR documents the reason, timeout and recovery design.

---

# MC-07 — External Side Effects

External effects such as email, SMS, payment-provider calls or Airtable projection writes MUST NOT be treated as part of the PostgreSQL atomic commit unless the external system supports an explicitly approved atomic protocol.

The preferred pattern is:

```text
Canonical transaction
→ Outbox event
→ Worker/adapter
→ External system
```

The adapter MUST be idempotent or maintain durable delivery evidence.

---

# MC-08 — Timeouts

Every synchronous cross-module call MUST have a bounded timeout budget.

Timeouts MUST be shorter than the caller's total request deadline.

A module MUST NOT wait indefinitely for:

- another module,
- a database lock,
- an external API,
- a queue response,
- a policy engine.

Timeout values MUST be observable and configurable through approved runtime configuration.

Timeout expiry MUST return a stable error code and MUST NOT produce ambiguous partial success.

---

# MC-09 — Retry Policy

Blind retries are prohibited.

A retry MAY occur only when:

- the failure is classified as transient,
- the operation is idempotent or read-only,
- the same idempotency identity is preserved,
- retry count is bounded,
- backoff and jitter are applied where appropriate,
- the remaining deadline permits another attempt.

Business rejections such as authorization failure, branch mismatch or resource conflict MUST NOT be retried automatically.

---

# MC-10 — Failure Propagation

Failure propagation MUST match the consistency requirement.

## Strong-consistency dependency failure

The caller MUST fail closed and roll back.

Examples:

- authorization unavailable,
- LOCK-59 validation unavailable,
- availability claim failure,
- canonical database write failure.

## Eventual-consistency dependency failure

The producer MAY complete successfully while the failed consumer enters retry, replay or dead-letter handling.

Examples:

- notification unavailable,
- analytics projection unavailable,
- Airtable projection delayed.

The API response MUST distinguish canonical success from downstream projection or delivery status where relevant.

---

# MC-11 — Error Contract

Cross-module errors MUST use stable machine-readable codes.

An error response SHOULD include:

```text
error_code
error_class
retryable
owner_module
trace_id
causation_id
safe_message
```

Sensitive internal details MUST NOT be exposed to untrusted clients.

Stack traces, SQL text and credentials MUST NOT cross the application boundary.

---

# Standard Error Classes

| Error class | Meaning | Default behaviour |
|---|---|---|
| `VALIDATION` | Invalid command or query input | Reject |
| `AUTHENTICATION` | Identity not proven | Fail closed |
| `AUTHORIZATION` | Action not permitted | Fail closed |
| `TENANT_SCOPE` | Tenant/location mismatch | Fail closed and audit |
| `CONFLICT` | Concurrent or resource conflict | Return deterministic conflict |
| `IDEMPOTENCY` | Replay or payload conflict | Replay or reject |
| `DEPENDENCY_TRANSIENT` | Temporary dependency failure | Bounded retry where permitted |
| `DEPENDENCY_PERMANENT` | Unsupported or permanently failed dependency | Reject or dead-letter |
| `INTERNAL_INTEGRITY` | Invariant or persistence failure | Roll back and alert |

---

# MC-12 — Tenant and Location Scope

Every cross-module request MUST carry or derive trusted tenant scope.

The callee MUST NOT trust a client-supplied tenant or location identifier without authorization context.

The callee MUST validate:

- actor identity,
- tenant membership,
- allowed location scope,
- resource ownership,
- environment boundary where applicable.

Cross-tenant results MUST NEVER be returned, even when the caller already filtered its own request.

---

# MC-13 — Authorization

Authorization MUST be evaluated at the module that owns the protected action or resource.

A caller's prior authorization check MAY reduce duplicate work but MUST NOT replace the owner's enforcement.

Automation, workers and AI orchestration MUST use the same published authorization path as human-originated commands.

---

# MC-14 — Observability

Every cross-module interaction MUST preserve trace continuity.

Synchronous interactions MUST propagate:

- `trace_id`,
- `correlation_id`,
- `causation_id` or parent span,
- actor and tenant context where safe.

Asynchronous events MUST use the identifiers defined by the Event Envelope Contract.

Metrics SHOULD include:

- call count,
- latency,
- timeout count,
- error count by stable code,
- retry count,
- event processing lag,
- dead-letter count.

Logs MUST identify the owner module without exposing unnecessary PII.

---

# MC-15 — Versioning

Published command, query and event contracts MUST be versioned.

Backward-compatible changes MAY add optional fields.

Breaking changes REQUIRE:

- a new contract version,
- migration plan,
- consumer compatibility review,
- contract tests,
- defined deprecation and sunset dates,
- architecture approval.

Internal refactoring that does not change the published contract does not require a new external version.

---

# MC-16 — Query Models and Projections

UI and reporting clients SHOULD read from purpose-built query models rather than joining private canonical tables across modules.

A projection MAY combine facts from multiple bounded contexts, but it MUST remain non-authoritative.

Projection writers MUST NOT mutate source contexts.

Projection records SHOULD include:

- source identifiers,
- source versions,
- projected timestamp,
- projection contract version,
- reconciliation status.

---

# MC-17 — Airtable Communication Boundary

Airtable SHALL be treated as an external projection and governance adapter during the target architecture phase.

Airtable automation MUST NOT:

- mutate PostgreSQL canonical tables directly,
- bypass application commands,
- invent missing tenant/location context,
- repair canonical state,
- become the authority for booking, payment or availability decisions.

Inbound Airtable requests MUST enter through controlled request/command interfaces.

Outbound Airtable updates MUST be projection operations derived from canonical evidence.

---

# MC-18 — AI Orchestration Boundary

AI Orchestration MUST NOT access private module tables or execute SQL.

AI MAY:

- call approved query interfaces,
- generate structured command proposals,
- submit commands within granted scope,
- request human approval for high-risk actions.

AI-originated commands MUST carry actor type, agent identity, trace information and approval evidence where required.

The owning module MUST perform final authorization and domain validation.

---

# Approved Interaction Examples

## Booking creation

```text
Reception UI
→ Booking.CreateBookingCommand
→ Identity authorization query
→ Availability resource command
→ Booking canonical mutation
→ Outbox: booking.created
→ CRM / Notifications / Analytics / Airtable projection
```

## Payment recording

```text
Reception UI or payment adapter
→ Payments.RecordPaymentCommand
→ Booking reference query
→ Payment canonical mutation
→ Accounting posting interface
→ Outbox: payment.recorded
→ Reporting / CRM projection
```

## Booking cancellation

```text
Booking.CancelBookingCommand
→ Booking state transition
→ Availability.releaseResources(...)
→ Outbox: booking.cancelled
→ Notification / CRM / Analytics consumers
```

---

# Prohibited Interaction Examples

The following are prohibited:

```text
Booking repository
→ UPDATE payments
```

```text
Airtable automation
→ direct INSERT into bookings
```

```text
React component
→ create booking + reserve room + record payment through independent writes
```

```text
Analytics worker
→ repair canonical payment state
```

```text
AI agent
→ execute arbitrary SQL
```

---

# Contract Testing

Every published module interface MUST have contract tests covering:

- valid request and response,
- invalid input,
- unauthorized actor,
- wrong tenant,
- wrong location,
- timeout behaviour,
- retry classification,
- idempotent replay where applicable,
- version compatibility,
- stable error codes,
- trace propagation.

Cross-module integration tests MUST verify that private table access is not required.

Architecture tests SHOULD detect forbidden imports and dependency direction violations.

---

# Production Acceptance Gate

A module communication path MUST NOT be marked `PRODUCTION APPROVED` until:

- owner and consumer are documented,
- the communication mode is explicitly selected,
- the consistency model is documented,
- timeout and retry policies are defined,
- tenant/location scope is enforced,
- stable error codes exist,
- tracing is verified,
- contract tests pass,
- failure and recovery behaviour are demonstrated,
- no direct foreign-table mutation exists.

Documentation approval alone does not grant production authority.

---

# Current Architecture Status

| Capability | Status |
|---|---|
| Bounded context ownership model | Normative Design |
| Published synchronous interfaces | Partial / evolving |
| Domain event communication | Normative Design |
| Transactional outbox | Normative Design |
| Cross-module contract test suite | Not yet fully evidenced |
| Production approval | Not Approved |

---

# Summary

Santis OS modules collaborate through explicit contracts rather than shared mutable persistence.

Strong-consistency decisions use bounded synchronous interfaces and atomic transactions. Completed facts use asynchronous events and rebuildable projections.

Every interaction MUST preserve ownership, tenant isolation, deterministic failure behaviour, observability and future module extractability.

---

End of Document
