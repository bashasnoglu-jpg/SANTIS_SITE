/**
 * SANTIS SOVEREIGN OS - Telemetry Engine (God's Eye)
 * Zero-Dependency, Non-Blocking Analytics
 */
class SantisTelemetryEngine {
  constructor() {
    // Sovereign Server telemetri rotası
    this.endpoint = 'http://127.0.0.1:3030/api/v1/telemetry/beacon'; 
    this.sessionId = this._generateSessionId();
    
    // Debounce kalkanı için zamanlayıcı (Timer) ve son hafıza
    this.vaultTrackTimer = null;
    this.latestVaultPayload = null;
  }

  init() {
    if (this.routeChangeBound) return;
    this.routeChangeBound = true;

    // 1. Sovereign Bus (Olay Yolu) Üzerinden Kuantum Dinlemeleri
    document.addEventListener('santis:vault:updated', (e) => this.trackVaultDebounced(e.detail));
    document.addEventListener('santis:handoff:success', (e) => this.track('API_HANDOFF_SUCCESS', e.detail));
    document.addEventListener('santis:handoff:error', (e) => this.track('API_HANDOFF_ERROR', { error: e.detail }));

    // 2. Sayfa Terk Edilme (Abandonment) Takibi
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        this.track('SESSION_PAUSED_OR_ENDED', { timeOnPageSec: Math.round(performance.now() / 1000) });
      }
    });

    // 3. SPA Route Takibi (Sovereign Router)
    document.addEventListener("santis:route-changed", (event) => {
      this.track("SPA_ROUTE_CHANGED", {
        ...(event.detail || {}),
        source: "santis-sovereign-router",
        occurredAt: new Date().toISOString()
      });
    });

    console.log(`👁️ [God's Eye] Telemetri Motoru Devrede. Oturum: ${this.sessionId}`);
  }

  /**
   * Kasa değişim spaminin Kuantum kalkanı (Debounce Optimization)
   */
  trackVaultDebounced(payload) {
    this.latestVaultPayload = payload;
    
    // Eğer halihazırda bir geri sayım varsa sıfırla (Spam engellendi)
    if (this.vaultTrackTimer) {
        clearTimeout(this.vaultTrackTimer);
    }
    
    // 2.5 saniye sabit kalırsa (kullanıcı hızlıca tıklamayı bitirdiyse) ateşle
    this.vaultTrackTimer = setTimeout(() => {
        this.track('VAULT_STATE_CHANGE', this.latestVaultPayload);
        this.vaultTrackTimer = null;
    }, 2500);
  }

  /**
   * Veriyi ana iplikçiyi (main thread) bozmadan sunucuya ateşler
   */
  track(eventName, payload = {}) {
    // 🛡️ Telemetry Feature Flag check to prevent 404 network noise in local dev
    const TELEMETRY_BEACON_ENABLED = window.__SANTIS_ENABLE_TELEMETRY_BEACON__ === true;
    if (!TELEMETRY_BEACON_ENABLED) {
        return false;
    }

    const data = {
      session_id: this.sessionId,
      event: eventName,
      timestamp: new Date().toISOString(),
      payload: payload
    };

    // sendBeacon için veriyi Blob formatına çeviriyoruz
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    
    // Tarayıcı bu işlemi arka planda otonom olarak yapar
    navigator.sendBeacon(this.endpoint, blob);
    console.log(`📡 [God's Eye] Sinyal Fırlatıldı: ${eventName}`);
  }

  _generateSessionId() {
    // Benzersiz ve anonim bir oturum kimliği (Crypto API destekliyse onu, yoksa fallback kullanır)
    if (window.crypto && window.crypto.randomUUID) {
      return window.crypto.randomUUID();
    }
    return 'sess_' + Math.random().toString(36).substring(2, 11);
  }
}

// Global Singleton Instance
window.SantisTelemetry = new SantisTelemetryEngine();
