# ADR-006 — LOCK-59 Defense-in-Depth Isolation

**Status:** Proposed  
**Decision Type:** Security Architecture  
**Version:** 0.9-RC2  
**Production Authority:** No

## Context

Santis OS is a multi-tenant platform. A tenant, location or environment boundary failure can expose or mutate another operating unit's data. UI filtering and application-level `WHERE tenant_id = ...` clauses alone are insufficient because they depend on every code path being correct.

LOCK-59 originated as a branch-safe Airtable guard and canonical-writer control. Its target form is a platform-wide isolation contract covering identity, authorization, exact resource ownership, database constraints, RLS, audit and negative testing.

## Decision

LOCK-59 SHALL be the normative tenant–location–resource isolation contract for Santis OS.

Isolation MUST be enforced through independent layers:

1. authentication,
2. tenant membership resolution,
3. location and action authorization,
4. trusted transaction context,
5. application/domain guards,
6. tenant-aware database constraints,
7. PostgreSQL Row-Level Security where applicable,
8. audit evidence,
9. cross-tenant negative tests.

No single layer MAY be treated as sufficient on its own.

## Normative Requirements

- Client-supplied tenant or location identifiers MUST NOT be trusted without server-side membership and scope resolution.
- Resource ownership MUST be validated by immutable identifiers, not display names or labels.
- Missing, ambiguous or multi-valued context MUST fail closed.
- Cross-tenant and cross-location rejection MUST produce zero canonical mutation.
- Raw canonical booking creation MUST remain prohibited.
- PostgreSQL application roles MUST NOT be superusers, table owners or possess `BYPASSRLS`.
- Tenant-scoped tables using RLS SHOULD use `ENABLE ROW LEVEL SECURITY` and `FORCE ROW LEVEL SECURITY` where the design requires owner enforcement.
- Composite foreign keys or equivalent constraints MUST prevent references across tenant boundaries.
- Background workers, automations and AI-originated commands MUST pass through the same isolation policy as human commands.
- Security rejection codes MUST be stable and auditable.

## Alternatives Considered

### UI-only filtering

Rejected. It is a usability control, not an enforceable security boundary.

### Application-only tenant predicates

Rejected as the sole defense because one omitted predicate can cause a data leak.

### Separate database per tenant from day one

Deferred. It offers strong isolation but creates provisioning, migration and operational complexity that is not justified for the current pilot stage.

### PostgreSQL RLS only

Rejected as a complete solution. RLS does not replace authentication, authorization, domain validation, resource ownership constraints or audit.

## Consequences

### Positive

- Reduces single-point security failures.
- Makes tenant isolation testable and auditable.
- Preserves LOCK-59 semantics from Airtable through PostgreSQL migration.
- Supports enterprise security review and controlled incident investigation.

### Negative

- Requires repeated scope checks across layers.
- Increases schema, test and operational complexity.
- RLS policies and role configuration require specialized review.
- Performance must be measured with realistic tenant data distributions.

## Evidence Required

Production acceptance requires:

- cross-tenant read tests returning zero rows,
- cross-tenant insert/update/delete tests being denied,
- wrong-location therapist and room tests producing zero mutation,
- missing and ambiguous context tests failing closed,
- worker and automation scope tests,
- non-owner application-role verification,
- RLS harness evidence,
- stable security audit events,
- rollback evidence for rejected commands.

## Related Documents

- `volume-2-technical-architecture/01-lock-59-isolation-contract.md`
- `volume-2-technical-architecture/02-transaction-context-and-rls.md`
- `volume-2-technical-architecture/03-booking-writer.md`
- ADR-002 — PostgreSQL as Canonical Authority
- ADR-004 — Durable PostgreSQL Idempotency

## Current Decision Status

**Normative Design / Partial Runtime Evidence / Production Not Approved**
