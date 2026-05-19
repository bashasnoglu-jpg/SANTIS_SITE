# SANTIS_SITE — Dead Code / Zombie Code Inventory
> **Date:** 2026-05-09  
> **Auditor:** Senior Staff Architect + Repo Governance Lead (Antigravity)  
> **Methodology:** Evidence-based. A file is NOT marked DEAD unless ≥ 2 independent evidence points exist.  
> **Doctrine:** No deletion. No blind refactor. No speculative moves. Evidence before action.

---

## Governance Status

| Item | Status |
|---|---|
| Phase 1 — Reservation E2E Gate | ✅ 24/24 PASS |
| Phase 2 — Lint Zero Warning | ✅ PASS (branch: `phase-2-lint-zero-warning-quality-seal`, commit `661edc78`) |
| Phase 3A — Runtime Component Visual Truth Seal | ✅ PASS (commit `853edd47`) |
| **Phase A — Dead Code Inventory** | ✅ This document |
| Phase B — Archive Operation | ⏳ Boardroom approval required |
| Phase C — Root Artifact Cleanup | ⏳ Separate PR |

---

## Reality Lock — Repo State

| Parameter | Value |
|---|---|
| Workspace | pnpm monorepo (turbo) |
| Canonical backend | `apps/ingestion-api` (port 3030) |
| Canonical admin frontend | `admin-panel/` (React/Vite, port 8080) |
| Marketing site | Static HTML (root + `tr/`) |
| Legacy admin panel | `admin/` — **Frozen at Phase 70** (`admin/_DEPRECATED_ADMIN.md` confirms) |

---

## Legend

| Icon | Meaning |
|---|---|
| 💀 DEAD | ≥ 2 evidence points: zero HTML/JS/route imports, deprecated notice present |
| ⚠️ ZOMBIE | Referenced, but only by a legacy/frozen surface |
| 🔍 REVIEW REQUIRED | 1 evidence point; full import graph not confirmed |
| ✅ ALIVE | Actively referenced from a production path |
| 🪦 STUB | Previously neutralized; empty export shell intentionally left for 404 prevention |

> **Important:** STUB ≠ DELETE. Stubs may be preventing 404 errors on pages that still reference these module paths. Do not remove without confirming no active consumer exists.

---

## Category 1 — Neutralized (Stub) JS Files

Previously intentionally hollowed out. Content replaced with `console.log` + empty export. Files remain on disk to prevent 404s.

| File | Size | Evidence 1 | Evidence 2 | Decision |
|---|---|---|---|---|
| `assets/js/santis-forge-injector.js` | 303B | Content: `☠️ ULTRA-MEGA PURGE — NÖTRALİZE` | 0 HTML references | 🪦 STUB → Phase B Archive |
| `assets/js/santis-rail.js` | 427B | Content: `☠️ ULTRA-MEGA PURGE — NÖTRALİZE` | 0 HTML references | 🪦 STUB → Phase B Archive |
| `assets/js/santis-gods-eye.js` | 511B | Seeks `#santis-gods-eye-canvas`; canvas exists in 0 active HTML | Only `admin/command-center.html` (frozen) references it | ⚠️ ZOMBIE → Archive |
| `assets/js/santis-canvas-engine.js` | 731B | Only imported by `santis-gods-eye.js` | gods-eye is zombie → cascade dead | 💀 DEAD → Archive |

---

## Category 2 — Orphan JS Files (Zero Active HTML References)

No production HTML file (root, `tr/`, marketing) loads these via `<script>`.

| File | Size | Evidence 1 | Evidence 2 | Decision |
|---|---|---|---|---|
| `assets/js/santis-bootloader.v10.js` | 8.9KB | 0 refs (only `index_backup.html`) | backup HTML is dead page | 💀 DEAD → Archive |
| `assets/js/santis-v8-engine.js` | 18.8KB | 0 HTML references | Version name conflict with v10 | 💀 DEAD → Archive |
| `assets/js/santis-v10-core.js` | 21KB | Only `index_backup.html` L21 | backup HTML is dead page | 💀 DEAD → Archive |
| `assets/js/santis-v17-bridge.js` | 2KB | 0 HTML references | Version naming → legacy era | 💀 DEAD → Archive |
| `assets/js/santis-diff-v2.js` | 5.9KB | 0 HTML references | "diff-v2" = version utility | 💀 DEAD → Archive |
| `assets/js/santis-kill-room.js` | 2KB | 0 HTML references | Name = operational tool, not prod | 💀 DEAD → Archive |
| `assets/js/santis-hologram.js` | 4.6KB | `index_backup.html` comment: `REMOVED: Dev-only editor tool` | 0 active references | 💀 DEAD → Archive |
| `assets/js/santis-icos-renderer.js` | 3.4KB | 0 HTML references | Specialized renderer, no linked page | 💀 DEAD → Archive |
| `assets/js/santis-gpu-field.js` | 11KB | 0 HTML references | GPU effects also in `engines/gpu-effects.js` | 💀 DEAD → Archive |
| `assets/js/santis-physics.js` | 8.4KB | 0 HTML references | Physics engine → `santis-rail.js` was stub | 💀 DEAD → Archive |
| `assets/js/neuro-db.js` | 6.2KB | 0 HTML references | DB logic → `apps/ingestion-api/src/db.ts` canonical | 💀 DEAD → Archive |
| `assets/js/neuro-sync.js` | 10.9KB | 0 HTML references | Sync engine → SSE replaced | 💀 DEAD → Archive |
| `assets/js/world.js` | 148KB | Only `admin/boardroom.html` | `admin/` FROZEN (Phase 70) | 💀 DEAD → Archive |
| `assets/js/tailwindcss.min.js` | 407KB | Referenced only in 4 frozen/legacy locations | All consumers are dead surfaces | ⚠️ ZOMBIE → 407KB unnecessary payload |
| `assets/js/santis-audio.js` | 9.2KB | 0 HTML references | Possible duplicate of `santis-audio-ui.js` | 🔍 REVIEW |
| `assets/js/santis-audio-ui.js` | 7.8KB | 0 HTML references | May be alternate of above | 🔍 REVIEW |
| `assets/js/santis-voice.js` | 5.2KB | 0 HTML references | Voice UI — active feature status unknown | 🔍 REVIEW |
| `assets/js/santis-brain.js` | 5.6KB | 0 HTML references | `core/santis-core.js` (30KB) is canonical | 🔍 REVIEW |
| `assets/js/santis-sovereign-ghost.js` | 3.3KB | Only `guest-zen/index.html` | guest-zen = standalone, no prod route confirmed | ⚠️ ZOMBIE (tied to guest-zen) |
| `assets/js/santis-coverflow-failsafe.js` | 3.7KB | Only `tr/index.html` | TR homepage = active production page | ✅ ALIVE (confirm coverflow usage) |
| `assets/js/santis-quantum-nexus.js` | 6KB | `tr/index.html` + `bronz-masaji.html` | Both are production pages | ✅ ALIVE |

---

## Category 3 — Frozen Admin Panel (`admin/`)

**Definitive Evidence:** `admin/_DEPRECATED_ADMIN.md` states:
> *"Phase 70'de dondurulmuş. Yeni özellik ekleme. Bug düzeltme. Tüm geliştirme `admin-panel/`'da."*

The entire `admin/` directory is officially frozen. `admin/_archive/` and `admin/_quarantine/` sub-directories already exist — the directory is self-archiving.

**Canonical admin:** `admin-panel/` (React/Vite)

| Path | Size (est.) | Decision |
|---|---|---|
| `admin/boardroom.html` | 65KB | 💀 DEAD — Phase 70 frozen |
| `admin/command-center.html` | 114KB | 💀 DEAD — Phase 70 frozen |
| `admin/god-mode.html` | 42KB | 💀 DEAD — Phase 70 frozen |
| `admin/chameleon-settings.html` | 78KB | 💀 DEAD — Phase 70 frozen |
| `admin/black-room.html` | 77KB | 💀 DEAD — Phase 70 frozen |
| `admin/dashboard.html` | 28KB | 💀 DEAD — Phase 70 frozen |
| `admin/integrated_hub.js` | 116KB | 💀 DEAD — Phase 70 frozen |
| `admin/vue-command-center.js` | 29KB | 💀 DEAD — Vue.js dependency; Vue is not in Sovereign OS stack |
| `admin/inline-panels.js` | 40KB | 💀 DEAD — Phase 70 frozen |
| `admin/i18n-dashboard.js` | 38KB | 💀 DEAD — Phase 70 frozen |
| `admin/` (full directory) | ~600KB+ | ⚠️ Phase B PR → `_archive/legacy-admin-panel/` |

> **Note:** `admin/_archive/` and `admin/_quarantine/` already exist inside; these should be excluded from the archive move.

---

## Category 4 — HQ Dashboard (`hq-dashboard/`)

Single-page legacy dashboard using Tailwind CDN JS (407KB). Superseded by `admin-panel/`.

| File | Evidence 1 | Evidence 2 | Decision |
|---|---|---|---|
| `hq-dashboard/index.html` (167KB) | Uses `tailwindcss.min.js` CDN | `admin-panel/` is the active React admin | 💀 DEAD → Archive |
| `hq-dashboard/js/admin-radar.js` | Loaded only by dead `hq-dashboard/index.html` | hq-dashboard is dead | 💀 DEAD → Archive |
| `hq-dashboard/refactor.py` | Python script in dead directory | No runtime caller | 💀 DEAD → Safe delete |

---

## Category 5 — Standalone Mini-Apps (Unrouted)

### `guest-zen/` (44KB, single HTML)
- Single file: `guest-zen/index.html`
- Loads `santis-sovereign-ghost.js` + `tailwindcss.min.js`
- No reference in Vercel config, `_redirects`, `routes.json`, or pnpm workspace
- **Decision:** 🔍 REVIEW REQUIRED — Confirm production URL or archive

### `tenant-dashboard/` (27KB, single HTML)
- Single file: `tenant-dashboard/index.html`
- Loads `tailwindcss.min.js` CDN + inline JS
- Not in `pnpm-workspace.yaml`, no production route
- **Decision:** 💀 DEAD → Phase B Archive

### `clinic-kiosk/`
- `index.html`: Three.js r128 CDN (jsDelivr) + local `js/` modules
- Purpose: "Sovereign Longevity" sales kiosk ($3,500–$25,000 packages)
- No production route, not in deployment configs
- **Decision:** 🔍 REVIEW REQUIRED — Confirm product roadmap status

### `santis-live-simulator/`
- Not fully analyzed; name implies dev-only simulator
- **Decision:** 🔍 REVIEW REQUIRED

---

## Category 6 — Legacy Server (`server/`)

`server/` was migrated to `apps/ingestion-api/` post-Phase 70.

| File | Size | Evidence 1 | Evidence 2 | Decision |
|---|---|---|---|---|
| `server/api-mock.ts` | 27KB | Uses `(global as any).globalWss2` = anti-pattern | Not in any Turbo task | 💀 DEAD → Archive |
| `server/santis-orbital-forge.js` | 25KB | Disabled/commented in `dev-control-layer.js` | Duplicate of `.mjs` variant | ⚠️ ZOMBIE |
| `server/santis-orbital-forge.mjs` | 25KB | Exact copy of `.js` variant | Both disabled in dev-control | ⚠️ ZOMBIE |
| `server/santis-reaper.js` | 10KB | 0 import references found | "reaper" = legacy cleanup tool | 💀 DEAD → Archive |
| `server/certificate-generator.js` | 4KB | Standalone script, 0 runtime references | Cert management → infra level | 💀 DEAD → Archive |
| `server/santis-db-vault.js` | 626B | 0 import references | DB → `apps/ingestion-api/src/db.ts` canonical | 💀 DEAD → Archive |
| `server/santis-shadow-analytics.js` | 1.4KB | 0 import references | Analytics → telemetry engine canonical | 💀 DEAD → Archive |
| `server/santis-signaling-nexus.js` | 2.1KB | Parallel: `nexus-signaling-server/` is separate package | 0 runtime references | 💀 DEAD → Archive |

---

## Category 7 — Nexus Signaling Server (`nexus-signaling-server/`)

Independent package with its own `package.json`. Investigation findings:

| Evidence | Detail |
|---|---|
| `pnpm-workspace.yaml` | Lists `apps/*`, `packages/*`, `admin-panel` — nexus-signaling-server NOT included |
| Turbo pipeline | `turbo.json` has no nexus reference |
| `.github/workflows/` | 12 workflows — zero nexus build/deploy steps |
| Internal reference | Only self-references within `src/main.ts` |
| Duplicate | `admin/server/nexus-signaling-server.js` is a second copy (in frozen admin) |

**Decision:** 💀 DEAD — Not in workspace, not built by CI, not deployed.  
**Action (Phase B):** → `_archive/nexus-signaling-server/` (Boardroom approval required)

---

## Category 8 — Intentional Stubs in `assets/js/modules/`

These 131-byte files contain only:
```js
// Public runtime compatibility shim.
// This module is intentionally lightweight for static/local serving.
export default {};
```

| File | Size | Note | Decision |
|---|---|---|---|
| `santis-reservation.js` | 131B | Empty shim | 🪦 STUB — Verify no active consumer; do not delete without checking |
| `sovereign-command.js` | 131B | Empty shim | 🪦 STUB — Same |
| `sovereign-cart.js` | 131B | Empty shim | 🪦 STUB — Same |
| `santis-intent-engine.js` | 131B | Empty shim | 🪦 STUB — `core/santis-intent-v7.js` is canonical |

> **Governance Rule:** STUB ≠ DELETE. These prevent 404 errors. Only remove after confirming zero active consumers.

---

## Category 9 — Root-Level Artifact Pollution

### Safe to Delete (Phase C — Boardroom-approved archival PR)

| File | Size | Evidence |
|---|---|---|
| `forecast.json`, `forecast2.json`, `forecast3.json` | ~6B total | Content: `{}` — completely empty |
| `cilt-bakimi.diff` | 419KB | Git diff artifact; not production content |
| `git-diff-stat-before-clean.txt` | 126KB | Git stat artifact |
| `git-status-before-clean.txt` | 81KB | Git status artifact |
| `index_backup.html` | 31KB | In `.gitignore`; explicit backup |
| `stitch_employee_feedback_dashboard.zip` (×2) | 194KB × 2 | Duplicate ZIP; should not be in repo |
| `bracket_test.js` | 1.8KB | In `.gitignore` explicitly |
| `debug_mega_menu.js` | 1.4KB | Dev debug script |
| `fix-masaj-cards.js` | 1.3KB | One-off fix script |
| `fix-phase2.5.js` | 2.9KB | One-off fix script |
| `rebuild-masaj-cards.js` | 2.6KB | One-off fix script |
| `test.js`, `test_upload.js`, `test_yap.mjs` | ~3KB | Dev test scripts |
| `check_console.js` | 1.8KB | Dev utility |
| `navbar_dominance_scan.js` | 5KB | Dev audit script |
| `santis_investor_pitch_deck.pdf` | 776KB | PDF file; should be external storage |
| `audit_report.csv` | 10B | Empty CSV |
| `omni_asset_vault.json` | 123KB | In `.gitignore`; may be tracked |

### 20+ Root-Level Python Maintenance Scripts

One-time implement/inject/build/analyze scripts accumulated at root level:

```
implement_ghost_v21.py      implement_phase8.py         implement_v23_scroll.py
inject_critical_css.py      inject_pwa.py
build_gallery.py            build_master_shell.py       build_ui_audit_visual.py
generate_post_purge_audit.py generate_ultra_optimization_plan.py
execute_great_purge.py      execute_quarantine.py
temp_converter.py           temp_replace.py             add_size_adjust.py
migrate_santis_rails.py     remove_world_hero_text.py
find_scripts.py             nav_audit.py                admin_scan.py (×2)
unify_telemetry.py          hidden_audit.py
```

**Decision:** Most are in `.gitignore`. Phase C → move to `scripts/maintenance/` or `_archive/scripts/`.

---

## Category 10 — TR/Masajlar Backup Pages

`tr/masajlar/_backup_manual/` — 24 HTML files.

| Evidence | Detail |
|---|---|
| Evidence 1 | `_backup_manual` path clearly marks backup intent |
| Evidence 2 | Each file loads `santis-chameleon.js` — not used in any active prod page |
| Evidence 3 | Not referenced in sitemap or routes |

**Decision:** 💀 DEAD → Phase B: `_archive/tr-masajlar-backup-manual/`

---

## Duplicate Module Risk — Parallel JS Files

Same-function modules existing at parallel paths. Canonical rule: `assets/js/core/` wins.

| Group | File 1 (Candidate Archive) | File 2 (Canonical) |
|---|---|---|
| WS Manager | `assets/js/core/santis-ws-manager.js` | `assets/js/core/santis-ws-orchestrator.js` — which is active? |
| Event Bus | `assets/js/santis-event-bus.js` | `assets/js/core/santis-event-bus.js` |
| Sovereign Bus | `assets/js/sovereign-bus.js` | `assets/js/core/sovereign-bus.js` |
| Scroll Engine | `assets/js/santis-scroll-engine.js` | `assets/js/core/santis-scroll-engine.js` |
| Revenue Brain | `assets/js/santis-revenue-brain.js` | `assets/js/core/santis-revenue-brain.js` |
| Scheduler | `assets/js/santis-scheduler.js` | `assets/js/core/santis-scheduler.js` |
| Store | `assets/js/santis-store.js` | `assets/js/core/santis-store.js` |
| Soul | `assets/js/santis-soul.js` | `assets/js/core/santis-soul.js` |
| Orbital Forge | `server/santis-orbital-forge.js` | `server/santis-orbital-forge.mjs` — both disabled |
| Admin services | `admin/services-data.js` | `assets/js/services-data.js` — frozen admin |

**Required action before archiving:** Import graph analysis (`grep`/`ripgrep`) to confirm no active consumer exists for the non-canonical copy.

---

## Phase B — Archive Operation Plan

> **Boardroom approval required before execution.**  
> No deletion in Phase B. Move only. `git mv` preserves history.

### Phase B Branch
```
git checkout -b phase-b-archive-zombie-code-safe-move
```

### Phase B Moves

| Source | Destination |
|---|---|
| `admin/` (excluding `admin/_archive/`, `admin/_quarantine/`) | `_archive/legacy-admin-panel/` |
| `hq-dashboard/` | `_archive/legacy-hq-dashboard/` |
| `tenant-dashboard/` | `_archive/legacy-tenant-dashboard/` |
| `nexus-signaling-server/` | `_archive/nexus-signaling-server/` |
| `tr/masajlar/_backup_manual/` | `_archive/tr-masajlar-backup-manual/` |

### Phase B Gate Sequence
```powershell
pnpm run lint
pnpm run stitch:enforce
pnpm run test:e2e -- --project=chromium tests/e2e/reservation.spec.ts
git restore tests/artifacts tests/reports
git status --short
```

All three gates must PASS before PR is raised.

---

## Phase C — Root Artifact Cleanup (Separate PR)

> Low-risk archive candidates, but deletion still requires one clean archival PR.

```
Phase C — Root Artifact Cleanup
```

Phase C targets: empty JSON files, git diff/stat artifacts, debug JS scripts, duplicate ZIPs, investor PDF, root Python maintenance scripts.

---

## Review Required — Product Owner Confirmation Needed

The following cannot be classified without product/roadmap owner input:

| Surface | Question |
|---|---|
| `guest-zen/` | Does this have an active production URL? |
| `clinic-kiosk/` | Is this on the product roadmap? |
| `santis-live-simulator/` | Active dev tool or abandoned? |
| `santis-audio.js` + `santis-audio-ui.js` | Is audio a live feature? |
| `santis-voice.js` | Is voice UI a live feature? |
| WS Manager duplicate pair | Which of the two is the active runtime path? |

---

## Summary Table

| Category | Dead | Zombie | Review | Alive | Stub |
|---|---|---|---|---|---|
| `assets/js/` root | 12 | 2 | 5 | 3 | 4 |
| `assets/js/core/` | — | — | — | ✅ Majority alive | — |
| `assets/js/modules/` | 0 | 0 | 4 | — | 4 |
| `admin/` | ~66 files | — | — | 0 | — |
| `hq-dashboard/` | All | — | — | 0 | — |
| `server/` | 7 | 2 | — | 0 | — |
| `nexus-signaling-server/` | 1 package | — | — | 0 | — |
| Standalone apps | 1 (tenant) | 0 | 2 (kiosk, guest-zen) | — | — |
| Root artifacts | ~15 | — | — | — | — |
| TR backup pages | 24 | — | — | 0 | — |
| **TOTAL** | **~130** | **~6** | **~11** | — | **~8** |

---

## Critical Security Note

**`assets/js/tailwindcss.min.js` (407KB)**
- Loaded from 4 frozen/legacy locations only
- Production Tailwind CSS is built at build-time inside `admin-panel/`
- This 407KB file is not consumed by any active marketing site page
- **Decision:** 🔍 If any active page needs it, migrate to CDN reference; otherwise archive

---

## Canonical Surface Map (Post-Cleanup Target State)

```
apps/ingestion-api/     → Canonical backend (port 3030)
admin-panel/            → Canonical admin frontend (React/Vite, port 8080)
tr/                     → Canonical TR marketing pages
assets/js/core/         → Canonical JS module registry
assets/css/             → Canonical stylesheet registry
packages/design-system/ → Canonical design token system
```

Everything outside this map is either a **live supporting module** (verified by import graph) or an **archive candidate**.

---

*Signed: Antigravity (Baş Mimar)*  
*Sealed: 2026-05-09*  
*Next action: Phase B archive PR — Boardroom approval required*
