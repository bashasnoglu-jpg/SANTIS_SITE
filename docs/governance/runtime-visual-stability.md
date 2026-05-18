# Santis Sovereign OS — Visual Governance & Scene Entropy Contract (v1.0)

## 1. Principles of Quiet Luxury Visual Stability
In the Santis OS ecosystem, motion and visual presentation represent editorial silence and premium calm. Ungoverned visual feedback (e.g., layout thrashing, rapid non-deterministic animations, excessive canvas particles, and stacking compositor filters) is visual noise. 

We define the primary visual metric:
> **"Luxury motion is not more motion. Luxury motion is governed motion."**

To enforce visual silence, the Sovereign OS implements **Scene Entropy Instrumentation**. Scene Entropy quantitatively measures visual turbulence, rendering intensity, and compositor stress across active runtime scenes.

---

## 2. Mathematical Definition of Scene Entropy
Scene Entropy ($H_s$) is a normalized metric ($0.0 \le H_s \le 1.0$) that represents the current rendering and visual complexity stress on the client GPU/CPU.

$$H_s = \min\left(1.0, \sum_{i} (w_i \cdot M_i) + \delta_{compositor}\right)$$

Where:
- $M_i$ represents the active metric count (e.g., active requestAnimationFrame loops, particle densities, transitioning nodes).
- $w_i$ represents the pre-assigned weight of each rendering risk.
- $\delta_{compositor}$ represents the GPU compositor overhead (heavy filter density, will-change stacking).

### Rule Weights and Classifications
| Metric Identifier ($M_i$) | Category | Target Budget | Rule Weight ($w_i$) | Warning Threshold |
| :--- | :--- | :--- | :--- | :--- |
| `activeRafLoops` | JS | $\le 2$ | $0.15$ | $> 3$ loops |
| `particleCount` | Canvas | $\le 150$ | $0.001$ per particle | $> 300$ particles |
| `activeTimers` | JS | $\le 1$ | $0.20$ | $> 2$ timers (`setInterval`/`setTimeout`) |
| `heavyFilterCount` | CSS | $\le 2$ | $0.15$ per filter | $> 3$ active filters |
| `willChangeCount` | CSS | $\le 2$ | $0.10$ per node | $> 4$ layers |
| `transitionAllCount` | CSS | $0$ | $0.25$ per rule | $> 1$ active rule |

---

## 3. Telemetry Schema (`SceneEntropyPayload`)
When the visual engine detects structural entropy shifts (e.g., transitions, particle bursts, page navigation), it reports telemetry payloads to `/api/v1/telemetry/rvs` using `navigator.sendBeacon`.

```typescript
interface SceneEntropyPayload {
  /** ISO timestamp of telemetry capture */
  timestamp: number;
  
  /** Unique identifier of the current visual route/module */
  sceneId: string;
  
  /** Normalized entropy value (0.0 to 1.0) */
  entropyScore: number;
  
  /** Current active visual metrics */
  metrics: {
    activeRafLoops: number;
    particleCount: number;
    activeTimers: number; // setInterval/setTimeout loop counters
    heavyFilterCount: number; // backdrop-filter, complex blur/drop-shadow
    willChangeCount: number; // compositor layer elements
    transitionAllCount: number; // raw transitions violating explicit properties
  };
  
  /** Performance heuristics sampled over 1000ms */
  performance: {
    fps: number; // frames per second
    jankCount: number; // frames dropping below 16.67ms budget
    layoutDurationMs: number; // time spent in forced synchronous layouts
  };
  
  /** Governance classification state */
  governanceState: 'SILENT' | 'GOVERNED' | 'BUDGET_EXCEEDED';
}
```

---

## 4. Governance States & Budget Reclamation
The Santis Visual Engine automatically changes visual state to preserve the 60FPS target:

### A. SILENT ($H_s < 0.4$)
- **Visual Behavior**: Full cinematic expression. High-fidelity drop-shadows, full particle limits, elegant backdrop blurs, organic easing transitions.
- **Actions**: Normal operations. Telemetry reporting is throttled to 60-second heartbeat checks.

### B. GOVERNED ($0.4 \le H_s \le 0.75$)
- **Visual Behavior**: Dynamic performance throttling active.
- **Actions**:
  - Telemetry reporting changes to immediate trigger upon state shift.
  - Active particle counts are capped at $150$ regardless of initial configuration.
  - Complex CSS filters (e.g., multi-layered box-shadows) are suspended.

### C. BUDGET_EXCEEDED ($H_s > 0.75$)
- **Visual Behavior**: Critical visual emergency. The priority shifts completely from "fidelity" to "stability".
- **Actions**:
  - Immediate budget reclamation triggered.
  - Non-essential requestAnimationFrame loops are paused or unified into the core scheduler.
  - Canvas particles are completely disabled ($0$ active particles).
  - WebKit and CSS filters (such as `backdrop-filter: blur()`) are degraded to flat opacity overlays.
  - Immediate `navigator.sendBeacon` report dispatched to notify visual governance dashboard.

---

## 5. Architectural Alignment & Implementation Checklist
Future implementation iterations of **Phase RVS-4** must adhere to the following checklist:

- [ ] **Contract Schema Verification**: Define Zod runtime validation matching `SceneEntropyPayload` in `.agents/rules/RuntimeContracts.md`.
- [ ] **Entropy Calculator Utility**: Develop `scripts/active/audit-scene-entropy-contract.mjs` to test static files and assert mathematical contract safety.
- [ ] **Unified Scheduler Hook**: Inject instrumentation telemetry directly into `window.SantisDOM` scheduler, collecting metrics automatically during DOM read/write cycles.
- [ ] **No Uncontrolled Animations**: Guarantee no direct frame looping without hooks passing visual states to the unified scheduler.
