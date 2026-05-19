# Runtime Reference Map — Core JS Inventory

## Overview
This audit maps the references of legacy and "shadow" core JS files within the SANTIS_SITE repository to determine their operational status.

## 1. Target Inventory & Status

| File Path | Version/Context | Status | Primary Reference |
| :--- | :--- | :--- | :--- |
| `assets/js/santis-v10-core.js` | Legacy Core | **Legacy/Shadow** | `index_backup.html:L21` |
| `assets/js/santis-v8-engine.js` | Legacy Engine | **Orphan (Comment-only)** | `santis-coverflow-failsafe.js:L5` |
| `assets/js/core/santis-temporal-v7.js` | Legacy Temporal | **Unreferenced Orphan** | None (Superseded by V42.6) |
| `assets/js/core/sovereign-debt-seed.js` | Internal Tooling | **Unreferenced Orphan** | None |
| `assets/js/modules/santis-ghost-preview.js` | Legacy UX | **Unreferenced Orphan** | None (Superseded by Bootloader) |

---

## 2. Detailed Reference Analysis

### [A] santis-v10-core.js
- **Active Usage:** NONE.
- **Legacy Usage:** Referenced in `index_backup.html`. This file is not part of the active production surface.
- **Risk:** High (Co-exists with `santis-core.js` and `santis-bootloader.js` creating ambiguity).

### [B] santis-v8-engine.js
- **Active Usage:** NONE.
- **Reference:** Only mentioned in a comment within `assets/js/santis-coverflow-failsafe.js` as a fallback example.
- **Risk:** Low (Safe for archival).

### [C] santis-temporal-v7.js
- **Active Usage:** NONE.
- **Analysis:** The system currently uses `assets/js/core/santis-temporal-os.js` (V42.6 Chronos Engine). V7 is an isolated artifact with no imports or script tags found.
- **Risk:** Low (Redundant ballast).

### [D] sovereign-debt-seed.js
- **Active Usage:** NONE.
- **Analysis:** Likely used for initial population of the Sovereign Debt Engine during development. Not referenced in any HTML or production boot sequence.
- **Risk:** Low.

### [E] santis-ghost-preview.js
- **Active Usage:** NONE.
- **Analysis:** The ghost-mode detection is now handled centrally by `assets/js/santis-bootloader.js` (Line 84: `detectGhostMode`). This specific module is obsolete.
- **Risk:** Low.

---

## 3. Dynamic Import Uncertainty List
The following files use dynamic imports or patterns that *could* theoretically resolve to these files, but no string building patterns were found that match the targets:
- `assets/js/santis-bootloader.js` (Omni-Router): Explicitly maps pages to `home-page.js`, `rituals.js`, etc. No wildcards match the legacy core files.
- `assets/js/santis-core.js`: Uses explicit ES Module imports.

## 4. Conclusion
All identified targets are **Candidates for Quarantine**. They are not part of the primary Santis OS V6 runtime path.
