# Santis OS - Risk Register v1.0
Generated: 2026-05-15
Mode: READ-ONLY AUDIT

## 1. Architectural Redundancy (Medium Risk)
Duplicate or shadowing scripts detected in `assets/js/core/`:
- `santis_router.js` vs `santis-sovereign-router.js` (Potential runtime confusion).
- `santis-sovereign-router.js` vs `sovereign-router.js`.
- `SovereignDebtEngine.js` vs `sovereign-debt-engine.js`.
- **Risk**: Dual-source of truth for routing or debt logic could lead to inconsistent state transitions.

## 2. Legacy Residue (Low/Medium Risk)
Large volume of "temporary" and "stale" files in `archive/`:
- `archive/scripts/tmp_...` (Over 20+ scripts).
- `archive/stale_reports/`.
- `archive/tw_v3_legacy/` (Legacy Tailwind configs).
- **Risk**: Potential for accidental imports or inclusion in builds if inclusion patterns are too broad.

## 3. Asset Weight & Performance (High Risk - Phase I Focus)
- Unoptimized mp4 files in `assets/img/cards/`.
- Large WebP/PNG assets in `assets/img/blog/` (Detected during manual scan of directory).
- **Risk**: Impact on LCP (Largest Contentful Paint) and cumulative layout shift.

## 4. Governance Drift (Medium Risk)
- `test_results.txt` and other temp files found in root.
- **Risk**: Pollution of the core repository boundary.

## 5. Dependency Governance (Low Risk)
- Presence of multiple `.env` related artifacts in archive.
- **Risk**: Potential leakage of non-production credentials if not properly excluded from git history (though currently ignored).

## 6. Realtime Complexity (Medium Risk)
- Multiple WebSocket managers (`santis-ws-manager.js`, `santis-ws-orchestrator.js`).
- **Risk**: Connection leakage or race conditions in event handling if both are active.
