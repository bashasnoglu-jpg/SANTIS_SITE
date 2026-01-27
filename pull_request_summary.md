# PR: Santis: TR-only lock + non-TR cleanup + a11y stabilization

**Branch:** `santis-tr-only-cleanup`  
**Status:** Ready

## ✅ Quality Gates & Infrastructure (New)
- **UTF-8 Policy (CI-enforced):** Added `tools/check_utf8.py` (PR fails if any tracked text file is not valid UTF-8).
- **CI Pipeline:** Added `.github/workflows/quality.yml` to run UTF-8 + audit checks on PR/push.
- **Standards:** Added `.editorconfig` and `.gitattributes` (LF + UTF-8 defaults).
- **Validation:** Local UTF-8 scan passed (150+ tracked files).

## Summary
Enforced strict **Turkish-only (TR)** behavior across the codebase, removed legacy multi-language assets, and stabilized booking modal accessibility. Changes follow the “Ultra Mega” plan with audit evidence.

---

## Changes

### Phase 1: Audit & Evidence
- Added `tools/audit.sh` and `tools/audit.ps1`
- Added baseline report `tools/audit-report.md`

**Audit proof:**
```text
🎉 AUDIT PASSED (0 forbidden hits)
```

### Phase 2: TR-Only Lock

* `assets/js/app.js` enforces `SITE_LANG="tr"` + `trText()` safe getter.
* `hotel.html` and `service.html` patched:
  * ignores `?lang=...` and strips it from URL via `history.replaceState`
  * removed legacy language branching

### Phase 3: A11y & Modals

* Booking modal standardized:
  * closed state uses `hidden`
  * open state uses `.active`
  * background uses `inert` (when supported)
  * focus restore via `__bookingLastFocus`
  * ESC + outside click closes
* Fix specifically targets the browser warning:
  * “Blocked aria-hidden on an element because its descendant retained focus”
  * by avoiding `aria-hidden` on focused ancestors and restoring focus safely.
* `#lightbox` / `#reviewModal`: repo-wide audit found no references; no changes applied in this PR.

### Phase 4: Cleanup & Redirects

* Deleted: `en/` directory and `assets/js/hammam-zigzag-en.js`
* Added `_redirects` (Safe Harbor):

```text
/en/hammam/*   /tr/hammam/   301!
/en/*          /             301!
/fr/*          /             301!
/de/*          /             301!
/du/*          /             301!
/ru/*          /             301!
```

> Note: If the hosting publish directory is not the repo root, `_redirects` must live in the publish root.

---

## Acceptance Checklist

* [x] `state.lang` always `"tr"`
* [x] No `name[STATE.lang]` / `.translations[lang]`
* [x] `?lang=` stripped (bookmark-safe)
* [x] Audit scripts pass
* [x] Booking modal works with focus restore and no aria-hidden focus warnings
* [x] CI gates enforce UTF-8 + audits

## Rollback Plan

* Revert merge:
  * `git revert -m 1 <MERGE_COMMIT_SHA>`
* Restore deleted content (if needed):
  * `git checkout <OLD_COMMIT_SHA> -- en/ assets/js/hammam-zigzag-en.js`

---

## Post-merge Smoke Test (5 dk)
- [] **Home (index.html):** Navbar/Footer load via `loadComp`, ana bölümler render oluyor (cards görünüyor).
- [] **Service pages:** `service.html` ve `service-detail.html` açılıyor, metinler TR, “undefined” yok.
- [] **Collections:** `tr/masajlar/index.html` + `tr/cilt-bakimi/index.html` açılıyor; arama + chip filtre çalışıyor.
- [] **Booking modal:** CTA’dan açılıyor; focus close button’a geçiyor; ESC + dış tık ile kapanıyor; kapanınca focus trigger’a dönüyor.
- [] **Console:** 0 error, 0 “aria-hidden… descendant retained focus” warning; 404 (assets/components) yok.
- [] **Redirect:** `/en/anything` -> `/` ve `/en/hammam/anything` -> `/tr/hammam/` 301 çalışıyor (hosting’de).
