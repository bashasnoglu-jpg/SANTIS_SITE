export type AdaptiveFunnelService = {
  id: string;
  title: string;
  category: string;
  price: number | null;
  compareAtPrice: number | null;
  availabilityScore: number;
  recommended?: boolean;
};

export type AdaptiveFunnelSlot = {
  serviceId: string;
  confidence?: number;
  rankScore?: number;
};

export type AdaptiveFunnelInput = {
  snapshot: {
    degraded: boolean;
    warningCodes: string[];
    services: AdaptiveFunnelService[];
    slots: AdaptiveFunnelSlot[];
  };
  telemetry: {
    requestId?: string;
    quoteLatencyMs?: number;
    lastEvent?: string;
  };
  behavioral: {
    serviceOpenCount: number;
    slotSelectionCount: number;
    quoteRequestCount: number;
    quoteFailureCount: number;
    abandonmentRisk?: number;
  };
  decision: {
    shouldReduceChoices: boolean;
    shouldEscalateToHuman: boolean;
    shouldOfferConciergeAssist: boolean;
    shouldSuppressAggressiveUpsell: boolean;
  };
};

export type AdaptiveFunnelOutput = {
  orderedServiceIds: string[];
  promotedServiceId?: string;
  hiddenServiceIds: string[];
  shouldShowAnchorPrice: boolean;
  shouldShowUrgencyBar: boolean;
  shouldShowRevenuePriorityBanner: boolean;
  shouldEmphasizeConciergePath: boolean;
  shouldUseCompactLayout: boolean;
  explanationCodes: string[];
};
