export type BoardroomMode = "LIVE" | "HISTORICAL";

export type AuditDecisionType =
  | "action.approved"
  | "action.rejected";

export interface AuditLogEntry {
  id: string;
  type: AuditDecisionType;
  actionId: string;
  operatorId: string;
  traceId?: string;
  reason?: string;
  snapshotId?: string;
  occurredAt: string;
  payload?: {
    confidence?: number;
    actionTitle?: string;
    target?: string;
    suggestedAdjustment?: number;
    [key: string]: unknown;
  };
}

export interface BoardroomSnapshot {
  id?: string;
  snapshotId?: string;
  timestamp: string;
  revenue: number;
  activeSessionsCount: number;
  actionId?: string;
  resolvedActionId?: string;
  resolutionType?: "approved_simulated" | "rejected" | string;
  reasoning?: string;
  confidence?: number;
}

export interface ReconstructedBoardroomState {
  success: boolean;
  reconstructedAt: string;
  requestedAt?: string;
  state: BoardroomSnapshot;
}

// ─── Phase 82.3: Cognitive Overlay Contract ───────────────────────────────

export interface CognitiveReasoningStep {
  cause: string;
  context: string;
  outcome: string;
}

export interface CognitiveDecisionDelta {
  projectedRevenueImpact: number;
  projectedRetentionImpact: number;
  projectedHesitationReduction: number;
}

export interface CognitiveSignificance {
  level: "low" | "medium" | "high" | "critical";
  narrative: string;
}

export interface CognitiveDecisionEnvelope {
  /** Backend Oracle Feed tarafından üretilir */
  actionId: string;
  snapshotId: string | null;
  confidence: number;
  reasoning: CognitiveReasoningStep[];
  delta: CognitiveDecisionDelta;
  significance: CognitiveSignificance;
  generatedAt: string;
}

export interface CognitiveInsight {
  id: string;
  type: string;
  message: string;
  confidence: number;
  evidence?: unknown;
  suggestedActionId?: string;
  occurredAt: string;
}
