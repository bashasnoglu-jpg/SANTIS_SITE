/**
 * SANTIS CLUB - SOVEREIGN EDGE WORKER
 * Phase 45: Global Edge-Side Rendering (ESR)
 *
 * Bu Worker beklemeden, HTML isteği sırasındayken araya girer (HTMLRewriter),
 * aktif resim slotlarını KV veya Edge API üzerinden bulur,
 * ve istemciye orijinal resmi hiç göstermeden doğrudan "Sovereign Winner" 
 * veya "Scarcity" katmanlı HTML'i döner. Sıfır CLS, sıfır gecikme.
 */

export default {
    async fetch(request, env, ctx) {
        // 1. Fetch current HTML
        const response = await fetch(request);

        // Sadece HTML isteklerinde devreye gir
        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("text/html")) {
            return response;
        }

        // 2. Nöral Slot Verilerini Çek (Örnek KV / Memory Read)
        // Gerçek senaryoda bu veri env.SANTIS_MEDIA_GRAPH KV alanında hazır tutulur.
        const slotMapCached = {
            "card-massage": {
                "assets": [{ "asset_id": "123", "url": "/assets/img/cards/massage.webp" }],
                "is_scarce": true,
                "scarcity_message": "Son 2 VIP Slot",
                "price_surge": 0.25
            }
        };

        // 3. HTMLRewriter Mimarisi
        const rewriter = new HTMLRewriter()
            .on("[data-santis-slot]", {
                element(el) {
                    const slotKey = el.getAttribute("data-santis-slot");
                    const slotData = slotMapCached[slotKey];

                    if (slotData && slotData.assets && slotData.assets.length > 0) {
                        // A/B Test Seçimi Edge Sırasında (Rastgele veya Deterministic)
                        const chosenAsset = slotData.assets[0]; // Simplifikasyon

                        if (el.tagName === 'img') {
                            el.setAttribute("src", chosenAsset.url);
                        }

                        // Scarcity Katmanı (ESR ile direkt içine CSS/HTML basma)
                        if (slotData.is_scarce) {
                            el.setAttribute("data-scarcity-rendered", "true");
                            el.after(`<div class="nv-scarcity-badge reveal-up"><span class="nv-pulse-dot"></span><span class="nv-scarcity-text">${slotData.scarcity_message}</span></div>`, { html: true });
                        }
                    }
                }
            });

        // 4. Modifiye edilmiş (Sovereign) yanıtı istemciye dön
        return rewriter.transform(response);
    }
};
