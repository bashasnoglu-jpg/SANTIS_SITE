/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  🧠 AURELIA — SCHEDULER DETERMINISM (PHASE I7)               ║
 * ║  RAF Drift · Jitter Analytics · Frame Attribution           ║
 * ╚══════════════════════════════════════════════════════════════╝
 * 
 * 🛡️ GOVERNANCE: Observation, not Adaptation.
 * 🛡️ SCIENCE: Deterministic timing instrumentation.
 */

export enum AureliaExperienceEvent {
    INTENT_VISUALIZE = 'santis:experience.intent.visualize',
    DATASET_READY    = 'santis:experience.dataset.ready',
    ERROR_VISUALIZE  = 'santis:experience.error.visualize'
}

/**
 * 🛰️ Metrics & Analytics (Static Memory Allocation)
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

const ANALYTICS = {
    avgFrameDrift: 0,
    maxFrameDrift: 0,
    longFramesDetected: 0,
    avgTransitionLatency: 0,
    totalFrameCount: 0
};

const syncMetrics = () => {
    (window as any).__AURELIA_METRICS__ = { ...METRICS, analytics: ANALYTICS };
};

/**
 * 🛡️ Frame Guard: Monitors UI performance and RAF drift.
 */
class FrameGuard {
    private static instance: FrameGuard | null = null;
    private lastFrameTime = performance.now();
    private isCongested = false;
    private active: boolean = true;
    
    private readonly IDEAL_FRAME = 16.666;
    private driftSum = 0;

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
            const drift = Math.abs(delta - this.IDEAL_FRAME);

            // 🛰️ Analytics: Drift & Long Frame Tracking
            ANALYTICS.totalFrameCount++;
            this.driftSum += drift;
            ANALYTICS.avgFrameDrift = this.driftSum / ANALYTICS.totalFrameCount;
            if (drift > ANALYTICS.maxFrameDrift) ANALYTICS.maxFrameDrift = drift;
            if (delta > 32) ANALYTICS.longFramesDetected++;

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
    
    private totalLatencySum = 0;

    constructor(orb: any) {
        this.orb = orb;
    }

    public schedule(targetState: string): void {
        const scheduleTime = performance.now();
        METRICS.eventsReceived++;

        const multiplier = FrameGuard.getInstance().getSaturationMultiplier();
        const effectiveRefractory = VisualScheduler.BASE_REFRACTORY * multiplier;

        if (multiplier > 1 && scheduleTime - this.lastTransitionTime < effectiveRefractory) {
            METRICS.eventsDropped++;
            METRICS.saturationBlocks++;
            syncMetrics();
            return;
        }

        if (scheduleTime - this.lastTransitionTime < VisualScheduler.BASE_REFRACTORY) {
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

        this.executeTransition(targetState, scheduleTime);
    }

    private executeTransition(targetState: string, scheduleTime: number): void {
        this.currentState = targetState;
        this.lastTransitionTime = performance.now();
        
        if (this.staleWatchdog) clearTimeout(this.staleWatchdog);

        if (targetState !== 'idle') {
            this.staleWatchdog = setTimeout(() => this.softReset('stale state detected'), VisualScheduler.STALE_TIMEOUT);
        } else {
            this.staleWatchdog = null;
        }

        requestAnimationFrame(() => {
            if (this.orb?.setState) {
                const executionTime = performance.now();
                
                // 🛰️ Analytics: Transition Latency
                const latency = executionTime - scheduleTime;
                this.totalLatencySum += latency;
                ANALYTICS.avgTransitionLatency = this.totalLatencySum / (METRICS.transitionsExecuted + 1);

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
        this.executeTransition('idle', performance.now());
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
    if (activeBridgeCleanup) activeBridgeCleanup();
    if (!orb?.setState) return;

    const scheduler = new VisualScheduler(orb);
    const frameGuard = FrameGuard.getInstance();

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
