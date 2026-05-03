/**
 * Santis Live Feed (SSE Strategy Consumer)
 * Implements 'Zero-Drift' state synchronization using EventSource.
 * 
 * CORE LAW: 
 * 1. UI never mutations state directly; it reacts to patches.
 * 2. Sequence gaps trigger a full state rehydration.
 * 3. Reactive UI binding via 'santis:state-patch' custom event.
 */
class SantisLiveFeed {
    constructor() {
        this.source = null;
        this.lastSeq = 0;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 10;
        this.reconnectDelay = 2000;
        this.isActive = false;
    }

    /**
     * Establishes connection to the Ingestion API Core-State Stream.
     */
    connect() {
        if (this.isActive) return;

        console.log("%c📡 [Santis SSE] Connecting to Sovereign Core Stream...", "color: #ffcc00; font-weight: bold;");
        this.source = new EventSource("/api/v1/core-state/stream");

        // Listen for deterministic strategy/state updates
        this.source.addEventListener("strategy_update", (event) => {
            try {
                const envelope = JSON.parse(event.data);
                this.handlePatch(envelope.data);
            } catch (err) {
                console.error("🚨 [Santis SSE] Patch parse error:", err);
            }
        });
        
        // Listen for system heartbeats
        this.source.addEventListener("heartbeat", () => {
            // Heartbeat received, no action needed but confirms connection health
        });

        this.source.onopen = () => {
            console.log("%c✅ [Santis SSE] Core Stream Established.", "color: #00ff00;");
            this.reconnectAttempts = 0;
            this.isActive = true;
            this.reconnectDelay = 2000;
        };

        this.source.onerror = (err) => {
            this.isActive = false;
            console.warn("⚠️ [Santis SSE] Connection interrupted. Attempting recovery...");
            this.handleReconnect();
        };
    }

    handleReconnect() {
        if (this.source) {
            this.source.close();
            this.source = null;
        }

        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            const delay = Math.min(this.reconnectDelay * this.reconnectAttempts, 30000);
            console.log(`🔄 [Santis SSE] Reconnecting in ${delay}ms... (Attempt ${this.reconnectAttempts})`);
            setTimeout(() => this.connect(), delay);
        } else {
            console.error("💀 [Santis SSE] Max reconnect attempts reached. Sovereign connection lost.");
            this.dispatchCriticalError("STREAM_DEAD");
        }
    }

    /**
     * Processes incoming patches with sequence validation.
     */
    handlePatch(data) {
        const { seq, ts, scope, patch } = data;

        // 🧠 Gap Recovery Engine (Self-Healing)
        if (this.lastSeq > 0 && seq !== this.lastSeq + 1) {
            console.warn(`🚨 [Santis SSE] SEQ GAP DETECTED! Expected ${this.lastSeq + 1}, got ${seq}. Triggering full sync.`);
            this.triggerFullSync();
            this.lastSeq = seq;
            return;
        }

        this.lastSeq = seq;
        
        // Log patch arrival with premium styling
        console.log(`%c📥 [SSE] Patch Received [${seq}] | Scope: ${scope}`, "color: #00e5ff;");

        // Apply Patch to Global State & UI
        this.applyPatch(scope, patch);
    }

    applyPatch(scope, patch) {
        // 1. Dispatch custom event for reactive UI components
        const patchEvent = new CustomEvent("santis:state-patch", {
            detail: { 
                scope, 
                patch, 
                timestamp: Date.now(),
                seq: this.lastSeq
            }
        });
        window.dispatchEvent(patchEvent);

        // 2. Production-Grade Patch Merge (Deep-ish Merge)
        // We use window.SantisCore.state as the authority
        if (window.SantisCore && window.SantisCore.state) {
            const currentState = window.SantisCore.state.store;
            
            // Apply patch with deep merge logic for metrics
            const newState = {
                ...currentState,
                ...patch,
                metrics: {
                    ...(currentState.metrics || {}),
                    ...(patch.metrics || {})
                }
            };

            // Inject into authoritative state
            Object.entries(newState).forEach(([key, value]) => {
                window.SantisCore.setState(key, value);
            });
            
            // Trigger visual feedback if enabled
            if (window.SantisCore.triggerVisualFeedback) {
                window.SantisCore.triggerVisualFeedback(scope);
            }
        }
    }

    triggerFullSync() {
        console.log("%c🔄 [Santis SSE] Initiating Full State Rehydration...", "color: #ff00ff;");
        if (window.SantisCore && typeof window.SantisCore.rehydrate === "function") {
            window.SantisCore.rehydrate();
        } else {
            // Fallback: reload page if critical drift occurs and no rehydration logic exists
            window.location.reload();
        }
    }

    dispatchCriticalError(code) {
        window.dispatchEvent(new CustomEvent("santis:critical-error", { detail: { code } }));
    }
}

// Global Singleton Initialization
window.santisLiveFeed = new SantisLiveFeed();

// Auto-boot if in Boardroom environment
if (document.body.classList.contains('nv-boardroom-pro') || window.location.pathname.includes('boardroom')) {
    window.santisLiveFeed.connect();
}
