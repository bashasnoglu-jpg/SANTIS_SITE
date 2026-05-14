export type BoardroomDecisionSeverity =
  | "low"
  | "medium"
  | "high"
  | "critical";

export type BoardroomDecisionReason =
  | "high_hesitation"
  | "demand_spike"
  | "vip_exception"
  | "pricing_risk"
  | "clinical_safety"
  | "system_conflict";

export type BoardroomDecisionAction =
  | "force_reduce_ui"
  | "handoff_to_human"
  | "lock_recommendation"
  | "suppress_upsell"
  | "freeze_session"
  | "suggest_price_increase";

export type BoardroomRecommendation = {
  id: string;
  sessionId: string;
  severity: BoardroomDecisionSeverity;
  reason: BoardroomDecisionReason;
  action: BoardroomDecisionAction;
  confidence: number;
  impactWeight: number;
  successRate?: number;
  feedbackScore?: number;
  message: string;
  createdAt: string;
};

export type BoardroomDecision = {
  id: string;
  sessionId: string;
  action: BoardroomDecisionAction;
  reason: BoardroomDecisionReason;
  confidence: number;
  impactWeight: number;
  emittedAt: string;
  override?: {
    applied: boolean;
    operatorId?: string;
    appliedAt?: string;
  };
  outcome?: {
    revenueDelta?: number;
    hesitationDelta?: number;
    success: boolean;
    evaluatedAt: string;
  };
  feedbackScore?: number;
};

export type DecisionStats = {
  action: BoardroomDecisionAction;
  total: number;
  success: number;
};
