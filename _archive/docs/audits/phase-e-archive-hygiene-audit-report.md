# SANTIS_SITE — Phase E Archive Hygiene Audit Report

**Date:** 2026-05-14
**Branch:** `docs/phase-e-archive-hygiene-audit`
**Engineer:** Antigravity (Santis OS Governance Engineer)
**Base:** `develop`

---

## 1. Mission Summary

Phase E executes a **READ-ONLY AUDIT** of the `_archive/private-infra/` directory. The goal is to classify the 446 archived tracked files to prepare for the eventual decoupling into a private Santis OS repository topology. This phase does not involve moving, deleting, or refactoring any code.

---

## 2. Archive Inventory & Classification Matrix

| Directory Path | File Count | Primary Classification | Status |
| :--- | :---: | :--- | :--- |
| `_archive/private-infra/apps/api/` | 3 | `PRIVATE_REPO_CANDIDATE` | ✅ AUDITED |
| `_archive/private-infra/apps/ingestion-api/` | 122 | `PRIVATE_REPO_CANDIDATE` | ✅ AUDITED |
| `_archive/private-infra/packages/db/` | 11 | `PRIVATE_REPO_CANDIDATE` | ✅ AUDITED |
| `_archive/private-infra/packages/decision-kernel/` | 8 | `PRIVATE_REPO_CANDIDATE` | ✅ AUDITED |
| `_archive/private-infra/server/` | 301 | `PRIVATE_REPO_CANDIDATE` | ✅ AUDITED |
| `_archive/private-infra/legacy/server.js` | 1 | `HISTORICAL_ARCHIVE` | ✅ AUDITED |
| **Total** | **446** | | |

---

## 3. Key Findings

### 3.1 `PRIVATE_REPO_CANDIDATE` (High Volume)
The vast majority of the archive (99%) consists of active operational code that was physically removed from the public root to comply with the Repository Boundary (D2-B4). This content is essential for the Sovereign Santis OS runtime and is slated for extraction into a separate private repository.

### 3.2 `SENSITIVE_REVIEW` (Critical)
The following paths contain operational data structures or logic that require high-security handling during extraction:
- `_archive/private-infra/server/storage/santis.db` (and shm/wal files)
- `_archive/private-infra/server/middleware/cerberus-auth.ts`
- `_archive/private-infra/server/routes/cerberus-login.ts`
- `_archive/private-infra/server/core/identity.ts`

**Recommendation:** Bit-perfect validation must be performed during extraction to ensure no leakage occurs.

### 3.3 `STALE_TOOLING_ARTIFACT` / `HISTORICAL_ARCHIVE`
`_archive/private-infra/legacy/server.js` is a deprecated entry point. It has been archived alongside the core server to resolve static import issues. It does not need to be part of the active private repository and can remain as a historical archive or be retired during Phase F.

---

## 4. Governance Responses

### 4.1 Which files should move to a private repo?
All files under `apps/`, `packages/`, and `server/` (excluding historical/stale scripts) are primary candidates for the private `SANTIS_CORE` repository.

### 4.2 Which files are only historical archive?
`legacy/server.js` and early prototype files found within `server/scripts/` (to be further audited in Phase F).

### 4.3 Sensitive/Credential content detection?
Initial scans for keys/secrets show typical operational variable names (token, auth, key) in logic files. No hardcoded plain-text credentials were found in tracked files, but the SQLite `.db` files remain a sensitivity risk and should be handled as encrypted/private assets.

### 4.4 Should the archive stay in the public repo long-term?
**No.** The archive acts as a temporary quarantine and history-preserving bridge. Long-term, the presence of 446 files of private infrastructure (even under `_archive/`) increases the surface area for discovery and bloats the public repository history. 
**Goal:** Extraction to a separate repository (Phase G).

---

## 5. Explicit Non-Actions

- ❌ No files were moved.
- ❌ No files were deleted.
- ❌ No source code refactored.
- ❌ No private repository created.
- ❌ No configuration changes.

---

## 6. Recommended Next Step: Phase F

Phase E confirms that the archive is a stable, high-fidelity mirror of the previously active infrastructure. The next step is **Phase F — Tooling Cleanup Audit**, which will focus on identifying and retiring the "stale" tooling and documentation that still refers to these archived paths in the public repository root.

---

**Status:** AUDIT_COMPLETE
**Branch:** `docs/phase-e-archive-hygiene-audit`
**Engineer:** Antigravity (Santis OS Governance Engineer)
**Date:** 2026-05-14
