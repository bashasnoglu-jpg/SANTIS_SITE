# P0.2-A.3E — Identity Evidence Reconciler Runbook

Status: **TEST-ONLY / NON-AUTHORITATIVE / FINAL GATE CUTOVER FORBIDDEN**

Contract version: `IDENTITY-RECON-0.2.0`

## Purpose

Re-read actual Airtable linked-record IDs and exact cardinality for therapist↔shift identity evidence, refresh cache fields, propagate shift-owner mutations to all impacted bookings, and protect sequential duplicate inputs with deterministic NOOP behavior.

## Safety boundary

- Write mode is **Test-only**.
- `Environment != Test` must fail before cache mutation.
- Booking `#130` is a **read-only forensic fixture**. Do not mutate its therapist or shift link during A.3E acceptance.
- Booking `#175` is the writable QA fixture for controlled mutation tests.
- `Live_Board_Final_Gate` and `Live_Board_Final_Reason` are out of scope and must not be modified.
- Native Airtable automation/webhook activation is out of scope until physically available and separately accepted.

## Runtime

```bash
node scripts/ops/identity-evidence-reconciler.mjs \
  --event-kind=booking \
  --record-id=recZXZxciP4rgZ6ik
```

Dry-run is the default. Write mode requires:

```bash
AIRTABLE_BASE_ID=app7VPfdgji5FzLHg
AIRTABLE_PAT=<secret>
IDENTITY_RECON_CONTROL_RECORD_ID=recTu7e7ohiBKOzeX
```

Then:

```bash
node scripts/ops/identity-evidence-reconciler.mjs \
  --event-kind=booking \
  --record-id=recZXZxciP4rgZ6ik \
  --write=true
```

Shift-owner event:

```bash
node scripts/ops/identity-evidence-reconciler.mjs \
  --event-kind=shift \
  --record-id=<Test Staff_Shifts record ID> \
  --write=true
```

## Booking event contract

1. Read booking from Airtable.
2. Require `Environment = Test`.
3. Read actual `Therapist_Link` and `Staff Shift Link` record IDs.
4. Resolve each linked shift and read actual `Staff_Link` record IDs.
5. Compute deterministic input fingerprint.
6. Check `Automation_Runs.Idempotency_Key`.
7. Existing successful/running/queued deterministic run → `NOOP`; do not mutate caches.
8. Otherwise clear `Identity_Reconciled_Source_Signature_v0_1` first.
9. Reconcile linked shift evidence.
10. Re-read booking and linked shifts.
11. Refresh:
   - `Linked_Shift_Staff_Record_ID`
   - `Staff_Shift_Link_Count`
   - `Identity_Reconciled_Source_Signature_v0_1`
12. Log result in `Automation_Runs`.

## Shift event contract

1. Read shift from Airtable.
2. Require `Environment = Test`.
3. Read actual `Staff_Link` record IDs and exact cardinality.
4. Scan Bookings and resolve impacted bookings by exact `Staff Shift Link` record ID.
5. Require every impacted booking to be `Environment = Test`.
6. Compute deterministic fingerprint from shift source state plus impacted booking IDs.
7. Check deterministic run key.
8. Existing successful/running/queued run → `NOOP`.
9. Otherwise clear all impacted booking reconciled signatures first.
10. Refresh shift evidence:
    - `Shift_Staff_Record_ID`
    - `Shift_Staff_Count`
    - `Shift_Identity_Reconciled_Source_Signature_v0_1`
11. Reconcile every impacted booking from actual linked-record IDs.
12. Log result in `Automation_Runs`.

## Acceptance matrix

### A. Direct booking shift-link mutation

Fixture: Booking `#175`.

Expected:

```text
Shift1 baseline
→ reconcile
→ FRESH / PASS

Shift1 → Shift2 mutation
→ event handler starts
→ reconciled signature invalidated
→ stale/BLOCK during processing
→ reread exact IDs
→ reconcile
→ FRESH / SHIFT_STAFF_IDENTITY_MISMATCH

restore Shift1
→ reconcile
→ FRESH / PASS
```

### B. Booking therapist mutation

Fixture: Test booking only.

Expected:

```text
Therapist_Link mutation
→ deterministic fingerprint changes
→ invalidate first
→ reread exact IDs
→ reconcile
→ identity result reflects current therapist vs current shift owner
```

### C. Shift-owner cross-record propagation

Fixture: isolated Test shift.

Expected:

```text
Staff_Link mutation
→ exact impacted booking set discovered by linked record ID
→ every impacted booking invalidated first
→ shift evidence reconciled
→ every impacted booking evidence refreshed
→ no impacted booking left with old reconciled signature
```

### D. Duplicate-run NOOP

Run the exact same input state twice.

Expected:

```text
run 1
→ RECONCILED
→ Automation_Runs success row with deterministic Idempotency_Key

run 2, identical source state
→ NOOP
→ no cache mutation
→ no readiness version drift caused by duplicate input
```

### E. Failure behavior

Inject or observe a reconciliation failure after invalidation.

Expected:

```text
reconciled signature remains blank/stale
→ Identity Guard remains BLOCK
→ run is Failed
→ error recorded
→ no PASS from partial execution
```

## Critical honesty boundary

The reconciler implements **fail-closed invalidation once event handling begins**. This does **not** by itself prove an end-to-end zero stale PASS window between the original Airtable mutation and event-handler start.

Therefore:

```text
NATIVE / DEPLOYED TRIGGER
= NOT PROVEN until physically wired

MUTATION → HANDLER START LATENCY
= NOT PROVEN zero

ATOMIC CONCURRENT DUPLICATE CLAIM
= NOT PROVEN by Airtable Idempotency_Key lookup alone

FINAL GATE CUTOVER
= FORBIDDEN
```

A true zero stale PASS claim requires either a synchronous write-through mutation boundary, native reactive evidence, or separately proven trigger semantics that invalidate affected bookings before any authoritative read can consume stale PASS.
