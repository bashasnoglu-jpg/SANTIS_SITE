import type {
  AutonomousAction,
  AutonomousActionInput,
} from './actions.contract.ts';
import { actionRegistry } from './actions.registry.ts';

function buildAction(
  type: keyof typeof actionRegistry,
  explanationCodes: string[],
  payload?: Record<string, unknown>
): AutonomousAction {
  return {
    id: `act_${crypto.randomUUID()}`,
    type,
    severity: actionRegistry[type].severity as 'low' | 'medium' | 'high',
    autoExecutable: actionRegistry[type].autoExecutable,
    explanationCodes,
    payload,
  };
}

export function deriveAutonomousActions(
  input: AutonomousActionInput
): AutonomousAction[] {
  const actions: AutonomousAction[] = [];

  if (input.funnel.hiddenServiceIds.length > 0) {
    actions.push(
      buildAction('REORDER_SERVICES', ['DECISION_REDUCE_CHOICES'], {
        hiddenServiceIds: input.funnel.hiddenServiceIds,
        promotedServiceId: input.funnel.promotedServiceId,
      })
    );
  }

  if (input.decision.shouldHideLowConfidenceSlots) {
    actions.push(
      buildAction('HIDE_LOW_CONFIDENCE_SLOTS', ['DECISION_HIDE_LOW_CONFIDENCE_SLOTS'], {
        minSlotConfidence: input.decision.minSlotConfidence,
      })
    );
  }

  if (input.funnel.shouldEmphasizeConciergePath || input.decision.shouldOfferConciergeAssist) {
    actions.push(
      buildAction('SHOW_CONCIERGE_PRIORITY_CTA', [
        'FUNNEL_CONCIERGE_PATH_EMPHASIZED',
      ])
    );
  }

  if (input.decision.shouldReduceChoices || input.funnel.shouldUseCompactLayout) {
    actions.push(
      buildAction('ENABLE_COMPACT_LAYOUT', ['FUNNEL_COMPACT_LAYOUT'], {
        maxVisibleServices: input.decision.maxVisibleServices,
      })
    );
  }

  if (input.decision.shouldSuppressAggressiveUpsell) {
    actions.push(
      buildAction('SUPPRESS_UPSELLS', [
        input.telemetry.degraded ? 'DEGRADED_RUNTIME' : 'QUOTE_LATENCY_HIGH',
      ])
    );
  }

  if (
    input.telemetry.lastEvent === 'QUOTE_FAILED' ||
    (input.telemetry.quoteLatencyMs ?? 0) > 1200
  ) {
    actions.push(
      buildAction('SHOW_QUOTE_RECOVERY_BANNER', ['QUOTE_FAILURE_RECOVERY'], {
        quoteLatencyMs: input.telemetry.quoteLatencyMs,
      })
    );
  }

  if (input.decision.shouldEscalateToHuman) {
    actions.push(
      buildAction('SUGGEST_HUMAN_ESCALATION', ['DECISION_ESCALATE_TO_HUMAN'])
    );
  }

  return actions;
}
