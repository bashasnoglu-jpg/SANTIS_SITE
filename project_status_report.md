# NEUROVA Website Deficiency & Status Report
**Date:** 2026-02-19
**Auditor:** Antigravity (Senior Web Auditor)
**Context:** Multi-language Parity & Data Integrity Audit

## 1. Executive Summary
The project is recovering from a major synchronization effort. While the Turkish (TR) section is largely consistent with the central database (`db.js`), the English (EN) section suffers from significant **Filename vs. Slug Mismatches**. Since the architecture uses a "Universal Slug" system (defined in `db.js`), these mismatches will likely cause "Content Not Found" errors or empty service detail pages on the EN site. Immediate remediation is required to rename EN files to match the canonical DB slugs.

## 2. Critical Deficiencies (High Priority)
### 🚨 Slug vs. Filename Mismatches (EN)
The following English pages have filenames that do not match the `slug` defined in `db.js`. This breaks the data loading logic which relies on the URL slug.

| Service | DB Canonical Slug | Current TR Filename (Correct) | Current EN Filename (❌ INCORRECT) | Action Required |
| :--- | :--- | :--- | :--- | :--- |
| **Bali Massage** | `bali-terapi` | `bali-terapi.html` | `bali-masaji.html` | **Rename EN to** `bali-terapi.html` |
| **Hot Stone** | `sicak-tas-masaji` | `sicak-tas-masaji.html` | `sicak-tas.html` | **Rename EN to** `sicak-tas-masaji.html` |
| **Deep Tissue** | `derin-doku-masaji` | `derin-doku-masaji.html` | `derin-doku.html` | **Rename EN to** `derin-doku-masaji.html` |
| **Back Therapy** | `sirt-terapi-masaji` | `sirt-terapi-masaji.html` | `sirt-terapi.html` | **Rename EN to** `sirt-terapi-masaji.html` |
| **Anti-Cellulite**| `selulit-masaji` | `selulit-masaji.html` | `anti-selulit.html` | **Rename EN to** `selulit-masaji.html` |
| **Reflexology** | `ayak-refleksoloji`| `ayak-refleksoloji.html` | `refleksoloji.html` | **Rename EN to** `ayak-refleksoloji.html` |
| **Cranio Sacral** | `kranyo-sakral-terapi` | `kranyo-sakral-terapi.html` | `kranyo-sakral.html` | **Rename EN to** `kranyo-sakral-terapi.html` |
| **Anti-Stress** | `anti-stress-masaji` | `anti-stress-masaji.html` | `anti-stress.html` | **Rename EN to** `anti-stress-masaji.html` |

### 🚨 Missing Pages (EN)
The following services exist in `db.js` and TR, but catch-all or specific pages are missing in EN.

*   `manuel-terapi.html` (Manual Therapy)
*   `lokal-derin-doku.html` (Local Deep Tissue)
*   `lokal-sicak-tas.html` (Local Hot Stone)
*   `bronz-masaji.html` (Bronze Massage) - Folder exists, file missing?

## 3. Data Integrity & Codebase Hygiene
*   **Legacy Clutter:** The `en/massages` and `tr/masajlar` directories are polluted with `_backup_legacy`, `_backup_manual` folders. These should be archived outside the deployment path to prevent confusion.
*   **DB Duplication:** `db.js` contains entries with `_50` suffixes (e.g., `klasik-masaj-50`). Verify if these are active services or legacy data. If active, ensure they don't conflict with main slugs.

## 4. Recommendations & Action Plan
1.  **Batch Rename EN Files:** Execute a script to rename all mismatched mismatching EN files to their canonical DB slugs.
2.  **Generate Missing Pages:** Create the 4 missing EN service pages (`manuel-terapi`, `lokal-derin-doku`, `lokal-sicak-tas`, `bronz-masaji`) using the standard template.
3.  **Clean Backup Folders:** Move all `_backup*` folders to a dedicated Root `_archive` directory.
4.  **Verify DB Schema:** Confirm that the frontend logic (`service-detail-logic.js`) strictly uses the URL slug to fetch data.

**Ready to execute Phase 1 (Renaming) upon approval.**
