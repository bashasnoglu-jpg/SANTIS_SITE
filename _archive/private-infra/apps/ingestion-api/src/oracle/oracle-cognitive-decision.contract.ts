import { z } from "zod";

// ─── Phase 83: Cognitive Decision Envelope ─────────────────────────────────
// Bu kontrat, bir Boardroom kararını "açıklanabilir" hale getirir.
// Kernel bu zarfı üretir; UI sadece tanıklık eder.

export const CognitiveReasoningStepSchema = z.object({
  cause: z.string().min(1),
  context: z.string().min(1),
  outcome: z.string().min(1),
});

export const CognitiveDecisionDeltaSchema = z.object({
  projectedRevenueImpact: z.number(),
  projectedRetentionImpact: z.number(),
  projectedHesitationReduction: z.number(),
});

export const CognitiveSignificanceSchema = z.object({
  level: z.enum(["low", "medium", "high", "critical"]),
  narrative: z.string().min(1),
});

export const CognitiveDecisionEnvelopeSchema = z.object({
  actionId: z.string(),
  snapshotId: z.string().nullable(),
  confidence: z.number().min(0).max(1),
  reasoning: z.array(CognitiveReasoningStepSchema).min(1),
  delta: CognitiveDecisionDeltaSchema,
  significance: CognitiveSignificanceSchema,
  generatedAt: z.string().datetime(),
});

export const CognitiveAnalysisResponseSchema = z.object({
  success: z.boolean(),
  timestamp: z.string().datetime(),
  data: CognitiveDecisionEnvelopeSchema,
});

// ─── Types ──────────────────────────────────────────────────────────────────

export type CognitiveReasoningStep = z.infer<typeof CognitiveReasoningStepSchema>;
export type CognitiveDecisionDelta = z.infer<typeof CognitiveDecisionDeltaSchema>;
export type CognitiveSignificance = z.infer<typeof CognitiveSignificanceSchema>;
export type CognitiveDecisionEnvelope = z.infer<typeof CognitiveDecisionEnvelopeSchema>;
export type CognitiveAnalysisResponse = z.infer<typeof CognitiveAnalysisResponseSchema>;
