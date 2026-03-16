/**
 * SANTIS ADMIN: WORLD ENGINE (Phase 50)
 * Responsibility: Visualize Registry Data in God View
 * Connects to SantisBrain (WebSocket) and renders "Souls"
 */

const WorldEngine = (function () {

    // State
    const souls = new Map(); // UUID -> { domElement, lastSeen, x, y }
    const container = document.getElementById('orbs-container');
    const countEl = document.getElementById('active-count');
    // const stressEl = document.getElementById('stress-level');

    // Config
    const TIMEOUT_MS = 60000; // Remove inactive souls after 60s
    let _socket = null;

    function init() {
        console.log("🌍 [World Engine] Initializing God View...");

        // Listen to Brain
        if (window.SantisBrain) {
            window.SantisBrain.listen(handleSignal);

            // Check connection
            setInterval(() => {
                const statusEl = document.getElementById('connection-status');
                if (statusEl) {
                    if (window.SantisBrain.isConnected) {
                        statusEl.innerText = "● SYSTEM ONLINE";
                        statusEl.classList.remove('offline');
                    } else {
                        statusEl.innerText = "○ DISCONNECTED";
                        statusEl.classList.add('offline');
                    }
                }
            }, 1000);
        } else {
            console.error("❌ [World Engine] SantisBrain not found.");
        }

        // Start Cleanup Loop
        setInterval(cleanup, 5000);
    }

    function handleSignal(type, payload) {
        // console.log("Received:", type, payload);

        if (type === 'REGISTRY_UPDATE') {
            updateSoul(payload);
        }

        // Handle SOUL_UPDATE if added later
    }

    function updateSoul(data) {
        // data: { uuid, event, data: {...} }
        const uuid = data.uuid || 'anonymous';

        let soul = souls.get(uuid);
        const now = Date.now();

        if (!soul) {
            // New Soul
            const el = createOrb(uuid);
            container.appendChild(el);
            soul = {
                dom: el,
                lastSeen: now,
                x: 50,
                y: 50
            };
            souls.set(uuid, soul);
            updateCount();
        }

        // Update Time
        soul.lastSeen = now;

        // Update Position based on Event
        if (data.event === 'view_service') {
            // Move to outer rings
            // Random angle
            const angle = Math.random() * Math.PI * 2;
            const radius = 35; // % from center

            soul.x = 50 + (Math.cos(angle) * radius);
            soul.y = 50 + (Math.sin(angle) * radius);

            // Update Tooltip
            const title = data.data.title || 'Service';
            setTooltip(soul.dom, title);

            // Flash color?
            soul.dom.classList.add('active');
            setTimeout(() => soul.dom.classList.remove('active'), 500);
        }

        else if (data.event === 'page_view') {
            // Move to inner rings (Lobby)
            const angle = Math.random() * Math.PI * 2;
            const radius = 10;
            soul.x = 50 + (Math.cos(angle) * radius);
            soul.y = 50 + (Math.sin(angle) * radius);
            setTooltip(soul.dom, 'Browsing...');
        }

        // Apply Position
        soul.dom.style.left = `${soul.x}%`;
        soul.dom.style.top = `${soul.y}%`;
    }

    function createOrb(id) {
        const div = document.createElement('div');
        div.className = 'soul-orb';

        // Extended Tooltip with Actions
        div.innerHTML = `
            <div class="soul-tooltip">
                <div class="soul-id">${id.substring(0, 4)}...</div>
                <div class="soul-actions">
                    <button onclick="WorldEngine.scare('${id}')">👻</button>
                    <button onclick="WorldEngine.calm('${id}')">💧</button>
                    <button onclick="WorldEngine.focus('${id}')">👁️</button>
                </div>
            </div>
        `;
        return div;
    }

    function setTooltip(el, text) {
        const idVis = el.querySelector('.soul-id');
        if (idVis) idVis.innerText = text; // Just show current activity as ID for now
    }

    function cleanup() {
        const now = Date.now();
        let changed = false;
        for (const [uuid, soul] of souls) {
            if (now - soul.lastSeen > TIMEOUT_MS) {
                soul.dom.remove();
                souls.delete(uuid);
                changed = true;
            }
        }
        if (changed) updateCount();
    }

    function updateCount() {
        if (countEl) countEl.innerText = souls.size;
    }

    // --- INTERVENTION API ---
    function sendIntervention(uuid, mode) {
        console.log(`⚡ [World] Sending ${mode} to ${uuid}`);
        if (window.SantisBrain) {
            window.SantisBrain.broadcast('SOUL_INTERVENTION', {
                target: uuid,
                mode: mode
            });
            // Show feedback
            const soul = souls.get(uuid);
            if (soul) {
                soul.dom.style.transform = 'scale(1.5)';
                setTimeout(() => soul.dom.style.transform = 'scale(1)', 300);
            }
        }
    }

    // Auto Init
    init();

    // Expose for Click Handlers
    return {
        calm: (id) => sendIntervention(id, 'calm'),
        focus: (id) => sendIntervention(id, 'clarity'),
        scare: (id) => sendIntervention(id, 'energy')
    };

})();

// Expose Global
window.WorldEngine = WorldEngine;
