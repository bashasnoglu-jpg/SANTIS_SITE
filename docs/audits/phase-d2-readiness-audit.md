# SANTIS_SITE — Phase D2 Readiness Audit

**Date:** 2026-05-13
**Branch:** `docs/phase-d2-readiness-audit`
**Auditor:** Senior Staff Architect + Repo Governance Lead (Antigravity)

## Mission Summary
This is the Phase D2 Readiness Audit. Its purpose is strictly to assess the operational and reference impact of the active forbidden paths identified in Phase D1. The goal is to provide the Boardroom with an evidence-based matrix to safely decide the fate of these directories (Migrate, Archive, Exception, or Review) without breaking the `develop` build, dev, test, and audit flows.

## Methodology
- Scanned the active working tree for the forbidden paths.
- Counted file volumes and approximate sizes.
- Verified active references across `package.json`, `pnpm-workspace.yaml`, `turbo.json`, `tsconfig.*.json`, GitHub workflows, test suites, and internal scripts.
- Assessed the structural risk of archiving or migrating each path.

## Target Path Decision Matrix

| Path | Exists | Tracked | Evidence Summary | Active References | Risk Level | Recommended Classification | Recommended Next Action | Requires Boardroom Approval |
|---|---|---|---|---|---|---|---|---|
| `server/` | Yes | Yes | 303 files (4.8 MB) | `tsconfig.sovereign-core.json`, multiple `smoke_phase*.js` and `run-rollout*.ts` scripts | CRITICAL | **MIGRATE_TO_PRIVATE_OS** | Untangle smoke tests before migration | YES |
| `apps/api/` | Yes | Yes | 90 files (2.2 MB) | Workspace config, `pnpm-lock.yaml` | MEDIUM | **MIGRATE_TO_PRIVATE_OS** | Remove from workspace/lockfile on migrate | YES |
| `apps/ingestion-api/` | Yes | Yes | 155 files (6.6 MB) | `tests/integration/`, `scripts/audit-localhost-leak.js`, workspace | HIGH | **MIGRATE_TO_PRIVATE_OS** | Adjust tests & scripts on migrate | YES |
| `packages/db/` | Yes | Yes | 18 files (0.02 MB) | `package.json`, `tsconfig.base.json`, `apps/ingestion-api` imports | HIGH | **MIGRATE_TO_PRIVATE_OS** | Unlink from workspace & tsconfig | YES |
| `packages/decision-kernel/` | Yes | Yes | 9 files (0.01 MB) | `tsconfig.base.json`, workspace | MEDIUM | **MIGRATE_TO_PRIVATE_OS** | Unlink from workspace & tsconfig | YES |
| `packages/event-dictionary/` | Yes | Yes | 10 files (0.03 MB) | `tsconfig.base.json`, `tests/helpers/in-memory-fakes.ts` | HIGH | **MIGRATE_TO_PRIVATE_OS** | Update test references | YES |
| `santis-os-monorepo/` | Yes | Yes | 16,955 files (476 MB) | Unreferenced | LOW | **ARCHIVE_CANDIDATE** | Move to `_archive/` or delete | YES |
| `santis-live-simulator/` | Yes | Yes | 22 files (0.14 MB) | Unreferenced | LOW | **ARCHIVE_CANDIDATE** | Move to `_archive/` | YES |
| `nexus-signaling-server/` | No | No | Not found in active tree | None | NONE | **NOT_FOUND** | None | NO |

## Detailed Findings per Path

### 1. `server/`
- **Purpose observed:** Core operational intelligence, telemetry, decision services, and arbitration kernels.
- **Reference evidence:** Heavily referenced in `tsconfig.sovereign-core.json` and a large suite of smoke test scripts (`smoke_phase6.js`, `run-rollout-smoke.ts`, etc.).
- **Build/test risk:** **CRITICAL**. Archiving this blindly will immediately break the testing pipelines.
- **Recommended action:** Requires a dedicated PR to decouple or mock the smoke tests before `server/` can be safely migrated to the private OS.

### 2. `apps/ingestion-api/`
- **Purpose observed:** Backend API for ingestion routes and revenue decisions.
- **Reference evidence:** Imported by `tests/integration/guest-select-mood.*.test.ts`.
- **Build/test risk:** **HIGH**. Archiving will break integration tests.
- **Recommended action:** Needs test adjustments/mocking prior to migration.

### 3. `packages/db/`, `packages/decision-kernel/`, `packages/event-dictionary/`
- **Purpose observed:** Private infrastructure modules and schemas.
- **Reference evidence:** Exported to workspace and rigidly bound in `tsconfig.base.json` aliases (`@santis/db`, etc.). `event-dictionary` is used in test fakes.
- **Build/test risk:** **HIGH**. Removing these breaks TypeScript compilation for any dependents.
- **Recommended action:** Migrate to private OS, ensuring dependent tests are updated or removed from the public boundary.

### 4. `santis-os-monorepo/`
- **Purpose observed:** A massive clone/backup of the private OS monorepo.
- **Reference evidence:** Zero active references outside the D1 boundary script.
- **Build/test risk:** **LOW**. 
- **Recommended action:** Archive immediately to drastically reduce repository noise.

### 5. `santis-live-simulator/`
- **Purpose observed:** Legacy or unused simulator dashboard.
- **Reference evidence:** Zero active references.
- **Build/test risk:** **LOW**. 
- **Recommended action:** Archive immediately.

## Global Recommendation
- **D2-A (Low-Hanging Fruit):** Boardroom approval to archive `santis-os-monorepo/` and `santis-live-simulator/` immediately.
- **D2-B (Infrastructure Migration):** Formulate a decoupling sprint to safely unlink `server/`, `apps/`, and `packages/` from TS Configs, workspaces, and test suites, paving the way for their migration to the private repo.
- **D2-C (Guardrail Activation):** Once D2-A and D2-B are complete, wire `audit:repo-boundary` into `audit:all`.

## Explicit Non-Actions
- No deletion performed.
- No archive moves performed.
- No runtime refactor performed.
- No `package.json` changes performed.
- No `audit:all` changes performed.
- No source code changes performed.

## Final Governance Statement
"Phase D2 execution is blocked until Boardroom approves per-path archive/migration decisions."
