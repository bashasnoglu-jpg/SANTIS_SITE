/**
 * SANTIS TRANSITION ENGINE v1.0 (Cinematic Fade)
 * Handles page navigation with theater-like transitions.
 */

class SantisTransition {
    constructor() {
        this.overlay = null;
        this.isTransitioning = false; // 🔒 Çift-tıklama koruyucu
        this.init();
    }

    init() {
        console.log("🎬 [Santis Cinema] Transition Engine Ready");
        this.createOverlay();
        window.addEventListener('load', () => this.playEntry());
        document.addEventListener('click', (e) => this.onLinkClick(e));
        window.addEventListener('pageshow', (e) => {
            if (e.persisted) {
                this.isTransitioning = false; // BFCache dönüşünde kilidi aç
                this.playEntry();
            }
        });
    }

    createOverlay() {
        const id = 'santis-transition-curtain';
        if (document.getElementById(id)) return;
        this.overlay = document.createElement('div');
        this.overlay.id = id;
        this.overlay.style.cssText = `
            position: fixed;
            top: 0; left: 0;
            width: 100vw; height: 100vh;
            background: #000;
            z-index: 99999;
            pointer-events: none;
            opacity: 1;
            transition: opacity 0.8s cubic-bezier(0.22, 1, 0.36, 1);
        `;
        document.body.appendChild(this.overlay);
    }

    playEntry() {
        if (!this.overlay) this.createOverlay();
        void this.overlay.offsetWidth;
        requestAnimationFrame(() => {
            this.overlay.style.opacity = '0';
            // Giriş tamamlanınca kilidi aç
            setTimeout(() => { this.isTransitioning = false; }, 900);
        });
    }

    playExit(url) {
        if (this.isTransitioning) return; // 🔒 Zaten geçiş varsa sessizce iptal et
        this.isTransitioning = true;

        if (!this.overlay) this.createOverlay();
        this.overlay.style.opacity = '1';

        setTimeout(() => {
            try {
                window.location.href = url;
            } catch (e) {
                // AbortError / InvalidStateError — sessizce yakala, kilidi aç
                this.isTransitioning = false;
                console.warn('[Santis Transition] Navigasyon iptal edildi, kilit açıldı.');
            }
        }, 800);
    }

    onLinkClick(e) {
        const link = e.target.closest('a');
        if (!link) return;
        const href = link.getAttribute('href');
        const target = link.getAttribute('target');
        if (
            !href ||
            href.startsWith('#') ||
            href.startsWith('mailto:') ||
            href.startsWith('tel:') ||
            target === '_blank' ||
            e.ctrlKey || e.metaKey ||
            href.includes('javascript:')
        ) return;
        const isInternal = href.startsWith('/') || href.includes(window.location.hostname) || !href.startsWith('http');
        if (isInternal) {
            e.preventDefault();
            this.playExit(href);
        }
    }
}

// Auto-Launch
document.addEventListener('DOMContentLoaded', () => {
    // Only activate if not in Admin Panel
    if (!window.location.pathname.includes('/admin/')) {
        window.SantisTransition = new SantisTransition();
    }
});
