/**
 * SANTIS DYNAMIC HOMEPAGE (Phase 27 & 28.5)
 * Quiet Luxury Layout Engine (CSR)
 * Includes Ultra Analytics Logging
 */
class SmartHome {
    constructor() {
        this.init();
    }

    async init() {
        // 1. Atmosphere Check (Immediate)
        this.updateAtmosphere();

        // 2. Oracle Layout (Async)
        setTimeout(async () => {
            const layout = await this.fetchLayout();
            if (layout) {
                if (layout.order) this.reorder(layout.order);
                if (layout.mood) this.applyMood(layout.mood);
            }
        }, 400);
    }

    updateAtmosphere() {
        const hour = new Date().getHours();
        const body = document.body;
        const title = document.querySelector('.nv-hero-title-dynamic');
        const caption = document.querySelector('.nv-hero-caption');

        // Reset
        body.classList.remove('mode-dawn', 'mode-sunset', 'mode-midnight');

        if (hour >= 6 && hour < 11) {
            // Morning
            body.classList.add('mode-dawn');
            if (title) title.innerText = "Güne Harika Başla...";
            if (caption) caption.innerText = "YENİ BİR GÜN";
        }
        else if (hour >= 17 && hour < 22) {
            // Sunset
            body.classList.add('mode-sunset');
            if (title) title.innerText = "Günün Yorgunluğunu At...";
            if (caption) caption.innerText = "ALTIN SAATLER";
        }
        else if (hour >= 22 || hour < 6) {
            // Night
            body.classList.add('mode-midnight');
            if (title) title.innerText = "Derin Bir Uyku İçin...";
            if (caption) caption.innerText = "GECE RİTÜELİ";
        }
        else {
            // Day (Default)
            if (title) title.innerText = "Gürültüden Uzaklaş...";
            if (caption) caption.innerText = "BAŞLANGIÇ";
        }
    }

    async fetchLayout() {
        try {
            const res = await fetch('/api/dynamic-home/score');
            if (res.ok) return await res.json();
        } catch (e) {
            console.warn("SmartHome silent:", e);
        }
        return null;
    }

    applyMood(mood) {
        console.log("🔮 Oracle Mood Detected:", mood);
        const body = document.body;

        // Remove old mood classes
        body.classList.remove('mood-calm', 'mood-balanced', 'mood-romantic', 'mood-neutral');

        // Add new mood class
        if (mood !== 'neutral') {
            body.classList.add(`mood-${mood}`);
        }
    }

    reorder(order) {
        // order = ["hammam", "masaj", "global-trends", ...]
        const safeIds = ["global-trends", "journeys", "hammam", "masaj", "cilt", "products"];
        const sections = {};

        safeIds.forEach(id => {
            const el = document.getElementById(id);
            if (el) sections[id] = el;
        });

        const hero = document.querySelector('.nv-hero-campaign');
        if (!hero) return;

        console.log("🏠 SmartHome: Reordering sections based on Oracle score...", order);

        let previousEl = hero;

        order.forEach(id => {
            const el = sections[id];
            if (el) {
                previousEl.after(el);
                previousEl = el;
                el.setAttribute('data-oracle-rank', order.indexOf(id) + 1);
            }
        });

        // Log this event for Ultra Analytics (Phase 28.5)
        fetch('/api/analytics/log-event', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: 'homepage_dynamic_view' })
        }).catch(e => console.warn("Analytics log failed", e));
    }
}

// Auto Init
document.addEventListener('DOMContentLoaded', () => {
    new SmartHome();
});
