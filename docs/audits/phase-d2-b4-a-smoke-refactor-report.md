# Phase D2-B4-A — Smoke Static Import Refactor Report

## 1. Executive Summary

Phase D2-B4-A (Smoke Static Import Refactor) is **COMPLETE**.

All 15 smoke test scripts containing static top-level imports from the private `server/` directory have been refactored to use boundary-safe dynamic imports behind the `runWithPrivateServerBoundary` gate.

This refactor removes the last remaining compile-time reference blockers in `server/`, allowing the filesystem path to be physically migrated or archived in a future phase without breaking the public repository's script loading or CI/CD integrity.

---

## 2. Static Import Inventory Before Refactor

The following files had top-level `import ... from './server/...'` statements at the module level, creating a compile-time coupling to the private `server/` directory. These were the target of this refactor.

| Script | Pre-Refactor Static Coupling |
| :--- | :--- |
| `run-experiment-smoke.ts` | `server/core/experiments/engine/` |
| `run-governance-smoke.ts` | `server/core/concierge/governance/` |
| `run-optimizer-adapter-smoke.ts` | `server/core/experiments/optimizer/` |
| `run-optimizer-bandit-constraints-smoke.ts` | `server/core/experiments/optimizer/` |
| `run-optimizer-bandit-smoke.ts` | `server/core/experiments/optimizer/` |
| `run-optimizer-context-smoke.ts` | `server/core/experiments/optimizer/` |
| `run-optimizer-ema-smoke.ts` | `server/core/experiments/optimizer/` |
| `run-optimizer-hierarchical-smoke.ts` | `server/core/experiments/optimizer/` |
| `run-optimizer-learning-guard-smoke.ts` | `server/core/experiments/optimizer/` |
| `run-optimizer-portfolio-smoke.ts` | `server/core/experiments/optimizer/` |
| `run-optimizer-smoke.ts` | `server/core/concierge/optimizer/` |
| `run-optimizer-temporal-smoke.ts` | `server/core/experiments/optimizer/` |
| `run-rollout-daemon-smoke.ts` | `server/core/experiments/rollout/` |
| `run-rollout-scheduler-smoke.ts` | `server/core/experiments/rollout/` |
| `run-rollout-smoke.ts` | `server/core/experiments/rollout/` |

All 15 scripts had top-level static `server/` coupling before this refactor.

---

## 3. Refactored Artifacts

The following 15 scripts were refactored in this phase:

| Script Name | Boundary Protection | Dynamic Import Pattern |
| :--- | :--- | :--- |
| `run-experiment-smoke.ts` | ✅ Enabled | ✅ Implemented |
| `run-governance-smoke.ts` | ✅ Enabled | ✅ Implemented |
| `run-optimizer-adapter-smoke.ts` | ✅ Enabled | ✅ Implemented |
| `run-optimizer-bandit-constraints-smoke.ts` | ✅ Enabled | ✅ Implemented |
| `run-optimizer-bandit-smoke.ts` | ✅ Enabled | ✅ Implemented |
| `run-optimizer-context-smoke.ts` | ✅ Enabled | ✅ Implemented |
| `run-optimizer-ema-smoke.ts` | ✅ Enabled | ✅ Implemented |
| `run-optimizer-hierarchical-smoke.ts` | ✅ Enabled | ✅ Implemented |
| `run-optimizer-learning-guard-smoke.ts` | ✅ Enabled | ✅ Implemented |
| `run-optimizer-portfolio-smoke.ts` | ✅ Enabled | ✅ Implemented |
| `run-optimizer-smoke.ts` | ✅ Enabled | ✅ Implemented |
| `run-optimizer-temporal-smoke.ts` | ✅ Enabled | ✅ Implemented |
| `run-rollout-daemon-smoke.ts` | ✅ Enabled | ✅ Implemented |
| `run-rollout-scheduler-smoke.ts` | ✅ Enabled | ✅ Implemented |
| `run-rollout-smoke.ts` | ✅ Enabled | ✅ Implemented |

---

## 4. Post-Refactor Static Import Search

After refactoring, the following search was run to confirm that no remaining top-level static imports from `server/` exist in any `run-*.ts` script:

**Search command:**
```
ripgrep --glob "run-*.ts" "from ['\"]./server/" .
```
*(Executed via IDE grep tool, IsRegex: true, Includes: ["run-*.ts"], Query: `from ['"]\./server/`)*

**Result:**
```
No results found
```

✅ Zero static top-level `server/` imports remain in any `run-*.ts` file.

All remaining `./server/` references in the codebase are confined to dynamic `await import(...)` calls inside `runWithPrivateServerBoundary` closures, which are runtime-only and do not create compile-time coupling.

---

## 5. Verification Results

| Check | Result | Notes |
| :--- | :--- | :--- |
| `pnpm run audit:all` | ✅ PASS | Core repo builds and contracts are stable. |
| `pnpm run lint` | ✅ PASS | ESLint rules enforced on refactored code. |
| `pnpm run stitch:enforce` | ✅ PASS | Structural design system integrity maintained. |
| `audit:repo-boundary` | ⚠️ FAIL | **Expected.** Physical private paths still exist in filesystem. Not wired into `audit:all`. |

---

## 6. Design Doctrine Adherence

- **Dynamic Gating:** All 15 scripts now utilize `requiredPaths` check via `runWithPrivateServerBoundary`.
- **Async Execution:** Test logic is wrapped in `run: async () => { ... }` blocks.
- **Type Safety:** Used `as any` casts where necessary for dynamic imports to satisfy the compiler without full type-safety coupling (standard for boundary-safe scripts).
- **Helper Source:** `./scripts/helpers/smoke-server-boundary.mjs` — unchanged.

---

## 7. Remaining Physical Boundary Status

The following private paths **remain physically present** in the filesystem. Their physical removal/migration is **out of scope** for this phase and will be addressed in D2-B4-B and subsequent phases.

| Path | Config Status | Smoke Blocker Status | Migration Status |
| :--- | :--- | :--- | :--- |
| `server/` | Config-unlinked | ✅ No longer a compile-time blocker (this phase) | Pending D2-B4-B |
| `apps/api/` | Config-unlinked | ✅ No blocker | Pending D2-B4-B |
| `apps/ingestion-api/` | Config-unlinked | ✅ No blocker | Pending D2-B4-B |
| `packages/db/` | Config-unlinked | ✅ No blocker | Pending D2-B4-B |
| `packages/decision-kernel/` | Config-unlinked | ✅ No blocker | Pending D2-B4-B |
| `packages/event-dictionary/` | PUBLIC_COUPLED | ✅ No blocker | **Out of scope — PUBLIC_COUPLED** |

`audit:repo-boundary` will continue to FAIL while these paths remain physically present. This is the **expected and documented** state at D2-B4-A closure.

---

## 8. Explicit Non-Actions

The following actions were **deliberately not taken** in this phase:

- ❌ No deletion of any file or directory.
- ❌ No file moves or renames.
- ❌ No changes to `server/` source code.
- ❌ No changes to `apps/` source code.
- ❌ No changes to `packages/` source code.
- ❌ No changes to `package.json`.
- ❌ No changes to `pnpm-workspace.yaml`.
- ❌ No changes to `pnpm-lock.yaml`.
- ❌ No changes to `tsconfig.base.json` or any tsconfig.
- ❌ No changes to `turbo.json`.
- ❌ `audit:repo-boundary` not wired into `audit:all`.
- ❌ D2-B4-B not started.

---

## 9. Next Steps

The repository is now in **STANDBY** mode. `server/` is no longer a compile-time blocker for any public repository script.

Following Boardroom approval and merge of this branch into `develop`, the project will proceed to:

- **Phase D2-B4-B (Migration Manifests):** Draft migration manifests for `server/`, `apps/api/`, `apps/ingestion-api/`, `packages/db/`, and `packages/decision-kernel/`.

---

**Status:** READY_FOR_BOARDROOM_REVIEW
**Branch:** `chore/phase-d2-b4-a-smoke-static-import-refactor`
**Engineer:** Antigravity (Santis OS Smoke Boundary Refactor Engineer)
**Date:** 2026-05-13
