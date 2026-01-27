# fix(nv): Resolve Homepage Click & Data Issues

## 1. Summary
This PR resolves critical navigation and data binding issues on the home page and throughout the "NV" UI system. The primary fix addresses a typo in the home page script reference that prevented massage data from loading, and a CSS overlay issue that blocked user interactions.

## 2. Root Cause(s)
- **Data Mismatch (Critical):** `index.html` referenced `massages-data.js` (plural), but the file is named `massage-data.js` (singular). This caused a 404 error and prevented the "Masajlar" grid from rendering correctly.
- **Overlay Blocking:** The preloader element, while visually hidden (`opacity: 0`), retained `pointer-events: auto`, creating an invisible layer that blocked clicks on the page.
- **Variable Alias:** Some UI components expected `NV_MASSAGES` while legacy code/data used `NV_MASSAGE`, creating potential "undefined" errors.
- **Duplicate Entry Points:** Both `tr/masajlar.html` (Legacy) and `tr/masajlar/index.html` (NV System) existed, causing navigation inconsistency. Redirected legacy file to canonical.
- **Wrong Link:** The "TÜM MASAJLAR" button on the home page pointed to a non-existent `tr/masajlar.html` file instead of `tr/masajlar/index.html`.

## 3. Changes

### Home Page (`index.html`)
- Corrected script source: `assets/js/massages-data.js` → `assets/js/massage-data.js`.
- Updated "View All" link path to `/tr/masajlar/index.html`.
- Enhanced `renderNVGrid` with robust `onclick` logic (fallback to slug-based HREF).

### Styles (`assets/css/style.css`)
- Added `.preloader.hidden { pointer-events: none !important; opacity: 0; visibility: hidden; }` to ensure the overlay allows clicks when hidden.

### Data (`assets/js/massage-data.js`)
- Added backward-compatibility alias: `window.NV_MASSAGE = window.NV_MASSAGES`.

## 4. Audit Evidence

> **NV Audit Stats**
> - **Total NV Pages Scanned:** 3 (Home, Masajlar, Cilt Bakımı)
> - **Status:** ✅ ALL PASS
> - **Critical Blockers:** 0

## 5. Test Checklist

- [x] **Home:** Clicking "TÜM MASAJLAR" opens `/tr/masajlar/index.html`.
- [x] **Home:** Clicking any Massage card navigates to the detail page.
- [x] **Preloader:** Page is clickable immediately after load.
- [x] **Console:** No `404` errors for `massages-data.js`.
- [x] **Console:** `window.NV_MASSAGES` is defined and populated.
