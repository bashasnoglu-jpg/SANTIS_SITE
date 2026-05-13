# SANTIS_SITE — Phase D2-B Decoupling Plan

**Date:** 2026-05-13
**Branch:** `docs/phase-d2-b-decoupling-plan`
**Auditor:** Senior Staff Architect + Repo Governance Lead (Antigravity)

## Mission Summary
This document serves as the formal architectural plan for Phase D2-B. Its purpose is to analyze the high-risk, deeply-coupled remaining public boundary violations (the private OS infrastructure) and outline a precise, zero-downtime roadmap for decoupling them from the active public frontend. This ensures a clean path to migration or archival without breaking the CI pipelines or local development.

## Doctrine / Non-actions
- **PLAN ONLY.** No files have been deleted, moved, or modified.
- **NO runtime refactoring or workspace changes.** All configurations (`package.json`, `pnpm-workspace.yaml`, `tsconfig*.json`) remain intact.
- **NO audit:all changes.** The existing CI pipeline is deliberately preserved.
- **Evidence-First.** All decoupling steps are derived directly from a comprehensive file-system and dependency graph audit.

## Current Remaining Boundary Violations
1. `server/`
2. `apps/api/`
3. `apps/ingestion-api/`
4. `packages/db/`
5. `packages/decision-kernel/`
6. `packages/event-dictionary/`

---

## Coupling Map by Target

### 1. `server/` (Critical Risk)
- **Purpose observed:** Core private operational engine (telemetry, decision services, arbitration kernels).
- **Boundary violation type:** Private Operational Infrastructure embedded in public site tree.
- **Coupling points:** `tsconfig.sovereign-core.json`, deeply bound in scripts (`scripts/smoke_phase*.js`, `run-rollout*.ts`).
- **Active references:** ~303 files actively executed by root smoke tests.
- **Build/test dependency risk:** **CRITICAL**.
- **Suggested decoupling strategy:** Extract/mock the smoke test dependencies. The smoke tests must run against interfaces or mock providers rather than pulling directly from `server/`.
- **Suggested migration destination:** Migrate to private Santis OS repo.

### 2. `apps/ingestion-api/` (High Risk)
- **Purpose observed:** Backend API serving ingest routes and revenue decision workflows.
- **Boundary violation type:** Private API logic embedded in public site tree.
- **Coupling points:** Workspace config (`pnpm-workspace.yaml`), `pnpm-lock.yaml`, integration tests (`tests/integration/guest-select-mood.*.test.ts`), and `.github/workflows/sovereign-guard.yml`.
- **Active references:** ~155 files.
- **Build/test dependency risk:** **HIGH**.
- **Suggested decoupling strategy:** Re-route the integration tests to use a mock API client or a generic HTTP boundary instead of directly importing the internal API services. Remove from GitHub Actions workflow.
- **Suggested migration destination:** Migrate to private Santis OS repo.

### 3. `packages/db/` (High Risk)
- **Purpose observed:** Database schema definitions and query wrappers.
- **Boundary violation type:** Private data layer embedded in public site tree.
- **Coupling points:** `pnpm-workspace.yaml`, `tsconfig.base.json` aliases (`@santis/db`), `apps/ingestion-api` imports, and `package.json` root scripts (`db:push`, `db:migrate`).
- **Active references:** ~18 files.
- **Build/test dependency risk:** **HIGH**.
- **Suggested decoupling strategy:** Unlink from TS Config aliases and workspace definitions concurrently with `apps/ingestion-api/` migration.
- **Suggested migration destination:** Migrate to private Santis OS repo.

### 4. `packages/decision-kernel/` (Medium Risk)
- **Purpose observed:** Sovereign decision engine types and algorithms.
- **Boundary violation type:** Private kernel logic embedded in public site tree.
- **Coupling points:** `pnpm-workspace.yaml`, `tsconfig.base.json` aliases.
- **Active references:** ~9 files.
- **Build/test dependency risk:** **MEDIUM**.
- **Suggested decoupling strategy:** Straightforward removal from workspace and tsconfig files prior to migration.
- **Suggested migration destination:** Migrate to private Santis OS repo.

### 5. `packages/event-dictionary/` (High Risk)
- **Purpose observed:** Immutable event contract schemas.
- **Boundary violation type:** Private contract definitions embedded in public site tree.
- **Coupling points:** `pnpm-workspace.yaml`, `tsconfig.base.json` aliases, `tests/helpers/in-memory-fakes.ts`, and `.github/workflows/sovereign-guard.yml`.
- **Active references:** ~10 files.
- **Build/test dependency risk:** **HIGH**.
- **Suggested decoupling strategy:** Duplicate/mock the required event types strictly within the `tests/helpers` folder so they do not rely on the external package. Remove from GitHub Actions workflow.
- **Suggested migration destination:** Migrate to private Santis OS repo.

### 6. `apps/api/` (Medium Risk)
- **Purpose observed:** Standard API application layer.
- **Boundary violation type:** Private API logic embedded in public site tree.
- **Coupling points:** `pnpm-workspace.yaml`, `pnpm-lock.yaml`.
- **Active references:** ~90 files.
- **Build/test dependency risk:** **MEDIUM**.
- **Suggested decoupling strategy:** Remove from workspace configuration.
- **Suggested migration destination:** Migrate to private Santis OS repo.

---

## Proposed D2-B Execution Roadmap (PR Sequence)

To maintain Zero Technical Debt and 100% CI stability, execution must happen in granular, isolated steps.

- **PR 1: D2-B1 — Test & Workflow Decoupling**
  - **Scope:** Mock the dependencies inside `tests/integration/` and `tests/helpers/`.
  - **Action:** Replace `@santis/event-dictionary` and `apps/ingestion-api` imports with localized mocks. Remove these paths from `.github/workflows/sovereign-guard.yml`.
  - **Verification:** `pnpm run audit:all` must pass.

- **PR 2: D2-B2 — Smoke Test Decoupling**
  - **Scope:** Isolate root smoke scripts (`smoke_phase*.js`, `run-rollout*.ts`) from the `server/` directory.
  - **Action:** Introduce a mock layer or dynamically bypass these tests if the target `server/` files are absent.
  - **Verification:** Smoke scripts and `pnpm run audit:all` must pass.

- **PR 3: D2-B3 — Config Unlinking (The Big Cut)**
  - **Scope:** `tsconfig.base.json`, `tsconfig.sovereign-core.json`, `pnpm-workspace.yaml`, and root `package.json` scripts.
  - **Action:** Remove the workspace globs, aliases, and root NPM scripts tied to the high-risk paths.
  - **Verification:** TypeScript compilation (`tsc`) and `lint` must pass locally.

- **PR 4: D2-B4 — High-Risk Migration**
  - **Scope:** `server/`, `apps/api/`, `apps/ingestion-api/`, `packages/db/`, `packages/decision-kernel/`, `packages/event-dictionary/`.
  - **Action:** Execute the actual archiving or moving of these decoupled directories out of the public boundary tree.
  - **Verification:** `pnpm run audit:repo-boundary` must PASS.

- **PR 5: D2-C — Wire Repo Boundary**
  - **Scope:** `package.json` (`audit:all` script).
  - **Action:** Integrate `audit:repo-boundary` directly into `audit:all` to forever guard the public frontend repository against backend leakage.

---

## Risk Matrix

| Area | Risk Level | Why risky | Safe first action | Must not do |
|---|---|---|---|---|
| Smoke Scripts | CRITICAL | Directly import from `server/`. | Create generic mock stubs. | Delete `server/` before mocking. |
| Test Helpers | HIGH | Directly import from `packages/`. | Duplicate types locally in `tests/`. | Remove `tsconfig` alias first. |
| GitHub Actions | HIGH | Workflow scans specific paths. | Update workflow `roots` array. | Commit without testing workflow. |
| Workspace Config | HIGH | Turbo/PNPM relies on package maps. | Remove entry only after unlinking. | Blindly run `pnpm install`. |

---

## Explicit Non-Actions
- No deletion performed.
- No archive moves performed.
- No runtime refactor performed.
- No `package.json` changes performed.
- No `pnpm-workspace` changes performed.
- No `tsconfig` changes performed.
- No source code changes performed.
- No test rewrites performed.
- No `audit:all` changes performed.

## Final Governance Statement
"D2-B execution remains blocked until Boardroom approves the decoupling roadmap PR sequence."
