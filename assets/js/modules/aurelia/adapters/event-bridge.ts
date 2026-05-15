/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  🧠 AURELIA — RUNTIME SELF-HEALING (PHASE I3)                ║
 * ║  Stale State Watchdog · Soft Reset · Lifecycle Recovery     ║
 * ╚══════════════════════════════════════════════════════════════╝
 * 
 * 🛡️ GOVERNANCE: Core panic edebilir, Orb panic etmez.
 * 🛡️ RECOVERY: Bozulduğunda zarif şekilde toparlanabilmek.
 */

export enum AureliaExperienceEvent {
    INTENT_VISUALIZE = 'santis:experience.intent.visualize',
    DATASET_READY    = 'santis:experience.dataset.ready',
    ERROR_VISUALIZE  = 'santis:experience.error.visualize'
}

class AureliaTelemetry {
    public metrics = {
        eventsReceived: 0,
        eventsDropped: 0,
        transitionsExecuted: 0,
        refractoryBlocks: 0,
        topologyViolations: 0,
        saturationBlocks: 0,
        selfHeals: 0,
        reducedMotionActive: window.matchMedia('(prefers-reduced-motion: reduce)').matches
    };

    public logTransition(): void {
        this.metrics.transitionsExecuted++;
        this.sync();
    }

    public reportDrop(reason: 'refractory' | 'topology' | 'saturation'): void {
        this.metrics.eventsDropped++;
        if (reason === 'refractory') this.metrics.refractoryBlocks++;
        if (reason === 'topology') this.metrics.topologyViolations++;
        if (reason === 'saturation') this.metrics.saturationBlocks++;
        this.sync();
    }

    public reportSelfHeal(): void {
        this.metrics.selfHeals++;
        this.sync();
    }

    private sync(): void {
        (window as any).__AURELIA_METRICS__ = this.metrics;
    }
}

const telemetry = new AureliaTelemetry();

/**
 * 🛡️ Frame Guard: Monitors UI performance.
 */
class FrameGuard {
    private lastFrameTime = performance.now();
    private isCongested = false;

    constructor() {
        this.monitor();
    }

    private monitor(): void {
        const check = (now: number) => {
            const delta = now - this.lastFrameTime;
            this.isCongested = delta > 32;
            this.lastFrameTime = now;
            requestAnimationFrame(check);
        };
        requestAnimationFrame(check);
    }

    public getSaturationMultiplier(): number {
        return this.isCongested ? 2 : 1;
    }
}

const frameGuard = new FrameGuard();

/**
 * Visual Scheduler: Enforces composure, saturation protection, and self-healing.
 */
class VisualScheduler {
    private orb: any;
    private lastTransitionTime: number = 0;
    private readonly BASE_REFRACTORY = 120;
    private currentState: string = 'idle';
    private staleWatchdog: any = null;
    private readonly STALE_TIMEOUT = 10000; // 10s (Maximum time in non-idle state)

    private readonly ALLOWED_TRANSITIONS: Record<string, string[]> = {
        'idle':     ['thinking', 'active'],
        'thinking': ['active', 'idle'],
        'active':   ['idle'],
        'error':    ['idle']
    };

    constructor(orb: any) {
        this.orb = orb;
    }

    public schedule(targetState: string): void {
        telemetry.metrics.eventsReceived++;
        const now = performance.now();

        // 1. Dynamic Saturation Protection
        const multiplier = frameGuard.getSaturationMultiplier();
        const effectiveRefractory = this.BASE_REFRACTORY * multiplier;

        if (multiplier > 1 && now - this.lastTransitionTime < effectiveRefractory) {
            telemetry.reportDrop('saturation');
            return;
        }

        // 2. Base Rate Limiting
        if (now - this.lastTransitionTime < this.BASE_REFRACTORY) {
            telemetry.reportDrop('refractory');
            return;
        }

        // 3. Transition Validation
        const allowed = this.ALLOWED_TRANSITIONS[this.currentState] || [];
        if (!allowed.includes(targetState)) {
            telemetry.reportDrop('topology');
            return;
        }

        this.executeTransition(targetState);
    }

    /**
     * Executes the visual transition and resets the stale watchdog.
     */
    private executeTransition(targetState: string): void {
        this.currentState = targetState;
        this.lastTransitionTime = performance.now();
        
        // 🛡️ Stale Watchdog: Clear existing timer
        if (this.staleWatchdog) {
            clearTimeout(this.staleWatchdog);
            this.staleWatchdog = null;
        }

        // 🛡️ Stale Watchdog: Set new timer for non-idle states
        if (targetState !== 'idle') {
            this.staleWatchdog = setTimeout(() => {
                this.softReset('stale state detected');
            }, this.STALE_TIMEOUT);
        }

        requestAnimationFrame(() => {
            if (this.orb && typeof this.orb.setState === 'function') {
                this.orb.setState(targetState);
                telemetry.logTransition();
            }
        });
    }

    /**
     * 🛡️ Soft Reset: Emergency return to idle state.
     * Bypasses transition matrix to ensure recovery.
     */
    public softReset(reason: string): void {
        if (this.currentState === 'idle') return;
        
        console.warn(`🛡️ [Aurelia Recovery] Soft Reset: ${reason}`);
        telemetry.reportSelfHeal();
        this.executeTransition('idle');
    }
}

export function initSovereignBridge(orb: any): void {
    if (!orb || typeof orb.setState !== 'function') return;

    const scheduler = new VisualScheduler(orb);

    const handleEvent = (event: Event) => {
        try {
            switch (event.type) {
                case AureliaExperienceEvent.INTENT_VISUALIZE:
                    scheduler.schedule('thinking');
                    break;
                case AureliaExperienceEvent.DATASET_READY:
                    scheduler.schedule('active');
                    break;
                case AureliaExperienceEvent.ERROR_VISUALIZE:
                    scheduler.schedule('error');
                    break;
            }
        } catch (err) {
            // Fail-Silent
        }
    };

    Object.values(AureliaExperienceEvent).forEach(eventType => {
        document.addEventListener(eventType, handleEvent);
    });

    const cleanup = () => {
        Object.values(AureliaExperienceEvent).forEach(eventType => {
            document.removeEventListener(eventType, handleEvent);
        });
    };

    if (orb.registerCleanup) {
        orb.registerCleanup(cleanup);
    }

    // Expose reset for I3 manual audit
    (window as any).__AURELIA_RECOVERY__ = {
        softReset: () => scheduler.softReset('manual trigger')
    };

    (window as any).__AURELIA_METRICS__ = telemetry.metrics;
}
