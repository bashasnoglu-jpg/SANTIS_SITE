
// 🌍 WORLD TABLE LOGIC (Extracted for Strict CSP)

// Initialize Globe
const globe = Globe()
    .globeImageUrl('//unpkg.com/three-globe/example/img/earth-dark.jpg')
    .bumpImageUrl('//unpkg.com/three-globe/example/img/earth-topology.png')
    .backgroundImageUrl('//unpkg.com/three-globe/example/img/night-sky.png')
    .pointOfView({ lat: 39.0, lng: 35.0, altitude: 2.0 }) // Default over Turkey
    .atmosphereColor('#00E0FF') // Cyan/Sci-Fi Atmosphere
    .atmosphereAltitude(0.2)
    (document.getElementById('globeViz'));

// 🌙 3️⃣ DAY/NIGHT CYCLE (SCENE LIGHTING)
const sunLight = new THREE.DirectionalLight(0xffffff, 1.2);
globe.scene().add(sunLight);

const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
globe.scene().add(ambientLight);

// Sun Rotation
function updateSunPosition() {
    const time = Date.now() * 0.00005;
    sunLight.position.x = Math.sin(time) * 200;
    sunLight.position.y = 100;
    sunLight.position.z = Math.cos(time) * 200;
}
setInterval(updateSunPosition, 50);

// Hover Effect
globe.onPointHover(point => {
    document.body.style.cursor = point ? 'pointer' : 'default';
});

// Config
globe.pointColor("color"); // Use dynamic color property
globe.pointAltitude(0.01);
globe.pointRadius("size"); // Use dynamic size property
globe.pointsMerge(false); // Disable merge to allow individual animation
globe.pointLabel(d => d.label); // Fixed Label

// Labels
globe.labelLat(d => d.lat)
    .labelLng(d => d.lng)
    .labelText(d => String(d.city || "Unknown"))
    .labelSize(d => 1.5)
    .labelDotRadius(d => 0.5)
    .labelColor(() => 'rgba(255, 255, 255, 0.75)')
    .labelResolution(2);

// Ripple/Ring Effect for Real-Time Activity
globe.ringsData([]);
globe.ringColor(() => colorInterpolator)
    .ringMaxRadius(5)
    .ringPropagationSpeed(2)
    .ringRepeatPeriod(1000);

const colorInterpolator = (t) => `rgba(212, 175, 55, ${1 - t})`;

const CITIZEN_DATA = [];

async function fetchCitzens() {
    const statusEl = document.getElementById("statusText");
    try {
        // statusEl.innerText = "SYNCHRONIZING...";
        const res = await fetch("/admin/world-table/data");
        const data = await res.json();

        // Update HUD
        document.getElementById("activeCount").innerText = data.length;
        const zones = new Set(data.map(c => c.location?.country || 'Unknown'));
        document.getElementById("zoneCount").innerText = zones.size;

        const vips = data.filter(c => (c.visits || 0) > 2).length;
        const ratio = data.length > 0 ? Math.round((vips / data.length) * 100) : 0;
        document.getElementById("vipRatio").innerText = ratio + "%";

        statusEl.innerText = "LIVE (UPDATED: " + new Date().toLocaleTimeString() + ")";

        // 🌍 1️⃣ COUNTRY COLOR SYSTEM
        function getCountryColor(country) {
            if (!country) return "#FF66CC"; // Deep Pink Default
            const map = {
                "Turkey": "#00E0FF",       // Cyan (Base)
                "Germany": "#FFD700",      // Gold (High Value)
                "Russia": "#FF4C4C",       // Red (Traffic)
                "France": "#7B5CFF",       // Purple (Premium)
                "United States": "#00FF9C" // Green (Tech)
            };
            return map[country] || "#FF66CC";
        }

        // 🔥 2️⃣ ACTIVE PULSE LOGIC
        const NOW = Date.now();

        // Format Data for Globe
        const points = data.map(c => {
            // Fallback Location logic
            let lat = c.location?.lat;
            let lon = c.location?.lon;

            if (!lat || !lon) {
                lat = 41.0082 + (Math.random() - 0.5) * 20;
                lon = 28.9784 + (Math.random() - 0.5) * 40;
            }

            // Simulation: Assign random last_seen if missing
            const lastSeen = c.last_seen ? new Date(c.last_seen).getTime() : (NOW - Math.random() * 5 * 60 * 1000);
            const isActive = (NOW - lastSeen) < (2 * 60 * 1000);

            return {
                lat: lat,
                lng: lon,
                city: c.location?.city || "Unknown",
                country: c.location?.country || "Unknown",
                label: `<b>${c.location?.city || "Unknown"}, ${c.location?.country || "Unknown"}</b><br/>Visits: ${c.visits || 1}<br/>Status: ${isActive ? "ONLINE" : "OFFLINE"}`,
                id: c.id,
                visits: c.visits || 1,
                color: getCountryColor(c.location?.country),
                size: isActive ? 0.6 : 0.35, // Base size
                lastSeen: lastSeen,
                isActive: isActive
            };
        });

        // Update Globe
        globe.pointsData(points);
        globe.ringsData(points); // Add ripples to points

        // Add Arcs (Connections from users to "Santis HQ" in Istanbul)
        const ISTANBUL = { lat: 41.0082, lng: 28.9784 };
        const arcs = points.map(p => ({
            startLat: p.lat,
            startLng: p.lng,
            endLat: ISTANBUL.lat,
            endLng: ISTANBUL.lng,
            color: ['#d4af37', '#ffffff'] // Gold to White
        }));
        globe.arcsData(arcs);
        globe.arcColor(d => d.color)
            .arcDashLength(0.4)
            .arcDashGap(2)
            .arcDashInitialGap(() => Math.random())
            .arcDashAnimateTime(4000);

    } catch (e) {
        console.error(e);
        const statusEl = document.getElementById("statusText");
        if (statusEl) {
            statusEl.innerText = "CONNECTION LOST";
            statusEl.style.color = "red";
        }
    }
}

// Auto Refresh
fetchCitzens();
setInterval(fetchCitzens, 4000);

// Pulse Animation Loop
setInterval(() => {
    const points = globe.pointsData();
    if (!points || points.length === 0) return;

    const NOW = Date.now();
    points.forEach(p => {
        if (p.isActive) {
            // Sine wave breath
            p.size = 0.6 + Math.sin(NOW * 0.005) * 0.25;
        } else {
            p.size = 0.35;
        }
    });
    // This needs to update the underlying object reference or force update
    globe.pointRadius("size"); // Update Buffer
    // Also re-trigger pointsData to force update if pointRadius doesn't auto-trigger? 
    // Usually pointRadius accessors are dynamic if fn, but here we passed string "size".
    // Globe.GL usually handles this if we call pointRadius again or update data.
    // Calling pointRadius("size") forces re-evaluation.
}, 60);
