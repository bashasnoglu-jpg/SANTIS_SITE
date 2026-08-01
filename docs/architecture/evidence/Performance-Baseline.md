# Performance Baseline Evidence

**Document:** Santis OS Production Readiness Evidence Pack  
**Version:** 0.9-RC2  
**Evidence Type:** Performance and Capacity  
**Status:** NOT_STARTED  
**Production Authority:** No

---

## Purpose

Establish a reproducible initial performance baseline for critical Santis OS command, query and projection paths.

## Scope

- booking create command
- identity authorization query
- availability/resource claim
- idempotent replay and conflict paths
- projection processing delay
- database query plans
- error and saturation behaviour

## Architecture References

- `../volume-4-production-reliability/01-slo-sli-error-budget.md`
- `../volume-4-production-reliability/06-observability.md`
- `../volume-2-technical-architecture/03-booking-writer.md`
- `../volume-2-technical-architecture/05-availability-resource-claim.md`

## Initial Engineering Targets

| Metric | Initial Target |
|---|---:|
| Booking Create P95 | ≤ 750 ms |
| Booking Create P99 | ≤ 1,500 ms |
| Identity Query P95 | ≤ 100 ms |
| Availability Claim P95 | ≤ 250 ms |
| Projection Delay P95 | ≤ 30 s |
| Audit Event Loss | 0 |
| Cross-Tenant Unauthorized Read | 0 |
| Duplicate Booking from Same Idempotency Key | 0 |
| Partial Write after Failed Command | 0 |
| Replay Rate | measured, no target yet |
| Conflict Rate | measured, no target yet |

These are initial engineering targets and MUST NOT be represented as demonstrated production performance before a valid test run is attached.

## Acceptance Criteria

The baseline MUST:

- run against a documented dataset and environment,
- use a verified commit and migration set,
- record warm-up and measurement phases,
- report request volume and concurrency,
- publish P50, P95, P99 and error rate where relevant,
- include database CPU, connection and lock observations,
- include `EXPLAIN (ANALYZE, BUFFERS)` for critical queries,
- separate CREATED, REPLAYED and CONFLICT paths,
- confirm zero isolation, duplicate and partial-write violations,
- preserve raw result artifacts.

## Evidence Required

- GitHub Actions Run ID or controlled benchmark run ID
- verified commit SHA
- environment and hardware/runtime description
- PostgreSQL version and configuration summary
- dataset size and tenant distribution
- load profile and concurrency
- raw latency results
- error-code distribution
- query-plan outputs
- system metrics and traces

## Execution Procedure

1. Provision a production-like isolated test environment.
2. Apply the verified schema and seed documented fixtures.
3. Warm caches using a declared procedure.
4. Run baseline single-user measurements.
5. Run representative concurrent measurements.
6. Measure CREATED, REPLAYED and CONFLICT command paths separately.
7. Measure projection processing from commit to visible projection.
8. Capture query plans, locks, CPU, memory and connection usage.
9. Preserve raw artifacts and calculate percentiles.
10. Record deviations from initial targets without altering results.

## Observed Results

| Metric | Target | Observed | Result |
|---|---:|---:|---|
| Booking Create P50 | measured | PENDING | NOT_RUN |
| Booking Create P95 | ≤ 750 ms | PENDING | NOT_RUN |
| Booking Create P99 | ≤ 1,500 ms | PENDING | NOT_RUN |
| Identity Query P95 | ≤ 100 ms | PENDING | NOT_RUN |
| Availability Claim P95 | ≤ 250 ms | PENDING | NOT_RUN |
| Projection Delay P95 | ≤ 30 s | PENDING | NOT_RUN |
| Replay Rate | measured | PENDING | NOT_RUN |
| Conflict Rate | measured | PENDING | NOT_RUN |
| Error Rate | measured | PENDING | NOT_RUN |
| Duplicate Booking Count | 0 | PENDING | NOT_RUN |
| Partial Write Count | 0 | PENDING | NOT_RUN |
| Cross-Tenant Unauthorized Read | 0 | PENDING | NOT_RUN |

## Evidence Links

- Benchmark run: PENDING
- Raw results: PENDING
- Query plans: PENDING
- Metrics dashboard/export: PENDING
- Trace bundle: PENDING

## Decision

```yaml
Status: NOT_STARTED
Decision: BLOCKED
Reason: Reproducible performance measurements have not yet been executed and attached.
Production Authority: No
```

## Production Gate

A baseline MAY be accepted only when the execution environment, load profile and raw measurements are reproducible. Missing a latency target does not permit falsifying PASS; it requires an explicit FAIL, BLOCKED decision or approved target revision through architecture governance.

---

End of Document
