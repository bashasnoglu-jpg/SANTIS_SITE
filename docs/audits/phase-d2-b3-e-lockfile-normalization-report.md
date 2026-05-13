# SANTIS_SITE — Phase D2-B3-E Lockfile Normalization Report

**Date:** 2026-05-13
**Branch:** `chore/phase-d2-b3-e-lockfile-normalization`
**Engineer:** Senior Staff Architect + Repo Governance Lead (Antigravity)

## Mission Summary
Executed Phase D2-B3-E. The mission was to normalize `pnpm-lock.yaml` following the workspace isolation (D2-B3-C) and TS alias pruning (D2-B3-D). Running `pnpm install --lockfile-only` successfully reconciled the lockfile with the new public workspace allowlist, resulting in the removal of over 1,400 lines of configuration related to private infrastructure packages (`api`, `db`, `decision-kernel`).

## Pre-normalization Lockfile Findings

| Entry | Found? | Expected? | Notes |
|---|---|---|---|
| `apps/api` | ✅ Yes | ✅ Yes | Present before normalization. |
| `apps/ingestion-api` | ✅ Yes | ✅ Yes | Present before normalization. |
| `packages/db` | ✅ Yes | ✅ Yes | Present before normalization. |
| `packages/decision-kernel` | ✅ Yes | ✅ Yes | Present before normalization. |
| `packages/event-dictionary` | ✅ Yes | ✅ Yes | Present before normalization. |
| `@santis/db` | ✅ Yes | ✅ Yes | Present before normalization. |
| `@santis/decision-kernel` | ✅ Yes | ✅ Yes | Present before normalization. |
| `@santis/event-dictionary` | ✅ Yes | ✅ Yes | Present before normalization. |

## Lockfile Diff Summary

| Area | Change observed | Expected? | Notes |
|---|---|---|---|
| Total Lines | -1,468 | ✅ Yes | Massive pruning of private package trees. |
| `apps/api` | **REMOVED** | ✅ Yes | Correctly excluded from public lockfile. |
| `apps/ingestion-api` | **REMOVED** | ✅ Yes | Correctly excluded from public lockfile. |
| `packages/db` | **REMOVED** | ✅ Yes | Correctly excluded from public lockfile. |
| `packages/decision-kernel` | **REMOVED** | ✅ Yes | Correctly excluded from public lockfile. |
| `@santis/db` | **REMOVED** | ✅ Yes | Workspace link removed. |
| `@santis/decision-kernel` | **REMOVED** | ✅ Yes | Workspace link removed. |

## Remaining Intentional Lockfile Entries
- **`packages/event-dictionary`**: Retained. Reason: `PUBLIC_COUPLED` dependency for `sovereign-bus` and `admin-panel`.
- **`@santis/event-dictionary`**: Retained. Reason: Workspace link preserved for dependency resolution.

## Explicit Non-Actions
- No source code changes.
- No `package.json` changes.
- No `pnpm-workspace.yaml` changes.
- No `tsconfig` changes.
- No manual lockfile edit.
- No dependency additions.
- No dependency upgrades (Verified by version stability in diff).
- No file moves.
- No deletion.
- No `audit:all` changes.

## Gate Results

| Command | Status | Notes |
|---|---|---|
| `pnpm run audit:repo-boundary` | ❌ FAIL (Expected) | High-risk paths remain in filesystem. |
| `pnpm run audit:all` | ✅ PASS | Develop gates remain stable with normalized lockfile. |
| `pnpm run lint` | ✅ PASS | All public packages valid. |
| `pnpm run stitch:enforce` | ✅ PASS | Visual truth synced. |

## Final Governance Statement
"D2-B3-E normalizes lockfile state after workspace isolation while preserving public dependency integrity."
