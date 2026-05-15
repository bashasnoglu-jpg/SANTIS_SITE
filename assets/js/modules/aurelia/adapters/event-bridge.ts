/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  🧠 AURELIA — STATIC ADAPTER CONTRACT (PHASE H1-D-A)         ║
 * ║  Technical Specification · Event Types · Payload Shapes     ║
 * ╚══════════════════════════════════════════════════════════════╝
 * 
 * 🛡️ GOVERNANCE: This file defines the technical contract. 
 * STATUS: SEALED (No runtime execution).
 * PRINCIPLE: Visual events are advisory-only. Fail silent.
 */

/**
 * Permitted Experience Events (Inbound from Core)
 */
export enum AureliaExperienceEvent {
    INTENT_VISUALIZE = 'santis:experience.intent.visualize',
    DATASET_READY    = 'santis:experience.dataset.ready',
    ERROR_VISUALIZE  = 'santis:experience.error.visualize'
}

/**
 * Payload Shapes for Inbound Signals
 */
export interface AureliaPayloadMap {
    [AureliaExperienceEvent.INTENT_VISUALIZE]: {
        intent: string;      // e.g., 'analyzing', 'thinking', 'fetching'
        confidence?: number; // visual-only indicator
    };
    [AureliaExperienceEvent.DATASET_READY]: {
        source: string;      // e.g., 'oracle', 'ritual_catalog'
        timestamp: number;
    };
    [AureliaExperienceEvent.ERROR_VISUALIZE]: {
        code: string;
        message: string;
        silent: boolean;     // If true, orb simply returns to idle
    };
}

/**
 * 🛑 FUTURE REGISTRATION LOGIC (UNACTIVATED)
 * Implementation delayed to Phase H1-D-B
 */
// export function initSovereignBridge(orb: any): void { ... }
