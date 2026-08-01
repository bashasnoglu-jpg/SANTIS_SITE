# LOCK-59 Isolation Contract

**Document:** Santis OS Architecture Book  
**Volume:** 2 – Technical Architecture  
**Version:** 0.9-RC2  
**Status:** Normative Draft  
**Production Authority:** No  

---

# Purpose

This document defines the normative isolation contract known as **LOCK-59**.

LOCK-59 is the Santis OS security boundary for preventing unauthorized or ambiguous cross-tenant, cross-location, cross-environment and cross-resource operations.

LOCK-59 is not a user-interface filter and is not limited to therapist or room selectors. It is a defense-in-depth contract spanning identity, authorization, application guards, domain invariants, database constraints, PostgreSQL Row-Level Security (RLS), audit evidence and negative security testing.

No implementation SHALL be considered LOCK-59 compliant merely because records are hidden in an Airtable view, React selector or client-side filter.

---

# Scope

LOCK-59 applies to every tenant-scoped operational command and query, including but not limited to:

- booking creation and modification
- therapist assignment
- room assignment
- availability checks and resource claims
- payment and refund operations
- package and entitlement consumption
- commission processing
- inventory movements
- guest and CRM access
- operational exports
- automation and AI initiated actions

The first production acceptance target is the canonical booking creation path.

---

# Security Objective

LOCK-59 SHALL guarantee that an authorized actor can act only within the exact operational context approved for that actor and command.

The effective context consists of:

```text
Actor
+ Tenant
+ Location or approved scope
+ Production boundary
+ Action
+ Resource ownership
+ Domain state
```

An operation MUST be rejected when any required context element is missing, ambiguous, stale, unauthorized or inconsistent.

---

# Normative Principles

## L59-01 — Default Deny

Access MUST be denied unless all required authorization and ownership conditions are proven.

The absence of a policy, membership, scope or record relationship MUST NOT be interpreted as permission.

---

## L59-02 — Server-Side Authority

LOCK-59 decisions MUST be made by the backend and database security layers.

Client applications MAY reduce visible choices for usability, but client filtering MUST NOT be treated as a security control.

---

## L59-03 — Untrusted Client Context

Tenant, location, role, environment and ownership values supplied by a client MUST be treated as untrusted input.

The backend MUST resolve the authorized context from authenticated identity, membership records and approved server-side configuration.

A client-provided `tenant_id` MUST NOT independently determine the tenant context.

---

## L59-04 — Exact Identity

Authorization and ownership MUST use immutable identifiers.

Display names, labels, slugs and human-readable codes MAY be used for presentation or lookup initiation, but MUST NOT be the final identity proof.

Examples of authoritative identities include:

- tenant UUID
- location UUID
- actor UUID
- booking UUID
- therapist UUID
- room UUID
- branch configuration UUID

---

## L59-05 — Single Cardinality

Where a command requires exactly one tenant, location, branch configuration, therapist or room, the resolved relationship MUST have cardinality one.

Zero or multiple matches MUST result in a controlled failure.

The system MUST NOT select an arbitrary first match.

---

## L59-06 — No Raw Canonical Create

New canonical bookings MUST NOT be created through direct table writes, direct Airtable record creation, unrestricted SQL or client-side CRUD.

All new bookings MUST pass through the approved booking command and canonical writer path.

For the Airtable transition period, the approved path is:

```text
Booking_Create_Requests
→ Canonical Booking Writer
→ LOCK-59 validation
→ Canonical booking or controlled rejection
```

For the PostgreSQL target architecture, the approved path is:

```text
CreateBookingCommand
→ Authentication
→ Membership and authorization resolution
→ LOCK-59 application guard
→ Domain validation
→ Atomic resource claim and booking transaction
→ Audit and outbox evidence
```

---

## L59-07 — Environment Isolation

Production and non-production data SHOULD be physically separated.

The production PostgreSQL database MUST NOT contain test fixtures unless an approved exception exists and the records are technically isolated by a documented control.

During the Airtable transition, the `Environment` field MUST remain mandatory for operational and test records and MUST be included in guard decisions.

An environment mismatch MUST fail closed.

---

## L59-08 — Resource Ownership

A therapist, room, shift, service, package, payment, guest or other operational resource MUST belong to the authorized tenant and location scope required by the command.

A valid resource identifier from another tenant or location MUST still be rejected.

Object existence is not authorization.

---

## L59-09 — Automation and AI Equality

Automations, workers, integrations and AI agents MUST pass through the same policy, domain and audit controls as human actors.

Service accounts MUST have explicit tenant and action scope.

No automation or AI tool MAY use unrestricted production database credentials.

---

## L59-10 — Zero Mutation on Rejection

A rejected LOCK-59 operation MUST produce zero canonical business mutations.

Audit and security evidence MAY be written to approved append-only evidence stores.

A failure MUST NOT leave:

- a partial booking
- an orphaned resource claim
- a partial payment
- an entitlement deduction
- a commission accrual
- an inconsistent projection

---

# Isolation Layers

LOCK-59 SHALL be implemented through independent security layers.

| Layer | Responsibility |
|---|---|
| Authentication | Prove actor identity |
| Membership resolution | Prove actor belongs to tenant |
| Authorization policy | Prove action is allowed in context |
| Application guard | Validate exact tenant, location and resource context |
| Domain invariants | Enforce business ownership and lifecycle rules |
| Database constraints | Prevent structurally invalid relationships |
| PostgreSQL RLS | Restrict row visibility and mutation by tenant context |
| Audit | Preserve evidence of decisions and attempts |
| Negative testing | Demonstrate zero cross-boundary access and mutation |

Passing one layer MUST NOT permit bypassing another required layer.

---

# Authorized Context Resolution

The backend MUST resolve an authorization context before executing a tenant-scoped operation.

A minimal context SHOULD contain:

```text
actor_id
tenant_id
allowed_location_ids
action
role_or_policy_attributes
trace_id
command_id
idempotency_key when required
```

The context MUST be derived from trusted server-side sources.

The authorization decision SHOULD include a machine-readable reason code.

Example outcomes:

```text
ALLOW
DENY_MEMBERSHIP_MISSING
DENY_LOCATION_NOT_ALLOWED
DENY_RESOURCE_TENANT_MISMATCH
DENY_RESOURCE_LOCATION_MISMATCH
DENY_ENVIRONMENT_MISMATCH
DENY_CONTEXT_AMBIGUOUS
DENY_POLICY_UNAVAILABLE
```

---

# Airtable Transition Contract

Airtable remains a transitional operational validation and governance layer.

## Required Booking Context

A booking request MUST resolve exactly one:

- tenant
- location
- environment
- branch configuration where applicable

Resource assignments MUST resolve exact record identities and cardinality.

## Branch-Safe Selectors

Branch-safe selector fields MAY be used to limit user choices during the Airtable phase.

Selectors MUST NOT be treated as the final security authority.

The canonical writer MUST independently verify:

- selector resource identity
- tenant ownership
- location ownership
- environment compatibility
- resource activity state
- command context

## Quarantine

Ambiguous, stale or mismatched records MUST enter a controlled quarantine or rejection state.

Quarantine MUST NOT be interpreted as a successful booking.

Quarantined records MUST NOT appear on the Live Board.

## Final Live Board Authority

LOCK-59 success is necessary but not sufficient for Live Board visibility.

The final Live Board decision remains subject to the authorized final gate and additional controls including:

- canonical create evidence
- lifecycle state
- availability and conflict checks
- therapist authorization
- room authorization
- shift validity
- duration validity
- quarantine state

A `LIVE BLOCKED` outcome MUST override weaker positive indicators.

---

# PostgreSQL Target Contract

## Database Roles

Production applications MUST connect through a restricted application role.

The application role MUST NOT:

- be a superuser
- hold `BYPASSRLS`
- own protected operational tables
- hold unrestricted schema modification privileges

Migration and administration roles MUST be separate from runtime application roles.

## RLS Requirement

Tenant-scoped canonical tables MUST enable RLS unless an approved ADR documents a safer alternative.

Protected tables SHOULD use `FORCE ROW LEVEL SECURITY` when table-owner bypass would otherwise weaken the runtime guarantee.

RLS MUST be treated as a defense-in-depth layer, not the sole authorization system.

## Transaction-Local Context

Tenant context MUST be established inside the active database transaction.

Session-global tenant state MUST NOT be relied upon in transaction-pooled environments.

Illustrative pattern:

```sql
BEGIN;

SELECT set_config(
  'app.current_tenant_id',
  $1,
  true
);

SELECT set_config(
  'app.current_actor_id',
  $2,
  true
);

-- Authorized operation

COMMIT;
```

The final `true` argument makes the configuration transaction-local.

If context setup fails, the transaction MUST be rolled back.

## Missing Context

RLS policies MUST deny access when the required transaction context is missing or invalid.

A missing context MUST NOT expose all rows.

## Referential Integrity

Tenant-scoped relationships SHOULD use structural constraints that prevent cross-tenant references.

Where practical, composite uniqueness and foreign keys SHOULD include tenant ownership.

Illustrative model:

```sql
ALTER TABLE locations
  ADD CONSTRAINT locations_tenant_id_id_uq
  UNIQUE (tenant_id, id);

ALTER TABLE bookings
  ADD CONSTRAINT bookings_location_tenant_fk
  FOREIGN KEY (tenant_id, location_id)
  REFERENCES locations (tenant_id, id);
```

Equivalent constraints SHOULD be defined for therapist, room, service and other tenant-owned resources.

---

# Query Contract

Tenant-scoped queries MUST execute under an authorized context.

Queries MUST NOT rely on a developer remembering to append `WHERE tenant_id = ...` as the only isolation control.

Reporting, exports and analytics queries MUST obey the same ownership boundaries unless they run through an explicitly approved cross-tenant administrative capability.

Cross-tenant reporting MUST require:

- an explicit privileged action
- a restricted administrative role
- documented purpose
- audit evidence
- data minimization

---

# Mutation Contract

Every tenant-scoped mutation MUST prove:

1. authenticated actor identity
2. active tenant membership or approved service-account scope
3. action permission
4. location permission where applicable
5. target resource tenant ownership
6. target resource location ownership where applicable
7. environment or physical database boundary
8. valid domain lifecycle transition
9. concurrency and idempotency requirements

Failure at any step MUST reject the mutation.

---

# Booking Creation Requirements

A canonical booking creation command MUST include or resolve:

- command identifier
- idempotency key
- payload fingerprint
- authenticated actor
- tenant
- location
- client or guest reference where required
- service
- start time and duration
- requested therapist and room where applicable
- contract version
- trace identifier

Before commit, the system MUST validate:

- tenant membership
- location permission
- service ownership and availability
- therapist ownership, activity, shift and service authorization
- room ownership, activity and compatibility
- resource conflicts
- booking lifecycle invariants

The idempotency claim, resource claim, booking record, audit evidence and outbox event MUST follow the approved transaction-boundary design.

---

# Error and Reason Codes

LOCK-59 failures MUST use stable machine-readable reason codes.

The initial reason-code catalogue SHOULD include:

```text
L59_CONTEXT_MISSING
L59_CONTEXT_AMBIGUOUS
L59_TENANT_MEMBERSHIP_DENIED
L59_LOCATION_ACCESS_DENIED
L59_ENVIRONMENT_MISMATCH
L59_BRANCH_CONFIG_MISSING
L59_BRANCH_CONFIG_CARDINALITY_INVALID
L59_RESOURCE_TENANT_MISMATCH
L59_RESOURCE_LOCATION_MISMATCH
L59_THERAPIST_UNAUTHORIZED
L59_ROOM_UNAUTHORIZED
L59_SHIFT_INVALID
L59_RAW_CREATE_BLOCKED
L59_POLICY_UNAVAILABLE
L59_RLS_CONTEXT_MISSING
L59_CANONICAL_MUTATION_BLOCKED
```

Human-readable error messages MAY change without changing the stable reason code.

---

# Audit Requirements

Every sensitive LOCK-59 decision SHOULD preserve:

- actor ID
- tenant ID
- location or scope
- action
- resource type and ID
- decision
- reason code
- policy or contract version
- command ID
- trace ID
- timestamp

Denied attempts MUST NOT copy unnecessary personal data into audit logs.

Audit evidence MUST be sufficient to distinguish:

- authentication failure
- membership failure
- authorization denial
- ownership mismatch
- environment mismatch
- domain validation failure
- database constraint failure
- RLS denial

---

# Required Negative Test Matrix

LOCK-59 SHALL NOT be production approved until automated tests demonstrate the following outcomes.

| Test | Expected result |
|---|---|
| Correct tenant, location, environment and resources | Allowed, subject to other domain gates |
| Wrong tenant | Denied; zero canonical mutation |
| Wrong location | Denied; zero canonical mutation |
| Wrong environment or database boundary | Denied; zero canonical mutation |
| Actor without membership | Denied |
| Actor without location permission | Denied |
| Resource exists but belongs to another tenant | Denied |
| Resource exists but belongs to another location | Denied |
| Missing branch configuration | Controlled failure |
| Multiple branch configurations | Controlled failure |
| Missing therapist or room cardinality | Controlled failure |
| Raw canonical booking create | Blocked |
| Missing transaction-local RLS context | Zero protected rows and mutations |
| Application role attempts to bypass RLS | Denied |
| Same idempotency key and same payload | Replay; one canonical booking |
| Same idempotency key and different payload | Idempotency conflict |
| Concurrent duplicate commands | One authoritative result |
| Mid-transaction fault | Rollback; zero partial write |
| Projection failure | Canonical state remains correct |
| Automation or AI attempts direct mutation | Denied |

Every negative test MUST assert mutation counts, not only response codes.

---

# Production Acceptance Gates

LOCK-59 may move to `PRODUCTION APPROVED` only when all of the following are available:

- approved normative contract
- implemented server-side authorization context
- exact-ID resource validation
- PostgreSQL constraint design
- RLS policies for protected tables
- restricted non-owner application role
- transaction-local context test harness
- cross-tenant read and write negative tests
- zero-partial-write evidence
- canonical booking-path integration
- security review approval
- database review approval
- linked immutable evidence package

A schema, policy or field existing without runtime evidence is insufficient.

---

# Current Architecture Status

At version 0.9-RC2, the expected component classifications are:

| Component | Status |
|---|---|
| Airtable branch-safe selectors | PROTOTYPED |
| Airtable exact-ID and guard design | PROTOTYPED / partial evidence |
| Canonical booking request path | ACCEPTANCE PENDING |
| PostgreSQL tenant constraints | NORMATIVE DESIGN / partial implementation subject to repository evidence |
| PostgreSQL RLS | NORMATIVE DESIGN |
| Transaction-local RLS context | NORMATIVE DESIGN |
| Cross-tenant automated test harness | ACCEPTANCE PENDING |
| LOCK-59 production closure | NOT APPROVED |

This status table MUST be updated when evidence changes.

---

# Prohibited Interpretations

The following claims are prohibited unless the production acceptance gates have passed:

- “The UI filter guarantees tenant isolation.”
- “Airtable views are a security boundary.”
- “LOCK-59 is closed because the fields exist.”
- “RLS alone proves complete authorization.”
- “A valid record ID implies permission.”
- “An automation service account may bypass normal policy.”
- “A negative response proves zero mutation without database evidence.”

---

# Related Documents

This contract SHALL be read with:

- `volume-1-architecture-principles/02-engineering-principles.md`
- `volume-1-architecture-principles/03-canonical-data-contract.md`
- `volume-1-architecture-principles/04-failure-philosophy.md`
- `volume-1-architecture-principles/06-bounded-context-map.md`
- `volume-2-technical-architecture/02-transaction-context-and-rls.md`
- `volume-2-technical-architecture/03-booking-writer.md`
- `contracts/lock59-negative-test-contract.md`
- `ADR-006-lock59-defense-in-depth.md`
- `ADR-007-environment-physical-separation.md`

Related documents that do not yet exist remain required deliverables and MUST NOT be treated as implemented.

---

# Summary

LOCK-59 is the Santis OS defense-in-depth isolation contract.

It requires exact identity, server-side authorization, tenant and location ownership validation, environment isolation, domain enforcement, database constraints, RLS, zero-mutation rejection behaviour and evidence-backed negative testing.

LOCK-59 SHALL remain unapproved for production until the complete runtime acceptance package demonstrates that no unauthorized cross-boundary read or mutation can occur through human, automation, integration or AI paths.

---

End of Document
