
// City Intelligence Frontend Logic

async function runIntelligenceScan() {
    const btn = document.querySelector('[data-action="run-intelligence-scan"]');
    if (!btn) return;
    btn.innerHTML = "🕵️‍♂️ SCANNING... (Background)";
    btn.disabled = true;

    try {
        const res = await fetch("/admin/intelligence/scan", { method: "POST" });
        const data = await res.json();

        if (res.ok) {
            alert("Scan initiated! Monitor results in a few seconds.");
            pollIntelligenceReport();
        } else {
            alert("Error: " + data.detail);
            btn.disabled = false;
            btn.innerHTML = "🕵️‍♂️ START DEEP SCAN";
        }
    } catch (e) {
        console.error(e);
        alert("Connection failed.");
        btn.disabled = false;
        btn.innerHTML = "🕵️‍♂️ START DEEP SCAN";
    }
}

async function loadIntelligenceReport() {
    try {
        const res = await fetch("/admin/intelligence/report");
        if (!res.ok) return;

        const data = await res.json();
        const report = data.report;

        if (data.status === "RUNNING") {
            document.getElementById("intel-score").innerHTML = "<span class='blink'>SCANNING</span>";
            setTimeout(loadIntelligenceReport, 2000); // Auto poll if running
            return;
        }

        if (!report || Object.keys(report).length === 0) return;

        // Populate Scorecard
        document.getElementById("intel-score").innerText = report.health_score + "/100";
        document.getElementById("intel-pages").innerText = report.crawler.pages_scanned;
        document.getElementById("intel-tone").innerText = report.semantic.tone_violations.length;
        document.getElementById("intel-broken").innerText = report.crawler.broken_links.length;

        // Populate Semantic List
        const semList = document.getElementById("semantic-list");
        semList.innerHTML = "";

        if (report.semantic.tone_violations.length === 0) {
            semList.innerHTML = "<div style='color:#00ff88; text-align:center; padding:20px;'>✨ Great! No tone violations found.</div>";
        } else {
            report.semantic.tone_violations.forEach(item => {
                const div = document.createElement("div");
                div.style.cssText = "padding:10px; border-bottom:1px solid #333; font-size:13px;";
                div.innerHTML = `
                    <div style="color:#ffcc00; font-weight:bold;">⚠️ "${item.violation}"</div>
                    <div style="color:#888;">${item.file}</div>
                    <div style="color:#666; font-size:11px;">${item.context}</div>
                `;
                semList.appendChild(div);
            });
        }

        // Populate Crawler List
        const crawlList = document.getElementById("crawler-list");
        crawlList.innerHTML = "";

        if (report.crawler.broken_links.length === 0) {
            crawlList.innerHTML = "<div style='color:#00ff88; text-align:center; padding:20px;'>✨ Clean! No broken links found.</div>";
        } else {
            report.crawler.broken_links.forEach(item => {
                const div = document.createElement("div");
                div.style.cssText = "padding:10px; border-bottom:1px solid #333; font-size:13px;";
                div.innerHTML = `
                    <div style="color:#ff4444; font-weight:bold;">🔗 ${item.status} Link</div>
                    <div style="color:#888; word-break:break-all;">${item.url}</div>
                `;
                crawlList.appendChild(div);
            });
        }

    } catch (e) {
        console.error("Failed to load intelligence report", e);
    }
}

function pollIntelligenceReport() {
    loadIntelligenceReport();
    // Simple polling for a while
    let checks = 0;
    const interval = setInterval(() => {
        loadIntelligenceReport();
        checks++;
        if (checks > 20) clearInterval(interval); // Stop after 20 checks (40s) or let loadIntelligenceReport handle running status
    }, 2000);
}

// Auto-load on view switch
document.addEventListener("DOMContentLoaded", () => {
    // Hook into switchTab to load report when tab is active
    // This assumes switchTab toggle classes. We can just auto load once on boot.
    loadIntelligenceReport();
});
