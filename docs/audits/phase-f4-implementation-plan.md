# Phase F4 - Bundle Budget Baseline & Optimization Plan

## Current State (Baseline)
- **Largest Chunk:** `tests_reports_html_index-*.js` (402.78 KB) - ⚠️ CRITICAL (Incorrectly bundled test report)
- **Core Kernel:** `santis-kernel-*.js` (61.75 KB) - ✅ OK
- **Booking Flow:** `booking-*.js` (41.09 KB) - ✅ OK

## Identified Issue
The Vite entry discovery logic is picking up `tests/reports/html/index.html`, which leads to a ~400KB chunk that shouldn't be in the production assets.

## Remediation Steps
1. **Exclude Test Artifacts:** Add `tests` and `reports` to the `EXCLUDE_DIRS` set in `vite.config.ts`.
2. **Verify Bundle Size:** Re-run the build to confirm the 400KB chunk is removed.
3. **Threshold Check:** Ensure no other business-critical chunk exceeds 400KB.

## Validation Gate
- `pnpm run build:mpa`
- No warnings about chunks > 400KB.
- Workspace Clean.
