export type ConciergeDecision =
  | "NO_ACTION"
  | "REDUCE_CHOICES"
  | "INJECT_CONCIERGE"
  | "CALM_UI"
  | "ESCALATE_TO_STAFF";

export interface TelemetryMetrics {
  hesitation_index: number;
  abandon_risk: number;
  stress_index: number;
  therapist_stress: number;
}
