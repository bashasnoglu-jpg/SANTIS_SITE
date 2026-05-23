# SANTIS OS — PHASE G / BATCH 02U: VERCEL DEPLOYMENT COMPLEX REVIEW

**Date/Time:** 2026-05-23T07:29:00+02:00
**Target branches reviewed:** 4

## Branch 1: `copilot/fix-deployment-not-found-error`
- **Unique commits:** 1
- **Changed files:** `vercel.json`
- **Diff summary:** Removes the explicit `corepack prepare pnpm@10.24.0 --activate` step from the Vercel `installCommand`.
- **Review Answers:**
  1. Files changed: `vercel.json`
  2. Modifies Vercel behavior: Yes, it drops explicit version activation.
  3. Downgrades/alters package manager: Relies solely on `package.json`, which can be brittle in Vercel.
  4. Touches lockfile/package.json: No.
  5. Superseded: Yes. Current `develop` uses explicit activation for stability.
  6. Extractable idea: No.
  7. Safe to delete: Yes.
- **Risk:** Low.
- **Final recommendation:** **DELETE_SAFE_NEXT_BATCH**

## Branch 2: `copilot/fix-vercel-corepack-install`
- **Unique commits:** 1
- **Changed files:** `package.json`, `vercel.json`
- **Diff summary:** Downgrades the `packageManager` field in `package.json` to `pnpm@10.0.0` and removes explicit corepack activation from `vercel.json`.
- **Review Answers:**
  1. Files changed: `package.json`, `vercel.json`
  2. Modifies Vercel behavior: Yes.
  3. Downgrades/alters package manager: Yes, downgrades pnpm to `10.0.0`.
  4. Touches lockfile/package.json: Yes, downgrades packageManager.
  5. Superseded: Yes. Current `develop` securely uses `10.24.0`.
  6. Extractable idea: No.
  7. Safe to delete: Yes.
- **Risk:** Low.
- **Final recommendation:** **DELETE_SAFE_NEXT_BATCH**

## Branch 3: `copilot/fix-vercel-deployment-issues`
- **Unique commits:** 1
- **Changed files:** `pnpm-lock.yaml`, `vercel.json`
- **Diff summary:** Drastically bypasses `corepack` entirely by replacing it with `npm i -g pnpm` in `vercel.json`. Regenerates `pnpm-lock.yaml` resulting in a massive (+12k lines) diff.
- **Review Answers:**
  1. Files changed: `pnpm-lock.yaml`, `vercel.json`
  2. Modifies Vercel behavior: Yes, uses global npm instead of corepack.
  3. Downgrades/alters package manager: Yes, introduces non-deterministic global pnpm installation.
  4. Touches lockfile/package.json: Yes, massive unverified changes to `pnpm-lock.yaml`.
  5. Superseded: Yes.
  6. Extractable idea: No.
  7. Safe to delete: Yes.
- **Risk:** Low (if deleted), High (if merged).
- **Final recommendation:** **DELETE_SAFE_NEXT_BATCH**

## Branch 4: `copilot/update-vercel-deployment-again`
- **Unique commits:** 1
- **Changed files:** `package.json`, `vercel.json`
- **Diff summary:** Alters `packageManager` in `package.json` to `pnpm@10.11.0` and removes explicit corepack activation in `vercel.json`.
- **Review Answers:**
  1. Files changed: `package.json`, `vercel.json`
  2. Modifies Vercel behavior: Yes.
  3. Downgrades/alters package manager: Yes, sets pnpm to `10.11.0` (current develop is `10.24.0`).
  4. Touches lockfile/package.json: Yes.
  5. Superseded: Yes.
  6. Extractable idea: No.
  7. Safe to delete: Yes.
- **Risk:** Low.
- **Final recommendation:** **DELETE_SAFE_NEXT_BATCH**

## Review Statements
- **No branches were deleted in Batch 02U.**
- **No source code was modified in Batch 02U.**

## Recommended Batch 02V Action
All four branches are obsolete, superseded deployment tweaks that attempt to resolve `pnpm` and `corepack` issues that have already been cleanly solved in `develop` (using `pnpm@10.24.0` with explicit activation). Proceeding to Batch 02V to delete these 4 branches is recommended.
