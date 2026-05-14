# SANTIS_SITE — Phase D2-B3-C Workspace Isolation Report

**Date:** 2026-05-13
**Branch:** `chore/phase-d2-b3-c-workspace-isolation`
**Engineer:** Senior Staff Architect + Repo Governance Lead (Antigravity)

## Mission Summary
Executed Phase D2-B3-C. The mission was to narrow the pnpm workspace boundaries by replacing broad globs (`apps/*`, `packages/*`) with a verified public workspace allowlist. This prevents private infrastructure packages (e.g., `server/`, `packages/db/`) from being automatically included in the public monorepo structure. 

**Dependency Leak Discovery:** During initial narrowing, a critical dependency leak was detected. Public packages `sovereign-bus` and `admin-panel` depend on `@santis/event-dictionary`. To maintain `pnpm install` stability, `packages/event-dictionary` has been explicitly added to the public allowlist until these dependents can be decoupled.

## Candidate Validation Table

| Candidate Path | Exists | Has package.json | Included in allowlist | Classification | Notes |
|---|---|---|---|---|---|
| `apps/web` | ✅ Yes | ❌ No | ❌ No | **REVIEW_REQUIRED** | Missing `package.json`. |
| `packages/ui` | ✅ Yes | ✅ Yes | ✅ Yes | **PUBLIC_KEEP** | Public UI components. |
| `packages/sovereign-bus` | ✅ Yes | ✅ Yes | ✅ Yes | **PUBLIC_KEEP** | Public event bridge. |
| `packages/application` | ✅ Yes | ❌ No | ❌ No | **REVIEW_REQUIRED** | Missing `package.json`. |
| `packages/openr` | ✅ Yes | ✅ Yes | ✅ Yes | **PUBLIC_COUPLED** | Infrastructure package. |
| `packages/domain-schema` | ✅ Yes | ✅ Yes | ✅ Yes | **PUBLIC_COUPLED** | Schema package. |
| `packages/design-system` | ✅ Yes | ✅ Yes | ✅ Yes | **PUBLIC_KEEP** | Core visual silence. |
| `packages/ui-tokens` | ✅ Yes | ✅ Yes | ✅ Yes | **PUBLIC_KEEP** | Design system tokens. |
| `packages/gravity-ux-engine` | ✅ Yes | ✅ Yes | ✅ Yes | **PUBLIC_KEEP** | Core UX orchestrator. |
| `packages/event-dictionary` | ✅ Yes | ✅ Yes | ✅ Yes | **PUBLIC_COUPLED** | **LEAK DETECTED.** Required by `sovereign-bus`. |
| `admin-panel` | ✅ Yes | ✅ Yes | ✅ Yes | **PUBLIC_COUPLED** | Internal admin tool. |

## Workspace Change Summary
- **Previous broad entries:**
  - `apps/*`
  - `packages/*`
  - `admin-panel`
- **New explicit entries:**
  - `packages/ui`
  - `packages/sovereign-bus`
  - `packages/openr`
  - `packages/domain-schema`
  - `packages/design-system`
  - `packages/ui-tokens`
  - `packages/gravity-ux-engine`
  - `packages/event-dictionary`
  - `admin-panel`
- **Private workspace paths excluded:**
  - `apps/api`
  - `apps/ingestion-api`
  - `packages/db`
  - `packages/decision-kernel`

## Explicit Non-Actions
- No deletion.
- No file moves.
- No `package.json` changes.
- No `pnpm-lock.yaml` changes (Deferred).
- No `tsconfig` changes (Deferred).
- No source code changes.
- **NO `pnpm install` committed.**
- No dependency changes.
- No `audit:all` changes.

## Gate Results

| Command | Status | Notes |
|---|---|---|
| `pnpm run audit:repo-boundary` | ❌ FAIL (Expected) | High-risk paths remain. |
| `pnpm run audit:all` | ✅ PASS | Develop gates remain stable. |
| `pnpm run lint` | ✅ PASS | Turbo filters to 9 verified packages. |
| `pnpm run stitch:enforce` | ✅ PASS | Visual truth synced. |

## Final Governance Statement
"D2-B3-C narrows workspace discovery to verified public packages. Lockfile normalization and TS alias pruning remain deferred."
