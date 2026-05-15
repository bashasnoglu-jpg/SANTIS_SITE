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

*   **Compositor-Only Rule:** All mapping-induced animations must use `transform`, `opacity`, or `filter`.
*   **Max Animation Duration:** Individual visual reactions shall not exceed **1200ms**.
*   **Reduced-Motion Fallback:** Inbound events must trigger **zero** movement/scale if active.

## 3. Governance Boundaries

*   **No Business Semantic Interpretation:** The Orb reacts to "types" of events but does not know the content.
*   **No State Persistence:** Visual mapping is transient.
*   **No Blocking UI:** Mapping logic runs on Main Thread but prioritized via `requestAnimationFrame`.

## 4. Visual Mapping Rate Limits & Composure

*   **Refractory Period:** The Orb shall not change its visual state more than once every **120ms**.
*   **Panic Suppression:** **"Core panic edebilir, Orb panic etmez."**

## 5. State Transition Matrix (Allowed Topology)

To maintain aesthetic composure, the following transition rules are enforced:

| From | To | Allowed | Note |
| :--- | :--- | :--- | :--- |
| `IDLE` | `THINKING` | ✅ Yes | Standard start of processing |
| `THINKING` | `ACTIVE` | ✅ Yes | Resolution of intent |
| `ACTIVE` | `IDLE` | ✅ Yes | Return to calm after success |
| `ERROR` | `IDLE` | ✅ Yes | Recovery via fade |
| `ERROR` | `ACTIVE` | ❌ No | Direct jump forbidden. Must pass through IDLE/Fade. |
| `IDLE` | `ACTIVE` | ✅ Yes | Passive success (no thinking phase needed) |

## 6. Resilience Policy (Fail-Silent)

*   **Silent Drop:** If an inbound event triggers an forbidden transition, it must be dropped silently.
*   **Visual Silence:** No aggressive flashes or high-saturation colors.
