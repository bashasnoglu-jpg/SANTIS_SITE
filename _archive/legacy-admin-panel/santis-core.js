/**
 * 🛑 DEPRECATED / FROZEN (PHASE 70) 🛑
 * This module is part of the legacy admin panel.
 * Do NOT use this for new features. All new logic should be implemented in React/Vite (/admin-panel/).
 *
 * Santis Master OS - Sovereign State Machine (Neural Bridge)
 * Phase 4.5: Autonomous updating with Gold Glow Pulse
 */

class SantisSovereign {
    constructor() {
        this.state = { revenue: 0, capacity: 0, heat: 0, visitors: 0 };
        this.socket = null;
        this._reconnectAttempts = 0;
        this._maxAttempts = 10;
        this._connectWS();
    }

    _connectWS() {
        if (!window.SANTIS_ENABLE_COMMAND_WS) {
            if (!this._wsWarned) {
                console.log('%c🔌 [Neural Bridge] Command WS disabled. SSE owns truth stream.', 'color: #6b7280; font-style: italic;');
                this._wsWarned = true;
            }
            return;
        }

        // 🛡️ Localhost Guard: Backend yokken WebSocket spam'ini engelle
        const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        if (isLocal) {
            if (!this._localWarned) {
                console.log('%c🔌 [Neural Bridge] Localhost tespit edildi — WebSocket devre dışı. Production\'da otomatik aktif olacak.', 'color: #6b7280; font-style: italic;');
                this._localWarned = true;
            }
            return;
        }

        if (this._reconnectAttempts >= this._maxAttempts) {
            console.warn(`🛑 [Neural Bridge] ${this._maxAttempts} deneme aşıldı. Manuel: SantisCore._reconnectAttempts=0; SantisCore._connectWS()`);
            return;
        }
        try {
            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            const WS_BASE = 'wss://api.sovereign-os.com';
            this.socket = new WebSocket(`${WS_BASE}/ws?client_type=hq&client_id=global`);
            this.socket.onopen = () => {
                this._reconnectAttempts = 0;
                console.log('🟢 [Neural Bridge] WebSocket bağlantısı kuruldu.');
            };
            this.socket.onerror = () => {};
            this.socket.onclose = () => {
                // 🛡️ Exponential Backoff: 3s → 6s → 12s → 24s → 30s max
                const delay = Math.min(3000 * (2 ** this._reconnectAttempts), 30000);
                this._reconnectAttempts++;
                setTimeout(() => this._connectWS(), delay);
            };
        } catch (e) {
            const delay = Math.min(3000 * (2 ** this._reconnectAttempts), 30000);
            this._reconnectAttempts++;
            setTimeout(() => this._connectWS(), delay);
        }
    }

    async init() {
        await this.syncStats(); // Fetch initial data
        
        // Connect to the new SSE Stream
        if (window.SantisApi) {
            window.SantisApi.connectCoreStateStream();
        }

        window.addEventListener("SANTIS_CORE_STATE_PATCH", (e) => {
            this.applyCoreStatePatch(e.detail);
        });

        this.listen(); // Start listening to WebSocket (if enabled)
    }

    applyCoreStatePatch(patch) {
        if (!patch) return;
        
        // Update core state
        this.state.coreState = { ...this.state.coreState, ...patch };
        
        // Extract top level updates
        if (patch.revenue) this.state.revenue = patch.revenue;
        if (patch.sessions) this.state.sessions = patch.sessions;
        if (patch.therapists) this.state.therapists = patch.therapists;
        if (patch.alerts) this.state.alerts = patch.alerts;
        if (patch.system) this.state.system = patch.system;

        // UI Widget Updates
        if (patch.revenue && patch.revenue.today !== undefined) {
             const el = document.querySelector(`#metric-revenue`);
             if (el) el.textContent = parseFloat(patch.revenue.today).toFixed(2);
        }
        if (patch.sessions && patch.sessions.active !== undefined) {
             const el = document.querySelector(`#metric-visitors`);
             if (el) el.textContent = Math.round(patch.sessions.active);
        }

        window.dispatchEvent(new CustomEvent("SANTIS_ADMIN_STATE_SYNCED", { detail: this.state.coreState }));
        console.log("⚡ [Admin Core] CoreState patched.", patch);
    }

    async apiFetch(endpoint, options = {}) {
        const token = localStorage.getItem('santis_token');
        const tenant = localStorage.getItem('tenant_id');
        const headers = { ...options.headers };

        const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        const API_BASE = isLocal ? '' : 'https://api.sovereign-os.com';
        const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        if (tenant) {
            headers['X-Tenant-ID'] = tenant;
        }

        // Let the browser handle Content-Type for FormData
        if (!(options.body instanceof FormData) && !headers['Content-Type']) {
            headers['Content-Type'] = 'application/json';
        }

        // Attach CSRF token if method is state-changing
        const method = (options.method || 'GET').toUpperCase();
        if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
            // Find csrf_token cookie
            const cookies = document.cookie.split('; ');
            const csrfCookie = cookies.find(row => row.startsWith('csrf_token='));
            if (csrfCookie) {
                headers['X-CSRF-Token'] = csrfCookie.split('=')[1];
            }
        }

        const fetchOptions = {
            ...options,
            headers,
            credentials: 'include' // Crucial for HttpOnly cookies and CSRF
        };

        const response = await fetch(url, fetchOptions);

        if (response.status === 401 || response.status === 403) {
            console.warn(`[Neural Bridge] ${response.status} Unauthorized/Forbidden detected. Token invalid or missing tenant claim. Redirecting to login...`);
            localStorage.removeItem('santis_token');
            if (!window.location.pathname.includes('index.html')) {
                window.location.href = '/admin/index.html';
            }
        }

        return response;
    }

    async syncStats() {
        try {
            const api = window.SantisApi;

            if (!api || typeof api.getCoreState !== "function") {
                throw new Error("SantisApi.getCoreState unavailable");
            }

            const state = await api.getCoreState();

            this.state = {
                ...this.state,
                coreState: state,
                revenue: state.revenue,
                sessions: state.sessions,
                therapists: state.therapists,
                alerts: state.alerts,
                system: state.system,
            };

            window.dispatchEvent(
                new CustomEvent("SANTIS_ADMIN_STATE_SYNCED", {
                    detail: state,
                })
            );

            console.log("✅ [Admin Core] CoreState synced.", state.meta);
        } catch (error) {
            console.error("❌ [Admin Core] CoreState sync failed:", error);
        }
    }

    updateState(newState) {
        // Automatically updates DOM elements and triggers the 'Gold Glow' class
        Object.keys(newState).forEach(key => {
            if (this.state[key] !== newState[key]) {
                const el = document.querySelector(`#metric-${key}`);
                if (el) {
                    // Format correctly (revenue has decimals, others are whole numbers)
                    el.textContent = key === 'revenue' ? parseFloat(newState[key]).toFixed(2) : Math.round(newState[key]);

                    // Add glow effect
                    const parent = el.closest('.bg-gray-900\\/50'); // Finding the widget container
                    if (parent) {
                        parent.classList.add('border-santis-gold', 'shadow', 'shadow-santis-gold/50');
                        setTimeout(() => parent.classList.remove('border-santis-gold', 'shadow', 'shadow-santis-gold/50'), 1500);
                    }
                }
            }
        });
        this.state = { ...this.state, ...newState };
    }

    listen() {
        // 🛡️ Null Guard: Localhost'ta WebSocket devre dışıyken çöküşü engelle
        if (!this.socket) {
            console.warn('⚠️ [Neural Bridge] WebSocket kapalı — dinleme atlandı.');
            return;
        }
        this.socket.onmessage = (event) => {
            try {
                const pulse = JSON.parse(event.data);

                // Silently process heartbeat pulses (don't spam the stream)
                if (pulse.type === "INTELLIGENCE_PULSE") {
                    // Update stats from surge data if available
                    if (pulse.surge && pulse.surge.multiplier) {
                        this.updateState({ heat: Math.round((pulse.surge.multiplier - 1) * 100) });
                    }
                    return;
                }

                // Phase 20: Predictive Intent Radar (Gold Intent Rings)
                if (pulse.type === "INTENT_RADAR_PING") {
                    const targetCard = document.querySelector(`.matrix-card[data-asset-id="${pulse.asset_id}"]`);
                    if (targetCard) {
                        const radarRing = document.createElement("div");
                        radarRing.className = "absolute inset-0 border-2 border-santis-gold/80 rounded-xl shadow-[0_0_20px_rgba(212,175,55,0.8)] z-50 pointer-events-none scale-[0.98] opacity-100 transition-all duration-[1200ms] ease-out";
                        targetCard.appendChild(radarRing);

                        // Trigger the expanding "lock-on" animation
                        requestAnimationFrame(() => {
                            setTimeout(() => {
                                radarRing.classList.remove('scale-[0.98]', 'opacity-100', 'border-santis-gold/80');
                                radarRing.classList.add('scale-[1.08]', 'opacity-0', 'border-santis-gold/20');
                            }, 50);
                        });

                        // Garbage collection
                        setTimeout(() => radarRing.remove(), 1500);
                    }

                    if (window.pushPulseSignal) {
                        window.pushPulseSignal("RADAR", pulse.message, "text-emerald-400 font-bold tracking-widest uppercase");
                    }
                    return;
                }

                // Phase 21: Full Sentience Feedback Loop (DB Reorganization)
                if (pulse.type === "OPTIMIZE_COMPLETE") {
                    if (window.fetchAssets) {
                        window.fetchAssets(); // Refresh Matrix with new sort order
                    }
                    if (window.pushPulseSignal) {
                        window.pushPulseSignal("SENTIENCE", pulse.message, "text-emerald-400 font-bold drop-shadow-[0_0_12px_rgba(16,185,129,0.6)] uppercase");
                    }
                    return;
                }

                // Phase 44: ECharts Radar Matrix Mutator
                if (pulse.type === "MATRIX_OPTIMIZED") {
                    if (window.SovereignCharts) {
                        window.SovereignCharts.mutateRadar(pulse.skincare || 0, pulse.hammam || 0, pulse.massage || 0, pulse.beauty || 0, pulse.whale || 0);
                    }
                    return;
                }

                // Phase 44: Stripe Webhook Revenue Pulse
                if (pulse.type === "PAYMENT_SUCCESS") {
                    if (window.SovereignCharts) {
                        window.SovereignCharts.triggerPulseSpike(pulse.amount + 5000);
                    }
                    if (window.pushPulseSignal) {
                        window.pushPulseSignal("💰 [REVENUE STRIKE]", `Ajan üzerinden +€${pulse.amount} kasaya girdi!`, "text-santis-gold font-bold");
                    }
                    return;
                }

                // Phase 45.1: The Genesis UI (Matrix Drop)
                if (pulse.type === "MATRIX_DROP_GENESIS") {
                    if (window.triggerMatrixDropGenesis) {
                        window.triggerMatrixDropGenesis(pulse.asset, pulse.mrr_lift);
                    }
                    // Otonom Varlığını Altın Rengiyle Logla
                    if (window.pushPulseSignal) {
                        window.pushPulseSignal("🌌 [VOID GENESIS]", pulse.message, "text-fuchsia-400 font-bold drop-shadow-[0_0_15px_rgba(232,121,249,0.8)]");
                    }
                    return;
                }

                // Push to Visual Log (implemented in integrated_hub.js)
                if (window.pushPulseSignal) {
                    let color = "text-gray-300";
                    if (pulse.type === "BOOKING_CREATED") color = "text-santis-gold font-bold";
                    if (pulse.type === "VISUAL_INGESTED") color = "text-blue-400";
                    // Phase 32: Sovereign Revenue Pulse (Stripe Webhooks)
                    if (pulse.type === "PAYMENT_SUCCESS") {
                        color = "text-santis-gold font-black drop-shadow-[0_0_15px_rgba(212,175,55,0.8)] border-l-4 border-santis-gold pl-2 bg-santis-gold/5 py-1";
                        // Update Revenue Top Bar Automatically
                        if (pulse.amount && typeof this.state.revenue !== 'undefined') {
                            this.updateState({ revenue: parseFloat(this.state.revenue) + parseFloat(pulse.amount) });
                        }
                    }
                    if (pulse.type === "PRICE_SURGE") {
                        color = "text-green-400 font-bold border-l-2 border-santis-gold pl-2";
                        // Flash the Demand Heat widget to signify Yield Engine activity
                        const heatEl = document.querySelector('#metric-heat');
                        if (heatEl) {
                            const parent = heatEl.closest('.bg-gray-900\\/50');
                            if (parent) {
                                parent.classList.add('border-santis-gold', 'shadow', 'shadow-santis-gold/50', 'bg-santis-gold/10');
                                setTimeout(() => parent.classList.remove('border-santis-gold', 'shadow', 'shadow-santis-gold/50', 'bg-santis-gold/10'), 3000);
                            }
                        }
                    }

                    window.pushPulseSignal(pulse.type, pulse.message || `Event: ${pulse.type}`, color);
                }
            } catch (e) {
                console.warn("Invalid pulse data", e);
            }
        };
    }
}

// Initialize class immediately
window.SantisCore = new SantisSovereign();

// Boot on load
document.addEventListener('DOMContentLoaded', () => {
    window.SantisCore.init();
});
