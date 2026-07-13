# Santis OS Guard Visual Contract v1.0

Status: Canonical production standard

## Universal guard states

- NOT_EVALUATED
- PASS
- WARNING
- FAIL
- OVERRIDDEN

## Visibility contract

- PASS is invisible on operational cards.
- WARNING and FAIL are visible.
- OVERRIDDEN preserves the original result and adds audit context.
- NOT_EVALUATED is visible only when evaluation freshness or missing evidence requires intervention.

## Guard mappings

| Guard | WARNING | FAIL | Default priority |
|---|---|---|---|
| ConflictGuard | `CONFLICT_RISK` / warning icon | `CONFLICT_HARD_OVERLAP` / critical icon | P0 for hard overlap |
| BranchGuard | `BRANCH_REVIEW_REQUIRED` | `BRANCH_MISMATCH` | P1 |
| TherapistCapabilityGuard | `CAPABILITY_UNVERIFIED` | `CAPABILITY_MISMATCH` | P1 |
| PaymentGuard | `PAYMENT_PENDING` | `PAYMENT_AUTH_FAILED` | P2 |
| QuarantineGuard | `QUARANTINE_UNVERIFIED` | `QUARANTINE_FAIL` | P0 |
| DataCompletenessGuard | `RECORD_INCOMPLETE` | — | P3/P5 by field criticality |
| ManualLock | — | `MANUAL_LOCK_ACTIVE` | Policy-defined |

Icons are presentation details. Machine contracts use semantic guard and reason codes.

## Overlay rules

1. Guard overlays never replace the operational background.
2. P0/P1 may activate a 3px top incident strip.
3. Multiple guard failures remain individually discoverable.
4. Color is never the only signal.
5. Badge order follows action priority, then detection time.

## Override contract

An override stores:

- originalState
- overrideState
- reason
- approvedBy
- approvedAt
- expiresAt
- evidenceReference
- scope

The original FAIL/WARNING remains immutable in audit history. Override never converts the historical evaluation to PASS.

## Freshness

Each result includes:

- evaluatedAt
- evaluationVersion
- evidenceVersion or source revision where available

Stale results must be distinguishable from current PASS results and may create an Action Center reason.

## Frontend boundary

The frontend receives guard results and resolved badges. It must not infer PASS, WARNING, FAIL, priority, or override validity from raw booking fields.