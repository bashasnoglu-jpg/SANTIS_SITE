# Backup and Restore Test Evidence

**Document:** Santis OS Production Readiness Evidence Pack  
**Version:** 0.9-RC2  
**Evidence Type:** Disaster Recovery  
**Status:** NOT_STARTED  
**Production Authority:** No

---

## Purpose

Prove that Santis OS canonical data can be restored into a clean environment within defined recovery objectives and with security controls intact.

## Scope

- encrypted PostgreSQL backup
- point-in-time recovery where supported
- clean target instance
- schema and migration integrity
- canonical booking integrity
- idempotency and outbox integrity
- RLS and role restoration
- projection rebuild

## Architecture References

- `../volume-4-production-reliability/03-backup-and-disaster-recovery.md`
- `../volume-4-production-reliability/05-security-operations.md`
- `../runbooks/database-failover.md`
- `RLS-Test-Harness.md`

## Initial Engineering Targets

| Objective | Initial Target |
|---|---:|
| RPO | ≤ 5 minutes |
| RTO | ≤ 60 minutes |
| Restore completion | 100% |
| Critical integrity errors | 0 |
| Cross-tenant leakage after restore | 0 |

These values are targets, not demonstrated production performance, until this document is marked `PASS`.

## Acceptance Criteria

- backup is readable and cryptographically/integrity verified,
- restore completes on a clean target,
- expected migration version is present,
- canonical row counts and sampled hashes match the recovery point,
- bookings, payments, claims and outbox references remain valid,
- application role remains non-owner and without `BYPASSRLS`,
- RLS and FORCE RLS remain enabled,
- cross-tenant negative tests pass,
- projection rebuild completes without canonical mutation,
- measured RPO and RTO are recorded.

## Evidence Required

- restore test date and operator
- source and target environment identifiers
- verified commit and migration SHAs
- backup identifier and timestamp
- restore start/end timestamps
- integrity query outputs
- RLS harness output
- projection rebuild output
- measured RPO/RTO
- incident/change ticket where applicable

## Execution Procedure

1. Select an approved non-production source dataset.
2. Capture expected recovery point and integrity markers.
3. Produce or select the encrypted backup/PITR point.
4. Provision a clean target instance.
5. Restore database and roles according to the approved runbook.
6. Verify migrations, constraints, RLS and role privileges.
7. Validate canonical counts, references and sampled hashes.
8. Run cross-tenant isolation checks.
9. Rebuild projections from canonical evidence.
10. Record RPO, RTO and all deviations.

## Observed Results

| Field | Observed Value |
|---|---|
| Test Date | PENDING |
| Verified Commit SHA | PENDING |
| Backup Identifier | PENDING |
| Recovery Point | PENDING |
| Restore Start | PENDING |
| Restore End | PENDING |
| Measured RPO | PENDING |
| Measured RTO | PENDING |
| Integrity Errors | PENDING |
| RLS Result | PENDING |
| Projection Rebuild Result | PENDING |

## Evidence Links

- Backup metadata: PENDING
- Restore logs: PENDING
- Integrity SQL transcript: PENDING
- RLS harness: PENDING
- Projection rebuild artifact: PENDING

## Decision

```yaml
Status: NOT_STARTED
Decision: BLOCKED
Reason: A controlled restore test has not yet been executed and attached.
Production Authority: No
```

## Production Gate

Restore readiness MAY be marked `PASS` only when the clean-environment restore satisfies all integrity and isolation criteria and records measured RPO/RTO.

---

End of Document
