export type ConciergeTelemetryContext = {
  tenantId: string;
  sessionId: string;
  visitorId?: string;
  requestId?: string;
  quoteId?: string;
  intentId?: string;
  degraded: boolean;
  warningCodes: string[];
  responseTimeMs?: number;
  source?: 'direct' | 'hotel' | 'concierge' | 'campaign';
  lastEvent?: string;
};

export function createEmptyTelemetryContext(input: {
  tenantId: string;
  sessionId: string;
  visitorId?: string;
  source?: 'direct' | 'hotel' | 'concierge' | 'campaign';
}): ConciergeTelemetryContext {
  return {
    tenantId: input.tenantId,
    sessionId: input.sessionId,
    visitorId: input.visitorId,
    degraded: false,
    warningCodes: [],
    source: input.source,
  };
}
