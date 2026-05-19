# Phase G.2 Pre-Extraction Checklist

## Overview
This checklist serves as the final safety gate before executing the physical extraction of `_archive/private-infra/` into the new `SANTIS_CORE` repository.

## Pre-Extraction Items

### 1. Repository Naming
- [ ] Is `SANTIS_CORE` confirmed as the final repository name?
- [ ] Is the package naming convention (`@santis/core-*`) finalized?

### 2. Visibility and Access
- [ ] Is the repository confirmed to be **PRIVATE**?
- [ ] Is the owner confirmed as `bashasnoglu-jpg`?

### 3. Extraction Strategy
- [ ] Is the `git filter-repo` command verified?
  - `git filter-repo --path _archive/private-infra/ --path-rename _archive/private-infra/:/`
- [ ] Is a **dry-run** planned on a local temporary clone?

### 4. Credential and Secret Audit
- [ ] Are the credential audit commands ready?
- [ ] Are `process.env` replacements for hardcoded fallback secrets verified?

### 5. Dependency Bridge
- [ ] Is the `event-dictionary` dependency strategy (GitHub Packages) net?
- [ ] Is the versioning strategy for the first release defined?

### 6. Archive Governance
- [ ] Is it understood that `_archive/private-infra/` in `SANTIS_SITE` must **NOT** be deleted until Phase G.5 (Final Verification)?

### 7. Risk Management
- [ ] Is there a rollback plan in case of extraction failure or history corruption?
- [ ] Is the primary branch name for the new repo confirmed (e.g., `main`)?

### 8. Post-Push Validation
- [ ] What is the first validation gate after the initial push to `SANTIS_CORE`?

## Readiness Status
- [ ] **Technical Readiness:** High
- [ ] **Procedural Readiness:** Pending Checklist Completion
- [ ] **Boardroom Execution Approval:** Pending

## Conclusion
Completion of this checklist marks the final "Green Light" for Phase G.2 execution.
