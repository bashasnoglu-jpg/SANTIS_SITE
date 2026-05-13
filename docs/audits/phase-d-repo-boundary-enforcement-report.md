# SANTIS_SITE — Phase D1 Guardrail Staging Report

**Date:** 2026-05-13
**Branch:** `chore/phase-d-repo-boundary-enforcement`
**Auditor:** Senior Staff Architect + Repo Governance Lead (Antigravity)

## Mission Summary
Implemented Phase D1 Guardrail Staging. This step creates the script for repo boundary enforcement but intentionally keeps it manual (`audit:repo-boundary`). It is intentionally not wired into `audit:all` yet because active violations still exist in the repository.

Follow-up Phase D2 will wire `audit:repo-boundary` into `audit:all` only after the currently detected violations are safely archived or migrated.

## Forbidden Active Paths
- `server/`
- `nexus-signaling-server/`
- `apps/api/`
- `apps/ingestion-api/`
- `packages/db/`
- `packages/decision-kernel/`
- `packages/event-dictionary/`
- `santis-os-monorepo/`
- `santis-live-simulator/`

## Allowed Exceptions
- `_archive/**`
- `docs/**`
- `scripts/active/audit-repo-boundary.mjs`

## Files Changed / Commands Added
- **Created:** `scripts/active/audit-repo-boundary.mjs`
- **Updated:** `package.json`
  - Added `"audit:repo-boundary": "node scripts/active/audit-repo-boundary.mjs"`
- **Created:** `docs/audits/phase-d-repo-boundary-enforcement-report.md`

## Detected Active Violations
The initial manual run detected the following operational paths in the public site repository that violate the boundary defined in `docs/REPO_BOUNDARY.md`:
- `server`
- `apps/api`
- `apps/ingestion-api`
- `packages/db`
- `packages/decision-kernel`
- `packages/event-dictionary`
- `santis-os-monorepo`
- `santis-live-simulator`

## Gate Results
| Command | Status | Notes |
|---|---|---|
| `pnpm run audit:repo-boundary` | ❌ **FAIL** | Found active violations (expected during D1). |
| `pnpm run audit:all` | ✅ **PASS** | `audit:all` is intentionally not wired yet, allowing `develop` tests to pass. |
| `pnpm run lint` | ✅ **PASS** | 0 errors |
| `pnpm run stitch:enforce` | ✅ **PASS** | Visual truth synced. |

## Explicit Non-Actions
- No deletion.
- No archive move.
- No runtime refactor.
- No dependency change.
- `audit:all` not changed.

## Final Governance Statement
Phase D1 successfully introduces the boundary enforcement guardrail in a manual staging mode. `audit:all` stability is preserved. Violations will be resolved in subsequent steps prior to D2 integration.
