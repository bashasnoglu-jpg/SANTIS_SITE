# Shadow Core Quarantine Manifest

## 1. Quarantine Information
- **Date:** 2026-05-14
- **Objective:** Phase H.3-B Technical Debt Compression
- **Status:** Isolated (Quarantine)
- **Authority:** SANTIS_SITE Governance Layer

## 2. Inventory & Evidence Summary

| Original Path | File Name | Status | Evidence |
| :--- | :--- | :--- | :--- |
| `assets/js/santis-v10-core.js` | santis-v10-core.js | **Legacy** | Only referenced in `index_backup.html`. Orphaned in V6 runtime. |
| `assets/js/santis-v8-engine.js` | santis-v8-engine.js | **Orphan** | No script tags or imports found. Comment-only mention in failsafe. |
| `assets/js/core/santis-temporal-v7.js` | santis-temporal-v7.js | **Orphan** | Superseded by Chronos Engine V42.6. Zero references. |
| `assets/js/core/sovereign-debt-seed.js` | sovereign-debt-seed.js | **Orphan** | Legacy seeding tool. Not part of production boot sequence. |
| `assets/js/modules/santis-ghost-preview.js` | santis-ghost-preview.js | **Obsolete** | Replaced by Bootloader Ghost Detector (Phase 84). |

## 3. Rollback Instructions
In case of runtime failure:
1. Identify the missing file from the table above.
2. Move the file from `_archive/shadow-core/[filename]` back to its **Original Path**.
3. Verify site functionality using `pnpm run test:e2e`.

Example command:
`Move-Item _archive/shadow-core/santis-v10-core.js assets/js/ -Force`

## 4. Final Disposal Recommendation
If no regression is reported within 30 days, these files may be considered for physical deletion (Governance approval required).
