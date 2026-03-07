/**
 * SANTIS QUANTUM OS - THE NEURAL EDGE WORKER
 * Cloudflare Worker for Server-Sent Events (SSE) and Telemetry Ingestion
 */

export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);

        // Cors kalkanı: Tüm Sovereign ekosistemine izin ver
        const corsHeaders = {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
        };

        // Preflight request (Tarayıcı güvenlik kontrolü)
        if (request.method === "OPTIONS") {
            return new Response(null, { headers: corsHeaders });
        }

        /* ========================================================
           1. TELEMETRY INGESTION (Kanı Yutma)
           Sistem: navigator.sendBeacon (santis-kill-room.js)
           Method: POST -> /v1/telemetry/kill-shot
           ======================================================== */
        if (request.method === "POST" && url.pathname.includes("/v1/telemetry/kill-shot")) {
            try {
                const payload = await request.json();

                // Gerçek bir Cloudflare ortamında bu payload, diğer sunuculara yayılmak 
                // üzere bir Pub/Sub kanalına veya KV Store'a yazılır.
                // Örn: await env.KILL_ROOM_PUBSUB.publish({ topic: "kills", message: JSON.stringify(payload) });

                console.log(`[Edge Worker] Zarf alındı. Kurtarılan Tutar: ${payload.roi.secured_price} EUR`);

                // Tarayıcıya 200 OK ile hızlı yanıt (Sıfır gecikme)
                return new Response(JSON.stringify({ status: "ACK_SECURED" }), {
                    status: 200,
                    headers: { "Content-Type": "application/json", ...corsHeaders }
                });
            } catch (err) {
                return new Response("Invalid Sovereign Payload", { status: 400, headers: corsHeaders });
            }
        }

        /* ========================================================
           2. NEURAL SSE UPLINK (Canlı Yayına Veri Pompalamak)
           Sistem: EventSource (quantum-panopticon.html)
           Method: GET -> /v1/telemetry/stream
           ======================================================== */
        if (request.method === "GET" && url.pathname.includes("/v1/telemetry/stream")) {

            // Geleneksel HTTP'yi tek yönlü, açık bir boruya (Stream) çevir
            let { readable, writable } = new TransformStream();
            let writer = writable.getWriter();
            let encoder = new TextEncoder();

            // Panopticon'a ilk bağlantı mühürlendi mesajını fırlat
            const handshake = { status: "Sovereign Uplink Established", timestamp: Date.now() };
            writer.write(encoder.encode("data: " + JSON.stringify(handshake) + "\n\n"));

            // Prodüksiyon ortamında, Cloudflare Pub/Sub'a (veya Durable Objects'e) 
            // abone olup, yeni "Kill-Shot" geldikçe bu 'writer' üzerinden içeri iteceğiz.
            // Örn: env.KILL_ROOM_PUBSUB.subscribe("kills", msg => writer.write(encoder.encode(`data: ${msg}\n\n`)));

            // Bağlantının kopmasını önlemek için 15 saniyede bir kalp atışı (Heartbeat) at
            const intervalId = setInterval(() => {
                writer.write(encoder.encode(`: heartbeat ${Date.now()}\n\n`));
            }, 15000);

            // İstemci (Panopticon) ekranı kapattığında döngüyü temizle
            request.signal.addEventListener("abort", () => {
                console.log("[Edge Worker] Müşteri ayrıldı. Uplink kesiliyor.");
                clearInterval(intervalId);
                writer.close();
            });

            return new Response(readable, {
                headers: {
                    "Content-Type": "text/event-stream",
                    "Cache-Control": "no-cache",
                    "Connection": "keep-alive",
                    ...corsHeaders
                }
            });
        }

        // Bilinmeyen bir rotaya sızmaya çalışanlara karşı mutlak ret.
        return new Response("Santis Sovereign Matrix - Unauthorized. The eye sees everything.", {
            status: 403,
            headers: corsHeaders
        });
    }
};
