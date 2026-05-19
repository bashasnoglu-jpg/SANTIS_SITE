# SANTIS_SITE — Phase D2-B3-D TS Alias Pruning Report

**Date:** 2026-05-13
**Branch:** `chore/phase-d2-b3-d-ts-alias-pruning`
**Engineer:** Senior Staff Architect + Repo Governance Lead (Antigravity)

## Mission Summary
Executed Phase D2-B3-D. The mission was to synchronize TypeScript path aliases in `tsconfig.base.json` with the new workspace boundary. Aliases pointing to private packages removed from the workspace (`@santis/db`, `@santis/decision-kernel`) were pruned after verifying zero active references in the public codebase. Aliases for packages still in the workspace or marked as `REVIEW_REQUIRED` were preserved to maintain system stability.

## Alias Decision Table

| Alias | Previous target | Decision | Active references found | Action taken | Notes |
|---|---|---|---|---|---|
| `@santis/db` | `packages/db/src/index.ts` | **REMOVE_NOW** | 0 | **REMOVED** | Verified zero usage. |
| `@santis/decision-kernel` | `packages/decision-kernel/src/index.ts` | **REMOVE_NOW** | 0 | **REMOVED** | Verified zero usage. |
| `@santis/event-dictionary` | `packages/event-dictionary/src/index.ts` | **KEEP_TEMPORARILY** | 3 | **KEPT** | Required by `sovereign-bus` and `admin-panel`. |
| `@santis/application` | `packages/application/src/index.ts` | **REVIEW_REQUIRED** | 0 | **KEPT** | Deferred as per governance rules. |
| `@santis/openr` | `packages/openr/src/index.ts` | **REVIEW_REQUIRED** | 0 | **KEPT** | Deferred as per governance rules. |
| `@santis/domain-schema` | `packages/domain-schema/src/index.ts` | **REVIEW_REQUIRED** | 0 | **KEPT** | Deferred as per governance rules. |
| `@santis/ui` | `packages/ui/src/index.ts` | **KEEP** | Many | **KEPT** | Core public package. |
| `@santis/sovereign-bus` | `packages/sovereign-bus/src/index.ts` | **KEEP** | Many | **KEPT** | Core public package. |

## Removed Aliases Table

| Alias | Target | Evidence | Notes |
|---|---|---|---|
| `@santis/db` | `packages/db/src/index.ts` | `grep` search returned 0 results. | Safe to remove. |
| `@santis/db/*` | `packages/db/src/*` | `grep` search returned 0 results. | Safe to remove. |
| `@santis/decision-kernel` | `packages/decision-kernel/src/index.ts` | `grep` search returned 0 results. | Safe to remove. |
| `@santis/decision-kernel/*` | `packages/decision-kernel/src/*` | `grep` search returned 0 results. | Safe to remove. |

## Kept Aliases Table

- **`@santis/event-dictionary`**: Maintained due to active references from public packages.
- **`@santis/sovereign-bus`**: Maintained (Public Core).
- **`@santis/ui`**: Maintained (Public Core).
- **`@santis/application`**: Maintained (REVIEW_REQUIRED).
- **`@santis/openr`**: Maintained (REVIEW_REQUIRED).
- **`@santis/domain-schema`**: Maintained (REVIEW_REQUIRED).

## Explicit Non-Actions
- No deletion.
- No source code changes.
- No `package.json` changes.
- No `pnpm-workspace.yaml` changes.
- No `pnpm-lock.yaml` changes.
- No `pnpm install`.
- **NO `@santis/event-dictionary` alias removal.**
- No `audit:all` changes.

## Gate Results

| Command | Status | Notes |
|---|---|---|
| `pnpm run audit:repo-boundary` | ❌ FAIL (Expected) | High-risk paths remain in filesystem. |
| `pnpm run audit:all` | ✅ PASS | Develop gates remain stable. |
| `pnpm run lint` | ✅ PASS | TypeScript compiler and ESLint validated pruned config. |
| `pnpm run stitch:enforce` | ✅ PASS | Visual truth synced. |

## Final Governance Statement
"D2-B3-D removes private TS alias coupling for db and decision-kernel. Aliases for event-dictionary and review-required packages are preserved to ensure zero regression."
