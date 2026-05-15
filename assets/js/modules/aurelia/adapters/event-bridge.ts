/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  🧠 AURELIA — PASSIVE DOM BRIDGE (PHASE H1-D-B)               ║
 * ║  Runtime Listeners · Fail-Silent Reactivity · Sealed State   ║
 * ╚══════════════════════════════════════════════════════════════╝
 * 
 * 🛡️ GOVERNANCE: Passive inbound bridge only. 
 * PRINCIPLE: Visual events are advisory-only. Fail silent.
 * NO OUTBOUND DISPATCH. NO CORE MUTATION.
 */

export enum AureliaExperienceEvent {
    INTENT_VISUALIZE = 'santis:experience.intent.visualize',
    DATASET_READY    = 'santis:experience.dataset.ready',
    ERROR_VISUALIZE  = 'santis:experience.error.visualize'
}

/**
 * 🛰️ Sovereign Bridge — Inbound Listener Logic
 * This function connects the Orb to the System Event Bus via DOM.
 * It is PASSIVE: it only listens and updates the Orb's local state.
 */
export function initSovereignBridge(orb: any): void {
    if (!orb || typeof orb.setState !== 'function') {
        console.warn('⚠️ [Aurelia Bridge] Invalid Orb instance provided. Bridge aborted.');
        return;
    }

    const handleEvent = (event: Event) => {
        try {
            const customEvent = event as CustomEvent;
            const detail = customEvent.detail;

            switch (event.type) {
                case AureliaExperienceEvent.INTENT_VISUALIZE:
                    // Map core intent to Orb visual state
                    orb.setState('thinking');
                    break;

                case AureliaExperienceEvent.DATASET_READY:
                    // Map data readiness to Orb active state
                    orb.setState('active');
                    break;

                case AureliaExperienceEvent.ERROR_VISUALIZE:
                    // Map error signal to Orb idle/error visual
                    orb.setState('idle');
                    break;

                default:
                    // Fail silent for unknown whitelisted events
                    break;
            }
        } catch (err) {
            // 🛡️ Fail Silent: Core functionality must remain independent
            // No error propagation to the global scope
        }
    };

    // Whitelisted Listeners
    Object.values(AureliaExperienceEvent).forEach(eventType => {
        document.addEventListener(eventType, handleEvent);
    });

    /**
     * Cleanup mechanism to prevent memory leaks during hot-reloads or navigation
     */
    const cleanup = () => {
        Object.values(AureliaExperienceEvent).forEach(eventType => {
            document.removeEventListener(eventType, handleEvent);
        });
    };

    // Attach cleanup to orb for lifecycle management
    if (orb.registerCleanup) {
        orb.registerCleanup(cleanup);
    }
}
