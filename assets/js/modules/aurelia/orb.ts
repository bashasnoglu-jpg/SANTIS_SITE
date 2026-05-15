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

    private init(): void {
        (window as any).__AURELIA_ORB_ACTIVE__ = true;
        console.log("🌌 [Aurelia] Initializing Passive Sovereign Orb (Stabilization Pass H1-A)...");
        
        // Ensure DOM is ready if not called from bootloader
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.createElements());
        } else {
            this.createElements();
        }
    }

    private createElements(): void {
        // Final DOM safety check
        if (document.getElementById('aurelia-orb-container')) return;

        this.container = document.createElement('div');
        this.container.id = 'aurelia-orb-container';
        this.container.setAttribute('aria-label', 'Aurelia AI Interface');
        this.container.setAttribute('role', 'button');

        this.container.innerHTML = `
            <div class="aurelia-orb-ring"></div>
            <div class="aurelia-orb">
                <div class="aurelia-core"></div>
            </div>
        `;

        document.body.appendChild(this.container);
        this.bindEvents();
    }

    private bindEvents(): void {
        if (!this.container) return;

        this.container.addEventListener('click', () => {
            console.log("🌌 [Aurelia] Interaction Sovereignty triggered.");
            this.pulse();
        }, { passive: true });
    }

    private pulse(): void {
        if (typeof gsap === 'undefined') return;

        gsap.to(this.container, {
            scale: 1.2,
            duration: 0.3,
            ease: "power2.out",
            yoyo: true,
            repeat: 1
        });
    }

    /**
     * Set the orb's visual state (idle, listening, thinking)
     * To be expanded in Phase H1-B
     */
    public setState(state: 'idle' | 'listening' | 'thinking'): void {
        console.log(`🌌 [Aurelia] Transitioning to state: ${state}`);
        // Visual state logic to be implemented with tokens
    }
}

// Auto-initialize if running in browser
if (typeof window !== 'undefined') {
    (window as any).AureliaOrb = new SovereignOrb();
}
