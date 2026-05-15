export class SovereignOrb {
    private container: HTMLElement | null = null;
    private setters: any = {};

    constructor() {
        if ((window as any).__AURELIA_ORB_ACTIVE__) {
            console.warn("🌌 [Aurelia] Active instance detected. Aborting duplicate boot.");
            return;
        }
        this.init();
    }

    private init(): void {
        (window as any).__AURELIA_ORB_ACTIVE__ = true;
        console.log("🌌 [Aurelia] Initializing Presence Layer (H1-B - Sealed)...");
        
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.createElements());
        } else {
            this.createElements();
        }
    }

    private createElements(): void {
        if (document.getElementById('aurelia-orb-container')) return;

        this.container = document.createElement('div');
        this.container.id = 'aurelia-orb-container';
        this.container.innerHTML = `
            <div class="aurelia-glow"></div>
            <div class="aurelia-orb-ring"></div>
            <div class="aurelia-orb">
                <div class="aurelia-core"></div>
            </div>
        `;

        document.body.appendChild(this.container);
        this.initSetters();
        this.bindEvents();
        this.applyContext();
    }

    private initSetters(): void {
        if (typeof gsap === 'undefined') return;
        this.setters.scale = gsap.quickSetter(this.container, "scale");
        this.setters.glowOpacity = gsap.quickSetter(".aurelia-glow", "opacity");
        this.setters.glowScale = gsap.quickSetter(".aurelia-glow", "scale");
    }

    private bindEvents(): void {
        if (!this.container) return;

        // Presence Layer: Proximity & Scroll Only
        window.addEventListener('mousemove', (e) => this.handleProximity(e), { passive: true });
        window.addEventListener('scroll', () => this.handleScroll(), { passive: true });
    }

    private handleProximity(e: MouseEvent): void {
        if (!this.container || !this.setters.scale) return;
        
        // ♿ Accessibility: Respect reduced motion preference
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

        const rect = this.container.getBoundingClientRect();
        const orbX = rect.left + rect.width / 2;
        const orbY = rect.top + rect.height / 2;
        
        const dist = Math.sqrt(Math.pow(e.clientX - orbX, 2) + Math.pow(e.clientY - orbY, 2));
        const proximity = Math.max(0, 1 - dist / 400); 

        this.setters.scale(1 + (proximity * 0.2));
        this.setters.glowOpacity(0.3 + (proximity * 0.7));
        this.setters.glowScale(1 + (proximity * 0.8));
    }

    private handleScroll(): void {
        if (typeof gsap === 'undefined' || !this.container) return;
        
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

        const scrollPercent = window.scrollY / (document.body.scrollHeight - window.innerHeight || 1);
        gsap.to('.aurelia-orb-ring', {
            scale: 1.1 + (scrollPercent * 0.3),
            opacity: 0.2 + (scrollPercent * 0.4),
            duration: 1,
            ease: "sine.out"
        });
    }

    private applyContext(): void {
        const page = document.body.dataset.page || 'index';
        this.container?.classList.add(`is-page-${page}`);
        console.log(`🌌 [Aurelia] Context applied: ${page}`);
    }
}

if (!window.__SANTIS_SYSTEM_INITIALIZED__) {
    new SovereignOrb();
}
