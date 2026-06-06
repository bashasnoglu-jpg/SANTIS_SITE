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
        // socket.io-client will automatically connect to this URL via its own protocols
        this.wsUrl = config.wsUrl ? config.wsUrl.replace('/events', '') : 'http://127.0.0.1:3030';
        this.apiBaseUrl = config.apiBaseUrl || '/api/v1';
        this.socket = null;
        
        // Phase K-3B: Flight Risk Buffer
        this.riskBuffer = [];
        this.lastRiskEmit = 0;
        
        this.initConnection();
        this.initRiskEngine();
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
        return token;
    }

    async initConnection() {
        // Load socket.io client dynamically if not present
        if (typeof window.io === 'undefined') {
            try {
                await new Promise((resolve, reject) => {
                    const script = document.createElement('script');
                    script.src = 'https://cdn.socket.io/4.7.4/socket.io.min.js';
                    script.onload = resolve;
                    script.onerror = reject;
                    document.head.appendChild(script);
                });
            } catch (e) {
                console.error("🚨 [Telemetry Client] Socket.IO kütüphanesi yüklenemedi:", e);
                return;
            }
        }

        if (!this.socket || this.socket.disconnected) {
            console.log(`🛡️ [Telemetry Client] Singleton Kalkanı aktif ediliyor. Bağlantı başlatılıyor...`);
            
            const token = await this.resolveAuthenticatedWsUrl();
            
            this.socket = window.io(this.wsUrl, {
                auth: { token },
                query: { client_type: 'telemetry' },
                reconnectionAttempts: 5,
                reconnectionDelay: 2000
            });
            
            this.socket.on("connect", () => {
                console.log("👁️ [Telemetry Client] Kuantum Tüneli Açıldı (Socket.IO).");
                
                // Detect Node (Page) ID
                const pathParts = window.location.pathname.split('/').filter(Boolean);
                let node_id = pathParts[pathParts.length - 1] || "index";
                const metaTag = document.querySelector('meta[name="santis-node-id"]');
                if (metaTag) node_id = metaTag.getAttribute('content');
                
                // Emit initial registration
                this.socket.emit("public:register_telemetry", {
                    page: window.location.pathname,
                    status: 'active'
                });
            });

            this.socket.on("disconnect", (reason) => {
                console.warn("⚠️ [Telemetry Client] Tünel Kapandı:", reason);
            });

            this.socket.on("connect_error", (err) => {
                console.error("🚨 [Telemetry Client] WebSocket zafiyeti!", err.message);
            });

            // Handle visibility change to update status
            document.addEventListener("visibilitychange", () => {
                if (this.socket && this.socket.connected) {
                    this.socket.emit('public:update_telemetry', {
                        status: document.visibilityState === 'hidden' ? 'idle' : 'active'
                    });
                    if (document.visibilityState === 'hidden') {
                        this.bufferAnomaly('idle', 'low', 40);
                    }
                }
            });
        }
    }

    // Phase K-3B: Silent Observer Risk Engine
    initRiskEngine() {
        // 1. Exit Intent (Mouse moving rapidly to top)
        document.addEventListener('mouseout', (e) => {
            if (e.clientY < 20 && e.relatedTarget == null) {
                this.bufferAnomaly('exit_intent', 'high', 85);
            }
        }, { passive: true });

        // 2. Rage Scroll
        let lastScrollY = window.scrollY;
        let lastScrollTime = Date.now();
        document.addEventListener('scroll', () => {
            requestAnimationFrame(() => {
                const now = Date.now();
                const deltaY = Math.abs(window.scrollY - lastScrollY);
                const deltaTime = now - lastScrollTime;
                if (deltaTime > 0 && deltaY > 0) {
                    const speed = deltaY / deltaTime; // px/ms
                    if (speed > 5) { // arbitrary threshold for erratic scroll
                        this.bufferAnomaly('rage_scroll', 'medium', 65);
                    }
                }
                lastScrollY = window.scrollY;
                lastScrollTime = now;
            });
        }, { passive: true });

        // Buffer flush interval (Max 1 per sec)
        setInterval(() => this.flushRiskBuffer(), 1000);
    }

    bufferAnomaly(anomalyType, severity, riskScore) {
        const existing = this.riskBuffer.find(a => a.anomalyType === anomalyType);
        if (existing) {
            if (riskScore > existing.riskScore) {
                existing.riskScore = riskScore;
                existing.severity = severity;
            }
        } else {
            this.riskBuffer.push({ anomalyType, severity, riskScore });
        }
    }

    flushRiskBuffer() {
        if (!this.socket || !this.socket.connected || this.riskBuffer.length === 0) return;
        const now = Date.now();
        // Ensure we respect the 5 msg/sec hard deck by batching anomalies 1 per sec
        if (now - this.lastRiskEmit >= 1000) {
            this.riskBuffer.sort((a, b) => b.riskScore - a.riskScore);
            const topAnomaly = this.riskBuffer[0];
            
            this.socket.emit('public:telemetry_anomaly', topAnomaly);
            this.lastRiskEmit = now;
            this.riskBuffer = [];
        }
    }
}

// Auto-boot
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { window.santisTelemetry = new SantisTelemetryClient(); });
} else {
    window.santisTelemetry = new SantisTelemetryClient();
}
