import { sovereignStore } from '../state/sovereignStore.js';

export function setFallbackIncidentsConnecting(tenantId) {
  const currentState = sovereignStore.getState('liveFallbackIncidents');
  sovereignStore.update('liveFallbackIncidents', {
      ...currentState,
      tenantId,
      connectionStatus: "connecting",
      error: null,
  });
}

export function setFallbackIncidentsLive(payload) {
  const currentState = sovereignStore.getState('liveFallbackIncidents');
  sovereignStore.update('liveFallbackIncidents', {
      ...currentState,
      snapshot: payload.data,
      tenantId: payload.tenantId,
      lastTraceId: payload.traceId ?? null,
      lastUpdatedAt: payload.data?.updatedAt ?? null,
      connectionStatus: "live",
      error: null,
  });
}

export function setFallbackIncidentsDisconnected(error = null) {
  const currentState = sovereignStore.getState('liveFallbackIncidents');
  sovereignStore.update('liveFallbackIncidents', {
      ...currentState,
      connectionStatus: "disconnected",
      error,
  });
}

export class FallbackIncidentsSseClient {
  constructor({ tenantId, window = "5m" }) {
    this.tenantId = tenantId;
    this.window = window;
    this.eventSource = null;
  }

  connect() {
    if (!this.tenantId) return;

    setFallbackIncidentsConnecting(this.tenantId);

    const url = `/api/v1/streams/fallback-incidents/${encodeURIComponent(
      this.tenantId
    )}?window=${encodeURIComponent(this.window)}`;

    this.eventSource = new EventSource(url);

    this.eventSource.addEventListener("fallback.snapshot.initial", (event) => {
      this.#handleSnapshotEvent(event);
    });

    this.eventSource.addEventListener("fallback.snapshot.updated", (event) => {
      this.#handleSnapshotEvent(event);
    });

    this.eventSource.addEventListener("fallback.snapshot.empty", () => {
      setFallbackIncidentsLive({
        tenantId: this.tenantId,
        traceId: null,
        data: {
          tenantId: this.tenantId,
          window: this.window,
          totalCount: 0,
          byReason: {
            webgpu_unavailable: 0,
            module_load_failed: 0,
            worker_timeout: 0,
            api_timeout: 0,
            device_constraint: 0,
          },
          byTransition: [],
          latestIncidentAt: null,
          lastTraceId: null,
          updatedAt: new Date().toISOString(),
        },
      });
    });

    this.eventSource.onerror = () => {
      setFallbackIncidentsDisconnected("sse_connection_error");
    };
  }

  disconnect() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    setFallbackIncidentsDisconnected(null);
  }

  #handleSnapshotEvent(event) {
    try {
      const payload = JSON.parse(event.data);
      if (!payload || !payload.type || !payload.tenantId) return;
      setFallbackIncidentsLive(payload);
    } catch (error) {
      console.error("[FallbackIncidentsSseClient] Parse failed:", error);
    }
  }
}
