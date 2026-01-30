/**
 * SANTIS CLUB — MASTER ENGINE v4.1 (TIER 4 UPDATE)
 * Features: Booking Wizard Integration, Sticky Sidebar Support, Whisper Share
 * Improved: Better race-condition handling for data loading
 */

document.addEventListener('DOMContentLoaded', () => {
    // Race-Condition Check with retry
    let retryCount = 0;
    const maxRetries = 5;

    function checkDataAndInit() {
        const hasData = window.NV_HAMMAM || window.NV_MASSAGES || window.NV_SKINCARE;

        if (!hasData && retryCount < maxRetries) {
            retryCount++;
            console.log(`⏳ Data not loaded yet, retry ${retryCount}/${maxRetries}...`);
            setTimeout(checkDataAndInit, 300);
            return;
        }

        console.log("📦 Data status:", {
            HAMMAM: window.NV_HAMMAM?.length || 0,
            MASSAGES: window.NV_MASSAGES?.length || 0,
            SKINCARE: window.NV_SKINCARE?.length || 0
        });

        SANTIS_ENGINE.init();
    }

    checkDataAndInit();
});

const SANTIS_ENGINE = {
    config: {
        whatsapp: "905348350169",
        pageTitle: "Santis Club | Spa Ritual",
        fallbackImg: "/assets/img/cards/hammam.png"
    },

    init() {
        console.log("🏆 Santis Detail Engine v4.1: Active.");
        this.runDetailEngine();
    },

    // --- Core Logic ---
    runDetailEngine() {
        if (!document.getElementById('santis-detail-root')) return;

        const params = new URLSearchParams(window.location.search);
        const slug = params.get('slug');

        console.log("🔍 Looking for slug:", slug);

        if (!slug) {
            console.warn("Ghost Visit. Redirecting.");
            window.location.replace('/');
            return;
        }

        // Merge Data Pools
        const allData = [
            ...(window.NV_HAMMAM || []),
            ...(window.NV_MASSAGES || []),
            ...(window.NV_SKINCARE || [])
        ];

        console.log("📋 Total items in pool:", allData.length);

        const item = allData.find(s => s.slug === slug || s.id === slug);

        if (!item) {
            console.warn("❌ Service not found for slug:", slug);
            console.log("Available slugs/ids:", allData.map(s => s.slug || s.id).slice(0, 10), "...");
            this.render404();
            return;
        }

        console.log("✅ Found service:", item.title);
        this.renderPage(item);
        this.setupInteractions(item);
    },

    renderPage(data) {
        document.title = `${data.title} | Santis Club`;

        // 1. Text Injection
        const map = {
            'dynamic-title': data.title,
            'dynamic-kicker': data.tier || 'RITUAL',
            'dynamic-long-desc': data.desc,
            'dynamic-duration': data.duration,
            'dynamic-price': data.price ? `${data.price}€` : "Danışınız"
        };

        for (const [id, val] of Object.entries(map)) {
            const el = document.getElementById(id);
            if (el) el.innerText = val;
        }

        // 2. Image Injection
        const bg = document.getElementById('dynamic-bg');
        if (bg && data.img) {
            bg.src = data.img.replace('.jpg', '.webp');
        }
    },

    setupInteractions(data) {
        // A. Booking Trigger (Wizard Integration)
        const bookBtn = document.getElementById('booking-trigger');
        if (bookBtn) {
            bookBtn.onclick = () => {
                if (typeof BOOKING_WIZARD !== 'undefined') {
                    // Pre-fill Wizard
                    // Note: Wizard needs to support pre-filling service. 
                    // For now, we open it. Future update: pass data.id
                    BOOKING_WIZARD.open();
                } else {
                    console.error("Booking Wizard missing!");
                }
            };
        }

        // B. Whisper Share (WhatsApp)
        const waBtn = document.getElementById('share-whatsapp');
        if (waBtn) {
            waBtn.onclick = () => {
                const text = `Santis Club'da bu ritüeli keşfettim: ${data.title}\n${window.location.href}`;
                window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
            };
        }

        // C. Whisper Share (Copy)
        const copyBtn = document.getElementById('share-copy');
        if (copyBtn) {
            copyBtn.onclick = () => {
                navigator.clipboard.writeText(window.location.href);
                const original = copyBtn.innerText;
                copyBtn.innerText = "Kopyalandı";
                setTimeout(() => copyBtn.innerText = original, 2000);
            };
        }
    },

    render404() {
        document.getElementById('dynamic-title').innerText = "Hizmet Bulunamadı";
        document.getElementById('dynamic-long-desc').innerText = "Aradığınız ritüel veya hizmet mevcut değil.";
        document.getElementById('booking-trigger').style.display = 'none';
    }
};
