/**
 * 🧠 SANTIS NEURO-TRACKER v2.0
 * Cognitive Dwell & Panopticon Focus Engine
 */
class NeuroTracker {
    constructor() {
        this.dwellTime = 2000; // 2 seconds threshold
        this.hoverTimers = new Map();

        console.log("🧠 [Neuro-Tracker] Booting Quantum Cog-Engine...");
        this.init();
    }

    init() {
        this.bindEvents();

        // Dinamik içerik (DataBridge) geldiğinde yeniden bağla
        window.addEventListener('santis-dom-ready', () => {
            this.bindEvents();
            console.log("🧠 [Neuro-Tracker] Re-bound to new Matrix DOM.");
        });
    }

    bindEvents() {
        const cards = document.querySelectorAll('.ritual-card');
        if (cards.length === 0) return;

        cards.forEach(card => {
            // Sadece bir kere event bağlamak için
            if (card.dataset.neuroBound) return;
            card.dataset.neuroBound = "true";

            // Orijinal z-index'i yedekle (Sovereign Z-Index Armor koruması)
            const styleZ = card.style.zIndex;
            card.dataset.originalZ = styleZ ? styleZ : "1";

            // Masaüstü
            card.addEventListener('mouseenter', () => this.startTracking(card));
            card.addEventListener('mouseleave', () => this.cancelTracking(card));

            // Mobil
            card.addEventListener('touchstart', () => this.startTracking(card), { passive: true });
            card.addEventListener('touchend', () => this.cancelTracking(card), { passive: true });
            card.addEventListener('touchcancel', () => this.cancelTracking(card), { passive: true });
        });

        // Track scroll to break focus (Kullanıcı kaydırmaya devam ederse aydınlanmayı boz)
        const tracks = document.querySelectorAll('.rail-track');
        tracks.forEach(track => {
            if (track.dataset.scrollBound) return;
            track.dataset.scrollBound = "true";

            track.addEventListener('scroll', () => {
                const focused = track.querySelector('.snapped-focus');
                if (focused) this.removeFocus(track);
            }, { passive: true });
        });

        console.log(`🧠 [Neuro-Tracker] Locked onto ${cards.length} Sovereign entities.`);
    }

    startTracking(card) {
        if (this.hoverTimers.has(card)) {
            clearTimeout(this.hoverTimers.get(card));
        }

        const timerId = setTimeout(() => {
            this.applyFocus(card);

            // CRM ve Score Engine Entegrasyonu (Sovereign Intelligence)
            if (window.Santis && window.Santis.ScoreEngine && typeof window.Santis.ScoreEngine.logAction === 'function') {
                window.Santis.ScoreEngine.logAction('hover_deep');
            }
        }, this.dwellTime);

        this.hoverTimers.set(card, timerId);
    }

    cancelTracking(card) {
        if (this.hoverTimers.has(card)) {
            clearTimeout(this.hoverTimers.get(card));
            this.hoverTimers.delete(card);
        }

        // Remove Panopticon focus if the user's cursor leaves the card
        if (card.classList.contains('snapped-focus')) {
            const container = card.closest('.rail-track') || document;
            this.removeFocus(container);
        }
    }

    applyFocus(targetCard) {
        const title = targetCard.querySelector('h2, h3')?.innerText || 'Card';
        console.log(`🧠 [Neuro-Tracker] Cognitive Dwell Reached! Activating Panopticon Focus on: ${title}`);

        // Only dim cards in the same rail container
        const container = targetCard.closest('.rail-track') || document;
        const allCards = container.querySelectorAll('.ritual-card');

        allCards.forEach(c => {
            if (c === targetCard) {
                c.classList.add('snapped-focus');
                c.classList.remove('snapped-dim');
                c.style.zIndex = "10050"; // Bring to absolute front
            } else {
                c.classList.add('snapped-dim');
                c.classList.remove('snapped-focus');
                c.style.zIndex = c.dataset.originalZ || "1";
            }
        });
    }

    removeFocus(container = document) {
        console.log("🧠 [Neuro-Tracker] Motion detected. Breaking Focus Matrix.");
        const allCards = container.querySelectorAll('.ritual-card');
        allCards.forEach(c => {
            c.classList.remove('snapped-focus', 'snapped-dim');
            // Z-Index Armor'ı geri yükle
            c.style.zIndex = c.dataset.originalZ || "1";
        });
    }
}

// OS Başlatıcı
document.addEventListener('DOMContentLoaded', () => {
    // Injector devreye girmeden önce sınıfı hazırla
    if (!window.Santis) window.Santis = {};
    window.Santis.NeuroTracker = new NeuroTracker();
});
