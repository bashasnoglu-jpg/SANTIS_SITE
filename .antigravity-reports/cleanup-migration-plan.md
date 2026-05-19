# Santis OS - Cleanup & Migration Plan v1.0
Generated: 2026-05-15
Mode: READ-ONLY AUDIT (PROPOSAL ONLY)

## Overview
This plan outlines a 7-batch strategy to compress technical debt and synchronize the repository with Antigravity Protocol v2.0. No actions will be taken until explicit Boardroom approval.

---

## 🟢 Batch 1: Docs & Governance [COMPLETED]
**Focus:** Consolidation of audit reports and boundary definitions.
**Governance Priority:** Rule #4 (Runtime Truth) & Rule #7 (Monolith Safety) applied.

### Classification:
- **ACTIVE**: 
  - `docs/governance/` (All files)
  - `.agents/` (All files)
  - `package.json`, `pnpm-workspace.yaml`, `.eslintrc`
  - `docs/audits/runtime-reference-map.md`
- **RUNTIME_POSSIBLE**:
  - `docs/runtime/legacy-server-contract-inventory.md`
  - `.env.example`
- **LEGACY_RUNTIME**:
  - `docs/audits/phase-*`
  - `SYSTEM_INCIDENT_REPORT.md`
- **ARCHIVE_CANDIDATE**:
  - `docs/reports/*.md` (Dated April 2026) -> Destination: `archive/stale_reports/`
  - `docs/archive/_card_fix_round2.py` -> Destination: `archive/scripts/`
  - `docs/archive/_test_cats.py` -> Destination: `archive/scripts/`
  - `docs/archive/_test_svc.py` -> Destination: `archive/scripts/`

---

## 🟡 Batch 2: Scripts [COMPLETED]
**Focus:** Archiving temporary maintenance and debugging scripts.
**Governance Priority:** Rule #3 (Strict Deletion Prohibition) - Archival over deletion.

### Classification:
- **ACTIVE**: `assets/js/core/santis-core.js`, `bootloader.js`
- **ARCHIVE_CANDIDATE**: 28 files starting with `tmp_` in `archive/scripts/` -> Destination: `archive/scripts/_legacy_fixes/`

---

## 🟠 Batch 3: Assets [COMPLETED]
**Focus:** Large file mapping and runtime necessity check.
**Governance Priority:** Rule #5 (Performance Integrity) & Rule #6 (Asset Governance).

### Classification:
- **ACTIVE**: 
  - `assets/img/cards/5091624-hd_...mp4` (Active in `trends/roman.html`)
  - `assets/img/master-logo.png` (Source for PWA generation)
- **ARCHIVE_CANDIDATE**: None in this phase. All heavy assets mapped to runtime.

---

## 🔵 Batch 4: Frontend [COMPLETED]
**Focus:** De-duplication of conflicting router modules.
**Governance Priority:** Rule #4 (Runtime Truth) & Rule #7 (Monolith Split Safety).

### Reality Mapping Result:
- **Active Router**: `assets/js/modules/page-router.js` (Loaded via `santis-core.js`).
- **Orphaned Routers**: `santis_router.js`, `santis-sovereign-router.js`, `cognitive-router.js`, etc. (0 references found in 690+ HTML files).

### Classification:
- **ARCHIVE_CANDIDATE**:
  - `assets/js/core/santis_router.js`
  - `assets/js/core/santis-sovereign-router.js`
  - `assets/js/core/sovereign-router.js`
  - `assets/js/core/aurelia-router.js`
  - `assets/js/core/santis-cognitive-router.js`
  - `assets/js/core/santis-quantum-router.js`
  - `assets/js/core/santis.bootstrap.js`
  - `assets/js/core/santis-route-controller.js`
- **Destination**: `archive/js/core/`

---

## 🟣 Batch 5: Backend Runtime [COMPLETED]
**Focus:** Legacy server contracts and middleware analysis.
**Governance Priority:** Rule #4 (Runtime Truth) - Archival of orphaned Python/Firebase artifacts.

### Reality Mapping Result:
- **Active Backend**: Managed via `packages/` monorepo and `pnpm`.
- **Orphaned Artifacts**: `alembic/`, `backend/` (Firebase), `infrastructure/` (Pulumi), `requirements.txt`.

### Classification:
- **ARCHIVE_CANDIDATE**:
  - `alembic/`
  - `backend/`
  - `infrastructure/`
  - `alembic.ini`
  - `requirements.txt`
- **Destination**: `archive/backend_legacy/`

---

## 🔴 Batch 6: Final Hardening [COMPLETED]
**Focus:** Cross-reference validation and governance scanner execution.
**Governance Priority:** Zero Technical Debt verification.

### Results:
- **Reality Lock**: Mapped all orphaned references in active code.
- **Legacy Cleanup**: `init-db.js` moved to archive as it depended on orphaned backend.

---

## ✨ Batch 7: PWA Optimization [COMPLETED]
**Focus:** Shadow Worker (santis-sw.js) performance hardening.
**Governance Priority:** Rule #5 (Performance Integrity) & Quiet Luxury UX.

### Results:
- **Version**: Upgraded to **V28_SANTIS_ULTRA_FLUID**.
- **Optimization**: Implemented 1.2s Adaptive Timeout, Range Request Bypass for heavy media, and Atomic Pre-caching for core assets.
