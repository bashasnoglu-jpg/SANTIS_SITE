# ADR-003 — Airtable as Projection and Governance

**Status:** Accepted for target architecture  
**Decision Type:** Integration and Governance  
**Production Authority:** No  
**Review Trigger:** Airtable role or migration strategy change

## Context

Airtable is central to Santis OS operational modeling, acceptance evidence, governance and interface prototyping. Retaining Airtable as an unrestricted canonical mutation system after PostgreSQL authority transfer would create dual authority, stale decisions, reconciliation ambiguity and weaker transaction guarantees.

Removing Airtable immediately would also discard useful operational workflows and governance visibility before equivalent React and backend capabilities are ready.

## Decision

Airtable SHALL transition to three controlled roles:

1. **Projection:** a derived operational/read model sourced from canonical evidence,
2. **Governance:** architecture, QA, approval, risk and evidence registers,
3. **Command Intake:** controlled request records that are validated and executed by backend commands.

Airtable MUST NOT directly mutate PostgreSQL canonical tables.

Airtable projections MUST include, where applicable:

- canonical source identifier,
- source/aggregate version,
- projected timestamp,
- projection contract version,
- reconciliation status,
- projection error state.

Airtable automation MUST NOT invent tenant, location, actor, resource or financial context.

## Consequences

### Positive

- preserves operational visibility and governance value,
- removes Airtable from transaction-critical authority,
- enables controlled migration rather than abrupt replacement,
- projection drift becomes measurable.

### Negative

- projection workers and reconciliation are required,
- temporary differences between canonical and projected state must be managed,
- existing Airtable automations require classification and retirement.

## Inbound Command Rules

An Airtable request MAY initiate a command only when:

- the request contract is versioned,
- actor and scope are resolved by the backend,
- idempotency identity is present,
- validation and policy run in the canonical backend,
- the result references the exact canonical resource.

Raw canonical creation from Airtable is prohibited after authority transfer.

## Projection Failure Rules

Projection failure MUST NOT invalidate or repair canonical state.

Failed projections MUST enter retry, reconciliation or quarantine with preserved evidence.

## Alternatives Considered

### Remove Airtable immediately

Rejected because the React and backend operational surfaces are not yet complete.

### Keep Airtable and PostgreSQL as co-equal authorities

Rejected because dual authority is unsafe and difficult to recover deterministically.

## Evidence Required

- Airtable projection contract,
- source-version reconciliation test,
- duplicate-delivery idempotency test,
- command-intake acceptance tests,
- legacy automation retirement registry.

## Related Documents

- `volume-2-technical-architecture/06-transactional-outbox.md`
- `volume-2-technical-architecture/08-module-communication.md`
- `ADR-002-postgresql-canonical-authority.md`

---

End of ADR
