/**
 * SANTIS TRANSITION ENGINE v1.0 (Cinematic Fade)
 * Handles page navigation with theater-like transitions.
 */

class SantisTransition {
    constructor() {
        this.overlay = null;
        this.init();
    }

    init() {
        console.log("🎬 [Santis Cinema] Transition Engine Ready");

        // 1. Create Overlay
        this.createOverlay();

        // 2. Play Entry Animation (Fade In)
        window.addEventListener('load', () => this.playEntry());

        // 3. Bind Links (Fade Out)
        document.addEventListener('click', (e) => this.onLinkClick(e));

        // 4. Handle Back/Forward Cache (Safari/Chrome restoration)
        window.addEventListener('pageshow', (e) => {
            if (e.persisted) {
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

        // Force Reflow
        void this.overlay.offsetWidth;

        // Fade Out the Black Overlay (Revealing the page)
        requestAnimationFrame(() => {
            this.overlay.style.opacity = '0';
        });
    }

    playExit(url) {
        if (!this.overlay) this.createOverlay();

        // Fade In the Black Overlay (Hiding the page)
        this.overlay.style.opacity = '1';

        // Wait for animation then navigate
        setTimeout(() => {
            window.location.href = url;
        }, 800); // Match transition duration (0.8s)
    }

    onLinkClick(e) {
        // Find anchor tag
        const link = e.target.closest('a');
        if (!link) return;

        const href = link.getAttribute('href');
        const target = link.getAttribute('target');

        // Ignore cases
        if (
            !href ||
            href.startsWith('#') ||
            href.startsWith('mailto:') ||
            href.startsWith('tel:') ||
            target === '_blank' ||
            e.ctrlKey || e.metaKey ||
            href.includes('javascript:')
        ) return;

        // Internal Link Check
        const isInternal = href.startsWith('/') || href.includes(window.location.hostname) || !href.startsWith('http');

        if (isInternal) {
            e.preventDefault();
            console.log(`🎬 [Transition] Exiting to: ${href}`);
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
