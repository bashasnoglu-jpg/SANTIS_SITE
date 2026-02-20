# 🕵️ SANTIS PROJECT AUDIT REPORT

**Date:** 2026-02-04

**Status:** Critical Hygiene Issues Found



## 🚨 1. CRITICAL DUPLICATES (Data Integrity Risk)

these files exist in two locations. If one is updated and the other is not, the site will break or data will be lost.



| File A (Active?) | File B (Legacy/Duplicate?) | Risk |

| :--- | :--- | :--- |

| `assets/js/product-data.js` | `admin/product-data.js` | **HIGH**: Admin panel might be editing a detached file. The site uses `assets/js/...`. |

| `server.py` | `live-server.py` | **MEDIUM**: Confusion on which server script to run. `server.py` is currently running. |

| `assets/data/home_data.json` | `admin/data/home_data.json` | **HIGH**: Homepage content split brain. |



## 🗑️ 2. CLUTTER & JUNK (Safe to Delete)

Files that appear to be accidental copies or obsolete backups.



- [ ] `home_data (1).json` (Root) - *Likely a download duplicate*

- [ ] `assets/css/editorial-zigzag.css.bak` - *Explicit backup file*

- [ ] `audit_results_utf8.txt` - *Old report*

- [ ] `audit_results_latest.txt` - *Old report*

- [ ] `audit_report_current.txt` - *Old report*



## 📂 3. ROOT DIRECTORY ORGANIZATION

The root folder is cluttered with scripts and reports that should be organized.



**Scripts (Move to `/scripts` or `/tools`):**

- `0_PANELI_AC.bat`

- `BASLAT.bat`

- `BASLAT_NEURAL.bat`

- `DIAGNOSE_SERVER.bat`

- `KUR_PILLOW.bat`

- `START_SERVER.bat`

- `YUKLE.bat`

- `fix_cards.bat`

- `fix_social_assets.bat`



**Documentation (Move to `/docs`):**

- `ADMIN_KULLANIM_KILAVUZU.md`

- `ADMIN_PANEL_DURUM_RAPORU.md`

- `AUTOMATION_STRATEGY.md`

- `FUTURE_SCALE_STRATEGY.md`

- `GLOBAL_SOCIAL_LANDSCAPE_REPORT.md`

- `HATA_ANALIZ_RAPORU.md`

- `PLANNING_ADMIN.md`

- `PLANNING_COMMERCE.md`

- `SAGLIK_RAPORU.md`

- `SOCIAL_MEDIA_MEGA_PLAN.md`

- `URUN_YONETIMI_RAPORU.md`



## 🚀 RECOMMENDED ACTION PLAN



1.  **Unify Data:** Delete `admin/product-data.js` and make Admin Panel read/write directly to `assets/js/product-data.js` (or use it as the single source).

2.  **Consolidate Server:** Confirm `server.py` is the master, archive `live-server.py`.

3.  **Clean Root:** Move `.bat` files to a `_launcher/` folder and `.md` reports to `_reports/`. Delete `home_data (1).json` and `.bak` files.



**Shall I proceed with Step 1 (Data Unification) and Step 3 (Root Cleanup)?**

