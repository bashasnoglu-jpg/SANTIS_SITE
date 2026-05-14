// apps/ingestion-api/src/revenue/revenue-decision-engine.ts

import { RevenueDecision } from "./revenue.types";

interface Input {
  decisionId: string;
  sessionId: string;
  sourceDecisionId?: string;
  baseValue: number;

  confidence: number;
  impactWeight: number;
  successRate: number;
  feedbackScore: number;

  hesitationIndex: number;
}

export function resolveRevenueDecision(input: Input): RevenueDecision | null {
  const {
    decisionId,
    sessionId,
    sourceDecisionId,
    baseValue,
    confidence,
    impactWeight,
    successRate,
    feedbackScore,
    hesitationIndex,
  } = input;

  // 1. Confidence Gate
  if (confidence < 0.5) return null;

  let adjustedBase = baseValue;
  let action: RevenueDecision["action"] = "increase_price";

  // 2. Hesitation Override
  if (hesitationIndex > 70) {
    adjustedBase = baseValue * 0.5;
    action = "suppress_upsell";
  }

  // 3. Feedback normalization (-1..+1 → 0..1)
  const feedbackFactor = (feedbackScore + 1) / 2;

  // 4. Final Weight
  const weight =
    confidence *
    successRate *
    feedbackFactor *
    impactWeight;

  const finalValue = adjustedBase * weight;

  return {
    decisionId,
    sessionId,
    sourceDecisionId,
    action,
    baseValue,
    finalValue,

    confidence,
    impactWeight,
    successRate,
    feedbackScore,

    reasoning: [
      `confidence=${confidence}`,
      `successRate=${successRate}`,
      `feedback=${feedbackScore}`,
      `impact=${impactWeight}`,
      hesitationIndex > 70 ? "hesitation_override" : "normal_flow",
    ],

    createdAt: Date.now(),
  };
}
