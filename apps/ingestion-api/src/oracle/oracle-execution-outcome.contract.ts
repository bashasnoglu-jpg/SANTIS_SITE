import { z } from "zod";

export const OracleExecutionOutcomeSchema = z.object({
  type: z.literal("ORACLE_EXECUTION_OUTCOME").default("ORACLE_EXECUTION_OUTCOME"),
  planId: z.string().min(1),
  scenarioId: z.string().nullable(),
  targetNodeId: z.string().nullable(),
  executionStatus: z.enum(["implemented", "partially_implemented", "not_implemented"]),
  forecastRevenueLift: z.number(),
  actualRevenueLift: z.number(),
  forecastConfidence: z.number().min(0).max(100),
  actualConfidence: z.number().min(0).max(100),
  notes: z.string().default(""),
  timestamp: z.string().datetime(),
});

export const OracleExecutionOutcomeRecordSchema = OracleExecutionOutcomeSchema.extend({
  outcomeId: z.string().uuid(),
  recordedAt: z.string().datetime(),
});

export const AdvisoryCalibrationSchema = z.object({
  mode: z.enum(["collect_more_data", "reduce_confidence", "increase_confidence", "hold_thresholds"]),
  recommendedAdjustment: z.number().int(),
  requiresHumanApproval: z.literal(true),
  rationale: z.string(),
});

export const BoardroomIntelligenceSummarySchema = z.object({
  intelligenceScore: z.number().int().min(0).max(100),
  economicAccuracy: z.number().int().min(0).max(100),
  confidenceAccuracy: z.number().int().min(0).max(100),
  decisionQuality: z.enum(["awaiting_data", "critical", "watch", "stable", "excellent"]),
  sampleSize: z.number().int().nonnegative(),
  advisoryCalibration: AdvisoryCalibrationSchema,
});

export const OracleExecutionOutcomeSummarySchema = z.object({
  outcomeCount: z.number().int().nonnegative(),
  averageRevenueDelta: z.number(),
  averageConfidenceDelta: z.number(),
  calibrationSignal: z.enum(["awaiting_outcomes", "over_forecast", "under_forecast", "aligned"]),
  boardroomIntelligence: BoardroomIntelligenceSummarySchema,
  latestOutcome: OracleExecutionOutcomeRecordSchema.nullable(),
  outcomes: z.array(OracleExecutionOutcomeRecordSchema),
});

export const OracleExecutionOutcomeResponseSchema = z.object({
  success: z.boolean(),
  timestamp: z.string().datetime(),
  data: OracleExecutionOutcomeSummarySchema,
});

export type OracleExecutionOutcome = z.infer<typeof OracleExecutionOutcomeSchema>;
export type OracleExecutionOutcomeRecord = z.infer<typeof OracleExecutionOutcomeRecordSchema>;
export type AdvisoryCalibration = z.infer<typeof AdvisoryCalibrationSchema>;
export type BoardroomIntelligenceSummary = z.infer<typeof BoardroomIntelligenceSummarySchema>;
export type OracleExecutionOutcomeSummary = z.infer<typeof OracleExecutionOutcomeSummarySchema>;
