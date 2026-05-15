/**
 * 🌌 AURELIA — SOVEREIGN ORB ORCHESTRATOR v1.0
 * Governance: Phase H1-A (Passive State)
 * Responsibility: Visual Sovereignty & Experience Shell
 */

export class SovereignOrb {
    private container: HTMLElement | null = null;
    private orb: HTMLElement | null = null;

    constructor() {
        if ((window as any).__AURELIA_ORB_ACTIVE__) {
            console.warn("🌌 [Aurelia] Active instance detected. Aborting duplicate boot.");
            return;
        }
        this.init();
    }

    private setters: any = {};

    private init(): void {
        (window as any).__AURELIA_ORB_ACTIVE__ = true;
        console.log("🌌 [Aurelia] Initializing Presence Layer (H1-B)...");
        
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
            const currentState = this.container?.dataset.state || 'idle';
            const nextState = currentState === 'idle' ? 'listening' : 'idle';
            this.setState(nextState as any);
            this.pulse();
        }, { passive: true });

        window.addEventListener('mousemove', (e) => this.handleProximity(e), { passive: true });
        window.addEventListener('scroll', () => this.handleScroll(), { passive: true });
    }

    /**
     * Set the orb's visual state (idle, listening, thinking)
     */
    public setState(state: 'idle' | 'listening' | 'thinking'): void {
        if (!this.container || typeof gsap === 'undefined') return;

        console.log(`🌌 [Aurelia] Transitioning to state: ${state}`);
        this.container.dataset.state = state;

        // Reset classes
        this.container.classList.remove('is-relaxed', 'is-alert', 'is-listening', 'is-thinking');

        const tl = gsap.timeline();

        if (state === 'listening') {
            this.container.classList.add('is-listening');
            tl.to('.aurelia-orb-ring', { scale: 1.5, opacity: 0.6, duration: 0.6, ease: "back.out(2)" });
        } else if (state === 'thinking') {
            this.container.classList.add('is-thinking');
            tl.to('.aurelia-orb-ring', { scale: 1.2, opacity: 0.4, rotate: 360, repeat: -1, duration: 2, ease: "linear" });
        } else {
            this.container.classList.add('is-relaxed');
            tl.to('.aurelia-orb-ring', { scale: 1.1, opacity: 0.3, rotate: 0, duration: 0.6, ease: "power2.inOut" });
        }
    }

    private handleProximity(e: MouseEvent): void {
        if (!this.container || !this.setters.scale || this.container.dataset.state === 'listening') return;
        
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
        if (typeof gsap === 'undefined' || this.container?.dataset.state === 'listening') return;
        const scrollPercent = window.scrollY / (document.body.scrollHeight - window.innerHeight || 1);
        gsap.to('.aurelia-orb-ring', {
            scale: 1.1 + (scrollPercent * 0.3),
            opacity: 0.2 + (scrollPercent * 0.4),
            duration: 1,
            ease: "sine.out"
        });
    }

    private pulse(): void {
        if (!this.container || typeof gsap === 'undefined') return;

        // 🌊 Ripple Effect
        const ripple = this.container.querySelector('.aurelia-ripple');
        if (ripple) {
            gsap.fromTo(ripple, 
                { scale: 0.8, opacity: 0.8 },
                { scale: 2.5, opacity: 0, duration: 0.8, ease: "power2.out" }
            );
        }

        gsap.to(this.container, {
            scale: 1.3,
            duration: 0.2,
            ease: "back.out(2)",
            yoyo: true,
            repeat: 1
        });
    }
}

// Auto-initialize if running in browser
if (typeof window !== 'undefined') {
    (window as any).AureliaOrb = new SovereignOrb();
}
