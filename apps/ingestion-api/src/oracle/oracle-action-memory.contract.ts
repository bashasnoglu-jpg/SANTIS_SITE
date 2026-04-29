import { z } from "zod";

export const OracleActionDecisionSchema = z.object({
  type: z.literal("ORACLE_ACTION_DECISION"),
  actionId: z.string().min(1),
  decision: z.enum(["approved", "dismissed", "escalated"]),
  confidence: z.number().min(0).max(100),
  riskLevel: z.enum(["low", "medium", "high"]),
  suggestedAction: z.string().min(1),
  evidence: z.array(z.string()).default([]),
  timestamp: z.string().datetime(),
});

export const OracleActionMemoryRecordSchema = OracleActionDecisionSchema.extend({
  eventId: z.string().uuid(),
  recordedAt: z.string().datetime(),
});

export const OracleActionMemoryResponseSchema = z.object({
  success: z.boolean(),
  timestamp: z.string().datetime(),
  data: z.array(OracleActionMemoryRecordSchema),
});

export type OracleActionDecision = z.infer<typeof OracleActionDecisionSchema>;
export type OracleActionMemoryRecord = z.infer<typeof OracleActionMemoryRecordSchema>;
