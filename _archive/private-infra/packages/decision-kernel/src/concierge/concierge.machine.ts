import { setup, assign } from 'xstate';
import type { TelemetrySignal } from '@santis/domain-schema/telemetry';
import type { ConciergeEvent, BoardroomOverrideMode } from '@santis/event-dictionary';

// Düzeltme 4: Karar Çıktısı Nesnesi (Zenginleştirilmiş Output Object)
export interface ConciergeDecision {
  reduceChoices: boolean;
  showConcierge: boolean;
  prioritizeSingleCTA: boolean;
  alertBoardroom: boolean;
  reasonCodes: string[];
}

export interface ConciergeContext {
  activeSignals: TelemetrySignal[];
  decision: ConciergeDecision;
  // Düzeltme 5: Egemen Override Modeli
  overrideMode: BoardroomOverrideMode | null;
}

const defaultDecision: ConciergeDecision = {
  reduceChoices: false,
  showConcierge: false,
  prioritizeSingleCTA: false,
  alertBoardroom: false,
  reasonCodes: []
};

export const conciergeMachine = setup({
  types: {
    context: {} as ConciergeContext,
    events: {} as ConciergeEvent
  },
  actions: {
    appendSignal: assign({
      activeSignals: ({ context, event }) => 
        event.type === 'SIGNAL_RECEIVED' 
          ? [...context.activeSignals, event.signal] 
          : context.activeSignals
    }),
    
    evaluateAutonomy: assign({
      decision: ({ context }) => {
        // İnsan override'ı her zaman otonomiyi ezer
        if (context.overrideMode === 'force_reduce') {
          return {
            reduceChoices: true,
            showConcierge: true,
            prioritizeSingleCTA: true,
            alertBoardroom: false, // Zaten admin komutada, tekrar alarm verme
            reasonCodes: ['BOARDROOM_FORCED_REDUCE']
          };
        }
        
        if (context.overrideMode === 'force_normal') {
          return {
            ...defaultDecision,
            reasonCodes: ['BOARDROOM_FORCED_NORMAL']
          };
        }

        // Override yoksa (null veya resume_autonomy), heuristic mantık çalışır
        const hasCriticalHesitation = context.activeSignals.some(
          s => s.signalType === 'hesitation_index' && s.value > 80
        );

        if (hasCriticalHesitation) {
          return {
            reduceChoices: true,
            showConcierge: true,
            prioritizeSingleCTA: true,
            alertBoardroom: true,
            reasonCodes: ['AUTO_CRITICAL_HESITATION_DETECTED']
          };
        }

        return defaultDecision;
      }
    }),

    applyOverride: assign({
      overrideMode: ({ event }) => event.type === 'BOARDROOM_OVERRIDE' ? event.mode : null
    })
  }
}).createMachine({
  id: 'ConciergeAdaptiveUX',
  initial: 'monitoring',
  context: {
    activeSignals: [],
    decision: defaultDecision,
    overrideMode: null
  },
  on: {
    // Override global olarak dinlenir
    BOARDROOM_OVERRIDE: {
      actions: ['applyOverride', 'evaluateAutonomy']
    }
  },
  states: {
    monitoring: {
      on: {
        SIGNAL_RECEIVED: {
          actions: ['appendSignal', 'evaluateAutonomy']
        }
      }
    }
  }
});
