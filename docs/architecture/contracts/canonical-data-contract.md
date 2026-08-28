# Canonical Data Contract

**Document:** Santis OS Architecture Book  
**Version:** 0.9-RC2  
**Status:** Normative Draft  
**Production Authority:** No

## Purpose

This contract defines the minimum structural, ownership, lifecycle and recovery requirements for canonical data in Santis OS.

## CDC-01 — Authority

PostgreSQL SHALL be the target canonical authority. Airtable, caches, analytics stores and UI state MUST be treated as projections or clients.

## CDC-02 — Ownership

Every canonical entity MUST have exactly one owning bounded context. Foreign contexts MUST NOT mutate the owning context's private tables directly.

## CDC-03 — Contract Profiles

### Universal metadata

Applicable canonical entities MUST define:

- `id`
- `created_at`
- `created_by_actor_id`
- `trace_id`
- `contract_version`

### Tenant-scoped operational entities

Applicable records MUST additionally define:

- `tenant_id`
- `location_id` or explicit `scope_type` / `scope_id`
- `aggregate_version` or `row_version`
- `lifecycle_state` where the entity has a lifecycle

### Type-specific metadata

Record types MAY define:

- `updated_at`
- `updated_by_actor_id`
- `occurred_at`
- `effective_at`
- `reversal_of_id`
- `deleted_at`
- `reconciliation_status`

Append-only entities SHOULD NOT expose mutable update semantics.

## CDC-04 — Identifier Rules

Canonical identifiers MUST be immutable, globally unique within their identifier domain and MUST NOT be reused after deletion or archival.

External identifiers MAY be stored as references but MUST NOT replace the canonical identifier.

## CDC-05 — Tenant and Location Scope

Tenant-scoped records MUST carry trusted ownership scope. Client-supplied tenant or location identifiers MUST NOT be accepted without owner-side authorization and validation.

Cross-tenant foreign keys MUST be prevented through composite constraints or equivalent database enforcement.

## CDC-06 — Versioning and Concurrency

Mutable aggregates MUST carry a monotonic version used for optimistic concurrency.

A state transition with a stale expected version MUST fail with a deterministic conflict and MUST NOT partially write.

Breaking contract changes REQUIRE a new `contract_version`, migration plan and compatibility tests.

## CDC-07 — Lifecycle

Lifecycle transitions MUST occur only through approved domain commands.

Direct field mutation that bypasses the owning aggregate's state machine is prohibited.

## CDC-08 — Canonical State and Projections

Projections are disposable and rebuildable. Canonical state is authoritative and MAY only be changed through approved commands or recovered through controlled restoration procedures.

A projection MUST NOT be used as the sole source for canonical recovery.

## CDC-09 — Auditability

Every canonical mutation MUST preserve evidence sufficient to identify:

- actor,
- command,
- affected resource,
- authorization scope,
- trace identifier,
- timestamp,
- resulting aggregate version.

## CDC-10 — Recovery

Canonical state MAY be recovered through:

- encrypted backup restoration,
- point-in-time recovery,
- approved durable replay,
- documented reconciliation procedures.

Recovery MUST preserve tenant isolation and audit evidence.

## CDC-11 — Environment Boundary

Production and non-production canonical data SHOULD be physically separated. An `environment` field MUST NOT be treated as the primary production isolation control.

## Acceptance Gate

A canonical entity MUST NOT be marked `PRODUCTION APPROVED` until ownership, scope, versioning, lifecycle, audit, migration, backup and negative isolation tests are evidenced.

## References

- ADR-002 — PostgreSQL as Canonical Authority
- ADR-003 — Airtable as Projection and Governance
- ADR-006 — LOCK-59 Defense-in-Depth Isolation
- ADR-007 — Production/Non-Production Physical Separation

---

End of Document
