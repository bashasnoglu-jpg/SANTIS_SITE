// apps/ingestion-api/src/revenue/revenue-ranking-engine.ts

import { RevenueDecision } from "./revenue.types.js";
import { resolveRevenueDecision } from "./revenue-decision-engine.js";

interface Signal {
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

export function rankRevenueDecisions(signals: Signal[]): RevenueDecision[] {
  const candidates = signals
    .map(resolveRevenueDecision)
    .filter((d): d is RevenueDecision => d !== null);

  // suppression
  const filtered = candidates.filter((d) => d.confidence >= 0.6);

  // ranking
  filtered.sort((a, b) => b.finalValue - a.finalValue);

  // top 3
  return filtered.slice(0, 3);
}
