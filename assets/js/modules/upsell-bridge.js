/**
 * SANTIS UPSELL BRIDGE v1.0
 * Connects The Temple (Services) to The Apothecary (Products)
 * Philosophy: "Complete the Ritual at Home"
 */

const UPSELL_MAP = {
    // HAMAM RITUALS
    'sultan-hamami': {
        title: "Sultan'ın Dokunuşu",
        desc: "Bu ritüeli evinizde yaşatın.",
        products: ['pestemal-classic', 'kese-ipek', 'sabun-no1']
    },
    'gelin-hamami': {
        title: "Gelin Hamamı Seti",
        desc: "Özel günler için saf bakım.",
        products: ['set-gelin', 'kese-ipek']
    },

    // MASSAGES
    'aroma-journey': {
        title: "Aromaterapi Devamı",
        desc: "Santis imza kokuları evinize eşlik etsin.",
        products: ['oil-relax', 'mum-santal']
    },
    'bali-terapi': {
        title: "Bali Esintisi",
        desc: "Derin rahatlama için doğal yağlar.",
        products: ['oil-bali', 'tutsuluk']
    },

    // FACIALS (Sothys)
    'hydra-facial': {
        title: "Nem Desteği",
        desc: "Sothys Hydra serisi ile ışıltınızı koruyun.",
        products: ['sothys-hydra-serum', 'sothys-hydra-cream']
    },
    'anti-age': {
        title: "Zamanı Durdurun",
        desc: "Gençlik iksiri evinizde.",
        products: ['sothys-youth-serum']
    }
};

const UpsellBridge = {
    init() {
        const urlParams = new URLSearchParams(window.location.search);
        const serviceId = urlParams.get('id'); // e.g. ?id=sultan-hamami

        if (serviceId && UPSELL_MAP[serviceId]) {
            this.renderUpsell(UPSELL_MAP[serviceId]);
        }
    },

    renderUpsell(data) {
        const container = document.getElementById('upsell-container');
        if (!container) return;

        // Fetch products to get details (simulated or from memory)
        // For V1, we will just show a static card structure that links to the shop

        let productsHtml = data.products.map(pid => `
            <div class="upsell-mini-card">
                <div class="upsell-img-box">
                    <img src="/assets/img/products/${pid}.webp" onerror="this.src='/assets/img/placeholder.png'" alt="${pid}">
                </div>
                <p>${this.formatName(pid)}</p>
            </div>
        `).join('');

        const html = `
            <div class="nv-upsell-wrapper slide-up-delay">
                <div class="nv-upsell-header">
                    <span class="nv-subtitle-gold">RİTÜELİ TAMAMLA</span>
                    <h3>${data.title}</h3>
                    <p>${data.desc}</p>
                </div>
                <div class="nv-upsell-grid">
                    ${productsHtml}
                </div>
                <div class="nv-upsell-action">
                    <a href="/tr/magaza/index.html" class="btn-text-gold">Tüm Ürünleri İncele &rarr;</a>
                </div>
            </div>
        `;

        container.innerHTML = html;
        container.style.display = 'block';
    },

    formatName(slug) {
        // Simple formatter, reliable real names should come from a DB/JSON
        return slug.replace(/-/g, ' ').toUpperCase();
    }
};

// Auto-Init
document.addEventListener('DOMContentLoaded', () => UpsellBridge.init());
