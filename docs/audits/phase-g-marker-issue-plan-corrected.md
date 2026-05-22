# Phase G — Marker Issue Plan (Corrected)

## Overview
This document outlines the technical debt marker (`TODO`, `FIXME`, `HACK`, `LEGACY`) clearance plan based on active source files only. All test reports, generated files, docs, and archives have been excluded.

## P0 Candidates
*(Targeting: security, auth/session, payment/billing, booking/reservation, tenant isolation, production deployment, service worker runtime safety)*

**Result:** Zero P0 markers found in active source code.
No critical production or security paths contain legacy hooks or unresolved critical markers.

## P1 Candidates
*(Targeting: core intelligence logic, state governance, design token fragmentation, legacy routing / URL normalization, data bridge migration, admin / boardroom / runtime observability)*

**1. Design Token Fragmentation**
- **File:** `assets/css/santis-cards.css`
- **Line:** 135
- **Marker:** `/* --- 3. LEGACY CARD (Fallback) --- */`
- **Why P1:** Retains legacy design token structures, violating the unified CSS font/token contract.
- **Recommended Action:** Migrate any remaining dependencies to the new design system and remove the fallback card styles.

**2. Design Token Tooling Fragmentation**
- **File:** `scripts/build-css-tokens.js`
- **Lines:** 29, 105
- **Marker:** `const LEGACY_ALIASES = [...]`
- **Why P1:** Generates legacy design aliases in the build process, preventing complete Phase H adoption.
- **Recommended Action:** Deprecate aliases and enforce strict new token variable names.

**3. Legacy Routing / State Mapping**
- **File:** `assets/js/category-engine.js`
- **Line:** 31
- **Marker:** `// LEGACY MAPPER: Map 'MASSAGES' -> 'massage' for new config`
- **Why P1:** Creates technical debt in state parsing/routing logic.
- **Recommended Action:** Update upstream data sources or config to provide the correct key natively, removing the mapper.

**4. Legacy Routing / URL Normalization**
- **File:** `assets/js/url-normalizer.js`
- **Lines:** 29, 36, 145, 163, 165, 167
- **Marker:** `// LEGACY REDIRECT MAP` and `const LEGACY_REDIRECTS = { ... }`
- **Why P1:** Maintained client-side redirect dictionary adding script weight and masking potential dead routes.
- **Recommended Action:** Move these redirects to edge infrastructure (`vercel.json` or equivalent) and remove the client-side map.

**5. Core Intelligence Logic**
- **File:** `core/cortex/oracle_engine.py`
- **Line:** 10
- **Marker:** `# TODO: Implement deep learning mood analysis`
- **Why P1:** Placeholder for core intelligence features that needs proper ticket tracking.
- **Recommended Action:** Move to feature backlog Epic and remove inline `TODO`.

**6. Core Intelligence Logic**
- **File:** `core/evolution/self_healer.py`
- **Line:** 10
- **Marker:** `# TODO: Implement auto-correction logic`
- **Why P1:** Same as above. Unfinished core feature placeholder.
- **Recommended Action:** Move to feature backlog Epic and remove inline `TODO`.

**7. Data Bridge Migration**
- **File:** `assets/js/loaders/data-bridge.js`
- **Line:** 1
- **Marker:** `// ☠️ [LEGACY BRIDGE] — V10 santis-data-bridge.js kullanın`
- **Why P1:** An entire legacy module remains in the repository despite a newer version being mandated.
- **Recommended Action:** Validate zero runtime dependencies and completely delete `data-bridge.js`.

**8. Admin / Boardroom Observability**
- **File:** `packages/gravity-ux-engine/src/saas-dashboard/cognitive-certificate.html`
- **Line:** 19
- **Marker:** `/* ── YÜKLEME (HACK/ANALİZ) EKRANI ── */`
- **Why P1:** Uses temporary logic (`HACK`) for the admin analytics loading screen.
- **Recommended Action:** Implement standard loading skeleton and remove the hack.

## P2 Backlog
*(Low-risk comments, cosmetic legacy notes, tooling comments)*

- `assets/js/hamam-engine.js:580` - `// LEGACY METHODS & UI LOGIC` (Informational comment).
- `scripts/cjs_to_esm_codemod.py:660, 665` - `// TODO(manual-review): ...` (Codemod script note).
- `scripts/test-echo-gateway.mjs:62` - `role: 'HACKER_ROLE'` (Mock data string matching keyword).
- `tools/i18n_update_remaining.py:16, 18` - `const LEGACY_REDIRECTS` (String literal in tooling).
- `tools/migrate_massages.py:285` - `# TODO: Fix breadcrumb link...` (Script development note).
- `tools/project_report.py:151` - `# === BACKUP/LEGACY WEIGHT ===` (Tooling comment).
- `tools/verify_vip.py:23` - `# HACK: Manually inject a citizen...` (Mock tooling note).

---

## Issue Drafts

### P1 Marker Cleanup Issue (Draft)
**Title:** `[EPIC] Phase H0 — P1 Technical Debt Clearance (Observability & Design)`
**Labels:** `governance`, `p1`, `design-system`, `core-logic`
**Body:**
```markdown
## Overview
This epic tracks high-priority (P1) markers related to design token fragmentation, legacy routing components, and core intelligence logic. Resolving these items is required to achieve complete architectural sovereignty in Phase H.

## Identified Action Items

**1. Design & CSS Tokens**
- [ ] `assets/css/santis-cards.css:135` - Remove `LEGACY CARD (Fallback)` and migrate usages to standard tokens.
- [ ] `scripts/build-css-tokens.js:29` - Deprecate `LEGACY_ALIASES` in the build process.

**2. Routing & State Normalization**
- [ ] `assets/js/category-engine.js:31` - Remove `LEGACY MAPPER` logic. Update downstream configs to use native keys.
- [ ] `assets/js/url-normalizer.js:36` - Extract `LEGACY_REDIRECTS` map to edge infrastructure (`vercel.json`) and remove from client bundle.

**3. Module Deprecation**
- [ ] `assets/js/loaders/data-bridge.js:1` - Verify zero dependencies and delete this `[LEGACY BRIDGE]` module. V10 bridge is the SSOT.

**4. Core Intelligence Backlog Transition**
- [ ] `core/cortex/oracle_engine.py:10` - Move "Implement deep learning mood analysis" to a formal feature ticket.
- [ ] `core/evolution/self_healer.py:10` - Move "Implement auto-correction logic" to a formal feature ticket.

**5. Gravity UX Engine**
- [ ] `packages/gravity-ux-engine/src/saas-dashboard/cognitive-certificate.html:19` - Resolve `HACK/ANALİZ` UI implementation and replace with deterministic standard components.

## Acceptance Criteria
- All listed markers are permanently removed from the `main` branch.
- No `LEGACY` fallback paths remain in active UI routing or CSS.
```
