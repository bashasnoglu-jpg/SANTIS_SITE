# SANTIS_SITE — Phase F Tooling Cleanup Audit Report

**Date:** 2026-05-14
**Branch:** `docs/phase-f-tooling-cleanup-audit`
**Engineer:** Antigravity (Santis OS Governance Engineer)
**Base:** `develop`

---

## 1. Mission Summary

Phase F executes a **READ-ONLY AUDIT** of the repository's tooling, scripts, and configurations that still refer to the now-archived private infrastructure paths (`server/`, `apps/api`, etc.). The goal is to identify "stale" references and plan a cleanup to maintain a pristine public repository root.

---

## 2. Stale Tooling Inventory

| Tooling / File | Reference Count | Status | Classification |
| :--- | :---: | :---: | :--- |
| `run-*-smoke.ts` (20 files) | ~60 | `STALE` | `PRIVATE_REPO_CANDIDATE` |
| `scripts/esm_smoke_targets.wave*.json` | 24 | `STALE` | `PRIVATE_REPO_CANDIDATE` |
| `scripts/start-rollout-runtime.ts` | 15 | `STALE` | `PRIVATE_REPO_CANDIDATE` |
| `scripts/dev-sovereign-*.mjs` | 12 | `STALE` | `PRIVATE_REPO_CANDIDATE` |
| `tsconfig.sovereign-core.json` | 10 | `STALE` | `PRIVATE_REPO_CANDIDATE` |
| `scripts/smoke_phase*.js` | 8 | `STALE` | `PRIVATE_REPO_CANDIDATE` |

---

## 3. Detailed Findings

### 3.1 Smoke Scripts (`run-*-smoke.ts`)
The repository contains 20 smoke test scripts in the root directory. While they use the `runWithPrivateServerBoundary` guard to prevent crashes, they are functionally dead in the public repository because their dependencies reside in `_archive/private-infra/`.
**Recommendation:** Move all `run-*-smoke.ts` files to `_archive/private-infra/tests/smoke/`.

### 3.2 ESM Smoke Targets (`scripts/esm_smoke_targets.wave*.json`)
These JSON files contain static paths to `server/` files for validation. Since the target files are moved, these manifests are now invalid.
**Recommendation:** Move to `_archive/private-infra/scripts/`.

### 3.3 Server Startups (`scripts/start-rollout-runtime.ts` etc.)
These scripts are entry points for the private infrastructure runtime. They have no utility in the public repository.
**Recommendation:** Move to `_archive/private-infra/scripts/`.

### 3.4 `tsconfig.sovereign-core.json`
This configuration explicitly includes the `server/` directory for compilation. It is no longer valid at the root level.
**Recommendation:** Move to `_archive/private-infra/configs/` or delete if redundant with private repo planning.

---

## 4. Governance Responses

### 4.1 What is stale?
Any script in the public root or `scripts/` directory that imports or references paths beginning with `server/`, `apps/api`, `apps/ingestion-api`, `packages/db`, or `packages/decision-kernel`.

### 4.2 What belongs to the private repo?
All smoke tests, rollout runtimes, and server-specific build configurations.

### 4.3 What should stay in the public repo?
Only tools that audit the **public** surface, such as:
- `scripts/active/audit-repo-boundary.mjs`
- `scripts/audit-localhost-leak.js`
- `scripts/audit-environment.mjs`
- `packages/design-system/scripts/validate.js`

---

## 5. Explicit Non-Actions (Audit Mode)

- ❌ No files were moved.
- ❌ No references were edited.
- ❌ No deletions performed.
- ❌ No config changes.

---

## 6. Recommended Next Step: Execution PR

Based on this audit, a targeted **Execution PR** should be prepared to perform the physical move of these stale assets to the archive directory. This will complete the decoupling of the developer experience from the private infrastructure.

---

**Status:** AUDIT_COMPLETE
**Branch:** `docs/phase-f-tooling-cleanup-audit`
**Engineer:** Antigravity (Santis OS Governance Engineer)
**Date:** 2026-05-14
