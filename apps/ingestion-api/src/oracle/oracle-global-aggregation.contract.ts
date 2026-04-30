import { z } from "zod";
import { OracleNodeSyncSnapshotSchema } from "./oracle-node.contract.js";

export const OracleGlobalSignalSchema = z.object({
  signalId: z.string().min(1),
  title: z.string().min(1),
  detail: z.string().min(1),
  confidence: z.number().min(0).max(100),
  sourceNodeIds: z.array(z.string()),
  recommendedNodeIds: z.array(z.string()),
  generatedAt: z.string().datetime(),
});

export const OracleGlobalAggregationSchema = z.object({
  nodeCount: z.number().int().nonnegative(),
  decisionCount: z.number().int().nonnegative(),
  globalApprovalRate: z.number().min(0).max(100),
  globalEscalationRate: z.number().min(0).max(100),
  topApprovalNode: OracleNodeSyncSnapshotSchema.nullable(),
  leadingAction: z.string().nullable(),
  crossNodeRecommendation: z.string(),
  nodes: z.array(OracleNodeSyncSnapshotSchema),
  signals: z.array(OracleGlobalSignalSchema),
});

export const OracleGlobalAggregationResponseSchema = z.object({
  success: z.boolean(),
  timestamp: z.string().datetime(),
  data: OracleGlobalAggregationSchema,
});

export type OracleGlobalSignal = z.infer<typeof OracleGlobalSignalSchema>;
export type OracleGlobalAggregation = z.infer<typeof OracleGlobalAggregationSchema>;
