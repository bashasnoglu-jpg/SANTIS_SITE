/**
 * SANTIS MASTER OS - ADMIN MOCK ENGINE
 * Simulates realtime WebSocket data for the V7 SaaS Architecture Demo.
 */

const MockEngine = {
    hotels: [
        "Lara Family Resort", "Akra Hotel", "Delphin Imperial", "Rixos Premium",
        "Titanic Mardan", "Regnum Carya", "Budva Luxury Spa", "Montenegro Bay"
    ],
    services: [
        "Deep Tissue Massage", "Couple Romance Ritual", "Turkish Hammam",
        "Mom & Kids Relax", "Glow Facial", "Jet Lag Recovery"
    ],

    tbody: document.getElementById('live-bookings-tbody'),

    init() {
        this.populateInitialMatrix();
        this.simulateRealTime();
    },

    getRandomTime() {
        const now = new Date();
        now.setMinutes(now.getMinutes() - Math.floor(Math.random() * 60));
        return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    },

    createRow(isNew = false) {
        const hotel = this.hotels[Math.floor(Math.random() * this.hotels.length)];
        const service = this.services[Math.floor(Math.random() * this.services.length)];
        const room = Math.floor(Math.random() * 800) + 100;
        const value = Math.floor(Math.random() * 150) + 70;
        const isPending = Math.random() > 0.7;
        const statusClass = isPending ? 'status-pending' : 'status-confirmed';
        const statusText = isPending ? 'Pending' : 'Confirmed';
        const time = isNew ? new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : this.getRandomTime();

        const tr = document.createElement('tr');
        tr.className = `border-b border-gray-800 hover:bg-gray-800/50 transition ${isNew ? 'fade-in bg-gray-800' : ''}`;

        tr.innerHTML = `
            <td class="px-4 py-3">${time}</td>
            <td class="px-4 py-3 text-white">${hotel}</td>
            <td class="px-4 py-3 text-gray-400">Room ${room}</td>
            <td class="px-4 py-3 text-amber-500">${service}</td>
            <td class="px-4 py-3"><span class="status-badge ${statusClass}">${statusText}</span></td>
            <td class="px-4 py-3 text-white font-medium">€${value}</td>
        `;

        return tr;
    },

    populateInitialMatrix() {
        for (let i = 0; i < 6; i++) {
            this.tbody.appendChild(this.createRow(false));
        }
    },

    simulateRealTime() {
        // Drop in a new booking every 8-15 seconds to simulate incoming traffic
        setInterval(() => {
            const row = this.createRow(true);
            this.tbody.insertBefore(row, this.tbody.firstChild);

            // Re-calc stat updates
            const statEl = document.getElementById('stat-bookings');
            if (statEl) {
                const curBookingsRaw = statEl.innerText.split(' ')[0];
                const curBookings = parseInt(curBookingsRaw);
                if (!isNaN(curBookings)) {
                    statEl.innerHTML = `${curBookings + 1} <span class="text-sm font-normal text-green-500/50">↑ Just now</span>`;
                }
            }

            // Keep table at max 8 rows
            if (this.tbody.children.length > 8) {
                this.tbody.removeChild(this.tbody.lastChild);
            }
        }, Math.floor(Math.random() * 8000) + 8000);
    }
};

document.addEventListener('DOMContentLoaded', () => {
    MockEngine.init();

    // --- Phase F: SANTIS NEURAL BRIDGE RENDERER ---
    // Replaces the HTTP Polling with a direct WebSocket Push subscriber
    window.renderSantisIntel = (pulseData) => {
        try {
            // 1. Prediction Radar (AI Concierge Pulse)
            const predictEl = document.getElementById('intel-predict-content');
            const guests = ["#204", "Mr. Wick", "A-501", "#108"];
            const svcs = ["Bali Massage", "Sothys Facial", "Deep Tissue", "Hammam"];
            const conf = Math.floor(Math.random() * 20) + 75; // 75-95%

            predictEl.innerHTML = `
                <div class="flex items-center gap-2 text-blue-300">
                    <div class="h-2 w-2 bg-blue-500 rounded-full animate-pulse"></div>
                    <span class="font-medium">Guest ${guests[Math.floor(Math.random() * guests.length)]}</span>
                </div>
                <div class="text-xs text-gray-400 mt-1">
                    Next best: <span class="text-white">${svcs[Math.floor(Math.random() * svcs.length)]}</span> 
                    <span class="text-blue-500 ml-1">(${conf}% conf)</span>
                </div>
            `;

            // 2. Surge Monitor (Live Yield Autopilot from Phase F WebSocket)
            const surgeEl = document.getElementById('intel-surge-content');

            // Safely extract the live backend surge object if available
            const surgeData = pulseData && pulseData.surge ? pulseData.surge : {
                current_status: "NORMAL",
                global_multiplier: 1.0,
                metrics: { demand_factor: 0, time_left_percentage: 1.0 }
            };

            const sType = surgeData.current_status;
            const mult = parseFloat(surgeData.global_multiplier).toFixed(2);
            let colorCls = "emerald";
            if (sType === "CRITICAL_CAPACITY") colorCls = "red";
            else if (sType === "SURGE_ACTIVE") colorCls = "amber";

            surgeEl.innerHTML = `
                <div class="flex items-center gap-2 text-${colorCls}-300">
                    <div class="h-2 w-2 bg-${colorCls}-500 rounded-full animate-pulse"></div>
                    <span class="font-medium">${sType}</span>
                </div>
                <div class="text-xs text-gray-400 mt-1">
                    Global Multiplier: <span class="text-white">${mult}x</span> 
                    <span class="text-emerald-500 ml-1">(Cap: ${(surgeData.metrics.demand_factor * 100).toFixed(0)}%)</span>
                </div>
            `;

            // 3. Graph Pulse (Semantic Edges)
            const graphEl = document.getElementById('intel-graph-content');
            const pairs = [
                ["Royal Hamam", "Thai Massage"],
                ["Deep Tissue", "Sports Recovery"],
                ["Signature", "Sothys Glow"]
            ];
            const p = pairs[Math.floor(Math.random() * pairs.length)];
            const weight = Math.floor(Math.random() * 50) + 120;

            graphEl.innerHTML = `
                <div class="flex items-center gap-2 text-purple-300">
                    <div class="h-2 w-2 bg-purple-500 rounded-full animate-pulse"></div>
                    <span class="font-medium">Edge Correlation</span>
                </div>
                <div class="text-xs text-gray-400 mt-1">
                    <span class="text-white">${p[0]}</span> ↔ <span class="text-white">${p[1]}</span>
                    <span class="text-purple-500 ml-1">(w:${weight})</span>
                </div>
            `;

        } catch (e) { console.error("Neural Bridge Intel Render Error:", e); }
    };
});
