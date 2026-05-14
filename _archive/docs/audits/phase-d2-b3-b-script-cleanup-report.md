# SANTIS_SITE — Phase D2-B3-B Script Cleanup Report

**Date:** 2026-05-13
**Branch:** `chore/phase-d2-b3-b-script-cleanup`
**Engineer:** Senior Staff Architect + Repo Governance Lead (Antigravity)

## Mission Summary
Executed Phase D2-B3-B. The goal was to redirect root-level private database scripts (`db:push`, `db:migrate`) to a formal migration notice. This removes the direct coupling between the public repository scripts and the private infrastructure (`@santis/db`) while preserving developer clarity. Commands now fail with an explicit `[PRIVATE_MOVED]` message rather than being removed silently.

## Files Changed Table

| File | Change type | Private dependency removed | Notes |
|---|---|---|---|
| `package.json` | Modified | `@santis/db` | Redirected `db:push` and `db:migrate` to helper. |
| `scripts/active/private-script-moved.mjs` | Created | N/A | New helper for migration notices. |

## Script Behavior Table

| Script | Previous behavior | New behavior | Exit code | Rationale |
|---|---|---|---|---|
| `db:push` | `pnpm --filter @santis/db db:push` | Logs `[PRIVATE_MOVED]` message | 1 | Boundary enforcement. |
| `db:migrate` | `pnpm --filter @santis/db db:migrate` | Logs `[PRIVATE_MOVED]` message | 1 | Boundary enforcement. |

## Explicit Non-Actions
- No deletion.
- No workspace changes (`pnpm-workspace.yaml` untouched).
- No lockfile changes (`pnpm-lock.yaml` untouched).
- No tsconfig changes.
- No server/apps/packages changes.
- No dependency changes.
- No audit:all changes.
- No runtime source changes.

## Gate Results

| Command | Status | Notes |
|---|---|---|
| `pnpm run db:push` | ❌ FAIL (Expected) | Successfully logged `[PRIVATE_MOVED]` and exited with 1. |
| `pnpm run db:migrate` | ❌ FAIL (Expected) | Successfully logged `[PRIVATE_MOVED]` and exited with 1. |
| `pnpm run audit:repo-boundary` | ❌ FAIL (Expected) | Found active violations (High-risk paths remain). |
| `pnpm run audit:all` | ✅ PASS | Develop gates remain stable. |
| `pnpm run lint` | ✅ PASS | 0 errors. |
| `pnpm run stitch:enforce` | ✅ PASS | Visual truth synced. |

## Final Governance Statement
"D2-B3-B removes root DB command coupling without deleting developer intent. Private DB operations must run from the private Santis OS repository."
