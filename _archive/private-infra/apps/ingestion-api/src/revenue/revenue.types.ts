// apps/ingestion-api/src/revenue/revenue.types.ts

export type RevenueAction =
  | "increase_price"
  | "decrease_price"
  | "suppress_upsell";

export interface RevenueDecision {
  decisionId: string;
  sessionId: string;
  sourceDecisionId?: string;

  action: RevenueAction;
  baseValue: number;      // örn: 0.08 (%8)
  finalValue: number;     // weighted result

  confidence: number;     // 0..1
  impactWeight: number;  // 0..1
  successRate: number;   // 0..1
  feedbackScore: number; // -1..+1

  reasoning: string[];
  createdAt: number;
}
