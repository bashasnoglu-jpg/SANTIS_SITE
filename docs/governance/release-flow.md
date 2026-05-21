# Santis OS - Release Flow & Branch Governance

This document outlines the canonical branching strategy and release flow for Santis OS. All developers and automated agents must adhere to these rules.

## Canonical Branches

*   **`main`**: **PRODUCTION BRANCH.** This branch is directly tied to the `sovereign-os` Vercel project. Any push or merge into this branch triggers a production deployment. It must remain pristine and only accept tested, approved merges via Pull Requests.
*   **`develop`**: **DEVELOPMENT INTEGRATION BRANCH.** This should be the GitHub **default branch**. All normal feature work, bug fixes, and documentation updates are merged here first for integration testing before being bundled into a release PR for `main`.

## Branch Prefixes & Workflows

*   **`feature/*`**, **`fix/*`**, **`docs/*`**, **`chore/*`**:
    *   **Target:** `develop`
    *   **Usage:** Standard daily development branches. Must be merged into `develop` via PR.
*   **`hotfix/*`**:
    *   **Target:** `main` (and subsequently backported to `develop`)
    *   **Usage:** Emergency production patches only. Branched directly from `main` and merged directly back into `main` to bypass standard release cycles.

## Release Process (`develop` → `main`)
A formal Release PR must be created to promote changes from `develop` to `main`. This PR requires:
1. Full build pipeline validation (`pnpm run build`).
2. Production Readiness Seal approval.
3. Boardroom governance sign-off.
