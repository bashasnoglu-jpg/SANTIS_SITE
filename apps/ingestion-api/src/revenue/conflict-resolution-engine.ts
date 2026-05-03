import { RevenueDecision } from "./revenue.types.js";

export interface ResolvedDecision {
  finalAction: "increase_price" | "decrease_price" | "neutral";
  netValue: number;
  reasoning: string[];
  sources: RevenueDecision[];
  idempotencyKey: string;
}

function actionToSign(action: RevenueDecision["action"]) {
  switch (action) {
    case "increase_price":
      return 1;
    case "decrease_price":
      return -1;
    case "suppress_upsell":
      return -0.5;
    default:
      return 0;
  }
}

export function resolveConflicts(
  decisions: RevenueDecision[]
): ResolvedDecision | null {
  if (decisions.length === 0) return null;

  let weightedSum = 0;
  let totalWeight = 0;

  for (const d of decisions) {
    const sign = actionToSign(d.action);

    // Adaptive Weighting (v2.2.1)
    const adaptiveWeight =
      d.successRate * 0.5 +
      ((d.feedbackScore + 1) / 2) * 0.5;

    const weight =
      d.confidence *
      adaptiveWeight *
      d.impactWeight;

    weightedSum += sign * d.baseValue * weight;
    totalWeight += weight;
  }

  if (totalWeight === 0) return null;

  let netValue = weightedSum / totalWeight;

  // Clamp spikes
  netValue = Math.max(-0.25, Math.min(0.25, netValue));

  let finalAction: ResolvedDecision["finalAction"] = "neutral";

  if (netValue > 0.01) finalAction = "increase_price";
  else if (netValue < -0.01) finalAction = "decrease_price";

  const idempotencyKey = decisions.map(d => d.decisionId).sort().join("_");

  return {
    finalAction,
    netValue,
    reasoning: [
      `weightedSum=${weightedSum.toFixed(4)}`,
      `totalWeight=${totalWeight.toFixed(4)}`,
      `net=${netValue.toFixed(4)}`,
    ],
    sources: decisions,
    idempotencyKey,
  };
}
