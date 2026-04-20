export type SovereignActionType =
  | "ADVISORY"
  | "OPTIMIZATION"
  | "RECOVERY"
  | "ALERT";

export type SovereignActionSeverity =
  | "low"
  | "medium"
  | "high"
  | "critical";

export type SovereignActionStatus =
  | "new"
  | "acknowledged"
  | "approved"
  | "rejected"
  | "applied";

export type PatchKind =
  | "ui_copy"
  | "ui_flow"
  | "routing"
  | "audio_alert"
  | "api_reconfiguration";

export interface RecommendedPatch {
  kind: PatchKind;
  payload: Record<string, unknown>;
}

export interface SovereignAction {
  id: string;
  type: SovereignActionType;
  severity: SovereignActionSeverity;
  title: string;
  description: string;
  source: "concierge_dashboard" | "boardroom_oracle" | "funnel_monitor";
  metric?: string;
  metricValue?: number;
  threshold?: number;
  recommendedPatch?: RecommendedPatch;
  createdAt: string;
  requiresApproval: boolean;
  status: SovereignActionStatus;
}

export type FunnelStep = "q1" | "q2" | "q3" | "q4" | "result";

export interface DashboardSnapshot {
  dropRate: number;
  completionRate: number;
  conciergeRate: number;
  premiumInterestRate: number;
  hotStep?: FunnelStep;
}
