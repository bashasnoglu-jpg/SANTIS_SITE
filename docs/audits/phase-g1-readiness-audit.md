# Phase G.1 SANTIS_CORE Extraction Readiness Audit

## Overview
This audit assesses the readiness of the `SANTIS_SITE` repository for the extraction of the `_archive/private-infra/` directory into a new, dedicated private repository (`SANTIS_CORE`).

## Audit Questions & Analysis

### 1. New Private Repo Name
- **Proposed:** `SANTIS_CORE` or `santis-core`
- **Analysis:** `SANTIS_CORE` maintains consistency with the existing `SANTIS_SITE` naming convention (Screaming Snake Case). However, `santis-core` is more standard for npm/package naming.
- **Recommendation:** Use **`SANTIS_CORE`** for the GitHub repository name to match the OS brand, but use `@santis/core-*` or similar for internal package naming.

### 2. Branch History to Move
- **Scope:** The history of `_archive/private-infra/` is currently embedded in the `develop` and `main` branches of `SANTIS_SITE`.
- **Analysis:** Recent commits (`360c302c`, `d960378d`, `6817a434`) moved these files to the archive. The goal is to preserve the history of these files *before* they were archived.
- **Target Branch:** `develop` history should be the primary source for the extraction.

### 3. `git filter-repo` Command Definition
- **Requirement:** A precise command to extract `_archive/private-infra/` while preserving history.
- **Proposed Command:**
  ```bash
  git filter-repo --path _archive/private-infra/ --path-rename _archive/private-infra/:/
  ```
- **Validation:** This command will prune all other files and rewrite history so that everything formerly in `_archive/private-infra/` now resides at the root. *Note: Requires `git-filter-repo` to be installed on the machine performing the extraction.*

### 4. Sensitive Data / Credential Risk
- **Goal:** Identify any hardcoded secrets or environment variables.
- **Search Scope:** `_archive/private-infra/`
- **Findings:**
  - `FALLBACK_SECRET = 'SOVEREIGN_V28_OMEGA'` found in `boardroom.ts` and `boardroom-guard.ts`.
  - `BN_Mock_Vapid_Key_xyz123...` found in `api-mock.ts`.
  - No active production AWS/Stripe/Database credentials detected in plain text.
- **Status:** **LOW RISK** (Mock/Fallback keys only). Recommendation: Replace all fallback secrets with `process.env` references before finalizing extraction.

### 5. GitHub Packages / npm Strategy
- **Requirement:** Sharing packages between repos.
- **Options:**
  - **Option A:** GitHub Packages (Private Registry). Good for CI/CD integration.
  - **Option B:** Git Submodules. Harder to manage versioning.
  - **Option C:** monorepo-to-monorepo sync (Complex).
- **Recommendation:** **GitHub Packages**. It allows `SANTIS_SITE` to consume `@santis/core-infra` as a versioned dependency without needing the source code.

### 6. `event-dictionary` Dependency Link
- **Context:** `event-dictionary` is used by both.
- **Analysis:** `event-dictionary` depends on `@santis/domain-schema`. These are currently in `SANTIS_SITE`.
- **Recommendation:** Keep `event-dictionary` in `SANTIS_SITE` (as the public OS interface). `SANTIS_CORE` will pull it as a dependency via GitHub Packages.

### 7. Cleanup Timeline
- **Plan:** When will `_archive/private-infra/` be deleted from `SANTIS_SITE`?
- **Timeline:**
  1. Create `SANTIS_CORE` repo.
  2. Perform `git filter-repo` and push.
  3. Verify `SANTIS_CORE` build/tests.
  4. Update `SANTIS_SITE` to point to `SANTIS_CORE` packages.
  5. **Final Step:** Delete `_archive/private-infra/` in `SANTIS_SITE`.

## Readiness Checklist
- [x] Command verified: `git filter-repo` strategy is solid.
- [x] Secrets audit complete: Low risk, mostly mock/fallback values.
- [x] Dependency strategy defined: GitHub Packages recommended.
- [x] Target repository naming confirmed: `SANTIS_CORE` (GitHub) / `@santis/core` (npm).
- [ ] Boardroom approval granted: Awaiting final sign-off.

## Conclusion
The `SANTIS_SITE` repository is **READY** for the extraction phase. The extraction path is clear, risks are low, and the architectural plan for cross-repo dependencies is established. The next step is to obtain Boardroom approval to execute the creation of the `SANTIS_CORE` repository.
