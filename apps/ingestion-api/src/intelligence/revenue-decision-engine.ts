import type { BoardroomDecision } from "./boardroom-intelligence.types.js";
import { getDecisionSuccessRate } from "./boardroom-decision.store.js";

export type RevenueBaseAction = "price_adjustment" | "upsell" | "bundle";

export type RevenueDecision = {
  id: string;
  sessionId: string;
  baseAction: RevenueBaseAction;
  baseValue: number;
  confidence: number;
  impactWeight: number;
  feedbackScore: number;
  successRate: number;
  finalValue: number;
  reasoning: {
    demandLevel: string;
    hesitationIndex: number;
    sourceDecisionId?: string;
  };
  createdAt: string;
};

type RevenueContext = {
  demandLevel: "low" | "normal" | "high";
  hesitationIndex: number;
};

export function resolveFinalValue(input: {
  baseValue: number;
  confidence: number;
  impactWeight: number;
  feedbackScore: number;
  successRate: number;
}) {
  if (input.confidence < 0.5) {
    return 0;
  }

  const confidenceFactor = input.confidence;
  const successFactor = input.successRate;
  const feedbackFactor = (input.feedbackScore + 1) / 2;

  const weight =
    confidenceFactor *
    successFactor *
    feedbackFactor *
    input.impactWeight;

  return Number((input.baseValue * weight).toFixed(4));
}

function resolveBaseDecision(decision: BoardroomDecision): { baseAction: RevenueBaseAction; baseValue: number } | null {
  if (decision.action === "suggest_price_increase") {
    return { baseAction: "price_adjustment", baseValue: 0.08 };
  }

  if (decision.action === "suppress_upsell") {
    return { baseAction: "upsell", baseValue: 0 };
  }

  if (decision.action === "lock_recommendation") {
    return { baseAction: "bundle", baseValue: 0.04 };
  }

  return null;
}

export function resolveRevenueDecisions(input: {
  decisions: BoardroomDecision[];
  context: RevenueContext;
}): RevenueDecision[] {
  const createdAt = new Date().toISOString();

  return input.decisions.flatMap((decision) => {
    const base = resolveBaseDecision(decision);

    if (!base) {
      return [];
    }

    const feedbackScore = decision.feedbackScore ?? 0;
    const successRate = getDecisionSuccessRate(decision.action) ?? 0.5;
    const baseValue = input.context.hesitationIndex > 70 && base.baseAction !== "bundle"
      ? 0
      : base.baseValue;

    return [{
      id: `rev_${decision.id}`,
      sessionId: decision.sessionId,
      baseAction: base.baseAction,
      baseValue,
      confidence: decision.confidence,
      impactWeight: decision.impactWeight,
      feedbackScore,
      successRate,
      finalValue: resolveFinalValue({
        baseValue,
        confidence: decision.confidence,
        impactWeight: decision.impactWeight,
        feedbackScore,
        successRate,
      }),
      reasoning: {
        demandLevel: input.context.demandLevel,
        hesitationIndex: input.context.hesitationIndex,
        sourceDecisionId: decision.id,
      },
      createdAt,
    }];
  });
}
