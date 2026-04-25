class SantisApiClient {
  constructor() {
    this.baseUrl = "/api/v1"; // Defaults to the local gateway API path
    this.coreStateCache = null;
    this.coreStateVersion = "68.0.0";
    this.coreStateEventSource = null;

    console.log("🦅 Santis API Client v68 — CoreState Mode Initialized.");
  }

  connectCoreStateStream() {
    console.log("📡 [SantisApiClient] Connecting to CoreState SSE Stream...");
    const streamUrl = `${this.baseUrl}/core-state/stream`;
    this.coreStateEventSource = new EventSource(streamUrl);

    this.coreStateEventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "CORE_STATE_PATCH") {
            window.dispatchEvent(
                new CustomEvent("SANTIS_CORE_STATE_PATCH", {
                    detail: data.patch,
                })
            );
        }
      } catch (err) {
        console.warn("[CoreState Stream] Invalid SSE payload", err);
      }
    };

    this.coreStateEventSource.onerror = (err) => {
      console.warn("⚠️ [CoreState Stream] Connection lost. EventSource will auto-reconnect.");
    };
  }

  async getCoreState() {
    const response = await fetch(`${this.baseUrl}/core-state`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "X-Santis-Contract": "CoreState/v68",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`[CoreState] HTTP ${response.status}`);
    }

    const data = await response.json();

    if (!this.validateCoreState(data)) {
      console.error("[CoreState] Invalid payload rejected:", data);
      throw new Error("[CoreState] Contract validation failed");
    }

    this.coreStateCache = data;
    window.SantisCoreState = data;

    window.dispatchEvent(
      new CustomEvent("SANTIS_CORE_STATE_READY", {
        detail: data,
      })
    );

    return data;
  }

  validateCoreState(data) {
    if (!data || typeof data !== "object") return false;

    return Boolean(
      data.meta &&
        typeof data.meta.version === "string" &&
        data.revenue &&
        typeof data.revenue.today === "number" &&
        data.sessions &&
        typeof data.sessions.active === "number" &&
        data.catalog &&
        Array.isArray(data.catalog.programs) &&
        Array.isArray(data.catalog.hammam) &&
        Array.isArray(data.catalog.massages) &&
        Array.isArray(data.catalog.skincare) &&
        Array.isArray(data.catalog.extras) &&
        data.system &&
        typeof data.system.status === "string"
    );
  }

  async getMasterCatalog() {
    const state = await this.getCoreState();
    return state.catalog;
  }

  async getServices() {
    const state = await this.getCoreState();
    return [
      ...state.catalog.programs,
      ...state.catalog.hammam,
      ...state.catalog.massages,
      ...state.catalog.skincare,
      ...state.catalog.extras,
    ];
  }

  async getDashboardState() {
    return this.getCoreState();
  }
}

window.SantisApi = window.SantisApi || new SantisApiClient();
export default window.SantisApi;
