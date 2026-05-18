# SANTIS OS — Duplicate UI Language Inventory

## Status

Documentation-only audit.  
No delete, no archive, no refactor.

## Core Finding

Navigation has no single canonical SSOT.

Current runtime chain:

1. `components/navbar.html` provides an ALIVE static SEO/HTML shell.
2. `assets/js/santis-nav.js` clears and rebuilds nav at runtime.
3. `santis-nav.js` attempts `/api/nav-manifest` and `/data/nav-manifest.json`.
4. `data/nav-manifest.json` is missing.
5. Runtime falls back to the hardcoded JS fallback list.
6. Existing `data/menu.json` and `assets/data/menu.json` are not used by this runtime chain.

## Classification

| Surface | Classification | Reason |
|---|---|---|
| `components/navbar.html` | ✅ ALIVE shell | Referenced by active HTML pages |
| `components/footer.html` | ✅ ALIVE shell | Referenced by active HTML pages |
| `assets/js/santis-nav.js` | ✅ ALIVE runtime | Runtime nav builder |
| `data/nav-manifest.json` | ❌ MISSING | Expected by runtime but absent |
| `data/menu.json` | ⚠️ ZOMBIE | Legacy menu shape, not runtime-connected |
| `assets/data/menu.json` | 🔍 REVIEW REQUIRED | Modern candidate but not runtime-connected |
| `assets/html/components/*` | ⚠️ ZOMBIE candidate | Shadow component pack, requires final reference scan |
| `assets/css/santis-v6/*` | ✅ ALIVE / governance drift | Active CSS import chain; do not archive |

## Recommended Next Step

Do not archive yet.

First implement a navigation SSOT decision:

Option A:
- Create `data/nav-manifest.json` from the modern `assets/data/menu.json` shape.
- Update `santis-nav.js` to consume it deterministically.
- Keep `components/navbar.html` as SEO shell.

Option B:
- Declare `components/navbar.html` as canonical static source.
- Remove runtime rebuild behavior in a later controlled PR.

Preferred path:
Option A, because it preserves runtime adaptivity while restoring deterministic SSOT.

## Do Not Touch

- `assets/css/santis-v6/`
- `assets/js/santis-nav.js`
- `components/navbar.html`
- `components/footer.html`

until the SSOT decision PR is merged.

---
**Bu rapor silme talimatı değildir. Bu rapor yalnızca kanıt temelli envanter ve güvenli arşiv planıdır. Her dosya taşıma işlemi ayrı branch, küçük batch ve gate doğrulaması gerektirir.** ✅
