# SANTIS OS — Design Drift Inventory

## Status

Documentation-only audit.  
Focus: Design authority drift, token shadowing, and manual layout overrides.

## Core Findings

Current design debt is not a dead-code problem; it is a **"design authority drift"** problem.

### 1. Hardcoded Color Proliferation
- **Volume:** 3000+ instances of hex/rgb values in CSS.
- **Pattern:** Token shadowing via fallback patterns such as `var(--gold, #D4AF37)`. Changing a global token may not update all surfaces due to these hardcoded fallbacks.

### 2. Manual Layout Overrides (The Inline Crisis)
- **Volume:** 650+ `style="..."` attributes in `tr/**` HTML files.
- **Critical Surface:** `tr/urunler/detay.html` and `tr/rituals/index.html` rely almost entirely on inline styles for critical UI logic.

### 3. Multiple Styling Authorities
Conflict between concurrent systems:
- `boardroom-tokens.css` (Canonical Tokens)
- `style.css` (Legacy Centralized Styles)
- `assets/css/santis-v6/*` (Parallel UI System)
- Page-level inline overrides.

## Classification

| Surface | Classification | Reason |
|---|---|---|
| `assets/css/boardroom-tokens.css` | ✅ ALIVE / Token candidate | Canonical design token SSOT |
| `assets/css/style.css` | ✅ ALIVE / Drift-heavy | Central styling in active build |
| `assets/css/santis-v6/*` | ✅ ALIVE / Governance drift | Active CSS import/build chain |
| Inline `style="..."` in active HTML | ⚠️ DRIFT | Fragmenting visual authority |
| Hardcoded hex / rgba / hsla values | ⚠️ DRIFT | Non-deterministic render behavior |
| Tailwind arbitrary values | ⚠️ DRIFT | Bypassing design system constraints |
| `vault_scarcity_v1.css` | 🔍 REVIEW REQUIRED | Heavy use of `!important` and hex values |

## Governance Recommendations

### Phase J — Token Normalization
Replace all hardcoded colors with canonical design tokens from `boardroom-tokens.css`.

### Phase K — Inline Style Purge
Migrate active inline styles from HTML pages into governed CSS classes.

### Phase L — Visual Authority Map
Define the canonical relationship and hierarchy between `boardroom-tokens.css`, `style.css`, and `santis-v6/*`.

## Do Not Touch
- `assets/css/santis-v6/`
- `assets/css/style.css`
- Inline styles in production pages

until the Token Normalization PR is merged.

---
**Bu rapor silme talimatı değildir. Bu rapor yalnızca kanıt temelli envanter ve yönetişim planıdır.** ✅
