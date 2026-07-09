# SLR Acceptance Seals v0.1

Date: 2026-07-09
Evaluator: `SLR-EVAL-0.1.0`
Event processor: `SLR-EVENT-0.1.0`
Scope: Test-only Shadow Living Readiness QA.

The authoritative live-board pair remains `Live_Board_Final_Gate` + `Live_Board_Final_Reason`. These acceptance seals do not promote shadow output to live authority.

## T1 — Mutation Detection Seal

Governance record: `LOCK-60 — SLR T1 Mutation Detection Seal`

Goal:

```text
NOOP
→ one real independent input change
→ WRITE_REQUIRED
→ accepted Version 2
→ repeat unchanged input
→ NOOP
```

T1 proves mutation detection and cache idempotency. A readiness-state change is not required.

PASS requires:

1. Test fixture starts at `NOOP` with recorded baseline version.
2. Exactly one independent evaluator input changes.
3. Input key changes.
4. SHA-256 fingerprint changes.
5. Cache action becomes `WRITE_REQUIRED`.
6. One new event identity exists for the new fingerprint.
7. One new evaluation identity exists for the new fingerprint.
8. Cache version increments exactly once.
9. Cache stores the new accepted input key.
10. Repeat of unchanged input creates no duplicate event or evaluation.
11. Repeat returns `NOOP` and version stays unchanged.
12. A no-op repeat does not rewrite the evaluation timestamp.
13. Final live-board authority remains untouched by the test harness.

T1 may pass with:

```text
Old State = BLOCKED
New State = BLOCKED
```

That is not T2 proof.

## T2 — Actual State Transition Seal

Governance record: `LOCK-61 — SLR T2 Actual State Transition Seal`

Goal: prove a real dominant independent input change alters semantic readiness output.

Mandatory:

```text
Old State != New State
```

Examples:

```text
BLOCKED → REVIEW
REVIEW → READY
READY → BLOCKED
READY → STALE
```

PASS requires:

1. Test fixture has a prior accepted evaluation and cache state.
2. A real dominant independent evaluator input changes.
3. Input key changes.
4. SHA-256 fingerprint changes.
5. Old readiness state differs from new readiness state.
6. Ledger retains prior evaluation and exactly one new evaluation for the new fingerprint.
7. New evaluation records exact `Previous_State` and `Readiness_State`.
8. Version increments exactly once.
9. Cache reflects the new accepted state.
10. Repeat of unchanged new input creates no duplicate event or evaluation.
11. Repeat returns `NOOP`; version stays unchanged.
12. Evidence records Input A != B, Fingerprint A != B, and Old State != New State.
13. Final live-board authority remains untouched by the test harness.

A version increment with unchanged state does not satisfy T2.

## Separation rule

- T1 PASS does not imply T2 PASS.
- T2 cannot inherit PASS from T1.
- T1 proves change detection plus idempotency.
- T2 proves actual readiness-state transition.

## Fixture policy

`#240` may be used for T1 only when the input change is Test-only, reversible, independent, and does not damage existing P0.1 evidence.

For T2, a dedicated Test fixture is preferred. `#240` is not automatically suitable because dominant blockers may mask lower-priority changes.

## Required evidence matrix

| Evidence | Baseline A | Mutated B | Repeat B |
|---|---|---|---|
| Environment | Test | Test | Test |
| Input Key | A | B | B |
| Fingerprint | A | B | B |
| Cache Action | NOOP | WRITE_REQUIRED | NOOP |
| Readiness State | Old | New/current | same as B |
| Version | n | n+1 | n+1 |
| Event identity count | 1 | 1 | 1 |
| Evaluation identity count | 1 | 1 | 1 |
| Final Gate authority | unchanged | unchanged | unchanged |

For T1, Old State may equal New State.
For T2, Old State must differ from New State.

## Seal lifecycle

```text
Ready for Test
→ Testing
→ PASS evidence complete
→ Locked
→ Verified
```

Current status on 2026-07-09:

- T1: contract defined; execution pending.
- T2: contract defined; execution pending.
- Airtable governance status: `Ready for Test`.
- Verification remains false until evidence is complete.
