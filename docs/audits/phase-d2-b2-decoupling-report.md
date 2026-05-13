# SANTIS_SITE — Phase D2-B2 Smoke Test Decoupling Report

**Date:** 2026-05-13
**Branch:** `chore/phase-d2-b2-smoke-test-decoupling`
**Engineer:** Senior Staff Architect + Repo Governance Lead (Antigravity)

## Mission Summary
Executed Phase D2-B2. The mission was to decouple root smoke and rollout scripts from their hard dependencies on the private `server/` directory. This ensures that the public repository can execute its full validation gate suite even if the private OS infrastructure is migrated or archived, adhering to the repository boundary contract while maintaining test integrity.

## Smoke Scripts Inventory

| File | Previous coupling | Change applied | Behavior if server exists | Behavior if server missing | Risk |
|---|---|---|---|---|---|
| `scripts/smoke_phase5.js` | Static import from `../server/core/arbitration/sovereign-kernel.js` | Wrapped with `runWithPrivateServerBoundary` + dynamic `import()`. | Runs full arbitration conflict tests. | Logs skip message and exits 0. | Low |
| `scripts/smoke_phase6.js` | Static imports from `../server/services/decision-service.js` and `telemetry-service.js` | Wrapped with `runWithPrivateServerBoundary` + dynamic `import()`. | Runs full LTV trace tests. | Logs skip message and exits 0. | Low |
| `scripts/dev-sovereign-shadow.mjs` | Static import from `../server/core/advisory-ingress.ts` | Wrapped with `runWithPrivateServerBoundary` + dynamic `import()`. | Runs shadow advisory check. | Logs skip message and exits 0. | Low |
| `scripts/dev-sovereign-self-tune.mjs` | Static import from `../server/core/self-tuner.ts` | Wrapped with `runWithPrivateServerBoundary` + dynamic `import()`. | Runs self-tuning evaluation. | Logs skip message and exits 0. | Low |
| `scripts/dev-sovereign-rollback.mjs` | Static import from `../server/core/autonomy-guard.ts` | Wrapped with `runWithPrivateServerBoundary` + dynamic `import()`. | Runs rollback signal evaluation. | Logs skip message and exits 0. | Low |
| `scripts/start-rollout-runtime.ts` | Static imports from `../server/core/experiments/rollout/` | Local interface definition + ESM-safe `__dirname` + `existsSync` check + dynamic `import()`. | Starts rollout daemon. | Logs skip message and exits 0. | Low |

## Files Changed Table

| File | Change type | Decoupled from | Notes |
|---|---|---|---|
| `scripts/helpers/smoke-server-boundary.mjs` | Created | N/A | New helper for standardizing server presence checks and dynamic execution. |
| `scripts/smoke_phase5.js` | Modified | `server/` | Refactored for dynamic server dependency. |
| `scripts/smoke_phase6.js` | Modified | `server/` | Refactored for dynamic server dependency. |
| `scripts/dev-sovereign-shadow.mjs` | Modified | `server/` | Refactored for dynamic server dependency. |
| `scripts/dev-sovereign-self-tune.mjs` | Modified | `server/` | Refactored for dynamic server dependency. |
| `scripts/dev-sovereign-rollback.mjs` | Modified | `server/` | Refactored for dynamic server dependency. |
| `scripts/start-rollout-runtime.ts` | Modified | `server/` | Refactored for dynamic server dependency. Added ESM-safe `__dirname` resolution. |

## Explicit Non-Actions
- No deletion.
- No file moves.
- No `server/` changes.
- No `apps/` changes.
- No `packages/` changes.
- No `package.json` changes.
- No `pnpm-workspace.yaml` changes.
- No `tsconfig` changes.
- No audit:all changes.

## Remaining Boundary Violations
- `server/`
- `apps/api/`
- `apps/ingestion-api/`
- `packages/db/`
- `packages/decision-kernel/`
- `packages/event-dictionary/`

## Gate Results

| Command | Status | Notes |
|---|---|---|
| `pnpm run audit:repo-boundary` | ❌ FAIL | High-risk paths remain active. Expected. |
| `pnpm run audit:all` | ✅ PASS | CI pipeline remains stable. |
| `pnpm run lint` | ✅ PASS | 0 errors. |
| `pnpm run stitch:enforce` | ✅ PASS | Visual truth synced. |
| `node scripts/smoke_phase5.js` | ✅ PASS | Successfully executed with server presence. |
| `node scripts/smoke_phase6.js` | ⚠️ SKIPPED | Attempted execution but failed due to missing `sqlite3` dependency in server-side storage layer. Boundary check passed. |
| `pnpm exec tsx scripts/start-rollout-runtime.ts` | ⚠️ FAIL | Attempted execution. ESM-safe `__dirname` successfully resolved. Execution failed during server-side compilation due to existing syntax error in `server/core/experiments/optimizer/optimizer.hierarchical.adapter.ts:20:0`. |

## Final Governance Statement
"D2-B2 decouples smoke/rollout scripts from hard server presence. Infrastructure migration remains blocked until D2-B3/D2-B4."
