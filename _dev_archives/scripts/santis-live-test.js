window.runLiveSyncTest = async function () {
    console.group("⚡ SANTIS LIVE SYNC INTELLIGENCE v3.0");

    // Check if Brain is alive 
    // We use a slight delay to ensure Brain IIFE has executed
    if (!window.SantisBrain) {
        console.error("❌ Brain Module Missing. (Is santis-brain.js loaded?)");
        console.groupEnd();
        return;
    }

    // We can now access the socket directly thanks to the getter we added
    const ws = window.SantisBrain.socket;

    if (!ws || ws.readyState !== 1) {
        console.warn("⚠️ Neural Link Not Fully Ready (State: " + (ws ? ws.readyState : 'NULL') + ")");
        // Attempt to use high-level listening instead
    }

    const testFile = "/assets/js/sync_probe_home_data.js";
    const timestamp = Date.now();
    let verified = false;

    // 1. Listen via Brain's Public Interface (Safest Method)
    const trap = (type, payload) => {
        // Normalize payload
        const file = payload?.file || (typeof payload === 'string' ? payload : '') || payload?.filename;

        // Debug Log
        if (type === 'update') {
            console.log("🔥 Brain Signal Received:", type, file);
        }

        if (type === 'update' && file === testFile) {
            const latency = Date.now() - timestamp;
            console.log(`%c🚀 LIVE SYNC SUCCESS (${latency}ms)`, "color:#4caf50; font-size:16px; font-weight:bold;");

            // Visual Toast
            const toast = document.createElement('div');
            toast.style.cssText = "position:fixed; top:20px; right:20px; background:#4caf50; color:white; padding:15px 25px; border-radius:8px; z-index:99999; box-shadow:0 5px 15px rgba(0,0,0,0.3); font-family:sans-serif; font-weight:bold;";
            toast.innerHTML = `🚀 LIVE SYNC: ${latency}ms`;
            document.body.appendChild(toast);
            setTimeout(() => toast.remove(), 4000);

            verified = true;
        }
    };

    // Subscribe to Brain
    window.SantisBrain.listen(trap);

    // 2. Transmit Probe (JSON MODE)
    console.log("💾 Transmitting Clean JSON Probe...");

    // Pure JSON payload. No "window.VAR =" prefix.
    const probeData = JSON.stringify({
        _probe: timestamp,
        status: "live_sync_v4",
        msg: "JSON Architecture Verified"
    });

    try {
        await fetch("/api/save", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                filename: testFile,
                content: probeData // Send raw JSON string
            })
        });
        console.log("✅ Probe Sent to Server (HTTP 200)");
    } catch (e) {
        console.error("❌ Transmission Failed:", e);
    }

    // 3. Watchdog
    setTimeout(() => {
        if (!verified) {
            console.warn("⚠️ Sync Signal Timeout (5s)");
            console.warn("Possible issues: Server broadcast filter, path mismatch, or WebSocket disconnect.");
        }
        console.groupEnd();
    }, 5000);
};

// Auto-run if query param present (optional)
if (location.search.includes('test_sync')) {
    setTimeout(window.runLiveSyncTest, 2000);
}

console.log("%c⚡ Live Sync v3 Loaded. Type 'runLiveSyncTest()' to execute.", "color:#d4af37");
