# Rule 5 — No Direct Deletion: Quarantine First

## Overview

Dead, zombie, legacy, duplicate, or suspected-unused code must never be deleted directly. All removal operations in Santis OS must follow a deterministic, evidence-based quarantine cycle.

## Required Sequence

### 1. Evidence
- The file or folder must be listed in a formal audit document.
- Classification must be supported by at least one source of evidence: runtime, build, tooling, or historical audit.

### 2. Quarantine
- Move the item to `_archive/phase-0-dead-code/`.
- Preserve the relative path inside the archive where practical.
- Do not rewrite application logic or perform refactoring in the same commit as the quarantine move.

### 3. Validation
- Run the governance gate:
  ```powershell
  pnpm run stitch:enforce
  pnpm run lint
  pnpm run test:e2e -- --project=chromium tests/e2e/reservation.spec.ts
  ```
- Run `pnpm build` if the quarantined files are part of the build-chain (CSS, JS modules, templates).

### 4. Observation Window
- Keep the quarantined item for at least one full follow-up validation cycle or PR review.
- Do not delete from `_archive/` in the same PR as the quarantine move.

### 5. Final Removal
- Only after validation remains stable throughout the observation window, open a second PR to remove the quarantined item.
- The deletion commit must reference:
  - Original audit document evidence.
  - Quarantine commit hash.
  - Validation result (PASS).

## Forbidden Actions

- `git rm` directly on suspected dead code without prior quarantine.
- Broad `git add .` after moves (use targeted staging).
- Archival and deletion in the same commit.
- Moving active runtime files without explicit audit evidence.

---
**Rule 5: Quarantine First — SEALED. 🔐**
