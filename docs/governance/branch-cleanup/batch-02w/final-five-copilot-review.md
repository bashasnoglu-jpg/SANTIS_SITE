# SANTIS OS — PHASE G / BATCH 02W: FINAL FIVE COPILOT REVIEW

**Date/Time:** 2026-05-23T07:35:00+02:00
**Target branches reviewed:** 5

## Branch 1: `copilot/santis-site-admin-panel`
- **Unique commits:** 7
- **Changed files:** `.github/workflows/sovereign-ci.yml`, `apps/api/package.json`, `package.json`, `pnpm-lock.yaml`, `vercel.json`
- **Diff summary:** Attempts to align Node/pnpm versions and uses `pnpm/action-setup@v4`. Includes early attempts to fix `vercel.json` with `corepack prepare pnpm@10.24.0 --activate`. 
- **Review Answers:**
  1. Files changed: `.github/workflows/sovereign-ci.yml`, `apps/api/package.json`, `package.json`, `pnpm-lock.yaml`, `vercel.json`.
  2. Touches critical files: Yes.
  3. Superseded: Yes. `develop` already natively and cleanly implements `pnpm@10.24.0` with `corepack` activation without lockfile drift.
  4. Useful extractable idea: No.
  5. Duplicate/Weaker: Yes, it's a messy historical attempt at what `develop` already has.
  6. Safe to delete: Yes.
- **Risk:** Low (if deleted).
- **Final recommendation:** **DELETE_SAFE_NEXT_BATCH**

## Branch 2: `copilot/santis-site-admin-panel-again`
- **Unique commits:** 1
- **Changed files:** `admin-panel/vite.config.js`, `vercel.json`
- **Diff summary:** Changes `admin-panel` build output to `../dist` to bypass Vercel's output directory logic, and modifies `vercel.json` to point to `dist`.
- **Review Answers:**
  1. Files changed: `admin-panel/vite.config.js`, `vercel.json`.
  2. Touches critical files: Yes.
  3. Superseded: Yes. `develop` properly uses `admin-panel/dist` in `vercel.json`, respecting monorepo boundaries.
  4. Useful extractable idea: No. `../dist` breaks isolation.
  5. Duplicate/Weaker: Yes.
  6. Safe to delete: Yes.
- **Risk:** Low.
- **Final recommendation:** **DELETE_SAFE_NEXT_BATCH**

## Branch 3: `copilot/sovereign-projects`
- **Unique commits:** 1
- **Changed files:** `.github/workflows/sovereign-orchestrator.yml`, `vercel.json`
- **Diff summary:** Hardcodes `PRODUCTION_URL` in CI health checks, removes the `/health` API ping (downgrading security), and adds an SPA rewrite to `vercel.json`.
- **Review Answers:**
  1. Files changed: `.github/workflows/sovereign-orchestrator.yml`, `vercel.json`.
  2. Touches critical files: Yes.
  3. Superseded: Yes. `develop` currently utilizes stronger multi-signal validation.
  4. Useful extractable idea: Hardcoding preview URLs is an anti-pattern.
  5. Duplicate/Weaker: Yes, a weaker and more brittle version of pipeline logic.
  6. Safe to delete: Yes.
- **Risk:** Low.
- **Final recommendation:** **DELETE_SAFE_NEXT_BATCH**

## Branch 4: `copilot/update-admin-panel`
- **Unique commits:** 1
- **Changed files:** `packages/ui/package.json`, `pnpm-lock.yaml`
- **Diff summary:** Bumps `@santis/ui` React peer and dev dependencies from `^18.2.0` to `^19.0.0` to align with the current `admin-panel` (which uses React 19 natively). Modifies `pnpm-lock.yaml` accordingly.
- **Review Answers:**
  1. Files changed: `packages/ui/package.json`, `pnpm-lock.yaml`.
  2. Touches critical files: Yes.
  3. Superseded: No. `develop` still incorrectly lists `"react": "^18.2.0"` in `packages/ui/package.json` while `admin-panel` runs React 19.
  4. Useful extractable idea: Yes, bumping the `@santis/ui` peer dependency to React 19 is a correct and necessary architectural alignment.
  5. Duplicate/Weaker: No.
  6. Safe to delete: Only *after* extraction.
- **Risk:** Medium (valuable fix, but introduces massive lockfile changes if merged directly).
- **Final recommendation:** **EXTRACT_IDEA_THEN_DELETE_LATER**
  - *Note: We should extract only the `package.json` line edits and regenerate the lockfile natively in `develop`, rather than cherry-picking the whole commit.*

## Branch 5: `copilot/update-sovereign-projects-again`
- **Unique commits:** 1
- **Changed files:** `.npmrc`, `package.json`
- **Diff summary:** Adds `.npmrc` with `inject-workspace-packages=false` and sets `packageManager` to `pnpm@10.24.0`.
- **Review Answers:**
  1. Files changed: `.npmrc`, `package.json`.
  2. Touches critical files: Yes.
  3. Superseded: Partially. `packageManager` is already `10.24.0` in `develop`. `.npmrc` does not exist in `develop` with this setting.
  4. Useful extractable idea: `inject-workspace-packages=false` can fundamentally alter how `pnpm` links monorepo packages. 
  5. Duplicate/Weaker: No.
  6. Safe to delete: Unclear.
- **Risk:** High (Modifying `.npmrc` globally affects the entire workspace behavior).
- **Final recommendation:** **NEEDS_HUMAN_REVIEW**
  - *Note: The Boardroom must decide if `inject-workspace-packages=false` is desired for the Santis OS architecture before deletion.*

## Review Statements
- **No branches were deleted in Batch 02W.**
- **No source code was modified in Batch 02W.**

## Recommended Batch 02X Action
- Delete branches 1, 2, and 3 immediately as they are obsolete and safe to discard.
- Perform a controlled extraction of Branch 4 (`copilot/update-admin-panel`) to align React 19 peer dependencies in `packages/ui`, then delete it.
- Request explicit Boardroom (User) decision on Branch 5 (`copilot/update-sovereign-projects-again`) regarding `.npmrc` workspace injection behavior.
