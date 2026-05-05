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

export interface CognitiveInsight {
  id: string;
  type: string;
  message: string;
  confidence: number;
  evidence?: unknown;
  suggestedActionId?: string;
  occurredAt: string;
}
