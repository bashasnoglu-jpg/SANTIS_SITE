export type AutonomousActionType =
  | 'REORDER_SERVICES'
  | 'HIDE_LOW_CONFIDENCE_SLOTS'
  | 'SHOW_CONCIERGE_PRIORITY_CTA'
  | 'SHOW_QUOTE_RECOVERY_BANNER'
  | 'ENABLE_COMPACT_LAYOUT'
  | 'SUPPRESS_UPSELLS'
  | 'SUGGEST_HUMAN_ESCALATION';

export type AutonomousActionSeverity = 'low' | 'medium' | 'high';

export type AutonomousAction = {
  id: string;
  type: AutonomousActionType;
  severity: AutonomousActionSeverity;
  autoExecutable: boolean;
  explanationCodes: string[];
  payload?: Record<string, unknown>;
};

export type AutonomousActionInput = {
  requestId?: string;
  decision: {
    shouldReduceChoices: boolean;
    shouldEscalateToHuman: boolean;
    shouldHideLowConfidenceSlots: boolean;
    shouldOfferConciergeAssist: boolean;
    shouldSuppressAggressiveUpsell: boolean;
    maxVisibleServices: number;
    minSlotConfidence: number;
    explanationCodes: string[];
  };
  funnel: {
    promotedServiceId?: string;
    hiddenServiceIds: string[];
    shouldShowUrgencyBar: boolean;
    shouldShowAnchorPrice: boolean;
    shouldEmphasizeConciergePath: boolean;
    shouldUseCompactLayout: boolean;
    explanationCodes: string[];
  };
  telemetry: {
    quoteLatencyMs?: number;
    degraded: boolean;
    quoteId?: string;
    intentId?: string;
    lastEvent?: string;
  };
};
