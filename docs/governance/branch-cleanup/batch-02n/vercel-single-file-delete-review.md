# SANTIS OS — PHASE G / BATCH 02N: SINGLE-FILE VERCEL DELETE REVIEW

**Date/Time:** 2026-05-23T07:10:00+02:00
**Target branches reviewed:** 2

## Branch 1: `copilot/sovereign-klws21tvg`
- **Unique commit:** `a5a89fd3c fix(vercel): align installCommand with packageManager pnpm@10.0.0`
- **Changed file:** `vercel.json`
- **Diff Summary:** Downgrades the pnpm version in `installCommand` to `10.0.0` and alters `buildCommand` and `installCommand` to invoke raw `pnpm` rather than `corepack pnpm`. 
- **Risk:** Low (Obsolete logic).
- **Extractable idea:** None.
- **Review answers:**
  1. **Change:** Alters `installCommand` and `buildCommand` for an older admin-panel specific build pattern.
  2. **Hardcoded URL:** No.
  3. **Superseded:** Yes. Current `develop` uses a far superior multi-app build step (`pnpm build && mkdir -p dist/admin && cp -rv admin-panel/dist/* dist/admin/`).
  4. **Affects Core Configuration:** Yes (`installCommand`, `buildCommand`).
  5. **Extractable:** No.
  6. **Obsolete:** Yes.
- **Final recommendation:** **DELETE_SAFE_NEXT_BATCH**

## Branch 2: `copilot/update-app-vercel-deployment`
- **Unique commit:** `085198986 fix(vercel): add SPA rewrite, align pnpm@10.0.0, use plain pnpm in buildCommand`
- **Changed file:** `vercel.json`
- **Diff Summary:** Similar to branch 1, downgrades `pnpm` to `10.0.0` and removes `corepack`. Crucially, it injects a greedy SPA rewrite rule: `{ "source": "/(.*)", "destination": "/index.html" }`.
- **Risk:** High if merged (Destructive to existing APIs). Low if deleted.
- **Extractable idea:** None.
- **Review answers:**
  1. **Change:** Downgrades PNPM and injects a greedy catch-all rewrite rule.
  2. **Hardcoded URL:** No.
  3. **Superseded:** Yes. `develop` already effectively handles SPA rewrites without breaking API routes (using specific `/admin/:path*` and `/api/:path*` targets).
  4. **Affects Core Configuration:** Yes (`installCommand`, `buildCommand`, `rewrites`).
  5. **Extractable:** No. Extracting the greedy rewrite would actively break the `apps/ingestion-api` routing defined in `develop`.
  6. **Obsolete:** Yes.
- **Final recommendation:** **DELETE_SAFE_NEXT_BATCH**

## Statements
- **No branches were deleted in Batch 02N.**
- **No source code was modified in Batch 02N.**

## Recommended Batch 02O Action
Execute the verified single-file branch deletions for:
1. `copilot/sovereign-klws21tvg`
2. `copilot/update-app-vercel-deployment`
