import type { ConciergeDecision } from "./decision.types.js";

export type SignalType = "stress_index" | "hesitation_index" | "abandon_risk" | "therapist_stress";

/**
 * Pure function: Decision -> Signal
 * Maps the deterministic decision into a semantic UI signal.
 */
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
    case "NO_ACTION":
    default:
      return undefined;
  }
}
