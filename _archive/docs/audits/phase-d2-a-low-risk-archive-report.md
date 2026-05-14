# SANTIS_SITE — Phase D2-A Low-Risk Archive Report

**Date:** 2026-05-13
**Branch:** `chore/phase-d2-a-low-risk-archive`
**Auditor:** Senior Staff Architect + Repo Governance Lead (Antigravity)

## Mission Summary
Executed Phase D2-A — Low-Risk Archive. This was a narrow, quarantine-first operation targeting only low-risk, unreferenced boundary violations (`santis-os-monorepo/` and `santis-live-simulator/`). These directories were safely moved into `_archive/legacy-surfaces/` to reduce repository noise and boundary violations without touching active infrastructure, adhering to the zero-downtime doctrine.

## Moved Paths Table

| Source | Destination | Classification | Evidence | Notes |
|---|---|---|---|---|
| `santis-os-monorepo/` | `_archive/legacy-surfaces/santis-os-monorepo/` | ARCHIVE_CANDIDATE | No active references found in Phase D2 Readiness Audit. 476 MB. | Untracked by git, moved via filesystem. |
| `santis-live-simulator/` | `_archive/legacy-surfaces/santis-live-simulator/` | ARCHIVE_CANDIDATE | No active references found. | Tracked files moved via `git mv`. |

## Explicit Non-Actions
- No deletion performed.
- No runtime refactor performed.
- No infrastructure migration performed.
- No `package.json` changes performed.
- No `audit:all` changes performed.
- No `server/`, `apps/`, or `packages/` paths touched.
- No source code edited.

## Remaining Known Boundary Violations
- `server/`
- `apps/api/`
- `apps/ingestion-api/`
- `packages/db/`
- `packages/decision-kernel/`
- `packages/event-dictionary/`

*Note: These paths remain active and require careful decoupling (Phase D2-B) before they can be safely migrated.*

## Gate Results
| Command | Status | Notes |
|---|---|---|
| `pnpm run audit:repo-boundary` | ❌ FAIL | Violations reduced. The remaining high-risk paths are correctly flagged. |
| `pnpm run audit:all` | ✅ PASS | CI pipeline remains perfectly stable since `audit:repo-boundary` is manual. |
| `pnpm run lint` | ✅ PASS | 0 errors. |
| `pnpm run stitch:enforce` | ✅ PASS | Visual truth synced. |

## Final Governance Statement
D2-A reduced low-risk boundary noise without touching active infrastructure. D2-B remains required for private OS migration planning.
