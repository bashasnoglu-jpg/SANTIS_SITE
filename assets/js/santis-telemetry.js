// [SOVEREIGN SEAL: PHANTOM TRACKER v2.0 - ULTRA MEGA EDITION]
(function () {
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const API_BASE = window.__API_BASE__ || (isLocal ? 'http://localhost:8080/api/v1' : '/api/v1');
    const TELEMETRY_ENDPOINT = `${API_BASE}/telemetry/ingest`;

    // Kuantum Kimlik (Backend'in Whale'i tanıması için)
    function getSovereignID() {
        let sid = sessionStorage.getItem("sovereign_sid");
        if (!sid) { sid = "sv_" + Math.random().toString(36).substr(2, 9); sessionStorage.setItem("sovereign_sid", sid); }
        return sid;
    }

    // Ziyaret Edilen Node'un Tespiti (URL veya Meta Tag'dan)
    function detectNodeID() {
        const pathParts = window.location.pathname.split('/').filter(Boolean);
        // Örn: /de/wien-exclusive/ -> node_id: "wien-exclusive" veya meta tag "santis-node-id"
        let node_id = pathParts[pathParts.length - 1] || "index";
        const metaTag = document.querySelector('meta[name="santis-node-id"]');
        if (metaTag) node_id = metaTag.getAttribute('content');
        return node_id.replace('.html', '');
    }

    let payloadData = {
        client_id: getSovereignID(),
        node_id: detectNodeID(),
        mouse_moves: 0,
        scroll_depth: 0,
        hesitation_events: [],
        timestamp: 0
    };

    let priceHoverStart = null;
    let moveThrottled = false;

    // 1. İşlemci Dostu Mouse Takibi (requestAnimationFrame)
    document.addEventListener("mousemove", () => {
        if (!moveThrottled) {
            requestAnimationFrame(() => {
                payloadData.mouse_moves++;
                moveThrottled = false;
            });
            moveThrottled = true;
        }
    });

    // 2. Scroll Ölçümü (Performanslı)
    let scrollTimeout;
    window.addEventListener("scroll", () => {
        if (scrollTimeout) return;
        scrollTimeout = setTimeout(() => {
            const docHeight = document.documentElement.scrollHeight - window.innerHeight;
            let depth = 0;
            if (docHeight > 0) {
                depth = Math.round((window.scrollY / docHeight) * 100);
            }
            payloadData.scroll_depth = Math.max(payloadData.scroll_depth, depth);
            scrollTimeout = null;
        }, 150);
    });

    // 3. Fiyat Kararsızlık (Hesitation) Dedektörü
    document.querySelectorAll("[data-price]").forEach(el => {
        el.addEventListener("mouseenter", () => { priceHoverStart = Date.now(); });
        el.addEventListener("mouseleave", () => {
            if (!priceHoverStart) return;
            const hesitation = Date.now() - priceHoverStart;
            // Sadece 500ms'den uzun (gerçek) beklemeleri say
            if (hesitation > 500) {
                payloadData.hesitation_events.push({ price_id: el.dataset.price, hesitation_ms: hesitation });
            }
            priceHoverStart = null;
        });
    });

    function buildPayload() {
        payloadData.timestamp = Date.now();
        return JSON.stringify(payloadData);
    }

    // 4. 5 Saniyelik Kuantum Havuzu
    async function sendTelemetry() {
        if (payloadData.mouse_moves === 0 && payloadData.hesitation_events.length === 0) return;
        if (window.SANTIS_API_ONLINE === false) return; // KILL SWITCH FOR LOCAL DEV

        try {
            const res = await fetch(TELEMETRY_ENDPOINT, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: buildPayload()
            });

            const data = await res.json();

            // --- PHASE 56: THE GOLDEN HOOK ---
            if (data.vip_intervention && !window.santisSovereignHookActive) {
                window.santisSovereignHookActive = true;
                triggerGoldenHook(data.offer, data.reason);
            }

            payloadData.mouse_moves = 0;
            payloadData.hesitation_events = [];
        } catch (err) { console.warn("[Santis] Telemetry pulse failed"); }
    }

    // 🎯 SOVEREIGN CONCIERGE (VIP ARAYÜZÜ)
    function triggerGoldenHook(offer, reason) {
        if (document.getElementById('santis-golden-hook')) return;

        console.log(`[SANTIS OS] 👑 Sovereign Intervention Triggered! Reason: ${reason}`);

        const hookHTML = `
            <div id="santis-golden-hook" style="pointer-events: auto; z-index: 9999;" class="fixed bottom-8 right-8 opacity-0 translate-y-4 transition-all duration-700 ease-out flex items-center gap-4 p-5 rounded-xl bg-black/85 backdrop-blur-md border border-[#D4AF37]/40 shadow-[0_0_40px_rgba(212,175,55,0.15)] max-w-sm">
                <div class="flex-shrink-0 w-12 h-12 rounded-full bg-[#D4AF37]/10 flex items-center justify-center border border-[#D4AF37]/30 text-[#D4AF37] shadow-[inset_0_0_10px_rgba(212,175,55,0.2)]">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"></path></svg>
                </div>
                <div class="flex-1">
                    <p class="text-[#D4AF37] text-[10px] font-bold tracking-widest uppercase mb-1 drop-shadow-[0_0_2px_rgba(212,175,55,0.8)]">Sovereign Concierge</p>
                    <p class="text-white text-sm font-light leading-relaxed">${offer}</p>
                    <div class="mt-4 flex items-center justify-between">
                        <button onclick="document.getElementById('santis-golden-hook').style.opacity='0'; setTimeout(()=>document.getElementById('santis-golden-hook').remove(), 700)" class="text-[10px] text-gray-400 hover:text-white transition-colors underline decoration-gray-700 underline-offset-4 tracking-widest uppercase">Gizle</button>
                        <button class="text-[10px] bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/50 hover:bg-[#D4AF37] hover:text-black font-bold py-1.5 px-4 rounded transition-all tracking-widest uppercase shadow-[0_0_10px_rgba(212,175,55,0.2)]">Ayrıcalığı Al</button>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', hookHTML);

        // CSS Animasyonu tetiklemek için reflow
        requestAnimationFrame(() => {
            const el = document.getElementById('santis-golden-hook');
            if (el) {
                el.classList.remove('opacity-0', 'translate-y-4');
                el.classList.add('opacity-100', 'translate-y-0');
            }
        });
    }

    setInterval(sendTelemetry, 5000);

    document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "hidden" && (payloadData.mouse_moves > 0 || payloadData.hesitation_events.length > 0)) {
            const blob = new Blob([buildPayload()], { type: "application/json" });
            navigator.sendBeacon(TELEMETRY_ENDPOINT, blob);
        }
    });
})();
