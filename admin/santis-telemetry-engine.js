/**
 * SANTIS MASTER OS - Sovereign Telemetry Engine (V24)
 * Consolidated Global Polling Architecture
 * Extinguishes UI overlap & network congestion. 
 */
window.SantisTelemetryEngine = (function() {
    let _pollingTimer = null;
    let _pollInterval = 5000; // 5 seconds global pulse
    let _isActive = false;

    function globalPulse() {
        if (!_isActive) return;
        
        // --- 1. Integrated Hub Endpoints (command-center) ---
        if (typeof updateAIBrain === 'function') updateAIBrain();
        if (typeof updateShadowLog === 'function') updateShadowLog();
        if (typeof updateSovereignTelemetry === 'function') updateSovereignTelemetry();
        if (typeof updateSovereignPulse === 'function') updateSovereignPulse();
        
        // Specific longer intervals can be rate-limited, but for now we unify them into the pulse
        // as the original intervals were 3000ms or 4000ms anyway.
        
        // --- 2. Dashboard Logic Endpoints ---
        // (If still attached to DOM)
        if (typeof renderTrafficSimulation === 'function') renderTrafficSimulation();
        if (typeof fetchDashboardMetrics === 'function') fetchDashboardMetrics();

        // Optional God Mode Sync once every 6 pulses (30s)
        if (typeof window.initGodMode === 'function' && Math.random() < 0.2) {
            window.initGodMode(false);
        }

        // Fire Global Event for Vue.js & external components
        window.dispatchEvent(new CustomEvent('santis:pulse', {
            detail: { timestamp: Date.now(), status: 'SYNCED' }
        }));
    }

    return {
        ignite: function(intervalMs = 5000) {
            if (_isActive) return;
            _isActive = true;
            _pollInterval = intervalMs;
            
            // Initial burst
            setTimeout(globalPulse, 1000);
            
            // Unified Loop
            _pollingTimer = setInterval(globalPulse, _pollInterval);
            console.log(`%c[Omni-Core] ⚡ Sovereign Telemetry Engine Ignited (${_pollInterval}ms pulse)`, "color: #D4AF37; font-weight: bold; font-family: monospace;");
        },
        halt: function() {
            _isActive = false;
            clearInterval(_pollingTimer);
            console.log("%c[Omni-Core] 🛑 Sovereign Telemetry Halted", "color: #ef4444; font-family: monospace;");
        }
    };
})();

// Auto-boot if not deferred
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => window.SantisTelemetryEngine.ignite());
} else {
    window.SantisTelemetryEngine.ignite();
}
