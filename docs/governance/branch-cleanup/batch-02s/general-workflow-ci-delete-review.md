# SANTIS OS — PHASE G / BATCH 02S: GENERAL WORKFLOW CI DELETE REVIEW

**Date/Time:** 2026-05-23T07:24:00+02:00
**Target branches reviewed:** 6

## Branch 1: `copilot/add-sovereign-project`
- **Unique commits:** 1
- **Changed files:** `.github/workflows/santis-sovereign-diagnostic.yml`, `.github/workflows/sovereign-ci.yml`, `.github/workflows/stitch-governance.yml`, `.npmrc`
- **Workflow diff summary:** Updates `pnpm/action-setup@v3` versions to `10.x` and sets `node-version: '20'`. Also updates `corepack prepare` to `pnpm@10.0.0`.
- **Risk:** Low (if deleted).
- **Extractable idea:** No.
- **Final recommendation:** **DELETE_SAFE_NEXT_BATCH**
  - **Reason:** Current `develop` already handles Node 20 and uses `corepack prepare pnpm@10.24.0 --activate` effectively. Superseded.

## Branch 2: `copilot/fix-issue-with-sovereign-projects`
- **Unique commits:** 2
- **Changed files:** `.github/workflows/santis-sovereign-diagnostic.yml`, `.github/workflows/sovereign-ci.yml`, `.github/workflows/sovereign-guard.yml`, `.github/workflows/stitch-governance.yml`
- **Workflow diff summary:** Updates `pnpm/action-setup` to `10.0.0` and removes `corepack prepare/enable` steps from `sovereign-ci.yml`.
- **Risk:** Low.
- **Extractable idea:** No.
- **Final recommendation:** **DELETE_SAFE_NEXT_BATCH**
  - **Reason:** Removing `corepack` is a regression. Superseded by `develop`.

## Branch 3: `copilot/fix-issues-on-sovereign-project`
- **Unique commits:** 1
- **Changed files:** `.github/workflows/deployment-rollback.yml`, `.github/workflows/docker-publish.yml`
- **Workflow diff summary:** Hardcodes `TELEMETRY_ENDPOINT` to a specific Vercel preview URL (`https://sovereign-7yhwymrfz...`).
- **Risk:** Low.
- **Extractable idea:** No.
- **Final recommendation:** **DELETE_SAFE_NEXT_BATCH**
  - **Reason:** Hardcoding specific preview URLs in CI is an anti-pattern. 

## Branch 4: `copilot/update-deployment-url`
- **Unique commits:** 1
- **Changed files:** `.env.example`, `.github/workflows/sovereign-ci.yml`, `.github/workflows/sovereign-guard.yml`
- **Workflow diff summary:** Adds `VERCEL_URL` to `.env.example`. Forces `pnpm/action-setup@v3` to `9.1.0` and deletes `corepack` steps.
- **Risk:** Low.
- **Extractable idea:** No.
- **Final recommendation:** **DELETE_SAFE_NEXT_BATCH**
  - **Reason:** Obsolete attempt at fixing pnpm cache/installation.

## Branch 5: `copilot/update-sovereign-projects`
- **Unique commits:** 1
- **Changed files:** `.github/workflows/santis-sovereign-diagnostic.yml`, `.github/workflows/sovereign-ci.yml`, `.github/workflows/sovereign-guard.yml`, `.npmrc`
- **Workflow diff summary:** Attempts to align Node to 20 and pnpm to 10.0.0. 
- **Risk:** Low.
- **Extractable idea:** No.
- **Final recommendation:** **DELETE_SAFE_NEXT_BATCH**
  - **Reason:** Redundant and superseded by current `develop`.

## Branch 6: `copilot/update-workflows-to-use-pnpm`
- **Unique commits:** 2
- **Changed files:** `.github/workflows/santis-sovereign-diagnostic.yml`, `.github/workflows/stitch-governance.yml`, `package-lock.json`
- **Workflow diff summary:** Migrates npm commands to pnpm commands (`npm run` -> `pnpm run`, `npm install -g http-server` -> `pnpm add -g http-server`) and deletes `package-lock.json`.
- **Risk:** Low.
- **Extractable idea:** No.
- **Final recommendation:** **DELETE_SAFE_NEXT_BATCH**
  - **Reason:** `develop` already natively uses `pnpm` exclusively and `package-lock.json` is not part of the active branch structure.

## Review Statements
- **No branches were deleted in Batch 02S.**
- **No source code was modified in Batch 02S.**

## Recommended Batch 02T Action
All 6 branches reviewed here are obsolete, superseded, or contain anti-patterns (like hardcoded Vercel URLs). I recommend deleting all 6 branches safely in Batch 02T.
