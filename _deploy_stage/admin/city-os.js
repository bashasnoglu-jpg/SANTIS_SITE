
// City OS Frontend Logic
console.log("🏙️ City OS Module Loaded");

async function scanCity() {
    logToTerminal("INITIATING DEEP CITY SCAN...", "info");

    try {
        const res = await fetch("/admin/city/scan");
        const report = await res.json();

        if (report.status === "error") {
            logToTerminal(`SCAN FAILED: ${report.msg}`, "error");
            return;
        }

        logToTerminal("--- DIAGNOSTIC RESULTS ---", "success");
        logToTerminal(`👻 Ghosts Detected: ${report.ghosts}`, report.ghosts > 0 ? "warning" : "success");
        logToTerminal(`🔤 Encoding Issues: ${report.bad_encoding}`, report.bad_encoding > 0 ? "warning" : "success");
        logToTerminal(`📦 Dead Assets: ${report.dead_assets}`, report.dead_assets > 0 ? "warning" : "success");
        logToTerminal("--- END REPORT ---", "success");

    } catch (e) {
        logToTerminal(`CONNECTION ERROR: ${e}`, "error");
    }
}

async function executeProtocol(protocolId) {
    if (!confirm(`⚠️ EXECUTE PROTOCOL: ${protocolId}?\nThis will modify system files.`)) return;

    logToTerminal(`🚀 LAUNCHING PROTOCOL: ${protocolId}...`, "info");
    document.getElementById("terminal-status").innerText = "EXECUTING";
    document.getElementById("terminal-status").style.color = "#00d9ff";

    try {
        const res = await fetch(`/admin/city/execute/${protocolId}`, { method: "POST" });
        const data = await res.json();

        if (data.status === "started") {
            startLogStream();
        } else {
            logToTerminal("FAILED TO START PROTOCOL", "error");
        }

    } catch (e) {
        logToTerminal(`EXECUTION ERROR: ${e}`, "error");
    }
}

var logInterval = window.logInterval || null;

function startLogStream() {
    if (logInterval) clearInterval(logInterval);

    logInterval = setInterval(async () => {
        try {
            const res = await fetch("/admin/city/logs");
            const data = await res.json();

            // Clear and render last 50 lines
            const term = document.getElementById("city-terminal");
            term.innerHTML = "";

            data.logs.forEach(msg => {
                const div = document.createElement("div");
                div.innerText = msg;
                div.style.color = msg.includes("✅") ? "#00ff88" :
                    msg.includes("❌") ? "#ff4444" :
                        msg.includes("⚠️") ? "#ffaa00" : "#ccc";
                term.appendChild(div);
            });

            term.scrollTop = term.scrollHeight;

            // Check if idle (simple heuristic or need API status)
            // For now, we keep polling. Ideally backend returns status.

        } catch (e) {
            console.error("Log stream error:", e);
        }
    }, 1000);
}

function logToTerminal(msg, type = "info") {
    const term = document.getElementById("city-terminal");
    const div = document.createElement("div");
    div.innerText = `> ${msg}`;

    if (type === "error") div.style.color = "#ff4444";
    if (type === "success") div.style.color = "#00ff88";
    if (type === "warning") div.style.color = "#ffaa00";
    if (type === "info") div.style.color = "#00d9ff";

    term.appendChild(div);
    term.scrollTop = term.scrollHeight;
}
