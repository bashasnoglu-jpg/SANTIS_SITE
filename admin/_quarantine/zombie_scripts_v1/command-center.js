/**
 * OMNI-CORE FAZ 11.6: Regional Performance Command Center
 * Vanilla JS Console (Strict CSP Ready)
 */

const CommandCenter = {
    state: {
        activeRegion: localStorage.getItem('icos_region') || 'tr',
        selectedHash: null
    },

    init() {
        console.log("⚡ [iCOS] Command Center Initializing...");

        // 1. Region Boot
        const regionSelect = document.getElementById("ctx-region");
        regionSelect.value = this.state.activeRegion;
        regionSelect.addEventListener("change", (e) => {
            localStorage.setItem('icos_region', e.target.value);
            // Region immutable context: Hard Reload
            window.location.reload();
        });

        // 2. Navigation Binding
        document.querySelectorAll(".nav-btn").forEach(btn => {
            btn.addEventListener("click", (e) => this.switchView(e.currentTarget.dataset.view));
        });

        // 3. Action Bindings
        document.getElementById("btn-publish").addEventListener("click", () => this.executePublish(false));
        document.getElementById("btn-force-publish").addEventListener("click", () => this.executePublish(true));
        document.getElementById("btn-dryrun").addEventListener("click", () => this.executeRollback(true));
        document.getElementById("btn-execute-rollback").addEventListener("click", () => this.executeRollback(false));

        // Listen to Input Changes to mock scoring (Real score is backend validated)
        document.getElementById("studio-json").addEventListener("input", this.mockScore);

        // Fetch Dashboard Status on boot
        this.fetchStatus();
    },

    switchView(viewId) {
        document.querySelectorAll(".nav-btn").forEach(btn => btn.classList.remove("active"));
        document.querySelector(`.nav-btn[data-view="${viewId}"]`).classList.add("active");

        document.querySelectorAll(".view-container").forEach(view => view.classList.add("hidden"));
        document.getElementById(`view-${viewId}`).classList.remove("hidden");
    },

    getHeaders() {
        // Generate X-Operation-ID for audit tracking
        const opId = 'op-' + Math.random().toString(36).substr(2, 9) + '-' + Date.now();
        return {
            "Content-Type": "application/json",
            "X-Operation-ID": opId
        };
    },

    async fetchStatus() {
        try {
            const res = await fetch("/api/admin/content/status", { headers: this.getHeaders() });
            if (!res.ok) throw new Error("Status API Failed");

            const data = await res.json();
            document.getElementById("st-db").innerText = data.active_db_engine;
            document.getElementById("st-db-latency").innerText = `${data.sla_db_latency_ms} ms (SLA) | Ext Errors: ${data.sla_last_24h_errors}`;

            document.getElementById("st-storage").innerText = data.storage_driver;
            document.getElementById("st-blob-count").innerText = `${data.blob_count} Total Blobs detected`;

            document.getElementById("st-pointers").innerText = data.active_hashes;
            document.getElementById("st-purge").innerText = data.last_purge_result;

        } catch (e) {
            console.error(e);
            document.getElementById("global-status-dot").classList.add("warn");
            document.getElementById("global-status-text").innerText = "Core API Unreachable";
        }
    },

    mockScore() {
        const text = document.getElementById("studio-json").value.toLowerCase();
        let score = 90;

        if (text.includes("ucuz") || text.includes("kampanya")) score -= 15;
        if (text.includes("premium") || text.includes("exclusive")) score += 2;

        const scoreDisplay = document.getElementById("studio-score");
        const msg = document.getElementById("studio-score-msg");
        const btnForce = document.getElementById("btn-force-publish");

        scoreDisplay.innerText = `${Math.min(100, Math.max(0, score))}/100`;

        if (score < 88) {
            msg.innerText = "WARNING: Brand Risk Detected. Publisher must override.";
            msg.style.color = "var(--accent-red)";
            btnForce.classList.remove("hidden");
        } else {
            msg.innerText = "System Valid. Sentinels green.";
            msg.style.color = "var(--accent-green)";
            btnForce.classList.add("hidden");
        }
    },

    async executePublish(isForce = false) {
        const slug = document.getElementById("studio-slug").value;
        const jsonStr = document.getElementById("studio-json").value;

        if (!slug || !jsonStr) {
            alert("Slug and JSON content are required."); return;
        }

        let contentObj;
        try {
            contentObj = JSON.parse(jsonStr);
        } catch (e) {
            alert("Syntax Error in JSON Payload."); return;
        }

        try {
            const res = await fetch("/api/admin/content/publish", {
                method: "POST",
                headers: this.getHeaders(),
                body: JSON.stringify({
                    slug: slug,
                    region_id: this.state.activeRegion,
                    content: contentObj
                })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.detail || "Publish Failed");

            alert(`Publish Success!\nHash: ${data.version_hash}\nWarnings: ${data.warnings.join(", ")}`);

        } catch (e) {
            alert(e.message);
        }
    },

    async fetchTimeline() {
        const slug = document.getElementById("timeline-slug").value;
        if (!slug) return;

        try {
            const res = await fetch(`/api/admin/content/${this.state.activeRegion}/${slug}/timeline`, { headers: this.getHeaders() });
            if (!res.ok) throw new Error("Timeline fetch failed");

            const data = await res.json();
            const tbody = document.getElementById("timeline-tbody");
            tbody.innerHTML = "";

            if (data.history.length === 0) {
                tbody.innerHTML = "<tr><td colspan='6'>No records found for this slug.</td></tr>";
                return;
            }

            data.history.forEach(log => {
                const tr = document.createElement("tr");
                tr.innerHTML = `
                    <td style="color:var(--text-dim); font-size:11px;">${log.timestamp.replace("T", " ")}</td>
                    <td><span class="hash-badge" style="cursor:pointer;" onclick="CommandCenter.selectHash('${log.version_hash}')">${log.version_hash}</span></td>
                    <td>${log.actor}</td>
                    <td><span style="color:${log.action.includes('rollback') ? 'var(--accent-yellow)' : 'var(--text-main)'}">${log.action}</span></td>
                    <td style="font-family:monospace; font-size:11px;">${log.ip_address}</td>
                    <td>Target DB -> Edge</td>
                `;
                tbody.appendChild(tr);
            });

        } catch (e) {
            alert("Error: " + e.message);
        }
    },

    selectHash(hash) {
        this.state.selectedHash = hash;
        document.getElementById("rollback-hash").value = hash;
    },

    async executeRollback(isDryRun) {
        const slug = document.getElementById("timeline-slug").value;
        const hash = document.getElementById("rollback-hash").value;
        const out = document.getElementById("rollback-output");

        if (!slug || !hash) {
            out.innerText = "ERR: Please select a valid slug and hash from the timeline.";
            out.style.color = "var(--accent-red)";
            return;
        }

        out.innerText = "Executing Request...";
        out.style.color = "var(--text-dim)";

        try {
            const res = await fetch(`/api/admin/content/${this.state.activeRegion}/${slug}/rollback`, {
                method: "POST",
                headers: this.getHeaders(),
                body: JSON.stringify({
                    target_version_hash: hash,
                    dry_run: isDryRun
                })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.detail || "Rollback Request Failed");

            out.style.color = isDryRun ? "var(--accent-blue)" : "var(--accent-green)";
            out.innerText = JSON.stringify(data, null, 2);

        } catch (e) {
            out.style.color = "var(--accent-red)";
            out.innerText = "FATAL: " + e.message;
        }
    }
};

window.CommandCenter = CommandCenter;
document.addEventListener("DOMContentLoaded", () => CommandCenter.init());
