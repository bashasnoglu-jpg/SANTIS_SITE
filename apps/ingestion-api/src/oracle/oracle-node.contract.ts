import { z } from "zod";

export const OracleNodeContextSchema = z.object({
  nodeId: z.string().min(2).max(64),
  nodeCode: z.string().min(2).max(32),
  location: z.string().min(2).max(80),
  region: z.string().min(2).max(32),
  role: z.enum(["primary", "partner", "future"]).default("primary"),
});

export const OracleNodeSyncSnapshotSchema = z.object({
  node: OracleNodeContextSchema,
  decisionCount: z.number().int().nonnegative(),
  approvedCount: z.number().int().nonnegative(),
  dismissedCount: z.number().int().nonnegative(),
  escalatedCount: z.number().int().nonnegative(),
  latestDecisionAt: z.string().datetime().nullable(),
});

export const OracleNodeSyncResponseSchema = z.object({
  success: z.boolean(),
  timestamp: z.string().datetime(),
  data: z.object({
    nodes: z.array(OracleNodeSyncSnapshotSchema),
    decisions: z.array(z.unknown()),
  }),
});

export type OracleNodeContext = z.infer<typeof OracleNodeContextSchema>;
export type OracleNodeSyncSnapshot = z.infer<typeof OracleNodeSyncSnapshotSchema>;
