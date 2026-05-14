# SANTIS_SITE — Phase D2-B3 Config Impact Audit Report

**Date:** 2026-05-13
**Branch:** `docs/phase-d2-b3-config-impact-audit`
**Engineer:** Senior Staff Architect + Repo Governance Lead (Antigravity)

## Mission Summary
This is the Phase D2-B3 Config Impact Audit. The goal is to analyze the coupling between the public repository configuration files (`package.json`, `pnpm-workspace.yaml`, `tsconfig*.json`) and the private infrastructure paths (`server/`, `apps/api/`, etc.) identified for migration. This audit provides a safe, documented sequence for unlinking these configurations without breaking build stability or the `develop` gate suite.

## Doctrine / Explicit Non-Actions
- **READ-ONLY AUDIT MODE.** No modifications made to configuration files or lockfiles.
- **NO deletion.**
- **NO file moves.**
- **NO source code changes.**
- **NO `package.json` modifications.**
- **NO lockfile regeneration.**

## Current Config Coupling Summary
The repository currently uses broad globs in `pnpm-workspace.yaml` and a shared `tsconfig.base.json` that implicitly or explicitly includes private infrastructure. This coupling causes the workspace to remain "heavy" and forces public build tools to traverse private directories.

## Workspace Impact Table

| Current entry | Includes | Public/Private Classification | Risk | Recommended Future Action |
|---|---|---|---|---|
| `apps/*` | `api`, `ingestion-api`, `web` | MIXED (2 Private, 1 Public) | HIGH | Replace with explicit `apps/web` |
| `packages/*` | `db`, `event-dictionary`, `ui`, etc. | MIXED | HIGH | Replace with explicit public package list |
| `admin-panel` | `admin-panel` | PUBLIC (Coupled) | MEDIUM | Keep, but monitor dependencies on private packages |

## Package Script Impact Table

| Script | Current Command | Private Dependency | Risk | Recommended Future Action |
|---|---|---|---|---|
| `db:push` | `pnpm --filter @santis/db db:push` | `@santis/db` | HIGH | Remove or mark as `PRIVATE_MOVED` |
| `db:migrate` | `pnpm --filter @santis/db db:migrate` | `@santis/db` | HIGH | Remove or mark as `PRIVATE_MOVED` |
| `audit:contract` | `turbo run audit:contract` | ALL packages | LOW | Keep, will self-adjust after workspace cleanup |

## TypeScript Alias Impact Table

| Alias | Target Path | Classification | Active References | Risk | Recommended Future Action |
|---|---|---|---|---|---|
| `@santis/event-dictionary` | `packages/event-dictionary/src/index.ts` | **PRIVATE_REMOVE** | `admin-panel`, Tests | HIGH | Remove after untangling dependents |
| `@santis/db` | `packages/db/src/index.ts` | **PRIVATE_REMOVE** | `package.json` | HIGH | Remove |
| `@santis/decision-kernel` | `packages/decision-kernel/src/index.ts` | **PRIVATE_REMOVE** | Internal Infra | MEDIUM | Remove |
| `@santis/sovereign-bus` | `packages/sovereign-bus/src/index.ts` | **PUBLIC_KEEP** | UI, Eventing | LOW | Keep |
| `@santis/ui` | `packages/ui/src/index.ts` | **PUBLIC_KEEP** | All UI | LOW | Keep |
| `@santis/application` | `packages/application/src/index.ts` | **REVIEW_REQUIRED** | Unknown | MEDIUM | Audit for public/private logic split |

## Sovereign Config Findings
- **`tsconfig.sovereign-core.json` status:** This file is a "Shadow Config" used exclusively for private infrastructure (`server/`, `server/core/`, etc.).
- **Server Coupling:** 90% of `include` paths point to `server/`.
- **Recommended Treatment:** This file should be migrated to the private OS repository as part of Phase D2-B4. It should not be unlinked early to maintain IDE support for the private code while it still resides in this repo.

## Lockfile Strategy
- **Can D2-B3-A avoid lockfile changes?** Yes, as long as we only change documentation or add non-functional comments.
- **When lockfile changes become necessary:** Once workspace globs are replaced with explicit entries, `pnpm install` will prune the private packages from the lockfile.
- **Recommended lockfile policy:** Perform lockfile normalization in a dedicated PR (D2-B3-E) only after all other config changes are merged.

## Proposed D2-B3 PR Sequence

1. **D2-B3-A (Inventory):** Explicit workspace inventory in `docs/` (Completed by this audit).
2. **D2-B3-B (Script Cleanup):** Remove root private DB scripts or mark as moved.
3. **D2-B3-C (Workspace Isolation):** Replace broad globs (`apps/*`, `packages/*`) with an explicit public workspace allowlist.
4. **D2-B3-D (TS Config Pruning):** Remove private aliases from `tsconfig.base.json`.
5. **D2-B3-E (Lockfile Normalize):** Final `pnpm install` to shrink lockfile to public-only boundary.

## Risk Matrix

| Config Area | Risk Level | Why Risky | Safe First Action | Must Not Do |
|---|---|---|---|---|
| Workspace | HIGH | Can break package discovery | Add explicit public entries before removing globs | Remove globs without testing `pnpm install` |
| Scripts | LOW | Minimal runtime risk | Mark as deprecated/moved | Delete scripts still used in CI |
| TS Aliases | MEDIUM | Breaks compilation | Check references with `grep` | Remove `@santis/ui` or other public shared packages |
| Lockfile | HIGH | Can cause massive diffs | Isolated PR with clear change log | Manually edit `pnpm-lock.yaml` |

## Gate Results

| Command | Status | Notes |
|---|---|---|
| `pnpm run audit:repo-boundary` | ❌ FAIL | Found active violations: `server`, `apps/api`, `packages/db`, etc. (Expected) |
| `pnpm run audit:all` | ✅ PASS | Develop gates remain stable. |
| `pnpm run lint` | ✅ PASS | 0 errors. |
| `pnpm run stitch:enforce` | ✅ PASS | Visual truth synced. |

## Final Governance Statement
"D2-B3 execution remains blocked until Boardroom approves a split config unlinking PR sequence."
