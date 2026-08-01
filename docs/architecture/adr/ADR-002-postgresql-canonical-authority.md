# ADR-002 — PostgreSQL as Canonical Authority

**Status:** Accepted for target architecture  
**Decision Type:** Data Authority  
**Production Authority:** No  
**Review Trigger:** Canonical persistence strategy change

## Context

Santis OS currently validates substantial operational behaviour in Airtable while building transaction-safe backend capabilities. Airtable is valuable for operational prototyping, governance and projections, but it cannot provide the complete transaction, concurrency, constraint, recovery and row-level isolation guarantees required for the target production architecture.

Multiple authorities for the same booking, payment or availability fact would create drift and ambiguous recovery.

## Decision

PostgreSQL SHALL become the single canonical persistence authority for target production operational state.

Canonical mutations MUST occur only through approved backend domain commands.

PostgreSQL SHALL provide, where applicable:

- atomic transactions,
- durable idempotency constraints,
- concurrency control,
- tenant-aware foreign keys and constraints,
- Row-Level Security as defense in depth,
- transactional outbox records,
- backup and point-in-time recovery.

React, Airtable, analytics stores and caches MUST be treated as clients, projections or derived read models rather than canonical authorities.

Production and non-production databases SHOULD be physically separated under ADR-007.

## Consequences

### Positive

- one authoritative operational truth,
- deterministic transaction boundaries,
- enforceable concurrency and uniqueness,
- controlled recovery and reconciliation,
- stronger tenant isolation.

### Negative

- migration and dual-run complexity,
- projection reconciliation is required,
- database operations and backup discipline become critical,
- Airtable workflows must be redesigned around commands and projections.

## Migration Rules

During migration:

- authority for each entity MUST be explicitly recorded,
- dual-write without deterministic reconciliation is prohibited,
- Airtable MAY remain temporary authority only where status is documented,
- authority transfer requires shadow verification and acceptance evidence,
- rollback ownership and recovery procedure MUST be defined.

## Alternatives Considered

### Airtable as permanent operational authority

Rejected for transaction-critical booking, availability and financial state.

### Multiple canonical databases by module immediately

Rejected because it introduces distributed consistency before justified service extraction.

## Evidence Required

- canonical schema and constraints,
- BK-P0 atomicity and concurrency acceptance,
- RLS test harness,
- restore test plan,
- Airtable projection and reconciliation contract.

## Related Documents

- `volume-1-architecture-principles/03-canonical-data-contract.md`
- `volume-2-technical-architecture/02-transaction-context-and-rls.md`
- `volume-2-technical-architecture/03-booking-writer.md`
- `ADR-003-airtable-projection-governance.md`

---

End of ADR
