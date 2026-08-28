# Santis OS Engineering Principles

**Document:** Santis OS Architecture Book  
**Volume:** 1 – Architecture Principles  
**Version:** 0.9-RC2  
**Status:** Normative Draft

---

# Purpose

This document defines the normative engineering principles governing the design, implementation, testing, deployment, and operation of Santis OS.

Unless an approved Architecture Decision Record (ADR) explicitly supersedes a principle, every Santis OS component MUST comply with this document.

The terms MUST, MUST NOT, SHOULD, SHOULD NOT, and MAY are normative and are defined in Appendix A — Normative Language.

---

# Engineering Constitution

## EP-01 — Backend Authority

The backend is the authoritative decision-maker for operational and financial state.

Presentation layers MAY provide client-side validation, optimistic interaction, local form state, accessibility behavior, and user feedback, but MUST NOT become the source of business truth.

The backend MUST:

- validate commands;
- resolve authenticated actor context;
- enforce authorization;
- enforce domain invariants;
- establish transaction boundaries;
- persist canonical state;
- produce audit and trace evidence.

No UI, Airtable interface, automation, AI agent, integration adapter, or background worker MAY bypass the authoritative backend decision path for production mutations.

---

## EP-02 — Domain Before UI

Business capabilities MUST be modeled in the domain before a production user interface is treated as authoritative.

UI implementations MUST consume published application contracts.

UI components MUST NOT independently define or override:

- lifecycle transitions;
- authorization rules;
- financial policies;
- tenant or location ownership;
- availability decisions;
- canonical conflict decisions.

Client-side validation is a user-experience control only. Backend validation remains mandatory.

---

## EP-03 — Canonical State Authority

Canonical state is the authoritative operational record.

Read models, caches, search indexes, analytics models, Airtable projections, and interface-specific views MUST be treated as derived representations.

Derived representations MUST NOT override canonical state.

A projection MAY be deleted and rebuilt. Canonical state MAY only be changed through approved domain commands or recovered through controlled restoration procedures.

---

## EP-04 — Auditable State Changes

Every successful state-changing command MUST produce sufficient audit evidence to reconstruct:

- actor identity;
- actor type;
- command identity and command type;
- affected resource;
- tenant and location scope where applicable;
- authorization decision context;
- timestamp;
- trace identifier;
- result classification;
- resulting canonical resource identifier.

Rejected high-risk commands SHOULD also produce audit evidence sufficient to explain the rejection.

Audit evidence MUST NOT rely solely on UI logs, browser state, Airtable notification history, or third-party dashboards.

---

## EP-05 — Idempotent Externally Retriable Commands

Every command that can be retried by a client, network intermediary, worker, automation, integration, or operator MUST be idempotent.

Examples include:

- `CreateBookingCommand`;
- `RecordPaymentCommand`;
- `ConsumePackageEntitlementCommand`;
- `ReverseCommissionCommand`;
- `CreateProjectionCommand`.

The same idempotency identity with the same canonical payload fingerprint MUST return the original outcome without creating duplicate business effects.

The same idempotency identity with a different canonical payload fingerprint MUST fail with an idempotency conflict.

Internal aggregate state transitions MAY rely on optimistic concurrency, database constraints, or transaction isolation instead of an independent idempotency key.

---

## EP-06 — Concurrency Safety

Every state transition MUST be concurrency-safe.

Concurrent execution MUST NOT produce:

- duplicate canonical records;
- duplicate financial effects;
- duplicate entitlement consumption;
- overlapping exclusive resource claims;
- lost updates;
- partial commits.

Concurrency guarantees MAY be implemented through:

- optimistic concurrency;
- unique constraints;
- exclusion constraints;
- transactional locking;
- claim tables;
- serializable transactions;
- carefully scoped advisory locks.

Application-level checks without database enforcement MUST NOT be treated as sufficient where a database constraint can enforce the invariant.

---

## EP-07 — Tenant Isolation

Cross-tenant access MUST NEVER occur.

Tenant isolation MUST be enforced through multiple independent layers, including where applicable:

- authentication;
- tenant membership resolution;
- role or attribute-based authorization;
- application guards;
- tenant-scoped identifiers;
- composite foreign keys;
- database constraints;
- PostgreSQL Row-Level Security;
- audit monitoring;
- negative security tests.

Client-supplied tenant identifiers MUST NOT be trusted without server-side membership and authorization resolution.

A missing, ambiguous, stale, or contradictory tenant context MUST cause the operation to fail closed.

---

## EP-08 — Security Before Convenience

Developer convenience, operational speed, UI simplicity, and delivery pressure MUST NOT weaken security boundaries.

When security and convenience conflict, security takes precedence unless an approved and time-bounded governance exception explicitly documents:

- the risk;
- the scope;
- the compensating control;
- the owner;
- the expiry date;
- the approval authority.

Production credentials, privileged database roles, unrestricted Airtable tokens, and shared secrets MUST NOT be used for routine development or testing.

---

## EP-09 — Fail Closed and Never Guess

Authorization uncertainty MUST deny the operation.

Missing operational context MUST NOT be inferred.

Unknown ownership, unresolved cardinality, stale identity snapshots, missing financial context, ambiguous branch configuration, or contradictory canonical references MUST result in a controlled rejection or quarantine decision.

The platform MUST NOT silently select a tenant, location, resource, payment state, package, or actor identity based on display names or best-effort matching.

---

## EP-10 — Automation Respects Policy

Automation engines, scheduled jobs, integrations, migration scripts, projection workers, and AI tools MUST execute through the same authorization, validation, idempotency, and audit controls as human-initiated operations.

Automation MUST NOT bypass:

- authorization;
- domain validation;
- tenant isolation;
- canonical writer contracts;
- idempotency;
- audit logging;
- policy evaluation;
- production gates.

An automation being technically capable of writing a record does not grant it authority to do so.

---

## EP-11 — Layer Independence

Presentation, Application, Domain, and Infrastructure layers MUST have explicit responsibilities and dependency boundaries.

- Presentation MAY manage interaction and rendering.
- Application MUST orchestrate use cases and transaction boundaries.
- Domain MUST own business invariants and state-transition rules.
- Infrastructure MUST implement persistence, messaging, external services, and technical adapters.

Business rules MUST remain in the Domain layer or an explicitly approved domain policy component.

Infrastructure concerns MUST NOT leak into domain decisions.

---

## EP-12 — Module Ownership and Communication

Each canonical entity MUST have exactly one owning bounded context.

Modules MUST NOT directly mutate another module’s canonical tables.

Synchronous requirements MUST use published application interfaces.

Completed business facts SHOULD be shared through domain events and the transactional outbox.

A module MAY consume another module’s published projection, but MUST NOT treat that projection as authority for a foreign invariant unless the contract explicitly permits it.

---

## EP-13 — Observable Production Capabilities

Every production capability MUST expose sufficient operational telemetry to support:

- health monitoring;
- metrics;
- tracing;
- incident response;
- security investigation;
- reconciliation;
- post-incident review.

Critical paths MUST propagate a trace or correlation identity across commands, transactions, events, workers, projections, and external integrations.

A production capability without measurable health and failure signals MUST NOT be considered production-ready.

---

## EP-14 — Controlled Evolution

Breaking architectural, schema, event, command, or security changes MUST be versioned and governed.

Changes that alter a canonical invariant, authority boundary, tenant-isolation control, or financial policy MUST have an ADR or equivalent approved decision record.

Legacy fields, automations, interfaces, and integrations MUST be explicitly classified before retirement.

Silent replacement of an authority field or business rule is prohibited.

---

## EP-15 — Evidence Before Production Approval

A design, schema, implementation, or passing happy-path test does not constitute production approval.

Production approval MUST be based on recorded evidence appropriate to the risk, which MAY include:

- concurrency tests;
- negative isolation tests;
- fault injection;
- zero-partial-write proof;
- replay and conflict tests;
- restore tests;
- migration rehearsal;
- security review;
- operational runbook validation.

Production status MUST be explicitly recorded. It MUST NOT be inferred from code presence, merged pull requests, or successful development runs.

---

# Engineering Goals

These principles exist to ensure that Santis OS remains:

- secure;
- auditable;
- concurrency-safe;
- deterministic within a defined authorized state snapshot;
- multi-tenant safe;
- recoverable;
- observable;
- evolvable;
- operationally verifiable.

---

# Compliance

Architecture reviews, pull requests, ADRs, contracts, acceptance tests, and production gates SHOULD reference the applicable engineering principle identifiers.

A known violation MUST be recorded as one of the following:

- approved temporary exception;
- tracked technical debt;
- release blocker;
- security blocker;
- production incident.

---

End of Document
