/**
 * @file oracle-cognitive-decision.contract.ts
 * @description Oracle Engine için karar ve muhakeme sözleşmesi.
 * Bu tipler, AI karar süreçlerinin şeffaf ve izlenebilir olmasını sağlar.
 */

export type CognitiveReasoningStep = {
  cause: string;
  context: string;
  outcome: string;
};

export type CognitiveDecisionDelta = {
  projectedRevenueImpact: number;
  projectedRetentionImpact: number;
  projectedHesitationReduction: number;
};

export type CognitiveSignificance = {
  level: "low" | "medium" | "high" | "critical";
  narrative: string;
};

export type CognitiveDecisionEnvelope = {
  actionId: string;
  snapshotId: string | null;
  confidence: number;
  reasoning: CognitiveReasoningStep[];
  delta: CognitiveDecisionDelta;
  significance: CognitiveSignificance;
  generatedAt: string;
};
