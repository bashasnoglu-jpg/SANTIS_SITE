/**
 * ═══════════════════════════════════════════════════════════
 * 🦅 SANTIS OS - TELEMETRY CLIENT (Singleton Shield v1.0)
 * ═══════════════════════════════════════════════════════════
 * Kuantum Tünelinde yaşanan Yeniden Bağlanma Fırtınası'nı 
 * (Reconnection Storm) önlemek için Singleton (Tekil) mimariyle 
 * yazılmış WebSocket kalkanı.
 */

class SantisTelemetryClient {
    constructor() {
        const config = window.getRuntimeConfig ? window.getRuntimeConfig() : {};
        this.wsUrl = config.wsUrl || 'ws://127.0.0.1:3030/events';
        this.apiBaseUrl = config.apiBaseUrl || '/api/v1';
        this.reconnectTimeout = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 3;
        this.initConnection();
    }

    async resolveAuthenticatedWsUrl() {
        let token = null;

        if (window.SantisApi && typeof window.SantisApi.getSessionToken === 'function') {
            token = await window.SantisApi.getSessionToken();
        }

        if (!token) {
            try {
                const response = await fetch(`${this.apiBaseUrl}/auth/session`, {
                    headers: { Accept: 'application/json' },
                    cache: 'no-store',
                });
                if (response.ok) {
                    const data = await response.json();
                    token = data.token || null;
                }
            } catch (error) {
                console.warn('[Telemetry Client] Session token alınamadı:', error.message);
            }
        }

        if (!token) return this.wsUrl;

        const url = new URL(this.wsUrl, window.location.href);
        url.searchParams.set('client_type', 'telemetry');
        url.searchParams.set('token', token);
        return url.toString();
    }

    async initConnection() {
        // İstemci tarafında bağlantı fırtınasını engelleyen Singleton Kalkanı
        if (!window.SantisSocket || window.SantisSocket.readyState === WebSocket.CLOSED) {
            console.log(`🛡️ [Telemetry Client] Singleton Kalkanı aktif ediliyor. Bağlantı başlatılıyor... (Deneme: ${this.reconnectAttempts + 1}/${this.maxReconnectAttempts + 1})`);
            
            try {
                window.SantisSocket = new WebSocket(await this.resolveAuthenticatedWsUrl());
            } catch (e) {
                console.error("🚨 [Telemetry Client] Socket oluşturma hatası:", e);
                this.scheduleReconnect();
                return;
            }
            
            window.SantisSocket.onopen = () => {
                console.log("👁️ [Telemetry Client] Kuantum Tüneli Açıldı (Singleton Guard).");
                this.reconnectAttempts = 0; // Reset counter on success
                clearTimeout(this.reconnectTimeout);
            };

            window.SantisSocket.onmessage = (event) => {
                // Heartbeat / Pulse messages
                try {
                    const data = JSON.parse(event.data);
                    if (data.type === "ping") {
                        window.SantisSocket.send(JSON.stringify({ type: "pong", timestamp: Date.now() }));
                    }
                } catch (e) {}
            };
            
            window.SantisSocket.onclose = () => {
                window.SantisSocket = null; // Clean up reference
                this.scheduleReconnect();
            };

            window.SantisSocket.onerror = (err) => {
                console.error("🚨 [Telemetry Client] WebSocket zafiyeti!", err);
            };
        } else {
            console.log("⚡ [Telemetry Client] Bağlantı zaten var. Çift bağlantı reddedildi.");
        }
    }

    scheduleReconnect() {
        if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);
        
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.warn(`🛑 [Telemetry Client] Maksimum bağlantı denemesine (${this.maxReconnectAttempts}) ulaşıldı. Kuantum Tüneli geçici olarak askıya alındı. Console Spam'i önlendi.`);
            return;
        }

        this.reconnectAttempts++;
        console.warn(`⚠️ [Telemetry Client] Tünel Kapandı. Reconnect 5 saniye sonra (Debounced)...`);
        
        // Anında değil, gecikmeli bağlanma (Debounce & Backoff)
        this.reconnectTimeout = setTimeout(() => {
            this.initConnection();
        }, 5000);
    }
}

// Auto-boot
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new SantisTelemetryClient());
} else {
    new SantisTelemetryClient();
}
