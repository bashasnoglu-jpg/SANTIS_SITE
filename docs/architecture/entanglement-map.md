# Phase 85 — Sovereign De-Entanglement & DNA Governance

Santis OS is no longer in a pure feature-addition phase. The current priority is architectural boundary sealing: reduce entanglement, protect Visual Truth, and prepare safe, backward-compatible refactors.

## Operating Principle

```txt
Measure first.
Map before extraction.
Extract before deletion.
Preserve runtime contracts.
Guard the visual DNA.
```

---

## Current High-Risk Hub

### `assets/js/santis-nav.js` — P0 ENTANGLEMENT HUB

`assets/js/santis-nav.js` currently carries multiple architectural responsibilities in one runtime file. This makes the file a high-risk boundary for public-site regressions.

```txt
assets/js/santis-nav.js
├── [PATH]
│   ├── depth calculation
│   ├── depthPrefix
│   ├── getPath()
│   └── fixPaths()
│   → Target: assets/js/nav/nav-path-resolver.js
│
├── [MANIFEST]
│   ├── buildSovereignNav()
│   ├── cascade fetch
│   ├── /api/v1/nav-manifest
│   ├── /data/nav-manifest.json
│   └── hardcoded emergency fallback routes
│   → Target: assets/js/nav/nav-manifest-loader.js
│
├── [RENDER]
│   ├── navRoot injection
│   ├── serviceRoot injection
│   ├── mobileRoot clone/render
│   ├── reservation CTA append
│   └── DOM node creation
│   → Target: assets/js/nav/nav-renderer.js
│
├── [INTERACTIONS]
│   ├── hamburger toggle
│   ├── mobile close on link click
│   ├── scroll reveal/hide
│   ├── mega menu dimmer
│   ├── hover intent
│   └── magnetic hover
│   → Target: assets/js/nav/nav-interactions.js
│
├── [BOOKING BRIDGE]
│   ├── bindBookingTriggers() near nav/footer boot
│   ├── duplicate binding inside initNavbarInteractions()
│   └── window.BOOKING_WIZARD bridge
│   → Target: assets/js/nav/nav-booking-bridge.js
│
├── [TELEMETRY]
│   ├── window.SantisOS.broadcastTelemetry()
│   ├── window.SantisBus.emit('santis:dom-ready')
│   └── document.dispatchEvent('santis:nav:ready')
│   → Target: assets/js/nav/nav-telemetry.js
│
└── [PREFETCH / ORCHESTRATION]
    ├── UIOrchestrator.prefetch()
    ├── hover dwell timer
    ├── predictive pre-render link injection
    └── nav overlay binding
    → Target: assets/js/nav/nav-interactions.js or nav-prefetch-bridge.js
```

---

## Confirmed Risks

### P0 — Duplicate Scroll Logic

Two independent scroll handlers exist in the nav runtime surface:

```txt
initNavbarInteractions() scroll handler
startUIOrchestrator() scroll-up reveal handler
```

Risk:

```txt
One page load can bind two competing scroll policies.
A navbar patch can produce hidden/revealed state drift.
```

Decision before extraction:

```txt
Canonical scroll owner: nav-interactions.js
Preferred policy: startUIOrchestrator-style scroll-up reveal
Legacy shrink behavior: preserve only if required by CSS contract
```

---

### P0 — Duplicate Booking Trigger Binding

Booking trigger binding appears in two zones:

```txt
bindBookingTriggers(scope)
initNavbarInteractions() document.querySelectorAll('[data-booking-open]')
```

Risk:

```txt
Duplicate listeners.
Inconsistent event prevention.
Harder DOM mutation support.
```

Decision before extraction:

```txt
Canonical owner: nav-booking-bridge.js
Preferred implementation: event delegation on document
Backward compatibility: keep window.BOOKING_WIZARD bridge behavior
```

---

### P0 — Runtime Visual Truth Bypass

Visual decisions appear in runtime JavaScript.

Examples to remove during later extraction:

```txt
style.setProperty(..., 'important')
inline color patches
hardcoded mobile CTA color such as #d4af37
```

Risk:

```txt
Runtime JS bypasses tokens, CSS, and Stitch guard expectations.
```

Decision before extraction:

```txt
JS may change class or data-state.
CSS/token layer owns visual output.
```

---

### P1 — Global Runtime Leakage

Current runtime depends on multiple global browser objects:

```txt
window._SANTIS_NAV_LOADED
window.loadComp
window.getRuntimeConfig
window.BOOKING_WIZARD
window.SANTIS_LANG
window.SantisOS
window.SantisBus
UIOrchestrator global/var surface
```

Risk:

```txt
Script order changes can silently break public runtime behavior.
```

Decision before extraction:

```txt
Wrap globals behind bridge modules.
Keep public compatibility shims during Phase 85.
```

---

## Phase 85 Sprint Order

### Sprint 1 — DNA Guard Baseline

Goal: verify guard expansion, run `stitch:enforce`, and record the first Visual Truth baseline.

```powershell
cd C:\Users\tourg\Desktop\SANTIS_SITE
pnpm run stitch:enforce 2>&1 | Tee-Object -FilePath "docs/reports/dna-guard-baseline-phase85.md"
```

Required check:

```txt
Branch tech-debt/dna-guard-expansion exists but must be rebased or recreated from main before merge if diverged.
```

---

### Sprint 2 — Entanglement Map

Goal: document responsibility boundaries before any extraction.

This document is the Sprint 2 output.

---

### Sprint 3 — Interaction Layer Extraction

Goal: extract interaction logic only, without redesigning rendering or manifest behavior.

Target file:

```txt
assets/js/nav/nav-interactions.js
```

Candidate responsibilities:

```txt
hamburger toggle
mobile menu close
mega menu dimmer
hover intent
scroll reveal/hide
UIOrchestrator compatibility shim
```

Backward compatibility rule:

```txt
window.initNavbarInteractions must remain callable until all legacy consumers are migrated.
```

---

### Sprint 4 — Booking Bridge Extraction

Goal: remove duplicate booking binding and centralize it.

Target file:

```txt
assets/js/nav/nav-booking-bridge.js
```

Preferred behavior:

```txt
Use event delegation.
If window.BOOKING_WIZARD.open exists, prevent default and open it.
Otherwise preserve native link behavior.
```

---

### Sprint 5 — Deployment Reality Check

Goal: verify production deployment reality rather than assuming it.

Manual checks:

```txt
GitHub Settings → Secrets and variables → Actions
□ VERCEL_TOKEN
□ VERCEL_ORG_ID
□ VERCEL_PROJECT_ID
□ Latest Actions run green
```

---

## Verification Plan

```powershell
pnpm run stitch:enforce
Test-Path "docs/architecture/entanglement-map.md"
pnpm run audit:runtime
pnpm run lint
```

Manual browser checks:

```txt
index.html → hamburger works
tr/masajlar/index.html → scroll hide/show works
Mega menu hover → dimmer activates
Mobile menu link click → menu closes
Footer booking CTA → BOOKING_WIZARD opens when present
Hardcoded #d4af37 removed or mapped to token class
```

---

## Non-Goals

```txt
No durable replay refactor in Phase 85.
No redesign during extraction.
No route manifest rewrite before interaction boundaries are mapped.
No deletion before behavior parity is verified.
```

Durable Replay Seal should remain a separate Phase 86.

---

## Final Seal

```txt
Phase 85 does not add new luxury.
Phase 85 protects existing luxury from architectural drift.
```
