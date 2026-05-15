# SANTIS OS — Phase H1-D-C Visual Mapping Rules

**Date:** 2026-05-15
**Status:** DRAFT / UNDER REVIEW
**Mission:** Define how inbound intelligence signals are visually represented without introducing business semantic interpretation.

---

## 1. Allowed Visual States (The Palette)

The Aurelia Orb is restricted to the following visual state transitions. Any state outside this list is forbidden:

*   **`IDLE`:** Default calm pulse. No active processing.
*   **`THINKING`:** Accelerated glow frequency + variable opacity. Indicates core cognitive activity.
*   **`ACTIVE`:** Success/Hydration pulse. Brief intensity spike then return to idle.
*   **`ERROR`:** Desaturated aura + low-frequency strobe. Indicates non-critical system fault.

## 2. Technical Constraints (Performance & UX)

*   **Compositor-Only Rule:** All mapping-induced animations must use `transform`, `opacity`, or `filter`. No layout-triggering properties (`width`, `height`, `margin`).
*   **Max Animation Duration:** Individual visual reactions shall not exceed **1200ms** to prevent interaction lag.
*   **Reduced-Motion Fallback:** Inbound events must trigger **zero** movement/scale if `prefers-reduced-motion` is active. Only opacity/color shifts are allowed.

## 3. Governance Boundaries

*   **No Business Semantic Interpretation:** The Orb reacts to "types" of events (intent, success, error) but must not know the *content* of those events. It should not "know" which specific ritual is being booked or which user is logged in.
*   **No State Persistence:** Visual mapping is transient. The Orb must not store history of past events or create a visual "memory" of interactions.
*   **No Blocking UI:** Mapping logic must run on the Main Thread but prioritized via `requestAnimationFrame` or `requestIdleCallback` to ensure 120 FPS shell integrity.

---

## 4. Resilience Policy (Fail-Silent)

*   **Silent Drop:** If an inbound event contains malformed metadata or an unsupported mapping type, it must be dropped silently without visual glitch or error reporting.
*   **Visual Silence:** The experience shell maintains the "Quiet Luxury" aesthetic. No aggressive flashes, high-saturation colors, or sudden jarring transitions.
