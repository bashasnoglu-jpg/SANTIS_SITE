import type { TelemetryMetrics, ConciergeDecision } from "./decision.types.js";

/**
 * Pure function: Event -> Decision
 * Evaluates raw telemetry metrics and returns a deterministic concierge decision.
 * Rule: hesitation_index >= 80 → REDUCE_CHOICES
 * Rule: abandon_risk >= 70 → INJECT_CONCIERGE
 * Rule: stress_index >= 85 → CALM_UI
 * Rule: therapist_stress >= 75 → ESCALATE_TO_STAFF
 */
export function evaluateConciergeRules(metrics: TelemetryMetrics): ConciergeDecision {
  if (metrics.hesitation_index >= 80) return "REDUCE_CHOICES";
  if (metrics.abandon_risk >= 70) return "INJECT_CONCIERGE";
  if (metrics.stress_index >= 85) return "CALM_UI";
  if (metrics.therapist_stress >= 75) return "ESCALATE_TO_STAFF";
  
  return "NO_ACTION";
}
