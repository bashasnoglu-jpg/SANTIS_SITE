# SANTIS OS — Phase H1-D Intelligence Boundary Review

**Date:** 2026-05-15
**Status:** DRAFT / UNDER REVIEW
**Mission:** Define the strict contract between the Aurelia Experience Shell (Public) and the Santis Intelligence Engine (Private).

---

## 1. Governance Principles

*   **Intelligence Sovereignty:** The public-facing site (`SANTIS_SITE`) shall never host inference logic, personal data processing, or decision-making algorithms.
*   **Passive Interaction (Visualize-Only):** The Experience Shell is a passive observer of system-wide events. It reacts visually but does not initiate state changes, generate intents, or trigger decisions in the core.
*   **Adapter Isolation:** All connectivity to the Intelligence Engine must pass through a "Sealed Adapter" with a strict event whitelist.
*   **Non-Authoritative Resilience:** Visual events are **advisory-only** and non-authoritative. Dropped events or adapter failures **must fail silently**. The core system functionality shall never depend on the state or availability of the experience shell.

## 2. Permitted Event Surface (The Visual-Only Contract)

Only the following **Passive Visualization Signals** are allowed to cross the boundary into the Aurelia Shell:

| Event ID | Source | Direction | Aurelia Reaction | Semantic Meaning |
| :--- | :--- | :--- | :--- | :--- |
| `santis:experience.intent.visualize` | SANTIS_CORE | Inbound | `Thinking` state | Visualize that the core is processing |
| `santis:experience.dataset.ready` | SANTIS_CORE | Inbound | `Pulse` state | Visualize hydration success |
| `santis:experience.error.visualize` | SANTIS_CORE | Inbound | `Idle` + Error Aura | Visualize a system fault |

---

## 3. Runtime Isolation Rules

1.  **No Direct Imports:** `orb.ts` must never import modules from `SANTIS_CORE` or private infrastructure.
2.  **No Shared State:** The Orb must not access `window.__SANTIS__.services` directly. It must strictly use the DOM Event Bus for inbound signals.
3.  **Non-Decisioning Policy:** The experience layer shall not contain "If/Else" logic that affects the business logic of the core engine.

## 4. Adapter Lifecycle (The Sealed Path)

The `assets/js/modules/aurelia/adapters/event-bridge.ts` adapter operates as a **"Low-Fidelity Proxy"**:
*   **Status:** SEALED (Not imported, Not active).
*   **Initialization:** Fired during the `idle` phase of the bootloader.
*   **Memory Safety:** Must implement auto-cleanup (`removeEventListener`).
*   **Zero-Action Guarantee:** The adapter only dispatches local visual state changes to the Orb.

---

## 5. Review Summary (H1-D Compliance)

Currently, the `SANTIS_SITE` is **Intelligence-Clean**. The H1-A, H1-B, and H1-C phases have established a high-performance visual surface without technical debt or boundary leakage.

**Next Action:** Open the Governance PR for this contract. No implementation un-sealing until Boardroom approval.
