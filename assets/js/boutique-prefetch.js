/**
 * 🔮 SANTIS QUANTUM PREFETCH (TtT SCROLL AI v2)
 * Wheel Velocity Tracking | Scroll Prediction | Zero-Latency Render
 */

const BoutiquePrefetch = {
    init() {
        this.lastTime = performance.now();
        this.cooling = false;

        // Fare/tekerlek kullanan masaüstü cihazlarda çalışır
        if (window.matchMedia('(pointer: fine)').matches) {
            window.addEventListener('wheel', (e) => this.trackScrollVelocity(e), { passive: true });
            console.log('🔮 [Prefetch] Quantum Scroll AI Aktif.');
        }
    },

    trackScrollVelocity(e) {
        if (this.cooling) return;

        const now = performance.now();
        const dt = now - this.lastTime;
        if (dt < 50) return;

        const velocity = Math.abs(e.deltaY) / dt;

        // Aşağı agresif scroll
        if (e.deltaY > 0 && velocity > 1.2) {
            const core = window.SovereignBoutiqueCore;
            if (!core?.renderedModules) return;

            const sockets = Array.from(document.querySelectorAll('.boutique-module-socket'));
            const unrendered = sockets.find(s => !core.renderedModules.has(s.dataset.category));
            if (!unrendered) return;

            const rect = unrendered.getBoundingClientRect();
            if (rect.top > 0 && rect.top < 1500) {
                console.log(`🔮 [Quantum Prefetch] Hız: ${velocity.toFixed(2)} | [${unrendered.dataset.category}] önden çiziliyor!`);
                core.injectModuleDOM(unrendered, unrendered.dataset.category);
                this.cooling = true;
                setTimeout(() => { this.cooling = false; }, 2000);
            }
        }

        this.lastTime = now;
    }
};

document.addEventListener('DOMContentLoaded', () => BoutiquePrefetch.init());
