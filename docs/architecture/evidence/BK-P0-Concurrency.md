# BK-P0 Concurrency Evidence

**Document:** Santis OS Production Readiness Evidence Pack  
**Version:** 0.9-RC2  
**Evidence Type:** Runtime Acceptance  
**Status:** NOT_STARTED  
**Production Authority:** No

---

## Purpose

Prove that the BK-P0 Booking Writer creates exactly one canonical booking under concurrent execution and returns deterministic replay results for duplicate commands.

## Scope

- `CreateBookingCommand`
- PostgreSQL durable idempotency
- Canonical booking creation
- Resource claim participation
- Audit evidence
- Transactional outbox

## Architecture References

- `../adr/ADR-004-durable-postgresql-idempotency.md`
- `../volume-2-technical-architecture/03-booking-writer.md`
- `../volume-2-technical-architecture/04-idempotency-contract.md`
- `../contracts/booking-command-contract.md`

## Acceptance Criteria

A controlled test MUST execute 20–25 concurrent requests with:

- identical `tenant_id`,
- identical `command_type`,
- identical `idempotency_key`,
- identical canonical payload,
- identical payload fingerprint.

Expected result:

- exactly `1 × CREATED/SUCCESS`,
- exactly `N−1 × REPLAYED`,
- exactly one canonical booking,
- exactly one completed durable claim,
- zero duplicate resource claims,
- zero partial writes,
- zero idempotency conflicts.

## Evidence Required

- GitHub Actions Run ID
- verified commit SHA
- test environment identifier
- exact command contract version
- request count and concurrency level
- booking ID
- `command_claims` query output
- booking count query output
- resource claim count query output
- outbox count query output
- representative API responses
- transaction or application logs

## Execution Procedure

1. Provision an isolated test database.
2. Apply the verified migration set.
3. Create immutable tenant, location and resource fixtures.
4. Generate one canonical command and one idempotency key.
5. Dispatch 20–25 requests concurrently.
6. Wait for all responses.
7. Query canonical booking, claim, resource-claim and outbox tables.
8. Compare all response identities and fingerprints.
9. Preserve raw evidence as artifacts.

## Observed Results

| Field | Observed Value |
|---|---|
| GitHub Run ID | PENDING |
| Verified Commit SHA | PENDING |
| Request Count | PENDING |
| Concurrency Level | PENDING |
| Created Count | PENDING |
| Replay Count | PENDING |
| Conflict Count | PENDING |
| Canonical Booking Count | PENDING |
| Partial Write Count | PENDING |
| Resulting Booking ID | PENDING |

## Evidence Links

- Workflow run: PENDING
- Artifact bundle: PENDING
- SQL output: PENDING
- Log bundle: PENDING

## Decision

```yaml
Status: NOT_STARTED
Decision: BLOCKED
Reason: Runtime evidence has not yet been executed and attached.
Production Authority: No
```

## Production Gate

This evidence MAY be marked `PASS` only when every acceptance criterion is satisfied by one reproducible run on the verified commit SHA.

---

End of Document
