# Santis OS - Architecture Inventory v1.0
Generated: 2026-05-15
Focus: Runtime Truth & Design Governance

## 1. Runtime Core (JS Sovereign Engine)
Located in `assets/js/core/`. These files constitute the living OS:

| Category | Key Files | Purpose |
| :--- | :--- | :--- |
| **Orchestration** | `santis.bootstrap.js`, `santis.adaptive-os.js` | System init and environment adaptation. |
| **Navigation** | `santis-sovereign-router.js`, `view-transition-handler.js` | SPA routing and cinematic transitions. |
| **Realtime** | `santis-ws-orchestrator.js`, `santis-ws-manager.js` | Boardroom event synchronization. |
| **Telemetry** | `santis-telemetry-bus.js`, `santis-telemetry-engine.js` | "God's Eye" radar and user behavior tracking. |
| **Intelligence** | `santis-sovereign-ai.js`, `santis-vocal-dna.js` | AI agent integration and voice interaction. |
| **State** | `santis-store.js`, `santis-sovereign-vault.js` | CoreState persistence and secure storage. |

## 2. Design System & Tokens
Enforced via `stitch:enforce` and `packages/design-system`.

- **Semantic Tokens**: `assets/css/tokens/semantic-tokens.css`
- **Atmospheres**: `assets/css/atmospheres.css` (Quiet Luxury presets).
- **Animations**: `assets/css/animations.css` (GSAP/Lenis integration points).
- **DNA Engine**: `assets/js/core/santis-style-dna-engine.js` (Dynamic style injection).

## 3. Package Architecture (pnpm Workspace)
- `@santis/domain-schema`: Zod-validated contracts for all state transitions.
- `@santis/event-dictionary`: Canonical event names and payload schemas.
- `admin-panel`: React-based dashboard for real-time monitoring.

## 4. Key Performance Patterns
- **JIT Asset Loading**: Managed by `santis-sovereign-rail.js`.
- **Cinematic Scrolling**: Lenis integration in `sovereign-scroll.js`.
- **Visual Silence**: Implemented via `atmospheres.css` and low-saturation design tokens.

## 5. Detected Governance Scripts
- `.agents/enforcement/detect-forbidden-imports.ts`
- `.agents/enforcement/detect-package-lock.ts`
- `scripts/audit-localhost-leak.js`
