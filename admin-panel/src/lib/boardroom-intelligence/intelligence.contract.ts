export type IntelligenceEvent = {
  ts: string;
  requestId?: string;
  quoteId?: string;
  intentId?: string;
  event: string;
  degraded?: boolean;
  explanationCodes?: string[];
  funnelExplanationCodes?: string[];
  quoteLatencyMs?: number;
  abandonmentRisk?: number;
  decisionMode?: 'NORMAL' | 'ASSIST';
  funnelMode?: 'REVENUE_PRIORITY' | 'ASSIST_PRIORITY';
};

export type BoardroomIntelligenceInput = {
  events: IntelligenceEvent[];
};

export type BoardroomIntelligenceOutput = {
  latestDecisionMode: 'NORMAL' | 'ASSIST';
  latestFunnelMode: 'REVENUE_PRIORITY' | 'ASSIST_PRIORITY';
  recentDecisionTimeline: IntelligenceEvent[];
  recentFunnelTimeline: IntelligenceEvent[];
  abandonmentClusters: Array<{
    event: string;
    count: number;
  }>;
  avgQuoteLatencyMs: number | null;
  degradedRate: number;
  topDecisionReasons: Array<{
    code: string;
    count: number;
  }>;
  topFunnelReasons: Array<{
    code: string;
    count: number;
  }>;
};
