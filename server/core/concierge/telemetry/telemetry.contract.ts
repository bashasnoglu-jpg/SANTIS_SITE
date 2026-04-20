export type TelemetryEventName =
  | 'SNAPSHOT_VIEWED'
  | 'SERVICE_OPENED'
  | 'SLOT_SELECTED'
  | 'QUOTE_REQUESTED'
  | 'QUOTE_RECEIVED'
  | 'QUOTE_FAILED'
  | 'INTENT_STARTED'
  | 'BOOKING_INTENT_SUBMITTED'
  | 'INTENT_CONFIRMED'
  | 'INTENT_FAILED'
  | 'FLOW_ABANDONED'
  | 'HUMAN_CONCIERGE_REQUESTED';

export type TelemetrySource =
  | 'direct'
  | 'hotel'
  | 'concierge'
  | 'campaign';

export type TelemetryContext = {
  tenantId: string;
  sessionId: string;
  visitorId?: string;
  requestId?: string;
  quoteId?: string;
  intentId?: string;
  degraded?: boolean;
  warningCodes?: string[];
  source?: TelemetrySource;
};

export type TelemetryPayload = {
  event: TelemetryEventName;
  ts: string;
  context: TelemetryContext;
  meta?: Record<string, unknown>;
};

export type TelemetryAcceptedResponse = {
  ok: true;
  accepted: true;
};
