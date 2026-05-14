export type ConciergeDecision =
  | "NO_ACTION"
  | "REDUCE_CHOICES"
  | "INJECT_CONCIERGE"
  | "CALM_UI"
  | "PREPARE_VIP_CATALYST"
  | "ESCALATE_TO_STAFF";

export interface TelemetryMetrics {
  hesitation_index: number;
  abandon_risk: number;
  stress_index: number;
  therapist_stress: number;
}

export type SignalType = "stress_index" | "hesitation_index" | "abandon_risk" | "therapist_stress";

export function evaluateConciergeRules(metrics: TelemetryMetrics): ConciergeDecision {
  // Sovereign Otonom Öğrenme Motoru Eşikleri
  if (metrics.abandon_risk >= 75 && metrics.hesitation_index >= 80) return "PREPARE_VIP_CATALYST";
  
  if (metrics.hesitation_index >= 80) return "REDUCE_CHOICES";
  if (metrics.abandon_risk >= 70) return "INJECT_CONCIERGE";
  if (metrics.stress_index >= 85) return "CALM_UI";
  if (metrics.therapist_stress >= 75) return "ESCALATE_TO_STAFF";
  
  return "NO_ACTION";
}

export function deriveSignalFromDecision(decision: ConciergeDecision): SignalType | undefined {
  switch (decision) {
    case "REDUCE_CHOICES":
      return "hesitation_index";
    case "INJECT_CONCIERGE":
      return "abandon_risk";
    case "CALM_UI":
      return "stress_index";
    case "ESCALATE_TO_STAFF":
      return "therapist_stress";
    case "PREPARE_VIP_CATALYST":
      return "abandon_risk";
    case "NO_ACTION":
    default:
      return undefined;
  }
}
