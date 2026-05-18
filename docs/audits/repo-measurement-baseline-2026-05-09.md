# SANTIS OS — Repository Measurement Baseline

## Status

Documentation-only measurement report.  
No delete, no archive, no refactor.

## Measurement Scope

Excluded directories:
- `node_modules`
- `dist`
- `_archive`
- `.git`

Measured surface:
- active workspace files
- CSS / HTML design drift density
- legacy markers
- package manager traces
- critical runtime script usage

## Quantitative Findings

| Metric | Result | Interpretation |
|---|---:|---|
| Active workspace files | 5,561 | Stable but fragmented codebase |
| Hardcoded color values | 1,816 | High design drift density |
| TODO / FIXME / HACK / LEGACY markers | 33 | Low count, but concentrated in critical surfaces |
| Root package-manager drift | 0 | `pnpm` remains canonical |
| Reservation E2E | 24/24 PASS | Core booking flow stable |

## Critical Observations

### 1. Large File / Storage Pressure
Large surfaces include log files under `logs/`, visual checkpoint PNGs, vendor bundles, Python `venv/`, and nested `santis-os-monorepo/` build surfaces. These are not automatically classified as dead; they require separate writer/reference checks before any cleanup.

### 2. Design Drift Density
1,816 hardcoded color values were found across CSS and HTML surfaces. This supports the Design Drift audit finding that token adoption is incomplete and legacy visual layers still compete with canonical tokens.

### 3. Legacy Marker Count
33 TODO / FIXME / HACK / LEGACY markers were found in active surfaces. This is not numerically catastrophic, but markers inside runtime-critical files should be reviewed before generic cleanup.

### 4. Critical JS Usage
`assets/js/santis-nav.js` is broadly referenced and must remain protected. `booking-wizard.js` appears narrowly referenced and should be reviewed as part of booking flow consolidation.

### 5. Package Manager Integrity
No root `package-lock.json`, `yarn.lock`, or `bun.lockb` drift was found. `pnpm` remains the canonical package manager.

## Current Evidence Lock Chain

| Audit Area | Status |
|---|---|
| A. Dead / Zombie Inventory | Evidence Locked |
| B. Duplicate UI Language | Evidence Locked |
| C. State Drift | Evidence Locked |
| D. Design Drift | Evidence Locked |
| E. Build / Tooling Debt | Evidence Locked |
| F. Git Debt | Evidence Locked |
| G. Governance Debt | Evidence Locked |
| Repository Measurement | Measured |

## Final Classification

Santis OS is: `STABLE BUT FRAGMENTED`.
The system is operational, buildable, and testable, but still carries fragmentation across design tokens, navigation SSOT, state authority, and governance enforcement.

## Recommended Next Phase
Proceed to: **Phase F — Build Warning Zero**.

---
**Bu rapor silme talimatı değildir. Bu rapor yalnızca kanıt temelli sayısal temel çizgidir.** ✅
