export type GovernanceActionExposure = {
  actionId: string;
  requestId?: string;
  quoteId?: string;
  intentId?: string;
  ts: string;
  actionType: string;
  autoExecutable: boolean;
  operatorStatus?: 'pending' | 'approved' | 'rejected' | 'executed' | 'overridden' | 'expired';
  explanationCodes: string[];
};

export type GovernanceOutcomeEvent =
  | 'QUOTE_CONVERTED'
  | 'INTENT_CONFIRMED'
  | 'FLOW_ABANDONED'
  | 'RECOVERY_ACCEPTED'
  | 'CONCIERGE_HANDOFF_ACCEPTED';

export type GovernanceOutcome = {
  outcomeId: string;
  requestId?: string;
  quoteId?: string;
  intentId?: string;
  ts: string;
  event: GovernanceOutcomeEvent;
  revenueAmount?: number;
  currency?: 'EUR';
};

export type GovernanceAttributionRecord = {
  actionId: string;
  actionType: string;
  outcomeId: string;
  outcomeEvent: GovernanceOutcomeEvent;
  attributedRevenue?: number;
  ts: string;
};
