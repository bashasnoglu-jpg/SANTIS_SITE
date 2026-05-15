/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  🧠 AURELIA — MEMORY & ALLOCATION DISCIPLINE (PHASE I6)      ║
 * ║  Closure Reduction · Static Extraction · Resource Pooling    ║
 * ╚══════════════════════════════════════════════════════════════╝
 * 
 * 🛡️ GOVERNANCE: Zero Memory Creep.
 * 🛡️ DISCIPLINE: Minimize allocations in high-frequency paths.
 */

export enum AureliaExperienceEvent {
    INTENT_VISUALIZE = 'santis:experience.intent.visualize',
    DATASET_READY    = 'santis:experience.dataset.ready',
    ERROR_VISUALIZE  = 'santis:experience.error.visualize'
}

/**
 * 🛰️ Metrics Registry (Static Memory Allocation)
 */
const METRICS = {
    eventsReceived: 0,
    eventsDropped: 0,
    transitionsExecuted: 0,
    refractoryBlocks: 0,
    topologyViolations: 0,
    saturationBlocks: 0,
    selfHeals: 0,
    reducedMotionActive: window.matchMedia('(prefers-reduced-motion: reduce)').matches
};

const syncMetrics = () => {
    (window as any).__AURELIA_METRICS__ = METRICS;
};

/**
 * 🛡️ Frame Guard: Monitors UI performance.
 * Singleton instance to prevent multiple RAF loops.
 */
class FrameGuard {
    private static instance: FrameGuard | null = null;
    private lastFrameTime = performance.now();
    private isCongested = false;
    private active: boolean = true;

    private constructor() {
        this.monitor();
    }

    public static getInstance(): FrameGuard {
        if (!this.instance) this.instance = new FrameGuard();
        this.instance.active = true;
        return this.instance;
    }

    private monitor(): void {
        const check = (now: number) => {
            if (!this.active) return;
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

    public deactivate(): void {
        this.active = false;
    }
}

/**
 * Visual Scheduler: Enforces composure and saturation protection.
 * Extracted static logic to reduce instance memory pressure.
 */
class VisualScheduler {
    private static readonly ALLOWED_TRANSITIONS: Record<string, string[]> = {
        'idle':     ['thinking', 'active'],
        'thinking': ['active', 'idle'],
        'active':   ['idle'],
        'error':    ['idle']
    };

    private static readonly BASE_REFRACTORY = 120;
    private static readonly STALE_TIMEOUT = 10000;

    private orb: any;
    private lastTransitionTime: number = 0;
    private currentState: string = 'idle';
    private staleWatchdog: any = null;

    constructor(orb: any) {
        this.orb = orb;
    }

    public schedule(targetState: string): void {
        METRICS.eventsReceived++;
        const now = performance.now();

        const multiplier = FrameGuard.getInstance().getSaturationMultiplier();
        const effectiveRefractory = VisualScheduler.BASE_REFRACTORY * multiplier;

        if (multiplier > 1 && now - this.lastTransitionTime < effectiveRefractory) {
            METRICS.eventsDropped++;
            METRICS.saturationBlocks++;
            syncMetrics();
            return;
        }

        if (now - this.lastTransitionTime < VisualScheduler.BASE_REFRACTORY) {
            METRICS.eventsDropped++;
            METRICS.refractoryBlocks++;
            syncMetrics();
            return;
        }

        const allowed = VisualScheduler.ALLOWED_TRANSITIONS[this.currentState] || [];
        if (!allowed.includes(targetState)) {
            METRICS.eventsDropped++;
            METRICS.topologyViolations++;
            syncMetrics();
            return;
        }

        this.executeTransition(targetState);
    }

    private executeTransition(targetState: string): void {
        this.currentState = targetState;
        this.lastTransitionTime = performance.now();
        
        if (this.staleWatchdog) {
            clearTimeout(this.staleWatchdog);
        }

        if (targetState !== 'idle') {
            this.staleWatchdog = setTimeout(() => this.softReset('stale state detected'), VisualScheduler.STALE_TIMEOUT);
        } else {
            this.staleWatchdog = null;
        }

        requestAnimationFrame(() => {
            if (this.orb?.setState) {
                this.orb.setState(targetState);
                METRICS.transitionsExecuted++;
                syncMetrics();
            }
        });
    }

    public softReset(reason: string): void {
        if (this.currentState === 'idle') return;
        console.warn(`🛡️ [Aurelia Recovery] Soft Reset: ${reason}`);
        METRICS.selfHeals++;
        this.executeTransition('idle');
    }

    public destroy(): void {
        if (this.staleWatchdog) {
            clearTimeout(this.staleWatchdog);
            this.staleWatchdog = null;
        }
    }
}

/**
 * 🛰️ Sovereign Bridge — Life-cycle Guard
 */
let activeBridgeCleanup: (() => void) | null = null;

export function initSovereignBridge(orb: any): void {
    if (activeBridgeCleanup) {
        activeBridgeCleanup();
    }

    if (!orb?.setState) return;

    const scheduler = new VisualScheduler(orb);
    const frameGuard = FrameGuard.getInstance();

    // 🛡️ Closure Pressure Reduction: Static Handler
    const handleEvent = (event: Event) => {
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
    };

    const eventTypes = Object.values(AureliaExperienceEvent);
    eventTypes.forEach(type => document.addEventListener(type, handleEvent));

    const cleanup = () => {
        eventTypes.forEach(type => document.removeEventListener(type, handleEvent));
        scheduler.destroy();
        frameGuard.deactivate();
        activeBridgeCleanup = null;
    };

    activeBridgeCleanup = cleanup;
    if (orb.registerCleanup) orb.registerCleanup(cleanup);

    (window as any).__AURELIA_RECOVERY__ = {
        softReset: () => scheduler.softReset('manual trigger'),
        destroy: () => cleanup()
    };

    syncMetrics();
}
