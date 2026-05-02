class SantisApiClient {
  constructor() {
    const config = window.getRuntimeConfig ? window.getRuntimeConfig() : { apiBaseUrl: "/api/v1" };
    this.baseUrl = config.apiBaseUrl;
    this.coreStateCache = null;
    this.coreStateVersion = "68.0.0";
    this.coreStateEventSource = null;
    this.catalogCache = null;
    this.ws = null;
    this.sessionToken = null;

    console.log("🦅 Santis API Client v68 — CoreState Mode Initialized.");
    this.initWebSocket();
  }

  async initWebSocket() {
    // Config üzerinden Gateway'e bağlanıyoruz
    const config = window.getRuntimeConfig ? window.getRuntimeConfig() : {};
    const wsUrl = await this.getAuthenticatedWebSocketUrl(config.wsUrl || `wss://${window.location.host}/ws`);

    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
        console.log('🦅 [API Client] Kuantum Bağlantısı Aktif (WebSocket).');
    };

    this.ws.onmessage = (event) => {
        try {
            const data = JSON.parse(event.data);
            
            // Gelen veriyi tüm sisteme duyuruyoruz
            const santisEvent = new CustomEvent('santis-update', { 
                detail: data 
            });
            window.dispatchEvent(santisEvent);
            
            console.log('📡 [API Client] Yeni Veri Paketi Dağıtıldı:', data.type || 'Bilinmiyor');
        } catch (e) {
            console.warn('[API Client] WS payload parsing hatası', e);
        }
    };

    this.ws.onclose = () => {
        console.warn('⚠️ [API Client] Bağlantı koptu. 5 saniye içinde yeniden denenecek...');
        setTimeout(() => this.initWebSocket(), 5000);
    };
  }

  async getAuthenticatedWebSocketUrl(wsUrl) {
    const token = await this.getSessionToken();
    if (!token) return wsUrl;

    const url = new URL(wsUrl, window.location.href);
    if (!url.searchParams.has("client_type")) {
      url.searchParams.set("client_type", "boardroom");
    }
    url.searchParams.set("token", token);
    return url.toString();
  }

  async getSessionToken() {
    if (this.sessionToken) return this.sessionToken;

    try {
      const response = await fetch(`${this.baseUrl}/auth/session`, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      this.sessionToken = data.token || null;
      return this.sessionToken;
    } catch (error) {
      console.warn("[API Client] Session token alınamadı:", error.message);
      return null;
    }
  }

  connectCoreStateStream() {
    console.log("📡 [SantisApiClient] Connecting to CoreState SSE Stream...");
    const streamUrl = `${this.baseUrl}/core-state/stream`;
    this.coreStateEventSource = new EventSource(streamUrl);

    this.coreStateEventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "CORE_STATE_PATCH") {
          if (!this.validateCoreStatePatch(data.patch)) {
            this.logDroppedCoreStatePatch(data.patch);
            return;
          }

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
    const state = await this.normalizeCoreState(data);

    if (!this.validateCoreState(state)) {
      const errors = this.getCoreStateValidationErrors(state);
      this.logCoreStateValidationFailure(data, state, errors);
      throw new Error(`[CoreState] Contract validation failed: ${errors.join(", ")}`);
    }

    this.coreStateCache = state;
    window.SantisCoreState = state;

    window.dispatchEvent(
      new CustomEvent("SANTIS_CORE_STATE_READY", {
        detail: state,
      })
    );

    return state;
  }

  async normalizeCoreState(data) {
    if (this.validateCoreState(data)) {
      return this.withCatalogDefaults(data);
    }

    if (this.isSovereignCapsuleState(data)) {
      const catalog = data.catalog && typeof data.catalog === "object"
        ? this.normalizeCatalog(data.catalog)
        : await this.buildCatalogFallback();

      return {
        ok: data.ok,
        phase: data.phase,
        runtime: data.runtime,
        timestamp: data.timestamp,
        telemetry: data.telemetry,
        boardroom: data.boardroom,
        capsule: data,
        meta: {
          version: data.phase || this.coreStateVersion,
          contract: "CoreState/capsule",
          timestamp: data.timestamp,
          sourceSystem: data.system,
        },
        revenue: {
          today: Number(data.revenue?.today) || 0,
        },
        sessions: {
          active: Number(data.sessions?.active) || 0,
        },
        catalog,
        system: {
          id: data.system,
          status: data.telemetry?.status || "degraded",
          phase: data.phase,
          runtime: data.runtime,
          boardroom: data.boardroom,
        },
      };
    }

    return data;
  }

  isSovereignCapsuleState(data) {
    return Boolean(
      data &&
        typeof data === "object" &&
        data.ok === true &&
        data.system === "SANTIS_OS" &&
        typeof data.phase === "string" &&
        data.runtime === "sovereign-capsule" &&
        typeof data.timestamp === "string" &&
        data.telemetry &&
        typeof data.telemetry.status === "string" &&
        data.boardroom &&
        typeof data.boardroom.status === "string"
    );
  }

  withCatalogDefaults(state) {
    return {
      ...state,
      catalog: this.normalizeCatalog(state.catalog),
    };
  }

  normalizeCatalog(catalog = {}) {
    return {
      programs: Array.isArray(catalog.programs) ? catalog.programs : [],
      hammam: Array.isArray(catalog.hammam) ? catalog.hammam : [],
      massages: Array.isArray(catalog.massages) ? catalog.massages : [],
      skincare: Array.isArray(catalog.skincare) ? catalog.skincare : [],
      extras: Array.isArray(catalog.extras) ? catalog.extras : [],
    };
  }

  async buildCatalogFallback() {
    if (this.catalogCache) return this.catalogCache;

    const globalCatalog = this.getGlobalCatalogSeed();
    if (globalCatalog.length > 0) {
      this.catalogCache = this.partitionServices(globalCatalog);
      return this.catalogCache;
    }

    try {
      const response = await fetch("/api/v1/core-state/resolve", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({ action: "fetch_catalog" }),
        cache: "no-store",
      });

      if (response.ok) {
        const raw = await response.json();
        const services = Array.isArray(raw)
          ? raw
          : raw.categories
            ? raw.categories.flatMap((category) => category.services || category.items || [])
            : raw.services || [];

        this.catalogCache = this.partitionServices(services);
        return this.catalogCache;
      }
    } catch (error) {
      console.warn("[CoreState] Catalog fallback unavailable:", error);
    }

    this.catalogCache = this.normalizeCatalog();
    return this.catalogCache;
  }

  getGlobalCatalogSeed() {
    const buckets = [
      window.SANTIS_PRODUCTS,
      window.SovereignDataMatrix,
      window.productCatalog,
    ];

    for (const bucket of buckets) {
      if (Array.isArray(bucket) && bucket.length > 0) return bucket;
    }

    return [
      ...(Array.isArray(window.SANTIS_HAMMAM) ? window.SANTIS_HAMMAM : []),
      ...(Array.isArray(window.SANTIS_MASSAGES) ? window.SANTIS_MASSAGES : []),
      ...(Array.isArray(window.SANTIS_SKINCARE) ? window.SANTIS_SKINCARE : []),
    ];
  }

  partitionServices(services = []) {
    const catalog = this.normalizeCatalog();

    services.forEach((service) => {
      const category = String(service.category || service.categoryId || service.cat || "").toLowerCase();

      if (category.includes("hammam") || category.includes("hamam")) {
        catalog.hammam.push(service);
      } else if (
        category.includes("skin") ||
        category.includes("sothys") ||
        category.includes("face") ||
        category.includes("cilt")
      ) {
        catalog.skincare.push(service);
      } else if (
        category.includes("massage") ||
        category.includes("masaj") ||
        category.includes("classic") ||
        category.includes("asian") ||
        category.includes("sports") ||
        category.includes("ayurveda") ||
        category.includes("couples") ||
        category === "massage"
      ) {
        catalog.massages.push(service);
      } else if (
        category.includes("program") ||
        category.includes("journey") ||
        category.includes("signature") ||
        category.includes("ritual")
      ) {
        catalog.programs.push(service);
      } else {
        catalog.extras.push(service);
      }
    });

    return catalog;
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

  validateCoreStatePatch(patch) {
    if (!patch || typeof patch !== "object" || Array.isArray(patch)) return false;

    const allowedTopLevelKeys = new Set([
      "meta",
      "revenue",
      "sessions",
      "therapists",
      "catalog",
      "alerts",
      "system",
      "totalRevenue",
      "bookingCount",
      "conversionRate",
      "vipSegments",
      "oracleInsights",
      "boardroom",
    ]);

    const keys = Object.keys(patch);
    if (keys.length === 0) return false;
    if (!keys.every((key) => allowedTopLevelKeys.has(key))) return false;

    if (patch.meta !== undefined && (!patch.meta || typeof patch.meta !== "object" || Array.isArray(patch.meta))) return false;
    if (patch.revenue !== undefined && (!patch.revenue || typeof patch.revenue !== "object" || Array.isArray(patch.revenue))) return false;
    if (patch.sessions !== undefined && (!patch.sessions || typeof patch.sessions !== "object" || Array.isArray(patch.sessions))) return false;
    if (patch.therapists !== undefined && !Array.isArray(patch.therapists)) return false;
    if (patch.catalog !== undefined && (!patch.catalog || typeof patch.catalog !== "object" || Array.isArray(patch.catalog))) return false;
    if (patch.alerts !== undefined && !Array.isArray(patch.alerts)) return false;
    if (patch.system !== undefined && (!patch.system || typeof patch.system !== "object" || Array.isArray(patch.system))) return false;
    if (patch.totalRevenue !== undefined && typeof patch.totalRevenue !== "number") return false;
    if (patch.bookingCount !== undefined && typeof patch.bookingCount !== "number") return false;
    if (patch.conversionRate !== undefined && typeof patch.conversionRate !== "number") return false;
    if (patch.vipSegments !== undefined && !Array.isArray(patch.vipSegments)) return false;
    if (patch.oracleInsights !== undefined && !Array.isArray(patch.oracleInsights)) return false;
    if (patch.boardroom !== undefined && (!patch.boardroom || typeof patch.boardroom !== "object" || Array.isArray(patch.boardroom))) return false;

    return true;
  }

  logDroppedCoreStatePatch(patch) {
    const summary = {
      reason: "INVALID_CORESTATE_PATCH",
      keys: patch && typeof patch === "object" ? Object.keys(patch) : [],
      receivedType: Array.isArray(patch) ? "array" : typeof patch,
    };

    console.warn("[CoreState Stream] Dropped invalid patch", summary);
  }

  getCoreStateValidationErrors(data) {
    const checks = [
      ["meta.version", data?.meta && typeof data.meta.version === "string"],
      ["revenue.today", data?.revenue && typeof data.revenue.today === "number"],
      ["sessions.active", data?.sessions && typeof data.sessions.active === "number"],
      ["catalog.programs[]", Array.isArray(data?.catalog?.programs)],
      ["catalog.hammam[]", Array.isArray(data?.catalog?.hammam)],
      ["catalog.massages[]", Array.isArray(data?.catalog?.massages)],
      ["catalog.skincare[]", Array.isArray(data?.catalog?.skincare)],
      ["catalog.extras[]", Array.isArray(data?.catalog?.extras)],
      ["system.status", data?.system && typeof data.system.status === "string"],
    ];

    return checks
      .filter(([, ok]) => !ok)
      .map(([path]) => path);
  }

  logCoreStateValidationFailure(raw, normalized, errors) {
    const summary = {
      missing: errors,
      rawKeys: raw && typeof raw === "object" ? Object.keys(raw) : [],
      normalizedKeys: normalized && typeof normalized === "object" ? Object.keys(normalized) : [],
      rawContract: raw?.runtime || raw?.meta?.contract || "unknown",
      phase: raw?.phase || normalized?.meta?.version || "unknown",
    };

    if (console.groupCollapsed) {
      console.groupCollapsed("[CoreState] Contract validation failed");
      console.table(summary);
      console.debug("Raw CoreState sample:", raw);
      console.debug("Normalized CoreState sample:", normalized);
      console.groupEnd();
    } else {
      console.error("[CoreState] Contract validation failed", summary);
    }
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

  /**
   * SANTIS API CLIENT - Command Dispatcher
   * Oracle tarafından onaylanan kararları sisteme iletir.
   */
  async sendCommand(commandType, payload) {
    console.log(`🦅 [Sovereign Command] Gönderiliyor: ${commandType}`);
    
    try {
      const url = `${this.baseUrl}/commands`;
      const commandId = this.createCommandId();
      const traceId = payload?.traceId || this.createCommandId();
      const sessionId = payload?.sessionId || payload?.sourceSessionId || "boardroom-session";
      const commandPayload = { ...(payload || {}) };
      delete commandPayload.traceId;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Trace-Id': traceId,
          'X-Session-Id': sessionId
        },
        body: JSON.stringify({
          commandId,
          commandType,
          requestedAt: new Date().toISOString(),
          tenant: this.getDefaultTenantContext(),
          sessionId,
          traceId,
          schemaVersion: "v1",
          payload: commandPayload
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Komut reddedildi. HTTP ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ [Sovereign Command] Başarıyla yürütüldü:', result);
      return result;

    } catch (error) {
      console.error('🚨 [Sovereign Command] Başarısız:', error.message);
      throw error;
    }
  }

  createCommandId() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
      return window.crypto.randomUUID();
    }

    return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (c) =>
      (Number(c) ^ (Math.random() * 16 >> (Number(c) / 4))).toString(16)
    );
  }

  getDefaultTenantContext() {
    return {
      hotelId: "123e4567-e89b-12d3-a456-426614174002",
      hotelCode: "SANTIS",
      region: "EU",
      locale: "tr",
      currency: "EUR",
      activePolicies: [],
      fallbackMode: false
    };
  }
}

window.SantisApi = window.SantisApi || new SantisApiClient();
