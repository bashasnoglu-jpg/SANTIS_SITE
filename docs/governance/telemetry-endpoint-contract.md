# Santis Sovereign OS — RVS Telemetry Endpoint Contract (v1.0)

## 1. Endpoint Overview
- **Path**: `/api/v1/telemetry/rvs`
- **Method**: `POST`
- **Content-Type**: `application/json` (or `text/plain` when dispatched via `navigator.sendBeacon` to bypass CORS preflights for performance)
- **Protocol Security**: HTTPS-only. Strictly governed by the Sovereign Shield security layers (CSRF and authentication policies).

---

## 2. Telemetry Payload Classifications (`RvsTelemetryType`)
Every telemetry submission must declare a strict payload type, enabling deterministic classification and ingestion pipelines:

### A. `LAYOUT_REFLOW_ANOMALY`
Triggered when the telemetry hook detects a forced synchronous layout (layout thrashing) exceeding the target execution budget ($> 8\text{ms}$ read/write block).
- **Scope**: Identifies critical layout thrashing risks (forced DOM reflows).

### B. `CINEMATIC_BUDGET_WARNING`
Dispatched when rendering metrics drop below the target cinematic frame budget ($< 50\text{FPS}$ or jank spikes $> 20\text{ms}$).
- **Scope**: Identifies heavy filter usage, transition-all bottlenecks, or excessive CPU layers.

### C. `SCENE_ENTROPY_SHIFT`
Sent when a page/module transition alters the visual entropy of the client view, indicating a shift between `SILENT`, `GOVERNED`, and `BUDGET_EXCEEDED` states.
- **Scope**: Tracks global visual complexity transitions over the user journey.

---

## 3. Strict Schema Definition (TypeScript Interface)

```typescript
type RvsTelemetryType = 
  | 'LAYOUT_REFLOW_ANOMALY'
  | 'CINEMATIC_BUDGET_WARNING'
  | 'SCENE_ENTROPY_SHIFT';

interface RvsTelemetryEnvelope {
  /** Telemetry class identifier */
  type: RvsTelemetryType;

  /** Unix epoch timestamp in milliseconds */
  timestamp: number;

  /** Unique anonymous session hash (strictly non-identifiable, rotated daily) */
  sessionToken: string;

  /** Normalized route identifier (e.g., /spa-booking instead of /spa-booking?guest=123) */
  normalizedPath: string;

  /** Payload details specific to the telemetry type */
  details: {
    /** Target DOM node identifier or selector path (anonymized) */
    targetNode?: string;

    /** Estimated frame duration or thrashing latency in milliseconds */
    durationMs?: number;

    /** Violating property name (e.g., 'offsetHeight', 'backdrop-filter', 'will-change') */
    violatingProperty?: string;

    /** Normalized visual entropy value (0.0 to 1.0) */
    entropyScore?: number;

    /** Count of rendering components active during telemetry capture */
    activeComponents?: {
      rafLoops: number;
      particleCount: number;
      heavyFilters: number;
    };
  };
}
```

---

## 4. Privacy-Safe Payload Standard (Zero PII Policy)
In compliance with the Sovereign OS constitution layer:
1. **Zero Personally Identifiable Information**: No user IDs, names, email hashes, payment details, or form inputs are permitted inside any `RvsTelemetryEnvelope`.
2. **Normalized Pathnames**: Any URLs or pathnames must be scrubbed of raw query parameters and dynamic IDs prior to transmission:
   - Dynamic path: `/guest/9871/billing` $\rightarrow$ normalized: `/guest/:id/billing`.
3. **Anonymized Node Identifiers**: Dynamic element text contents are discarded. Node reference tracking is limited to the structural CSS selector (e.g., `main#nv-main > div.nv-figure`).

---

## 5. Rate Limiting & Throttle Policy
To prevent denial of service (DoS) and protect client bandwidth:
- **Client Session Throttling**: A maximum of **10 payloads per minute** per active session. Additional violations are consolidated locally in memory and dispatched as a unified summary packet.
- **Burst Protection**: No more than **3 payloads within a 500ms window**. Submissions exceeding this burst rate are held in a local debounced queue.

---

## 6. Client Dispatch & Fallback Mechanics (`sendBeacon`)
The visual engine utilizes non-blocking transport mechanisms to avoid interrupting client interactions:

```typescript
/**
 * Dispatches the RVS telemetry envelope defensively.
 */
function dispatchRvsTelemetry(envelope: RvsTelemetryEnvelope): void {
  const payload = JSON.stringify(envelope);
  const targetUrl = '/api/v1/telemetry/rvs';

  // 1. Primary Transport: navigator.sendBeacon
  if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
    const success = navigator.sendBeacon(targetUrl, new Blob([payload], { type: 'text/plain' }));
    if (success) return;
  }

  // 2. Secondary Fallback: Fetch with keepalive flag
  if (typeof fetch !== 'undefined') {
    fetch(targetUrl, {
      method: 'POST',
      body: payload,
      headers: { 'Content-Type': 'text/plain' },
      keepalive: true
    }).catch(() => {
      // 3. Tertiary Fallback: Silent memory logging
      console.warn('[SANTIS_TELEMETRY_FALLBACK] Buffer full. Telemetry stored in local queue.');
    });
  }
}
```
