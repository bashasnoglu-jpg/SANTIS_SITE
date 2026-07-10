# P0.2-A.3G — Synchronous Identity Invalidation Boundary

Status: **TEST-ONLY / DRAFT / FINAL GATE CUTOVER FORBIDDEN**

Contract: `IDENTITY-WRITE-THROUGH-0.1.0`

## Why this boundary exists

A.3F physically proved asymmetric staleness:

```text
Shift Staff_Link changes
→ Shift freshness becomes STALE
→ impacted bookings can still remain FRESH/PASS
```

An asynchronous webhook alone cannot prove a zero-stale window because mutation can occur before handler start. The A.3G write-through boundary therefore changes the order of operations:

```text
1. discover impacted bookings by exact linked shift record ID
2. invalidate impacted bookings
3. reread and verify every impacted booking is non-FRESH
4. reread shift and verify expected current owner
5. only then mutate Staff_Link
6. reconcile shift identity evidence
7. reconcile every impacted booking
8. log run
```

## Endpoint

```text
POST /api/v1/reception/identity/shift-owner/write-through
```

Required header:

```text
x-santis-identity-boundary-secret: <secret>
```

Required runtime configuration:

```text
AIRTABLE_BASE_ID=app7VPfdgji5FzLHg
AIRTABLE_PAT=<Test-scoped PAT>
IDENTITY_BOUNDARY_SHARED_SECRET=<secret>
IDENTITY_RECON_CONTROL_RECORD_ID=recTu7e7ohiBKOzeX
```

Optional table overrides:

```text
IDENTITY_RECON_BOOKINGS_TABLE=tblocCFVgSNfaLAH6
IDENTITY_RECON_SHIFTS_TABLE=tblQjvfz4ljnvCl1R
IDENTITY_RECON_RUNS_TABLE=tblZfL6UuOfxz3On1
```

## Request contract

```json
{
  "correlation_id": "A3G-QA-20260710-T1-TO-T2",
  "shift_record_id": "recM6KGAwAje9Nopj",
  "expected_current_staff_record_ids": ["recjcknHE0T70Ldm0"],
  "new_staff_record_ids": ["recFQE7i08tUxhCEt"]
}
```

The current A.3G boundary permits exactly one shift owner ID. Multi-owner shifts are outside this acceptance contract and must fail validation.

## Test fixture

Shift:

```text
Shift1
recM6KGAwAje9Nopj
Environment = Test
```

Impacted bookings:

```text
#175 recZXZxciP4rgZ6ik
#266 recPwTnjUAhQ8cIUc
#267 recAssjwdeUujUuwq
```

Therapists:

```text
Therapist1 recjcknHE0T70Ldm0
Therapist2 recFQE7i08tUxhCEt
```

## Acceptance A — T1 → T2 write-through

Precondition:

```text
Shift1 owner = Therapist1
all 3 bookings = FRESH/PASS
```

Invoke the boundary once.

Required evidence:

```text
impact_count = 3
impacted_booking_ids = exact #175/#266/#267 set
invalidated_at <= shift_mutated_at
boundary_order_proven = true
```

The service must verify all three bookings are non-FRESH before it writes the new `Staff_Link`.

Expected final state:

```text
Shift1 owner = Therapist2
Shift freshness = FRESH - SOURCE_MATCH
#175 = FRESH + BLOCK - SHIFT_STAFF_IDENTITY_MISMATCH
#266 = FRESH + BLOCK - SHIFT_STAFF_IDENTITY_MISMATCH
#267 = FRESH + BLOCK - SHIFT_STAFF_IDENTITY_MISMATCH
```

## Acceptance B — deterministic duplicate NOOP

Repeat the exact same request with the exact same correlation ID and source state.

Expected:

```text
status = NOOP
no shift mutation
no booking cache mutation
existing successful run reused
```

This proves sequential duplicate suppression only. It does not prove atomic distributed concurrency.

## Acceptance C — restore T2 → T1

Use a new correlation ID and expected current owner Therapist2.

Expected final state:

```text
Shift1 owner = Therapist1
Shift freshness = FRESH
#175 = FRESH/PASS
#266 = FRESH/PASS
#267 = FRESH/PASS
```

## Acceptance D — optimistic race failure

Send a request whose `expected_current_staff_record_ids` no longer equals the current `Staff_Link` state.

Expected:

```text
impacted bookings invalidated first
current shift owner reread
expected/current mismatch detected
shift mutation aborted
run Failed / Claim CONFLICT
impacted bookings remain STALE/BLOCK
```

This is fail-closed optimistic concurrency, not a distributed transaction.

## Native trigger status

```text
Native Airtable automation/webhook deployment = NOT PROVEN
```

The connected Airtable tool surface used during A.3G does not expose create/enable webhook or automation actions. A native trigger must not be claimed until a webhook/automation is physically created, identified, enabled and observed firing without operator initiation.

## Zero-stale honesty boundary

The write-through boundary can prove ordering **only for mutations routed through the boundary**:

```text
invalidate/verify
→ mutate shift owner
```

It cannot make this global claim:

```text
all Airtable Staff_Link edits everywhere are zero-stale
```

because:

- direct Airtable edits can bypass the boundary
- process-local `asyncio.Lock` is not a distributed lock
- another external writer can race after the last impacted-set reread
- Airtable does not provide a transaction spanning bookings and shift records through this runtime

Therefore Final Gate cutover remains forbidden until the approved operational write path is proven to route all authoritative shift-owner mutations through the boundary or an equivalent native computed safety dependency is added.

## Forbidden claims before physical runtime proof

```text
Native trigger deployed ❌
Real PAT execution passed ❌
Global zero-stale guaranteed ❌
Atomic distributed concurrency proven ❌
Final Gate cutover allowed ❌
```
