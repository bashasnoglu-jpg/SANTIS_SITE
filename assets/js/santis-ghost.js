/**
 * SANTIS - GHOST TRACE ENGINE (Phase 5 Sovereign CRM)
 * Asynchronous, Non-Blocking Intent Collector.
 * Uses navigator.sendBeacon for guaranteed delivery without UI lag.
 */

(async function () {
    // Basic Configuration
    const TRACE_API_URL = '/api/v1/crm/trace';

    // Lazy Load Sovereign Identity Engine
    if (!window.SantisIdentity) {
        await new Promise((resolve) => {
            const script = document.createElement('script');
            script.src = '/assets/js/core/santis-identity.js';
            script.onload = resolve;
            script.onerror = resolve; // Fail gracefully
            document.head.appendChild(script);
        });
    }

    // Unique Session Key (Omni-Device Sovereign Fingerprint)
    let sessionId = 'ghost_loading';
    if (window.SantisIdentity) {
        sessionId = await window.SantisIdentity.getSovereignId();
    } else {
        sessionId = sessionStorage.getItem('santis_ghost_session') || ('ghost_' + Math.random().toString(36).substr(2, 9));
    }

    // Global Object for external triggers if needed
    window.SantisGhost = {
        getSessionId: () => sessionId,

        /**
         * The core dispatch function.
         */
        track: function (actionType, targetElement, intentDelta = 0.0, extraPayload = {}) {
            // --- GHOST SCORE ACCUMULATOR ---
            // Revenue Brain'in okuyacağı 'santis_ghost_score' key'ini sessionStorage'da güncelle
            const currentScore = parseInt(sessionStorage.getItem('santis_ghost_score') || '0', 10);
            const newScore = Math.max(0, Math.min(100, currentScore + intentDelta));
            sessionStorage.setItem('santis_ghost_score', Math.round(newScore).toString());
            // --------------------------------

            // Build CRM DataFrame
            const payload = {
                session_id: sessionId,
                tenant_id: localStorage.getItem("tenant_id") || "1", // Fallback HQ
                action_type: actionType,
                target_element: targetElement,
                intent_score_delta: intentDelta,
                payload: {
                    ...extraPayload,
                    url: window.location.pathname,
                    viewport_w: window.innerWidth,
                }
            };

            // Dispatch via Beacon if available (doesn't block navigation)
            if (window.SANTIS_API_ONLINE === false) return; // KILL SWITCH

            if (navigator.sendBeacon) {
                // sendBeacon requires Blob/FormData/String. JSON requires Blob structure.
                const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
                navigator.sendBeacon(TRACE_API_URL, blob);
            } else {
                // Fallback for extreme cases
                fetch(TRACE_API_URL, {
                    method: 'POST',
                    body: JSON.stringify(payload),
                    headers: { 'Content-Type': 'application/json' },
                    keepalive: true
                }).catch(e => { /* silent fail */ });
            }
        }
    };

    // --- AUTOMATIC COLLECTORS ---

    // 1. Dwell & Hover Tracking (High intent if > 1.5s)
    let hoverTimers = {};

    document.addEventListener('mouseover', function (e) {
        const el = e.target.closest('[data-ghost-trace]');
        if (!el) return;

        const targetId = el.getAttribute('data-ghost-trace');
        if (!hoverTimers[targetId]) {
            hoverTimers[targetId] = Date.now();
        }
    });

    document.addEventListener('mouseout', function (e) {
        const el = e.target.closest('[data-ghost-trace]');
        if (!el) return;

        const targetId = el.getAttribute('data-ghost-trace');
        const start = hoverTimers[targetId];

        if (start) {
            const dwellMs = Date.now() - start;
            delete hoverTimers[targetId];

            // Hover (>1.5sn): +5 (İlgi var)
            if (dwellMs > 1500) {
                let delta = 5.0;
                // Ekstra süreler için kademeli artış
                if (dwellMs > 5000) delta += 5.0;
                if (dwellMs > 8000) delta += 10.0;

                window.SantisGhost.track('hover', targetId, delta, { dwell_time_ms: dwellMs });
            }
        }
    });

    // 2. Click Tracking & Specific Actions (Price, Gallery)
    document.addEventListener('click', function (e) {
        const el = e.target.closest('[data-ghost-trace]');
        if (el) {
            const targetId = el.getAttribute('data-ghost-trace');

            let delta = 10.0; // Standard klik
            let actionType = 'click';

            // Kaptan'ın İstediği Özel Puanlamalar
            if (targetId.includes('gallery') || el.classList.contains('nv-gallery-open')) {
                delta = 15.0; // Gallery Open
                actionType = 'gallery_open';
            } else if (targetId.includes('price') || el.classList.contains('nv-price-toggle')) {
                delta = 20.0; // Price Toggle
                actionType = 'price_toggle';
            }

            window.SantisGhost.track(actionType, targetId, delta, { tag: el.tagName });
        }
    });

    // 3. Exit Intent (Sayfayı terk etme eğilimi)
    let exitTriggered = false;
    document.addEventListener('mouseleave', function (e) {
        if (e.clientY < 0 && !exitTriggered) {
            exitTriggered = true;

            // Exit Intent: -10 (Kritik kayıp riski)
            window.SantisGhost.track('exit_intent', 'page_exit', -10.0, { trigger: 'mouse_leave_top' });

            // 15 saniye sonra sıfırla (eğer sekmede kalmaya devam ederse)
            setTimeout(() => { exitTriggered = false; }, 15000);
        }
    });

    // 4. WebSocket Neural Link (Sovereign Aura Receiver)
    function connectGhostSocket() {
        if (window.SANTIS_API_ONLINE === false) return; // KILL SWITCH

        const protocol = window.location.protocol === 'https:' ? 'wss://' : 'ws://';
        const wsUrl = `${protocol}${window.location.host}/ws?client_type=site&client_id=${sessionId}`;
        let socket;
        try {
            socket = new WebSocket(wsUrl);
        } catch (e) {
            setTimeout(connectGhostSocket, 5000);
            return;
        }

        socket.onmessage = function (event) {
            try {
                const data = JSON.parse(event.data);
                if (data.type === "SOVEREIGN_AURA") {
                    console.log("⚡ [Sovereign Aura] Inbound payload:", data);
                    showSovereignAuraPopup(data.message, data.token, data.target);
                }
            } catch (e) {
                // ignore
            }
        };

        socket.onclose = () => {
            // Silent reconnect attempt after 5s
            setTimeout(connectGhostSocket, 5000);
        };

        socket.onerror = () => {
            // Error is handled by onclose usually, but we can hook it if needed
        };
    }

    connectGhostSocket();

    function showSovereignAuraPopup(msg, token, target) {
        if (document.getElementById('nv-sovereign-aura')) return;
        const auraHtml = `
            <div id="nv-sovereign-aura" class="fixed inset-0 z-[99999] flex items-center justify-center p-4" style="background: radial-gradient(circle at center, rgba(20,20,18,0.9), rgba(0,0,0,0.95)); opacity: 0; transition: opacity 1s ease;">
                <div class="relative max-w-md w-full border border-santis-gold/30 bg-[#0a0a09] p-8 text-center shadow-[0_0_50px_rgba(212,175,55,0.15)] overflow-hidden">
                    <div class="absolute inset-0 bg-[url('/assets/img/textures/gold.webp')] bg-cover opacity-10 mix-blend-overlay"></div>
                    <div class="relative z-10">
                        <div class="text-santis-gold text-xs tracking-[4px] uppercase mb-4 animate-pulse">Sovereign Privilege</div>
                        <h2 class="text-2xl text-white font-serif mb-4"><span class="italic text-gray-400">Exclusive</span> Access</h2>
                        <p class="text-gray-400 text-xs tracking-wider leading-relaxed mb-6 font-mono border-y border-gray-800 py-4">${msg}</p>
                        <div class="bg-black/50 border border-santis-gold/20 p-4 mb-6 relative group overflow-hidden cursor-pointer" onclick="navigator.clipboard.writeText('${token}'); this.innerHTML='<span class=\\'text-emerald-400 tracking-widest\\'>COPIED</span>'">
                            <div class="absolute inset-0 bg-santis-gold/5 transform -translate-x-full group-hover:translate-x-0 transition-transform duration-700"></div>
                            <span class="text-santis-gold text-xl font-mono tracking-widest relative z-10">${token}</span>
                            <div class="absolute bottom-1 right-2 w-max text-[8px] text-gray-500 uppercase tracking-widest">Click to Copy</div>
                        </div>
                        <button onclick="document.getElementById('nv-sovereign-aura').remove()" class="text-xs text-gray-500 hover:text-white uppercase tracking-widest transition-colors">Acknowledge</button>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', auraHtml);
        setTimeout(() => {
            document.getElementById('nv-sovereign-aura').style.opacity = '1';
        }, 100);
    }

    console.log("[Santis Ghost] Sovereign CRM Tracker Initialized - " + sessionId);
})();
