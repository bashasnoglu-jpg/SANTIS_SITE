# LOCK-59 Negative Test Evidence

**Document:** Santis OS Production Readiness Evidence Pack  
**Version:** 0.9-RC2  
**Evidence Type:** Multi-Tenant Isolation  
**Status:** NOT_STARTED  
**Production Authority:** No

---

## Purpose

Prove that LOCK-59 rejects unauthorized tenant, location, environment and resource combinations with zero unauthorized mutation.

## Scope

- tenant membership
- location authorization
- environment isolation
- therapist ownership
- room ownership
- canonical booking mutation
- resource claims
- idempotency claims
- outbox and audit evidence

## Architecture References

- `../adr/ADR-006-lock59-defense-in-depth.md`
- `../volume-2-technical-architecture/01-lock-59-isolation-contract.md`
- `../contracts/lock59-negative-test-contract.md`
- `../contracts/transaction-context-contract.md`

## Acceptance Criteria

Every negative scenario MUST:

- return `403`, a stable authorization code, or a deterministic domain rejection,
- produce zero canonical booking mutation,
- produce zero unauthorized resource claim,
- produce zero success outbox event,
- preserve security audit evidence,
- avoid disclosing cross-tenant resource data.

Required scenarios:

1. wrong tenant,
2. wrong location,
3. wrong environment in transitional Airtable context,
4. cross-tenant therapist,
5. cross-location room,
6. fabricated tenant identifier,
7. missing authorization context,
8. inactive membership,
9. multiple or missing branch configuration,
10. raw booking create attempt.

## Evidence Required

- GitHub Actions Run ID
- verified commit SHA
- immutable fixture IDs
- request/response evidence
- before/after mutation counts
- audit/security event output
- stable reason codes

## Execution Procedure

1. Create isolated fixtures for at least two tenants and two locations.
2. Record baseline canonical and claim counts.
3. Execute each negative request independently.
4. Verify rejection code and safe response body.
5. Query all affected canonical, claim and outbox tables.
6. Verify cross-tenant identifiers are not leaked.
7. Preserve raw evidence.

## Observed Results

| Scenario | Rejection Code | Booking Mutation | Resource Mutation | Success Outbox | Audit Evidence | Result |
|---|---|---:|---:|---:|---|---|
| Wrong tenant | PENDING | PENDING | PENDING | PENDING | PENDING | NOT_RUN |
| Wrong location | PENDING | PENDING | PENDING | PENDING | PENDING | NOT_RUN |
| Wrong environment | PENDING | PENDING | PENDING | PENDING | PENDING | NOT_RUN |
| Cross-tenant therapist | PENDING | PENDING | PENDING | PENDING | PENDING | NOT_RUN |
| Cross-location room | PENDING | PENDING | PENDING | PENDING | PENDING | NOT_RUN |
| Fabricated tenant ID | PENDING | PENDING | PENDING | PENDING | PENDING | NOT_RUN |
| Missing context | PENDING | PENDING | PENDING | PENDING | PENDING | NOT_RUN |
| Inactive membership | PENDING | PENDING | PENDING | PENDING | PENDING | NOT_RUN |
| Config cardinality invalid | PENDING | PENDING | PENDING | PENDING | PENDING | NOT_RUN |
| Raw create | PENDING | PENDING | PENDING | PENDING | PENDING | NOT_RUN |

## Evidence Links

- Workflow run: PENDING
- Negative-test artifact: PENDING
- SQL output: PENDING
- Audit bundle: PENDING

## Decision

```yaml
Status: NOT_STARTED
Decision: BLOCKED
Reason: Runtime isolation evidence has not yet been executed and attached.
Production Authority: No
```

## Production Gate

LOCK-59 MAY be marked `PASS` only when every required negative case demonstrates zero unauthorized mutation and no data disclosure.

---

End of Document
