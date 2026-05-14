# SANTIS_SITE — Phase D2-B4 Readiness Audit Report

**Date:** 2026-05-13
**Branch:** `docs/phase-d2-b4-readiness-audit`
**Engineer:** Senior Staff Architect + Physical Boundary Auditor (Antigravity)

## Mission Summary
Executed Phase D2-B4 Readiness Audit. The goal was to assess the physical state of the repository following the successful unlinking of private infrastructure from public configuration (D2-B3). This audit identifies remaining physical coupling and classifies target directories for future archival or private migration.

## Doctrine / Explicit Non-Actions
- **STRICT READ-ONLY AUDIT.**
- No deletion.
- No file moves.
- No archive moves.
- No source code changes.
- No package.json/workspace/lockfile changes.
- No dependency changes.

## Current Post-D2-B3 Boundary State
- **Workspace:** Explicit public allowlist enforced. Private paths excluded.
- **TS Config:** Private `db` and `decision-kernel` aliases pruned.
- **Lockfile:** Normalized to public boundary. Private dependencies removed.
- **event-dictionary:** Retained as `PUBLIC_COUPLED` due to active dependents (`sovereign-bus`, `admin-panel`).

## Target Readiness Matrix

| Path | Exists | Tracked | Config Links | Active Refs | Runtime Safety | Risk Level | Classification | Recommended Action |
|---|---|---|---|---|---|---|---|---|
| `server/` | ✅ Yes | ✅ Yes | ❌ No | ⚠️ **HIGH** | ⚠️ **FAIL** | **CRITICAL** | **BLOCKED_BY_REF** | Refactor smoke scripts. |
| `apps/api/` | ✅ Yes | ✅ Yes | ❌ No | ✅ None | ✅ Safe | **LOW** | **READY_TO_MIGRATE** | Migration Manifest. |
| `apps/ingestion-api/` | ✅ Yes | ✅ Yes | ❌ No | ✅ None | ✅ Safe | **LOW** | **READY_TO_MIGRATE** | Migration Manifest. |
| `packages/db/` | ✅ Yes | ✅ Yes | ❌ No | ✅ None | ✅ Safe | **LOW** | **READY_TO_MIGRATE** | Migration Manifest. |
| `packages/decision-kernel/` | ✅ Yes | ✅ Yes | ❌ No | ✅ None | ✅ Safe | **LOW** | **READY_TO_MIGRATE** | Migration Manifest. |

## Detailed Findings per Target

### 1. server/
- **Filesystem Status:** Primary private infrastructure directory.
- **Config Status:** Fully unlinked from `pnpm-workspace.yaml`.
- **Reference Evidence:** Multiple `run-*-smoke.ts` scripts (e.g., `run-rollout-smoke.ts`, `run-optimizer-smoke.ts`) contain top-level static imports from `./server/...`.
- **Runtime Risk:** **CRITICAL BLOCKER.** If `server/` is moved, these scripts will fail immediately during module resolution, regardless of boundary checks.
- **Recommendation:** Must refactor smoke scripts to use dynamic `import()` behind the `runWithPrivateServerBoundary` check before `server/` can be hardened.

### 2. apps/ (api & ingestion-api)
- **Filesystem Status:** Isolated application directories.
- **Config Status:** Excluded from workspace and lockfile.
- **Reference Evidence:** Zero active references found in public source code.
- **Recommendation:** Ready for migration to private infrastructure. Requires a migration manifest to preserve canonical infra value.

### 3. packages/ (db & decision-kernel)
- **Filesystem Status:** Isolated infrastructure packages.
- **Config Status:** Pruned from `tsconfig.base.json`, workspace, and lockfile.
- **Reference Evidence:** Zero active references found in public source code.
- **Recommendation:** Ready for migration/archival.

## event-dictionary Exclusion Note
`packages/event-dictionary/` is **EXCLUDED** from Phase D2-B4 hardening.
- **Status:** `PUBLIC_COUPLED`.
- **Dependents:** `packages/sovereign-bus`, `admin-panel`.
- **Precondition for Removal:** Decouple public eventing from private dictionary definitions or implement a shared public contract package.

## Proposed D2-B4 Execution Roadmap
- **D2-B4-A: Smoke Script Boundary Refactor.** (Dynamic imports).
- **D2-B4-B: Private Migration Manifest Creation.**
- **D2-B4-C: Physical Archival — Apps & Packages.**
- **D2-B4-D: Physical Archival — Server.**
- **D2-B4-E: Hard Gate Integration.** Wire `audit:repo-boundary` into `audit:all`.

## Risk Matrix

| Area | Risk Level | Why Risky | Safe First Action | Must Not Do |
|---|---|---|---|---|
| Smoke Tests | **CRITICAL** | Static imports break on file move. | Refactor to dynamic import. | Archive `server/` blindly. |
| DB Integrity | **MEDIUM** | Private data schema loss. | Create Migration Manifest. | Delete `packages/db`. |
| Workspace | **LOW** | Accidental config drift. | Keep `event-dictionary`. | Remove coupled deps. |

## Gate Results Baseline

| Command | Status | Notes |
|---|---|---|
| `pnpm run audit:repo-boundary` | ❌ FAIL (Expected) | Physical violations detected as planned. |
| `pnpm run audit:all` | ✅ PASS | Develop configuration is stable. |
| `pnpm run lint` | ✅ PASS | Scope narrowed to 9 public packages. |
| `pnpm run stitch:enforce` | ✅ PASS | Visual truth synced. |

## Final Governance Statement
"D2-B4 execution remains blocked until Boardroom approves per-path migration/archive actions based on this readiness audit. Refactoring of static imports in smoke scripts is the primary technical precondition."
