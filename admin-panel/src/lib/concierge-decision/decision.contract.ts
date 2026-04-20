export type ConciergeDecisionInput = {
  snapshot: {
    degraded: boolean;
    warningCodes: string[];
    serviceCount: number;
    slotCount: number;
  };
  telemetry: {
    requestId?: string;
    quoteId?: string;
    intentId?: string;
    responseTimeMs?: number;
    quoteLatencyMs?: number;
    lastEvent?: string;
  };
  behavioral: {
    serviceOpenCount: number;
    slotSelectionCount: number;
    quoteRequestCount: number;
    quoteFailureCount: number;
    abandonmentRisk?: number; // 0..1
  };
};

export type ConciergeDecisionOutput = {
  shouldReduceChoices: boolean;
  shouldEscalateToHuman: boolean;
  shouldHideLowConfidenceSlots: boolean;
  shouldPromoteTopService: boolean;
  shouldShowUrgency: boolean;
  shouldOfferConciergeAssist: boolean;
  shouldSuppressAggressiveUpsell: boolean;
  maxVisibleServices: number;
  minSlotConfidence: number;
  explanationCodes: string[];
};
