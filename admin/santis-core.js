/**
 * Santis Master OS - Sovereign State Machine (Neural Bridge)
 * Phase 4.5: Autonomous updating with Gold Glow Pulse
 */

class SantisSovereign {
    constructor() {
        this.state = { revenue: 0, capacity: 0, heat: 0, visitors: 0 };
        this.socket = null;
        this._connectWS();
    }

    _connectWS() {
        try {
            const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            const WS_BASE = isLocal ? `${protocol}//${window.location.host}` : 'wss://api.sovereign-os.com';
            this.socket = new WebSocket(`${WS_BASE}/ws?client_type=hq&client_id=global`);
            this.socket.onerror = () => {};
            this.socket.onclose = () => {
                // Auto-reconnect after 5s
                setTimeout(() => this._connectWS(), 5000);
            };
        } catch (e) {
            // Silently retry
            setTimeout(() => this._connectWS(), 5000);
        }
    }

    async init() {
        await this.syncStats(); // Fetch initial data
        this.listen(); // Start listening to WebSocket
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
            const response = await this.apiFetch('/api/v1/analytics/metrics');

            if (response.ok) {
                const data = await response.json();
                this.updateState({
                    revenue: data.today_revenue || 0,
                    capacity: data.current_capacity || 0,
                    heat: data.demand_heat || 0,
                    visitors: data.active_visitors || 0
                });
            } else {
                console.warn("[Neural Bridge] Failed to sync stats from Backend");
            }
        } catch (error) {
            console.error("[Neural Bridge] Connection error:", error);
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
        this.socket.onmessage = (event) => {
            try {
                const pulse = JSON.parse(event.data);

                // If it's a booking or a visual ingest, sync stats again
                if (pulse.type === "BOOKING_CREATED" || pulse.type === "VISUAL_INGESTED") {
                    this.syncStats();
                }

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
