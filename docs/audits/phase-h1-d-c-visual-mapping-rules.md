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

*   **No Business Semantic Interpretation:** The Orb reacts to "types" of events (intent, success, error) but must not know the *content* of those events.
*   **No State Persistence:** Visual mapping is transient. The Orb must not store history of past events or create a visual "memory" of interactions.
*   **No Blocking UI:** Mapping logic must run on the Main Thread but prioritized via `requestAnimationFrame`.

## 4. Visual Mapping Rate Limits & Composure

*   **Refractory Period:** The Orb shall not change its visual state more than once every **120ms** to prevent strobe effects during event storms.
*   **Transition Smoothing:** Instant state flips (e.g., `ERROR` -> `ACTIVE`) are forbidden. Transitions must pass through a brief neutral state or use a fade-out/fade-in cycle.
*   **Panic Suppression:** In the event of rapid inbound signals, the Orb must maintain a steady rhythm. **"Core panic edebilir, Orb panic etmez."** (The core may panic; the Orb maintains composure).

## 5. Resilience Policy (Fail-Silent)

*   **Silent Drop:** If an inbound event contains malformed metadata or an unsupported mapping type, it must be dropped silently.
*   **Visual Silence:** The experience shell maintains the "Quiet Luxury" aesthetic. No aggressive flashes or high-saturation colors.
