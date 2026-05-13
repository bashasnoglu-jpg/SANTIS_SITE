# SANTIS_SITE — Phase D2-B3-C Workspace Isolation Report

**Date:** 2026-05-13
**Branch:** `chore/phase-d2-b3-c-workspace-isolation`
**Engineer:** Senior Staff Architect + Repo Governance Lead (Antigravity)

## Mission Summary
Executed Phase D2-B3-C. The mission was to narrow the pnpm workspace boundaries by replacing broad globs (`apps/*`, `packages/*`) with a verified public workspace allowlist. This prevents private infrastructure packages (e.g., `server/`, `packages/db/`) from being automatically included in the public monorepo structure. All candidate paths were physically verified for the existence of a `package.json` file before inclusion.

## Candidate Validation Table

| Candidate Path | Exists | Has package.json | Included in allowlist | Classification | Notes |
|---|---|---|---|---|---|
| `apps/web` | ✅ Yes | ❌ No | ❌ No | **REVIEW_REQUIRED** | Directory exists but lacks `package.json`. Cannot be a pnpm workspace package. |
| `packages/ui` | ✅ Yes | ✅ Yes | ✅ Yes | **PUBLIC_KEEP** | Verified public UI components. |
| `packages/sovereign-bus` | ✅ Yes | ✅ Yes | ✅ Yes | **PUBLIC_KEEP** | Verified public eventing bridge. |
| `packages/application` | ✅ Yes | ❌ No | ❌ No | **REVIEW_REQUIRED** | Directory exists but lacks `package.json`. |
| `packages/openr` | ✅ Yes | ✅ Yes | ✅ Yes | **PUBLIC_COUPLED** | Verified infrastructure package. |
| `packages/domain-schema` | ✅ Yes | ✅ Yes | ✅ Yes | **PUBLIC_COUPLED** | Verified schema package. |
| `packages/design-system` | ✅ Yes | ✅ Yes | ✅ Yes | **PUBLIC_KEEP** | Core visual silence engine. |
| `packages/ui-tokens` | ✅ Yes | ✅ Yes | ✅ Yes | **PUBLIC_KEEP** | Design system tokens. |
| `packages/gravity-ux-engine` | ✅ Yes | ✅ Yes | ✅ Yes | **PUBLIC_KEEP** | Core UX orchestrator. |
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
  - `admin-panel`
- **Private workspace paths excluded:**
  - `apps/api`
  - `apps/ingestion-api`
  - `packages/db`
  - `packages/decision-kernel`
  - `packages/event-dictionary`

## Explicit Non-Actions
- No deletion.
- No file moves.
- No `package.json` changes.
- No `pnpm-lock.yaml` changes (Deferred to D2-B3-E).
- No `tsconfig` changes (Deferred to D2-B3-D).
- No source code changes.
- **NO `pnpm install`.** Workspace narrowing was performed at the definition level only.
- No dependency changes.
- No `audit:all` changes.

## Gate Results

| Command | Status | Notes |
|---|---|---|
| `pnpm run audit:repo-boundary` | ❌ FAIL (Expected) | High-risk paths remain in filesystem. |
| `pnpm run audit:all` | ✅ PASS | Develop gates remain stable. |
| `pnpm run lint` | ✅ PASS | Turbo correctly filtered scope to 8 verified packages. |
| `pnpm run stitch:enforce` | ✅ PASS | Visual truth synced. |

## Final Governance Statement
"D2-B3-C narrows workspace discovery to verified public packages. Lockfile normalization and TS alias pruning remain deferred."
