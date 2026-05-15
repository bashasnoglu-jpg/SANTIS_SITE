/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  🧠 AURELIA — RUNTIME OBSERVABILITY (PHASE I1)               ║
 * ║  Health Counters · Transition Logs · Zero Outbound          ║
 * ╚══════════════════════════════════════════════════════════════╝
 * 
 * 🛡️ GOVERNANCE: Inbound metrics only. 
 * PRINCIPLE: Zero outbound telemetry unless approved.
 */

export enum AureliaExperienceEvent {
    INTENT_VISUALIZE = 'santis:experience.intent.visualize',
    DATASET_READY    = 'santis:experience.dataset.ready',
    ERROR_VISUALIZE  = 'santis:experience.error.visualize'
}

/**
 * 🛰️ Aurelia Telemetry Service (Local Only)
 */
class AureliaTelemetry {
    public metrics = {
        eventsReceived: 0,
        eventsDropped: 0,
        transitionsExecuted: 0,
        refractoryBlocks: 0,
        topologyViolations: 0,
        reducedMotionActive: window.matchMedia('(prefers-reduced-motion: reduce)').matches
    };

    public logTransition(from: string, to: string): void {
        this.metrics.transitionsExecuted++;
        // Quiet Luxury: Silent logging to window only for audit
        (window as any).__AURELIA_METRICS__ = this.metrics;
    }

    public reportDrop(reason: 'refractory' | 'topology'): void {
        this.metrics.eventsDropped++;
        if (reason === 'refractory') this.metrics.refractoryBlocks++;
        if (reason === 'topology') this.metrics.topologyViolations++;
        (window as any).__AURELIA_METRICS__ = this.metrics;
    }
}

const telemetry = new AureliaTelemetry();

/**
 * Visual Scheduler: Enforces composure and valid visual topology.
 */
class VisualScheduler {
    private orb: any;
    private lastTransitionTime: number = 0;
    private readonly REFRACTORY_PERIOD = 120; // ms
    private currentState: string = 'idle';

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

        // 1. Rate Limiting
        if (now - this.lastTransitionTime < this.REFRACTORY_PERIOD) {
            telemetry.reportDrop('refractory');
            return;
        }

        // 2. Transition Validation
        const allowed = this.ALLOWED_TRANSITIONS[this.currentState] || [];
        if (!allowed.includes(targetState)) {
            telemetry.reportDrop('topology');
            return;
        }

        // 3. Execution
        const fromState = this.currentState;
        this.currentState = targetState;
        this.lastTransitionTime = now;
        
        requestAnimationFrame(() => {
            if (this.orb && typeof this.orb.setState === 'function') {
                this.orb.setState(targetState);
                telemetry.logTransition(fromState, targetState);
            }
        });
    }
}

/**
 * 🛰️ Sovereign Bridge — Inbound Listener Logic
 */
export function initSovereignBridge(orb: any): void {
    if (!orb || typeof orb.setState !== 'function') {
        console.warn('⚠️ [Aurelia Bridge] Invalid Orb instance. Bridge aborted.');
        return;
    }

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

    // Expose metrics for I1-A audit
    (window as any).__AURELIA_METRICS__ = telemetry.metrics;
}
