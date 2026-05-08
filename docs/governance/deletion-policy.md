# SANTIS OS — Safe Deletion Policy

## 1. No Blind Delete
Under no circumstances shall any code, script, or configuration file be deleted based purely on assumptions or automated cleanup sweeps.

## 2. File State Classifications
Before any file is slated for removal, it must be classified into one of the following states:
- **Alive:** Actively imported, executed, or served in production/development.
- **Dormant:** Not actively used but maintained for compatibility, legacy fallback, or pending integration.
- **Dead:** Proven to be fully unreferenced, inaccessible, or obsoleted by a newer canonical system.
- **Unknown:** The purpose or integration points of the file cannot be definitively proven.

## 3. The Quarantine-First Policy
Files classified as **Dead** must not be deleted immediately.
1. They must first be moved to a designated quarantine directory (e.g., `_archive/phase-0-dead-code/`).
2. This ensures the file is removed from the active build path while remaining recoverable via version control if an edge case is triggered.

## 4. Build/Test Before Deletion
Following any quarantine action, a full application build and test suite run must occur (`pnpm run audit:all`, `turbo run build`). Deletion or quarantine PRs are rejected if tests fail.

## 5. Unknown is Never Deleted
If a file is classified as **Unknown**, it remains untouched until further evidence classifies it as Alive or Dead.

## 6. Production Files Require Explicit Approval
Any file that currently resides in a core domain directory (`spaos-core/`, `components/`, `server/`) requires explicit human/Boardroom approval before moving to Quarantine.

## 7. Current Dead-Code Candidates (Phase 0 Validation)
Based on the Reality Lock audit, the following files must follow this protocol:
- `server/services/vip-risk-heuristic.js`
- `server/services/ritual-recommendation-heuristic.js`
- `scripts/cjs_to_esm_codemod.py`
