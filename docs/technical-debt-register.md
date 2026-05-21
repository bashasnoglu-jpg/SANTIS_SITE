# Santis OS - Technical Debt Register

## Governance Rules & Status Matrix
*   **OPEN**: Active technical debt requiring remediation.
*   **DEFERRED**: Acknowledged but intentionally pushed to a later phase.
*   **DO NOT TOUCH**: Legacy or sensitive system that must remain as-is until a formal Boardroom architectural rewrite.
*   **RESOLVED / CLOSED**: Debt has been paid and verified.
*   **PROMOTED TO MAIN**: Feature or hotfix successfully sealed into the `main` production branch.

---

## 🛑 P0 — Critical Debt

| ID | Issue | Risk | Status | Action Plan |
| :--- | :--- | :--- | :--- | :--- |
| **P0-1** | **`main` / `develop` governance drift** | **HIGH** | OPEN | GitHub and Vercel use `main` for production, but GitHub default branch is not `develop`. PRs must flow strictly `develop` → `main`. Set default branch to `develop`. |
| **P0-2** | **`develop` → `main` delta strategy** | **HIGH** | OPEN | The divergence between `develop` and `main` is too large. Need a strict release strategy PR to merge `develop` into `main` safely without skipping runtime files. |

---

## ⚠️ P1 — High Priority Debt

| ID | Issue | Risk | Status | Action Plan |
| :--- | :--- | :--- | :--- | :--- |
| **P1-1** | **Multiple Service Worker Architecture** | MEDIUM | OPEN | `sw.js`, `santis-sw.js`, `santis-sanctuary-sw.js`, `service-worker.js`, etc. Need audit-only phase to map active/legacy registrations. |
| **P1-2** | **Color System & Design Token Fragmentation** | HIGH | OPEN | `#d4af37` hardcoded 159+ times. Tokens conflict between `editorial.css` and `style.css`. Needs Phase C1-C5 audit and refactor. |

---

## 🟡 P2 — Medium Priority Debt

| ID | Issue | Risk | Status | Action Plan |
| :--- | :--- | :--- | :--- | :--- |
| **P2-1** | **Tailwind Dependency Ownership** | MEDIUM | OPEN | `tailwindcss` exists in both `dependencies` and `devDependencies`. Needs normalization (chore PR). |
| **P2-2** | **Nav Manifest & WebSocket Gateway** | MED-HIGH | OPEN | Frontend encounters `Unexpected token '<'` on 404 manifest. Telemetry client expects `ws://localhost:8080`. Needs fallback fix. |
| **P2-3** | **Branch Policy Enforcement** | MEDIUM | OPEN | Orphaned `phase-*` branches need cleanup. GitHub settings need to match `docs/governance/release-flow.md`. |

---

## ⏸️ Deferred Debt

| ID | Issue | Reason for Deferral |
| :--- | :--- | :--- |
| **DEF-01** | **Vite MPA Config Refactor** | Currently relying on Vite defaults. Proper integration of `admin-dashboard.html` requires dedicated refactoring of `vite.config.ts`. |
| **DEF-02** | **CSS Grid Optimization** | Minor layout shifts are acceptable for now. Waiting for design system tokenization (Phase C) before layout refactoring. |

---

## 🔒 Do Not Touch (Frozen Systems)

| ID | Component | Reason |
| :--- | :--- | :--- |
| **DNT-01** | **CoreState Runtime Kernel** | Canonical SSOT. Modifications without Boardroom approval will violate `RuntimeContracts.md`. |
| **DNT-02** | **Legacy Zod Validation Pipelines** | Fragile. Changing them without full test suite coverage will break booking validation. |

---

## ✅ Closed / Sealed Debt

*   **Tailwind CDN production warning:** CLOSED
*   **`tailwind is not defined` runtime risk:** CLOSED
*   **Guest Zen Tailwind suppressor legacy:** CLOSED
*   **Service Worker non-http cache crash:** CLOSED
*   **Develop -> main incorrect full merge risk:** Prevented
*   **Runtime Integrity Patch v1.0.1:** SEALED / PROMOTED TO MAIN
*   **Vercel Project Ambiguity:** RESOLVED (Mapped in `docs/deployment/vercel-project-map.md`)
*   **Technical Debt Register Structure:** RESOLVED (This document)
