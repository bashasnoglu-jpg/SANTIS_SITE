import { z } from "zod";

export const OracleStrategyScenarioSchema = z.object({
  scenarioId: z.string().min(1),
  label: z.string().min(1),
  strategy: z.string().min(1),
  targetNodeId: z.string().min(1),
  projectedRevenueLift: z.number(),
  projectedApprovalRate: z.number().min(0).max(100),
  riskAdjustedConfidence: z.number().min(0).max(100),
  riskLevel: z.enum(["low", "medium", "high"]),
  decisionPath: z.array(z.string()),
});

export const OracleStrategySimulationSchema = z.object({
  simulationId: z.string().min(1),
  generatedAt: z.string().datetime(),
  source: z.literal("cross-node-learning"),
  scenarioCount: z.number().int().nonnegative(),
  recommendedScenarioId: z.string().nullable(),
  executivePreview: z.string().min(1),
  scenarios: z.array(OracleStrategyScenarioSchema),
});

export const OracleStrategySimulationResponseSchema = z.object({
  success: z.boolean(),
  timestamp: z.string().datetime(),
  data: OracleStrategySimulationSchema,
});

export type OracleStrategyScenario = z.infer<typeof OracleStrategyScenarioSchema>;
export type OracleStrategySimulation = z.infer<typeof OracleStrategySimulationSchema>;
