/**
 * 🌍 SANTIS OS v4.0 - THE SOVEREIGN ORCHESTRATOR (Cloudflare Edge Worker)
 * 
 * Görevler:
 * 1. Edge Cache (Statik Dosyalar) - Origin Server'ı %95 rahatlatır.
 * 2. Edge KV (Visitor Intent) - Ziyaretçi skorunu sunucuya gitmeden Edge'de hesaplar.
 * 3. VIP Intervention - Balina (Whale) tespitinde anında Upgrade (Upsell) JSON'ı döner.
 */

// Cloudflare KV Namespace Bağlantısı (Wrangler.toml dosyasında "SANTIS_GLOBAL_STATE" olarak tanımlanmalıdır)
// const SANTIS_KV = env.SANTIS_GLOBAL_STATE;

export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);
        const clientIP = request.headers.get('cf-connecting-ip') || 'unknown';

        // ─────────────────────────────────────────────────────────
        // 🛡️ 1. THE EDGE SHIELD: STATİK DOSYA ÖNBELLEKLEME (CACHE)
        // ─────────────────────────────────────────────────────────
        const staticExtensions = ['.jpg', '.png', '.webp', '.css', '.js', '.woff2', '.pdf'];
        const isStatic = staticExtensions.some(ext => url.pathname.endsWith(ext));

        if (isStatic) {
            const cache = caches.default;
            let response = await cache.match(request);

            if (!response) {
                // Cache'de yoksa Origin'den al ve 1 Yıl Edge Cache'e göm!
                response = await fetch(request);
                response = new Response(response.body, response);
                response.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
                ctx.waitUntil(cache.put(request, response.clone()));
            }
            return response;
        }

        // ─────────────────────────────────────────────────────────
        // 🧠 2. KOGNİTİF KESİŞİM: TELEMETRY (EDGE KV & WHALE DETECT)
        // ─────────────────────────────────────────────────────────
        if (url.pathname === '/api/v1/telemetry/ingest' && request.method === 'POST') {
            try {
                const payload = await request.json();
                const sessionKey = `session_${clientIP}_${payload.client_id}`;

                let hesitationScore = 0;
                if (payload.hesitation_events && payload.hesitation_events.length > 0) {
                    hesitationScore = payload.hesitation_events.reduce((acc, ev) => acc + ev.hesitation_ms, 0);
                }

                // Edge KV'den eski oturumu al
                let sessionData = await env.SANTIS_GLOBAL_STATE.get(sessionKey, { type: 'json' });

                if (!sessionData) {
                    sessionData = {
                        first_seen: Date.now(),
                        total_hesitation: hesitationScore,
                        max_scroll: payload.scroll_depth,
                        is_whale: false
                    };
                } else {
                    sessionData.total_hesitation += hesitationScore;
                    sessionData.max_scroll = Math.max(sessionData.max_scroll, payload.scroll_depth);
                }

                // 🐋 THE EDGE WHALE ALGORITHM (Origin'i Rahatsız Etmeden Hesapla!)
                // Sitede 40sn kalmış, %50 scroll yapmış ve fiyatta 3 saniye duraksamışsa...
                const dwellTime = (Date.now() - sessionData.first_seen) / 1000;

                if (dwellTime > 40 && sessionData.max_scroll > 50 && sessionData.total_hesitation > 3000) {
                    sessionData.is_whale = true;
                }

                // Yeni Veriyi Edge KV'ye yaz (Asenkron - API yanıtını yavaşlatmaz)
                ctx.waitUntil(env.SANTIS_GLOBAL_STATE.put(sessionKey, JSON.stringify(sessionData), { expirationTtl: 86400 }));

                // Eğer Ziyaretçi Balinaysa (Whale) Origin'e gitmeye gerek yok, VIP teklifi doğrudan EDGE (Tokyo/Londra) fırlatır!
                if (sessionData.is_whale) {
                    // Origin sunucusuna (FastAPI) sadece "Whale Haberi" (Pulse) fırlat, ama kullanıcının yanıtını bekletme
                    ctx.waitUntil(fetch(new Request(request.url, request)));

                    return new Response(JSON.stringify({
                        status: "ingested",
                        cognitive_ack: true,
                        vip_intervention: true,
                        offer: "Sovereign Concierge Ayrıcalığı - %15 Upgrade",
                        source: "Cloudflare Edge Node (Zero-Latency Zırhı)"
                    }), {
                        headers: { 'Content-Type': 'application/json' }
                    });
                }
            } catch (err) {
                // Hata durumunda trafik akışını kesme, Origin'e devret.
                console.error("Edge Kognitif Hata:", err);
            }
        }

        // ─────────────────────────────────────────────────────────
        // ⚡ 3. ORIGIN PROXY (Dinamic Rotalar FastAPI'ye İletilir)
        // ─────────────────────────────────────────────────────────
        // Eğer istek özel bir önbellekleme kuralına uymuyorsa, doğrudan sunucumuza (FastAPI) gönderilir.
        let response = await fetch(request);

        // Güvenlik Başlıkları (Sovereign Shield)
        response = new Response(response.body, response);
        response.headers.set('X-Sovereign-Edge', 'Enforced by Santis OS');
        response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');

        return response;
    }
};
