/**
 * Santis Master OS - Dark Pulse Dashboard Engine
 * Version 1.0
 */

document.addEventListener('DOMContentLoaded', () => {

    // 1. Sovereign Clock Engine
    setInterval(() => {
        const now = new Date();
        document.getElementById('clock').textContent = now.toISOString().replace('T', ' ').substring(0, 19) + ' UTC';
    }, 1000);

    // 1.5 Sovereign Health Pulse (Uptime & RPS)
    setInterval(() => {
        // RPS Simülasyonu (Normal: 1-15, Pik: 40-60)
        let rps = (Math.random() * 5 + 2).toFixed(1);
        document.getElementById('pulse-rps').textContent = rps;

        let latency = Math.floor(Math.random() * 10 + 15);
        document.getElementById('pulse-latency').textContent = latency + 'ms';
    }, 2000);

    // 1.6 THE REVENUE MOMENTUM (ApexCharts)
    let revenueData = Array.from({ length: 20 }, () => Math.floor(Math.random() * 1500) + 500);
    var options = {
        series: [{
            name: 'Booking Volume (€)',
            data: revenueData
        }],
        chart: {
            type: 'area',
            height: '100%',
            fontFamily: 'Space Grotesk, sans-serif',
            toolbar: { show: false },
            sparkline: { enabled: true }
        },
        colors: ['#c9a96e'],
        fill: {
            type: 'gradient',
            gradient: {
                shadeIntensity: 1,
                opacityFrom: 0.45,
                opacityTo: 0.05,
                stops: [20, 100]
            }
        },
        stroke: {
            curve: 'smooth',
            width: 2
        },
        tooltip: {
            theme: 'dark',
            fixed: { enabled: false }
        }
    };
    var revenueChart = new ApexCharts(document.querySelector("#revenue-chart"), options);
    revenueChart.render();

    // Canlı grafik güncellemesi
    function pushRevenuePoint(val) {
        revenueData.push(val);
        revenueData.shift();
        revenueChart.updateSeries([{ data: revenueData }]);
    }

    // 1.7 404 Guardian (Ghost Hits) Simulator
    let guardianHits = 43; // Base number
    document.getElementById('stat-404-guardian').textContent = guardianHits;

    function trigger404Save() {
        guardianHits += Math.floor(Math.random() * 3) + 1;
        document.getElementById('stat-404-guardian').textContent = guardianHits;
        pushPulseSignal("GUARDIAN", "Ghost path intercepted and redirected to /tr/ root.", "text-cyan-400 font-bold", "border-cyan-500 bg-cyan-900/10 p-2");
    }
    setInterval(() => {
        // Her 8-15 saniyede bir eski kırık link yakalama simülasyonu
        if (Math.random() > 0.6) trigger404Save();
    }, 12000);

    // 2. Metrics Polling (Backup if WS loses some events, but primarily we rely on WS)
    async function fetchMetrics() {
        try {
            const res = await fetch('/api/v1/analytics/metrics');
            const data = await res.json();

            document.getElementById('stat-offers-made').textContent = data.conversions.total_offers || data.conversions.accepted_offers;
            document.getElementById('stat-offers-claimed').textContent = data.conversions.accepted_offers;

            const revenue = Number(data.conversions.revenue_gained).toLocaleString('en-US', { minimumFractionDigits: 2 });
            document.getElementById('stat-revenue').textContent = `€${revenue}`;
        } catch (e) {
            console.error('Failed to fetch analytics metrics', e);
        }
    }

    // Fetch initial metrics
    fetchMetrics();
    setInterval(fetchMetrics, 10000);

    // 3. Radar Visualizer
    const radarScreen = document.getElementById('radar-screen');
    const bounds = { w: 0, h: 0 };

    function updateBounds() {
        bounds.w = radarScreen.clientWidth;
        bounds.h = radarScreen.clientHeight;
    }
    updateBounds();
    window.addEventListener('resize', updateBounds);

    function triggerRadarPing(x_ratio, y_ratio, category) {
        // We assume x and y come in as relative window percentages or we randomize if not available
        // For visual flair, we will just plot them based on random coordinates if x,y are missing
        const plotX = (x_ratio || Math.random()) * bounds.w;
        const plotY = (y_ratio || Math.random()) * bounds.h;

        const dot = document.createElement('div');
        dot.className = 'absolute rounded-full bg-santis-gold z-10 shadow-[0_0_10px_rgba(201,169,110,0.8)] transition-all duration-1000';
        dot.style.width = '6px';
        dot.style.height = '6px';
        dot.style.left = `${plotX}px`;
        dot.style.top = `${plotY}px`;
        dot.style.opacity = '1';
        dot.style.transform = 'scale(1)';

        // Ripple effect
        const ripple = document.createElement('div');
        ripple.className = 'absolute rounded-full border border-santis-gold z-0 animate-ping';
        ripple.style.width = '24px';
        ripple.style.height = '24px';
        ripple.style.left = `${plotX - 9}px`;
        ripple.style.top = `${plotY - 9}px`;

        radarScreen.appendChild(dot);
        radarScreen.appendChild(ripple);

        // Let it decay after 5 seconds
        setTimeout(() => {
            dot.style.opacity = '0';
            dot.style.transform = 'scale(0.5)';
            ripple.remove();
            setTimeout(() => dot.remove(), 1000);
        }, 5000);
    }

    // 4. WebSocket Engine (Neural Bridge)
    function initNeuralBridge() {
        const wsUrl = `ws://${window.location.host}/ws?client_type=hq&client_id=global`;
        const ws = new WebSocket(wsUrl);

        ws.onopen = () => {
            pushPulseSignal("SYSTEM", "Neural Bridge connection established. Listening to Phase S limits...", "text-green-400");
        };

        ws.onmessage = (event) => {
            try {
                const payload = JSON.parse(event.data);

                // Parse the signals flowing from server.py (Neural Thoughts, Surges, Heatmaps)
                if (payload.type === 'NEURAL_THOUGHT') {
                    handleNeuralThought(payload);
                } else if (payload.type === 'SURGE_UPDATED') {
                    handleSurgeUpdate(payload);
                } else if (payload.type === 'HEATMAP_PING') {
                    triggerRadarPing(payload.x_ratio, payload.y_ratio, payload.category);
                } else if (payload.type === 'CONVERSION_PING') {
                    fetchMetrics(); // Force refresh on a conversion
                    pushPulseSignal("SALE", `Offer Accepted: ${payload.category} | Impact: +€${payload.revenue}`, "text-santis-gold border-santis-gold/50");
                    pushRevenuePoint(payload.revenue + 1500); // Grafik Sıçraması
                } else if (payload.type === 'AI_INTELLIGENCE_PING') {
                    handleIntelligencePing(payload);
                }
            } catch (e) {
                // Ignore raw or malformed pings
            }
        };

        ws.onclose = () => {
            pushPulseSignal("SYSTEM", "Connection lost. Re-establishing link...", "text-red-500");
            setTimeout(initNeuralBridge, 3000);
        };
    }

    // UI Helpers
    const feed = document.getElementById('pulse-feed');

    function pushPulseSignal(tag, message, colorClass = "text-gray-300", boxClass = "") {
        const ts = new Date().toLocaleTimeString('en-US', { hour12: false });
        const row = document.createElement('div');
        const defaultBox = "pl-2 border-l border-gray-700";
        row.className = `pulse-entry ${defaultBox} ${boxClass}`;

        row.innerHTML = `
            <span class="text-gray-600 block mb-0.5 text-[9px]">[${ts}] ${tag}</span>
            <span class="${colorClass}">${message}</span>
        `;

        // Remove empty placeholder
        const ph = feed.querySelector('.animate-pulse');
        if (ph) ph.remove();

        feed.appendChild(row);

        // Auto scroll to bottom
        feed.scrollTop = feed.scrollHeight;

        // Cap at 100 elements
        if (feed.children.length > 100) {
            feed.removeChild(feed.firstChild);
        }
    }

    // Handlers
    function handleNeuralThought(payload) {
        let col = "text-gray-300", box = "";
        if (payload.level === 'surge') { col = "text-amber-400"; box = "border-amber-500/50 bg-amber-900/10 p-2"; }
        if (payload.level === 'relax') col = "text-blue-400";
        if (payload.level === 'alert') { col = "text-red-400 font-semibold"; box = "border-red-500 bg-red-900/10 p-2"; }
        if (payload.level === 'conversion') { col = "text-santis-gold"; box = "border-santis-gold/50 bg-santis-gold/10 p-2"; }

        // Quick extraction to detect flash sale generation
        if (payload.message.includes('Flash Sale')) {
            addActiveFlashSale(payload.message);
            // Simulate radar ping
            triggerRadarPing(null, null, 'intent');
        }

        pushPulseSignal("INTELLIGENCE", payload.message, col, box);
    }

    function handleSurgeUpdate(payload) {
        const multEl = document.getElementById('surge-multiplier');
        const badge = document.getElementById('surge-badge');
        const panel = document.getElementById('surge-panel');

        multEl.innerHTML = `${Number(payload.multiplier).toFixed(2)}<span class="text-2xl text-gray-600">x</span>`;

        panel.classList.remove('surge-glow', 'border-blue-900/50');

        if (payload.multiplier > 1.2) {
            badge.textContent = "SURGE ACTIVE";
            badge.className = "px-2 py-0.5 text-[9px] font-mono uppercase tracking-widest bg-red-900/30 text-red-500 border border-red-500/30 rounded";
            multEl.className = "text-6xl heading-font font-bold text-red-500 tracking-tighter";
            panel.classList.add('surge-glow');
        } else if (payload.multiplier < 1.0) {
            badge.textContent = "RELAX";
            badge.className = "px-2 py-0.5 text-[9px] font-mono uppercase tracking-widest bg-blue-900/30 text-blue-400 border border-blue-500/30 rounded";
            multEl.className = "text-6xl heading-font font-bold text-blue-400 tracking-tighter";
            panel.classList.add('border-blue-900/50');
        } else {
            badge.textContent = "STABLE";
            badge.className = "px-2 py-0.5 text-[9px] font-mono uppercase tracking-widest bg-gray-800 text-gray-400 rounded";
            multEl.className = "text-6xl heading-font font-bold text-gray-300 tracking-tighter";
        }
    }

    // 5. Sovereign Intelligence Handlers
    let moodStats = { relaxed: 0, exploring: 0, hesitant: 0, intent: 0, total: 0 };
    let intentTags = {};
    let recognizedGuests = 0;

    function handleIntelligencePing(payload) {
        // Mood assignment
        let s = (payload.sentiment || "").toLowerCase();

        if (s.includes("relax")) moodStats.relaxed++;
        else if (s.includes("hesitan") || s.includes("stress")) moodStats.hesitant++;
        else if (s.includes("intent") || payload.intent_score >= 80) moodStats.intent++;
        else moodStats.exploring++;

        moodStats.total++;

        document.getElementById('mood-relaxed').textContent = moodStats.relaxed;
        document.getElementById('mood-exploring').textContent = moodStats.exploring;
        document.getElementById('mood-hesitant').textContent = moodStats.hesitant;
        document.getElementById('mood-intent').textContent = moodStats.intent;

        document.getElementById('bar-relaxed').style.width = (moodStats.relaxed / moodStats.total * 100) + '%';
        document.getElementById('bar-exploring').style.width = (moodStats.exploring / moodStats.total * 100) + '%';
        document.getElementById('bar-hesitant').style.width = (moodStats.hesitant / moodStats.total * 100) + '%';
        document.getElementById('bar-intent').style.width = (moodStats.intent / moodStats.total * 100) + '%';

        // Intent Cloud processing
        let t = payload.topic;
        if (t && t !== "Unknown" && t !== "General") {
            intentTags[t] = (intentTags[t] || 0) + 1;
            renderIntentCloud();
        }

        // Recognized Guests Tracker (Loyalty)
        if (s.includes("return") || (payload.guest_name && payload.guest_name !== "Captain" && Math.random() > 0.5)) {
            // Simplified logic: If the system explicitly marks returning or we randomly simulate it for named Kaptans
            recognizedGuests++;
            document.getElementById('stat-recognized').textContent = recognizedGuests;
        }

        // Push signal to feed for tracking
        pushPulseSignal("AI-INTELL", `Analysis: [Mood: ${payload.sentiment}] [Focus: ${payload.topic}]`, "text-purple-400", "border-purple-500 bg-purple-900/10 p-2");
    }

    function renderIntentCloud() {
        const cloud = document.getElementById('intent-cloud');
        cloud.innerHTML = '';

        let sortedKeys = Object.keys(intentTags).sort((a, b) => intentTags[b] - intentTags[a]);
        if (sortedKeys.length === 0) return;

        let maxVal = intentTags[sortedKeys[0]];

        sortedKeys.slice(0, 8).forEach(tag => {
            let scaleFactor = Math.max(0.6, intentTags[tag] / maxVal);
            let el = document.createElement('span');
            el.className = "px-2 py-1 rounded bg-gray-900/80 border border-gray-800 text-santis-gold font-mono whitespace-nowrap shadow-[0_0_5px_rgba(201,169,110,0.1)] transition-all";
            el.style.fontSize = (9 + scaleFactor * 5) + 'px';
            el.textContent = tag + ' (' + intentTags[tag] + ')';
            cloud.appendChild(el);
        });
    }


    // 6. V22 THE ORACLE PULSE (Execute Power Move)
    window.executePowerMove = async function (action, target, multiplier) {
        const btn = event.currentTarget || event.target;
        const originalText = btn.innerHTML;

        try {
            btn.innerHTML = '<span class="animate-pulse">EXEC...</span>';

            const response = await fetch('/api/v1/admin/execute-power-move', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: action,
                    target_category: target,
                    multiplier: multiplier
                })
            });
            const data = await response.json();

            if (data.status === 'success') {
                // Tactical Confirmation
                btn.innerHTML = '✓ EXECUTED';
                btn.classList.add('bg-santis-gold', 'text-black', 'border-santis-gold');
                btn.classList.remove('text-santis-gold');

                pushPulseSignal("ORACLE", `Action Executed: ${action} | Multiplier: ${multiplier}x`, "text-santis-gold shadow-[0_0_10px_#c9a96e]", "border-santis-gold/50 bg-santis-gold/10 p-2");

                setTimeout(() => {
                    btn.innerHTML = originalText;
                    btn.classList.remove('bg-santis-gold', 'text-black', 'border-santis-gold');
                    btn.classList.add('text-santis-gold');
                }, 4000);

                // Note: The UI for SURGE_UPDATED will be automatically updated by WebSocket `handleSurgeUpdate`
            } else {
                console.error("Execute failed:", data.error);
                btn.innerHTML = 'FAILED';
                setTimeout(() => btn.innerHTML = originalText, 2000);
            }
        } catch (e) {
            console.error("Network error during Execute Power Move", e);
            btn.innerHTML = 'ERROR';
            setTimeout(() => btn.innerHTML = originalText, 2000);
        }
    };

    function addActiveFlashSale(msg) {
        const list = document.getElementById('flash-offers-list');
        const emptyState = list.querySelector('.text-center');
        if (emptyState) emptyState.remove();

        const card = document.createElement('div');
        card.className = "p-3 border border-red-900/30 bg-black/40 rounded-lg flex justify-between items-center";

        // Extract a fake target / offer name for flair
        const match = msg.match(/Constructing '([^']+)'/);
        const pkg = match ? match[1] : "Dynamic Wellness Package";

        card.innerHTML = `
            <div>
                <p class="text-[10px] text-red-500 font-mono tracking-widest mb-1">LIVE OFFER</p>
                <p class="text-sm font-medium text-white">${pkg}</p>
                <p class="text-[10px] text-gray-500 font-mono mt-1">Exp: 180s left</p>
            </div>
            <button class="px-3 py-1 bg-red-950/50 hover:bg-red-900 border border-red-800/50 rounded text-xs text-red-400 transition" onclick="this.parentNode.remove()">KILL</button>
        `;

        list.prepend(card);

        // Automatically clear out the flash sale after 30 seconds for the demo
        setTimeout(() => {
            if (card.parentNode) {
                card.style.opacity = '0.5';
                card.innerHTML = `<p class="text-xs text-gray-600 font-mono w-full text-center py-2">Offer Expired</p>`;
                setTimeout(() => card.remove(), 2000);
            }
        }, 30000);
    }

    // Boot sequence
    setTimeout(initNeuralBridge, 500);
});
