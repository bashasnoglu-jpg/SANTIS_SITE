import { z } from "zod";

export const OracleExecutionGuardrailSchema = z.object({
  key: z.string().min(1),
  label: z.string().min(1),
  passed: z.boolean(),
  actual: z.union([z.string(), z.number(), z.boolean()]),
  threshold: z.union([z.string(), z.number(), z.boolean()]),
  severity: z.enum(["info", "warning", "blocking"]),
});

export const OracleExecutionStepSchema = z.object({
  stepId: z.string().min(1),
  label: z.string().min(1),
  detail: z.string().min(1),
  status: z.literal("proposed"),
});

export const OracleExecutionGovernanceSchema = z.object({
  executionPolicy: z.literal("human_gated"),
  approvalRequired: z.literal(true),
  approvedBy: z.null(),
  approvedAt: z.null(),
  autoApplyAllowed: z.literal(false),
  auditReason: z.string().min(1),
});

export const OracleExecutionPlanSchema = z.object({
  planId: z.string().min(1),
  generatedAt: z.string().datetime(),
  source: z.literal("strategy-simulation"),
  status: z.enum(["awaiting_signal", "not_recommended", "human_approval_required"]),
  executable: z.boolean(),
  scenarioId: z.string().nullable(),
  targetNodeId: z.string().nullable(),
  rationale: z.string().min(1),
  governance: OracleExecutionGovernanceSchema,
  guardrails: z.array(OracleExecutionGuardrailSchema),
  steps: z.array(OracleExecutionStepSchema),
});

export const OracleExecutionGuardResponseSchema = z.object({
  success: z.boolean(),
  timestamp: z.string().datetime(),
  data: OracleExecutionPlanSchema,
});

export type OracleExecutionGuardrail = z.infer<typeof OracleExecutionGuardrailSchema>;
export type OracleExecutionStep = z.infer<typeof OracleExecutionStepSchema>;
export type OracleExecutionGovernance = z.infer<typeof OracleExecutionGovernanceSchema>;
export type OracleExecutionPlan = z.infer<typeof OracleExecutionPlanSchema>;
