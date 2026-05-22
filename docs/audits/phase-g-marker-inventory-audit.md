# Phase G — Marker Inventory Audit

## Status
Inventory only.

## Scope
Excluded:
- node_modules
- dist
- _archive
- .git
- assets/vendor
- coverage
- build outputs

## Classification Rules

### P0
Markers touching:
- auth/session/security
- payments/billing
- booking/reservation
- tenant isolation
- production deployment
- service worker runtime safety

### P1
Markers touching:
- design token fragmentation
- state governance
- runtime observability
- admin/boardroom
- CI/CD guardrails

### P2
Markers that are:
- old comments
- non-runtime notes
- documentation reminders
- cosmetic cleanup notes

## Findings

### P0 (Critical - Needs Immediate Tracked GitHub Issues)
- `tools/verify_vip.py:23` - `HACK: Manually inject a citizen...` (Auth/Tenant isolation breach risk)
- `scripts/test-echo-gateway.mjs:62` - `{ type: 'AUTH', role: 'HACKER_ROLE' } // Geçersiz!` (Security boundary)
- `tests/test_booking_stress.py:123` - `TODO: Booking Management` (Booking/Reservation core logic)

### P1 (Medium - Requires Refactoring or Architecture Alignment)
- `core/evolution/self_healer.py:10` - `TODO: Implement auto-correction logic` (State Governance)
- `core/cortex/oracle_engine.py:10` - `TODO: Implement deep learning mood analysis` (Runtime Observability)
- `scripts/build-css-tokens.js:29` - `LEGACY_ALIASES` (Design Token Fragmentation)
- `packages/gravity-ux-engine/src/saas-dashboard/cognitive-certificate.html:19` - `YÜKLEME (HACK/ANALİZ) EKRANI` (Admin/Boardroom boundary)

### P2 (Low - Old Comments, Fallbacks, Cosmetic/Documentation)
- `assets/js/url-normalizer.js` - Multiple `LEGACY_REDIRECTS` and maps (Legacy Fallback)
- `assets/js/loaders/data-bridge.js:1` - `[LEGACY BRIDGE]` (Non-runtime note for V10 migration)
- `assets/js/hamam-engine.js:580` - `LEGACY METHODS & UI LOGIC` (Cosmetic documentation)
- `assets/js/category-engine.js:31` - `LEGACY MAPPER` (Fallback compatibility note)
- `assets/css/santis-cards.css:135` - `LEGACY CARD (Fallback)` (Cosmetic)
- `scripts/cjs_to_esm_codemod.py` - Multiple `TODO(manual-review)` (Documentation reminder)
- `tools/migrate_massages.py:285` - `TODO: Fix breadcrumb link` (Cosmetic script note)
- `hidden_audit.py`, `tools/project_report.py`, `tools/i18n_update_remaining.py`, `MARKERS_CLEAN.txt` - Mentions inside strings, regexes, and log files.

## Action
No marker removal performed in this pass.
