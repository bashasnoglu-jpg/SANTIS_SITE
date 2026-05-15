/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  🧠 AURELIA — VISUAL MAPPING IMPLEMENTATION (PHASE H1-D-C)    ║
 * ║  Visual Scheduler · Transition Matrix · Rate Limiting        ║
 * ╚══════════════════════════════════════════════════════════════╝
 * 
 * 🛡️ GOVERNANCE: Visualize-only. No decision authority.
 * PRINCIPLE: Core panic edebilir, Orb panic etmez.
 */

export enum AureliaExperienceEvent {
    INTENT_VISUALIZE = 'santis:experience.intent.visualize',
    DATASET_READY    = 'santis:experience.dataset.ready',
    ERROR_VISUALIZE  = 'santis:experience.error.visualize'
}

/**
 * Visual Scheduler: Enforces composure and valid visual topology.
 * Prevents visual chaos during event storms.
 */
class VisualScheduler {
    private orb: any;
    private lastTransitionTime: number = 0;
    private readonly REFRACTORY_PERIOD = 120; // ms
    private currentState: string = 'idle';

    // Transition Matrix: Allowed visual topology
    private readonly ALLOWED_TRANSITIONS: Record<string, string[]> = {
        'idle':     ['thinking', 'active'],
        'thinking': ['active', 'idle'],
        'active':   ['idle'],
        'error':    ['idle'] // ERROR -> ACTIVE is forbidden (must pass through idle/fade)
    };

    constructor(orb: any) {
        this.orb = orb;
    }

    /**
     * Schedules a state change if it complies with governance rules.
     */
    public schedule(targetState: string): void {
        const now = performance.now();

        // 1. Rate Limiting (Refractory Period)
        if (now - this.lastTransitionTime < this.REFRACTORY_PERIOD) {
            return; // Dropped silently (Fail-Silent)
        }

        // 2. Transition Validation (Topology Check)
        const allowed = this.ALLOWED_TRANSITIONS[this.currentState] || [];
        if (!allowed.includes(targetState)) {
            return; // Forbidden transition dropped silently
        }

        // 3. Execution (Compositor-Only Mapping)
        this.currentState = targetState;
        this.lastTransitionTime = now;
        
        requestAnimationFrame(() => {
            if (this.orb && typeof this.orb.setState === 'function') {
                this.orb.setState(targetState);
            }
        });
    }

    public getCurrentState(): string {
        return this.currentState;
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
            // Fail-Silent: Core remains independent
        }
    };

    // Whitelisted Listeners
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
}
