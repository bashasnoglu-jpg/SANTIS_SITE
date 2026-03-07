/**
 * 🌍 SANTIS COGNITIVE CORE (State Engine V1)
 * Disconnects the UI from hardcoded HTML text completely.
 * Hydrates all homepage and UI components dynamically via the Single Source of Truth.
 */

window.SantisStateEngine = {
    init() {
        console.log("🧠 [Santis State Engine] V1 Boot Sequence Initiated...");

        // Data Bridge is async. Check if it's already here, otherwise wait for DataBridge completion.
        // It distributes to window.NV_HAMMAM, window.NV_MASSAGES, window.NV_SKINCARE.

        if ((document.readyState === 'complete' || document.readyState === 'interactive') && window.NV_MASSAGES && window.NV_MASSAGES.length > 0) {
            this.hydrateAll();
        } else {
            // Depending heavily on custom events or DOMContentLoaded
            window.addEventListener('load', () => {
                setTimeout(() => this.hydrateAll(), 300); // Küçük delay ile DataBridge i bekle
            });
        }
    },

    hydrateAll() {
        console.log("💧 [State Engine] The Hydration Protocol is engaging DOM elements...");

        const allServices = [
            ...(window.NV_HAMMAM || []),
            ...(window.NV_MASSAGES || []),
            ...(window.NV_SKINCARE || []),
            ...(window.NV_JOURNEYS || [])
        ];

        if (allServices.length === 0) {
            console.warn("🚨 [State Engine] Master Pool is empty! Fetch might have failed or DataBridge isn't ready.");
            return;
        }

        const cards = document.querySelectorAll('.ritual-card[data-santis-id]');

        cards.forEach(card => {
            const slug = card.getAttribute('data-santis-id');
            const data = allServices.find(s => s.slug === slug || s.id === slug);

            if (data) {
                this.hydrateCard(card, data);
            } else {
                console.warn(`⚠️ [State Engine] Missing Data Link for UI Slot: ${slug}`);
            }
        });

        console.log(`✅ [State Engine] Hydration Sequence Complete! (${cards.length} nodes bound)`);
    },

    hydrateCard(card, data) {
        const lang = document.documentElement.lang || 'tr';

        // Multi-lang Object Parser (Sovereign Array Structure Support)
        const parseStr = (field) => {
            if (typeof field === 'object' && field !== null) {
                return field[lang] || field.en || field.tr || '';
            } else if (typeof field === 'string' && data.i18n && data.i18n[lang]) {
                // e.g. title inside i18n
                return data.i18n[lang][field] || '';
            }
            return field || '';
        };

        // Get elements
        const titleEl = card.querySelector('.santis-hydrate-title');
        const descEl = card.querySelector('.santis-hydrate-desc');
        const durationEl = card.querySelector('.santis-hydrate-duration');
        const categoryEl = card.querySelector('.santis-hydrate-category');

        // Extract Data
        let title = data.title || data.name || '';
        if (data.i18n && data.i18n[lang]) {
            title = data.i18n[lang].title || title;
        }

        const duration = data.duration || data.defaultDuration || 60;

        let categoryName = "SOVEREIGN EXPERIENCE";
        const catId = data.category || data.categoryId || '';
        if (catId.includes('hammam')) categoryName = "PURIFICATION";
        if (catId.includes('massage')) categoryName = "BODY THERAPY";
        if (catId.includes('skin') || catId.includes('facial')) categoryName = "REJUVENATION";

        // V10 Fluid DOM Mutation (Using rAF for zero frame drops)
        requestAnimationFrame(() => {
            if (titleEl) {
                titleEl.style.opacity = '0';
                setTimeout(() => {
                    titleEl.innerText = title;
                    titleEl.style.opacity = '1';
                }, 150);
            }

            if (durationEl) {
                durationEl.innerHTML = `${duration} MIN &bull; DETAYLARI GÖR`;
            }

            if (categoryEl) {
                categoryEl.innerText = categoryName;
            }

            let section = 'masajlar';
            if (catId.includes('hammam')) section = 'hamam';
            else if (catId.includes('skin') || catId.includes('facial')) section = 'cilt-bakimi';
            else if (catId.includes('ritual')) section = 'rituals';

            if (card.tagName === 'A') {
                const url = `/${lang}/${section}/${data.slug || slug}.html`;
                card.href = url;
            }
        });
    }
};

// Global Boot
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => window.SantisStateEngine.init());
} else {
    window.SantisStateEngine.init();
}
