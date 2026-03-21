/**
 * ═══════════════════════════════════════════════════════════
 * SANTIS OS - PHASE 53: THE SOVEREIGN WHATSAPP LINKER
 * ═══════════════════════════════════════════════════════════
 * Legacy dokulardan (NEUROVA Hardcoding) tamamen arındırılmış, 
 * %100 "Single Source of Truth" ve "Zero Hardcoding" prensibiyle çalışan
 * Otonom İletişim Köprüsü.
 */

(function () {
    "use strict";

    // 1. Kuantum Veritabanı (Single Source of Truth)
    // Eğer HTML'de window.SANTIS_CONFIG yoksa, asil bir varsayılanla (Santis) ayağa kalkar.
    const CONFIG = window.SANTIS_CONFIG || {};
    const BRAND_NAME = CONFIG.BRAND_NAME || "Santis OS";
    const WA_NUMBER = (CONFIG.WHATSAPP_NUMBER || "").replace(/\D/g, "");

    console.log(`💎 [WA Linker] Legacy kodlar temizlendi. Brand Identity: ${BRAND_NAME} mühürlendi.`);

    // 2. Çoklu Dil Desteği (Globalization Engine)
    const I18N = {
        tr: {
            helloBook: `Zarafetin kaynağı ${BRAND_NAME}'a ulaştınız. Rezervasyon talebimi iletiyorum.`,
            helloProducts: `Sovereign Boutique üzerinden yazıyorum. ${BRAND_NAME} koleksiyonundan bir eser talep ediyorum.`,
            bookQ: [
                "1) Tercih Edilen Zaman: Bugün / Yarın",
                "2) Tereddüt Skorunuz (Odak): Rahatlama / Toparlanma",
                "3) Basınç Tercihi: Yumuşak / Orta / Sert"
            ],
            bookClose: "Uygunsa en asil zaman dilimini tarafıma ayırınız.",
            productsTopic: "Boutique Talebi",
            tagPrefix: "Kuantum Kaynağı"
        },
        en: {
            helloBook: `You have reached the pinnacle of elegance, ${BRAND_NAME}. I am submitting my reservation request.`,
            helloProducts: `Writing from the Sovereign Boutique. I request a masterpiece from the ${BRAND_NAME} collection.`,
            bookQ: [
                "1) Preferred Time: Today / Tomorrow",
                "2) Focus: Relaxation / Recovery",
                "3) Pressure Preference: Soft / Medium / Firm"
            ],
            bookClose: "Please reserve the most noble time slot available.",
            productsTopic: "Boutique Request",
            tagPrefix: "Quantum Source"
        }
    };

    function getLang() {
        const htmlLang = document.documentElement.getAttribute("lang");
        if (htmlLang) return htmlLang.toLowerCase().startsWith("tr") ? "tr" : "en";
        return "tr";
    }

    function buildMessageParts({ lang, context }) {
        const L = lang === "en" ? I18N.en : I18N.tr;
        const isProducts = context === "products";
        const intro = isProducts ? L.helloProducts : L.helloBook;
        const questions = isProducts ? [] : L.bookQ; // Ürünler için eklenebilir
        const closeLine = L.bookClose;
        const tagLine = `\n\n${L.tagPrefix}: ${location.pathname} | OS: Santis V18`;

        const text = intro + "\n\n" + questions.join("\n") + "\n\n" + closeLine + tagLine;
        return { text };
    }

    function waUrl(text) {
        if (!WA_NUMBER) return "https://wa.me/?text=" + encodeURIComponent(text);
        return "https://wa.me/" + WA_NUMBER + "?text=" + encodeURIComponent(text);
    }

    function wireSovereignLinks() {
        // [data-wa="sovereign"] olan tüm butonları dinle
        const links = document.querySelectorAll('a[href="#santis-wa"], [data-wa="sovereign"]');
        const lang = getLang();

        links.forEach(a => {
            a.addEventListener("click", (e) => {
                if (e.metaKey || e.ctrlKey) return;
                e.preventDefault();

                // Niyet Tahmini (Context Inference)
                const isProducts = (location.pathname || "").toLowerCase().includes("boutique");
                const context = isProducts ? "products" : "booking";

                const { text } = buildMessageParts({ lang, context });
                const url = waUrl(text);

                // Sovereign Animasyonu (İsteğe Bağlı: Yönlenmeden önce UI'ı yatıştır)
                if(window.SantisPhantom) window.SantisPhantom.executeAction("[ACTION: NONE]");

                const w = window.open(url, "_blank", "noopener,noreferrer");
                if (!w) window.location.href = url;
            });
        });
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", wireSovereignLinks);
    } else {
        wireSovereignLinks();
    }
})();
