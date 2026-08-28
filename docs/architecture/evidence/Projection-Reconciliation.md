# Projection Reconciliation Evidence

**Document:** Santis OS Production Readiness Evidence Pack  
**Version:** 0.9-RC2  
**Evidence Type:** Projection Integrity  
**Status:** NOT_STARTED  
**Production Authority:** No

---

## Purpose

Prove that Airtable and other read projections accurately represent PostgreSQL canonical state without becoming mutation authorities.

## Scope

- PostgreSQL source records
- Airtable projection records
- source identity and version
- projection lag
- duplicate and missing projections
- reconciliation and replay

## Architecture References

- `../adr/ADR-003-airtable-projection-governance.md`
- `../contracts/airtable-projection-contract.md`
- `../volume-2-technical-architecture/06-transactional-outbox.md`
- `../volume-4-production-reliability/06-observability.md`

## Acceptance Criteria

For the tested dataset:

- every required canonical record has exactly one projection,
- every projection references a valid canonical source,
- projected source version matches the expected canonical version,
- no duplicate projection exists,
- no unknown-source projection exists,
- stale projections are detected,
- replay rebuilds the projection without canonical mutation,
- projection failure does not roll back canonical success,
- projection writes do not create canonical side effects.

## Evidence Required

- verified commit SHA
- canonical dataset snapshot
- Airtable base/table identifiers with sensitive values redacted where needed
- canonical-to-projection mapping export
- reconciliation query/report
- projection lag measurements
- replay/rebuild logs
- mutation-safety verification

## Execution Procedure

1. Select a controlled canonical dataset.
2. Export canonical IDs, versions and timestamps.
3. Export matching projection IDs, source versions and projected timestamps.
4. Compare counts and identity mappings.
5. Inject one missing, stale and duplicate projection in a test environment.
6. Run reconciliation and verify detection.
7. Rebuild from durable event or source evidence.
8. Confirm canonical state remains unchanged.

## Observed Results

| Metric | Expected | Observed | Result |
|---|---:|---:|---|
| Required canonical records | measured | PENDING | NOT_RUN |
| Matching projections | equal | PENDING | NOT_RUN |
| Missing projections | 0 | PENDING | NOT_RUN |
| Duplicate projections | 0 | PENDING | NOT_RUN |
| Unknown-source projections | 0 | PENDING | NOT_RUN |
| Version drift | 0 | PENDING | NOT_RUN |
| Projection delay P95 | ≤ 30 s initial target | PENDING | NOT_RUN |
| Canonical mutations during rebuild | 0 | PENDING | NOT_RUN |

## Evidence Links

- Canonical export: PENDING
- Projection export: PENDING
- Reconciliation report: PENDING
- Replay logs: PENDING

## Decision

```yaml
Status: NOT_STARTED
Decision: BLOCKED
Reason: Projection reconciliation has not yet been executed and attached.
Production Authority: No
```

## Production Gate

Projection reconciliation MAY be marked `PASS` only when identity, version and mutation-safety checks pass for the defined acceptance dataset.

---

End of Document
