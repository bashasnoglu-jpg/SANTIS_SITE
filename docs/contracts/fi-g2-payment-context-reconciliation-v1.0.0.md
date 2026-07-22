# FI-G2 Payment Context Reconciliation v1.0.0

## Contract identity

- Contract: `FI-G2-PAYMENT-CONTEXT-RECONCILIATION-v1.0.0`
- Reference authority: Airtable controlled reconciliation worker
- Mirror implementation: FastAPI read-only payment-context guard
- Freshness model: canonical current signature equals reconciled signature
- Failure model: fail closed

## Airtable reference acceptance

### Positive fixture — QA240

- Payment: `PAY-QA240-BOOKING-297-TEST`
- Payment record ID: `recMyLfFWt5QmNb2Q`
- Expected result: `PAYMENT_CONTEXT_PASS`
- Second real-trigger reconciliation: PASS
- Duplicate financial side effect: none

### Negative fixture — QA241

- Payment: `PAY-QA241-FI-G2-NEG-USD-TEST`
- Payment record ID: `recxjEKYMQDio6cb9`
- Currency: `USD`
- Expected blocker: `UNSUPPORTED_CURRENCY`
- Expected automation behavior: trigger succeeds, worker fails closed
- Automation audit: one `Blocked` run with matching source and target IDs
- Commission Ledger entries: `0`

QA240 and QA241 are permanent acceptance evidence. Do not delete, repurpose, or rerun them without a new controlled test plan.

## Mirror endpoint

```text
GET /api/v1/payment-context/{payment_record_id}/validate
```

The endpoint reads the Payment and its single linked Booking from Airtable. It performs no Airtable writes and creates no Commission Ledger records.

- PASS: HTTP `200`
- BLOCKED: HTTP `409`
- Invalid record ID: HTTP `422`
- Missing Payment: HTTP `404`
- Airtable configuration/network failure: HTTP `502` or `503`

## Stable blocker order

Structural and exact-context blockers are evaluated before freshness blockers:

1. `ENVIRONMENT_NOT_TEST`
2. `PAYMENT_BOOKING_CARDINALITY`
3. `PAYMENT_TENANT_CARDINALITY`
4. `PAYMENT_LOCATION_CARDINALITY`
5. `UNSUPPORTED_CURRENCY`
6. `CURRENT_SIGNATURE_MISSING`
7. `LINKED_BOOKING_NOT_FOUND`
8. `BOOKING_TENANT_CARDINALITY`
9. `BOOKING_LOCATION_CARDINALITY`
10. `TENANT_MISMATCH`
11. `LOCATION_MISMATCH`
12. `ENVIRONMENT_MISMATCH`
13. `PAYMENT_CONTEXT_NEVER_RECONCILED`
14. `PAYMENT_CONTEXT_SOURCE_CHANGED`

Freshness blockers are evaluated only when the structural/context blocker list is empty. This preserves the accepted QA241 result as the single blocker `UNSUPPORTED_CURRENCY`.

## Exact-ID rules

- Payment must link to exactly one Booking, Tenant, and Location.
- Booking must link to exactly one Tenant and Location.
- Payment and Booking Tenant record IDs must match exactly.
- Payment and Booking Location record IDs must match exactly.
- Payment and Booking Environment values must match exactly.
- Display names and labels are not identity authority.

## Currency scope

- `EUR`: supported
- Empty currency: supported only as accepted legacy scope; the canonical signature remains authoritative
- Any other value, including `USD`: `UNSUPPORTED_CURRENCY`

## Mutation boundary

This mirror release is validation-only. It must not:

- update Payment reconciliation fields,
- write snapshot fields,
- create or update Commission Ledger records,
- trigger commission runtime,
- silently continue after a blocker.

Financial mutation wiring requires a separate acceptance step after this read-only mirror passes CI and review.
