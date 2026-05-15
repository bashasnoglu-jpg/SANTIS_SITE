import { initSovereignBridge } from './adapters/event-bridge';

export class SovereignOrb {
    private container: HTMLElement | null = null;
    private setters: any = {};
    private cleanups: Array<() => void> = [];

    constructor() {
        if ((window as any).__AURELIA_ORB_ACTIVE__) {
            console.warn("🌌 [Aurelia] Active instance detected. Aborting duplicate boot.");
            return;
        }
        this.init();
    }

    private init(): void {
        (window as any).__AURELIA_ORB_ACTIVE__ = true;
        console.log("🌌 [Aurelia] Initializing Experience Bridge (H1-D-C - Mounted)...");
        
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
            <div class="aurelia-ripple"></div>
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
        
        // 🛰️ Mount Intelligence Bridge
        initSovereignBridge(this);
    }

    private initSetters(): void {
        if (typeof gsap === 'undefined') return;
        this.setters.scale = gsap.quickSetter(this.container, "scale");
        this.setters.glowOpacity = gsap.quickSetter(".aurelia-glow", "opacity");
        this.setters.glowScale = gsap.quickSetter(".aurelia-glow", "scale");
    }

    private bindEvents(): void {
        if (!this.container) return;

        this.container.addEventListener('click', () => {
            this.pulse();
            this.ripple();
        }, { passive: true });

        // Presence Layer: Proximity & Scroll
        window.addEventListener('mousemove', (e) => this.handleProximity(e), { passive: true });
        window.addEventListener('scroll', () => this.handleScroll(), { passive: true });
    }

    private pulse(): void {
        if (!this.container || typeof gsap === 'undefined') return;
        
        gsap.to(this.container, {
            scale: 1.3,
            duration: 0.2,
            ease: "back.out(2)",
            yoyo: true,
            repeat: 1
        });
    }

    private ripple(): void {
        if (!this.container || typeof gsap === 'undefined') return;
        
        const rippleEl = this.container.querySelector('.aurelia-ripple');
        if (rippleEl) {
            gsap.fromTo(rippleEl, 
                { scale: 0.8, opacity: 0.8 },
                { scale: 2.5, opacity: 0, duration: 0.8, ease: "power2.out" }
            );
        }
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

    /**
     * Updates the Orb's visual state based on system-wide signals.
     * 🛡️ Governance: Compositor-only, Non-authoritative.
     */
    public setState(state: string): void {
        if (!this.container || typeof gsap === 'undefined') return;

        console.log(`🌌 [Aurelia] Visual Transition: ${state}`);
        this.container.dataset.state = state;

        switch (state) {
            case 'thinking':
                gsap.to(".aurelia-glow", { 
                    opacity: 0.8, 
                    scale: 1.4, 
                    duration: 0.6, 
                    repeat: -1, 
                    yoyo: true, 
                    ease: "sine.inOut" 
                });
                break;
            case 'active':
                this.pulse();
                this.ripple();
                break;
            case 'idle':
            default:
                gsap.killTweensOf(".aurelia-glow");
                gsap.to(".aurelia-glow", { opacity: 0.4, scale: 1, duration: 1 });
                break;
        }
    }

    public registerCleanup(fn: () => void): void {
        this.cleanups.push(fn);
    }

    public destroy(): void {
        this.cleanups.forEach(fn => fn());
        this.container?.remove();
        (window as any).__AURELIA_ORB_ACTIVE__ = false;
    }
}

if (!window.__SANTIS_SYSTEM_INITIALIZED__) {
    new SovereignOrb();
}
