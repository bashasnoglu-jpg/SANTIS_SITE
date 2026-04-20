export type OperatorActionStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'executed'
  | 'overridden'
  | 'expired';

export type OperatorDecisionType =
  | 'APPROVE'
  | 'REJECT'
  | 'OVERRIDE'
  | 'DISMISS';

export type ConsoleActionItem = {
  id: string;
  requestId?: string;
  quoteId?: string;
  intentId?: string;
  type: string;
  severity: 'low' | 'medium' | 'high';
  autoExecutable: boolean;
  explanationCodes: string[];
  payload?: Record<string, unknown>;
  status: OperatorActionStatus;
  createdAt: string;
};

export type OperatorDecision = {
  actionId: string;
  operatorId: string;
  decision: OperatorDecisionType;
  reason?: string;
  ts: string;
};
