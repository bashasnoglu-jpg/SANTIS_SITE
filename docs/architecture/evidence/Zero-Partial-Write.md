# Zero Partial Write Evidence

**Document:** Santis OS Production Readiness Evidence Pack  
**Version:** 0.9-RC2  
**Evidence Type:** Transaction Integrity  
**Status:** NOT_STARTED  
**Production Authority:** No

---

## Purpose

Prove that a failed canonical command never leaves incomplete booking, claim, resource, audit-success or outbox state.

## Scope

- Booking Writer transaction boundary
- Idempotency claim lifecycle
- Availability/resource claims
- Canonical booking persistence
- Audit evidence
- Transactional outbox

## Architecture References

- `../volume-2-technical-architecture/03-booking-writer.md`
- `../volume-2-technical-architecture/04-idempotency-contract.md`
- `../volume-2-technical-architecture/06-transactional-outbox.md`
- `../contracts/booking-command-contract.md`

## Acceptance Criteria

Each injected failure MUST produce:

- zero canonical booking rows,
- zero committed resource claims,
- zero committed success outbox events,
- no completed idempotency claim referencing a missing booking,
- preserved failure evidence,
- deterministic error classification.

Required scenarios:

1. availability rejection,
2. foreign-key violation,
3. booking insert failure,
4. resource-claim failure,
5. outbox insert failure,
6. explicit transaction rollback,
7. constraint violation,
8. failure immediately before commit.

## Evidence Required

- GitHub Actions Run ID
- verified commit SHA
- fault-injection hook and scenario identifier
- before/after SQL counts
- transaction logs
- API response/error code
- audit failure evidence
- absence of orphan claims

## Execution Procedure

For every scenario:

1. Record baseline table counts.
2. Execute one command with the designated fault hook.
3. Confirm the transaction fails.
4. Query booking, claim, resource-claim and outbox tables.
5. Verify no authoritative partial state remains.
6. Preserve logs and SQL output.

## Observed Results

| Scenario | Booking Rows | Completed Claims | Resource Claims | Success Outbox | Audit Failure Evidence | Result |
|---|---:|---:|---:|---:|---|---|
| Availability rejection | PENDING | PENDING | PENDING | PENDING | PENDING | NOT_RUN |
| FK violation | PENDING | PENDING | PENDING | PENDING | PENDING | NOT_RUN |
| Booking insert failure | PENDING | PENDING | PENDING | PENDING | PENDING | NOT_RUN |
| Resource claim failure | PENDING | PENDING | PENDING | PENDING | PENDING | NOT_RUN |
| Outbox insert failure | PENDING | PENDING | PENDING | PENDING | PENDING | NOT_RUN |
| Explicit rollback | PENDING | PENDING | PENDING | PENDING | PENDING | NOT_RUN |
| Constraint violation | PENDING | PENDING | PENDING | PENDING | PENDING | NOT_RUN |
| Before-commit failure | PENDING | PENDING | PENDING | PENDING | PENDING | NOT_RUN |

## Evidence Links

- Workflow run: PENDING
- SQL bundle: PENDING
- Fault-injection logs: PENDING

## Decision

```yaml
Status: NOT_STARTED
Decision: BLOCKED
Reason: Fault-injection evidence has not yet been executed and attached.
Production Authority: No
```

## Production Gate

`Zero Partial Writes = PASS` requires every scenario to pass with no orphaned or ambiguous authoritative state.

---

End of Document
