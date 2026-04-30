import { z } from "zod";

export const OracleCrossNodePatternSchema = z.object({
  patternId: z.string().min(1),
  sourceNodeId: z.string().min(1),
  sourceNodeCode: z.string().min(1),
  suggestedAction: z.string().min(1),
  approvalRate: z.number().min(0).max(100),
  sampleSize: z.number().int().nonnegative(),
  evidence: z.array(z.string()),
});

export const OracleLearningTransferSchema = z.object({
  transferId: z.string().min(1),
  patternId: z.string().min(1),
  targetNodeId: z.string().min(1),
  targetNodeRole: z.enum(["primary", "partner", "future"]),
  contextFit: z.number().min(0).max(100),
  baseConfidence: z.number().min(0).max(100),
  adjustedConfidence: z.number().min(0).max(100),
  riskBoundary: z.enum(["low", "medium", "high"]),
  recommendation: z.string().min(1),
});

export const OracleCrossNodeLearningSchema = z.object({
  patternCount: z.number().int().nonnegative(),
  transferCount: z.number().int().nonnegative(),
  globalCalibration: z.object({
    approvalRate: z.number().min(0).max(100),
    escalationRate: z.number().min(0).max(100),
    confidenceFloor: z.number().min(0).max(100),
    confidenceCeiling: z.number().min(0).max(100),
  }),
  patterns: z.array(OracleCrossNodePatternSchema),
  transfers: z.array(OracleLearningTransferSchema),
  networkStrategy: z.string().min(1),
});

export const OracleCrossNodeLearningResponseSchema = z.object({
  success: z.boolean(),
  timestamp: z.string().datetime(),
  data: OracleCrossNodeLearningSchema,
});

export type OracleCrossNodePattern = z.infer<typeof OracleCrossNodePatternSchema>;
export type OracleLearningTransfer = z.infer<typeof OracleLearningTransferSchema>;
export type OracleCrossNodeLearning = z.infer<typeof OracleCrossNodeLearningSchema>;
