# ADR-001 — Modular Monolith First

**Status:** Accepted for v0.9-RC2  
**Decision Type:** Architecture  
**Production Authority:** No  
**Review Trigger:** Material scale, team or deployment-boundary change

## Context

Santis OS contains distinct business capabilities including Identity, Booking, Availability, Payments, Accounting, Inventory, Commission, Notifications, Analytics and AI Orchestration.

Premature decomposition into independently deployed microservices would introduce distributed transactions, network failure modes, message-ordering complexity, duplicated operational tooling and significant DevOps overhead before the core domain contracts and production acceptance evidence are mature.

At the same time, an unstructured monolith would permit shared mutable models, foreign-table writes and unclear ownership.

## Decision

Santis OS MUST be implemented first as a **modular monolith**:

- one primary deployable backend,
- explicit bounded-context ownership,
- private module persistence access,
- published synchronous command/query interfaces,
- domain and integration events through a transactional outbox,
- architecture tests preventing forbidden dependencies.

Modules MUST NOT directly mutate another module's canonical tables.

A module MAY be extracted into an independently deployed service only through a separate approved ADR.

## Consequences

### Positive

- preserves strong transaction boundaries for Booking and Availability,
- reduces operational complexity,
- enables faster contract refinement,
- supports future extraction without requiring it prematurely,
- keeps observability and deployment simpler during the pilot phase.

### Negative

- modules share a deployment lifecycle,
- a backend outage may affect multiple capabilities,
- strict code-level boundaries require active enforcement,
- database-level ownership must be documented and tested.

## Extraction Criteria

Service extraction MAY be considered when at least one condition is demonstrated:

- materially different scaling profile,
- independent release cadence is repeatedly blocked,
- regulatory or data-residency boundary requires separation,
- fault isolation has measurable business value,
- ownership by a separate team is stable,
- synchronous transaction coupling has been removed.

Extraction MUST include contract, migration, observability, rollback and failure-mode evidence.

## Alternatives Considered

### Microservices immediately

Rejected because operational and distributed-system costs exceed current demonstrated need.

### Unstructured monolith

Rejected because it would undermine ownership, security and future extractability.

## Evidence Required

- module dependency tests,
- no foreign-table mutation evidence,
- published interface registry,
- bounded-context ownership matrix,
- transactional outbox proof-of-concept.

## Related Documents

- `volume-1-architecture-principles/06-bounded-context-map.md`
- `volume-2-technical-architecture/08-module-communication.md`
- `ADR-005-transactional-outbox.md`

---

End of ADR
