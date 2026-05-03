import { z } from 'zod';

export const AIRouterTaskSchema = z.enum([
  'ci_review',
  'small_code_change',
  'large_refactor',
  'architecture_review',
  'critical_runtime_decision',
  'narrative_copy',
  'boardroom_analysis'
]);

export type AIRouterTask = z.infer<typeof AIRouterTaskSchema>;

export const AIRouterRiskSchema = z.enum(['low', 'medium', 'high', 'critical']);
export type AIRouterRisk = z.infer<typeof AIRouterRiskSchema>;

export const AIRouterRequestSchema = z.object({
  id: z.string().min(1),
  task: AIRouterTaskSchema,
  risk: AIRouterRiskSchema.default('low'),
  prompt: z.string().min(1),
  system: z.string().optional(),
  maxOutputTokens: z.number().int().positive().max(32768).default(1200),
  estimatedInputTokens: z.number().int().positive().optional(),
  labels: z.array(z.string()).default([]),
  metadata: z.record(z.unknown()).default({})
});

export type AIRouterRequest = z.infer<typeof AIRouterRequestSchema>;

export const AIModelSchema = z.enum(['gpt-4.1-mini', 'gpt-4.1']);
export type AIModel = z.infer<typeof AIModelSchema>;

export const AIRouterDecisionSchema = z.object({
  model: AIModelSchema,
  reason: z.string(),
  allowed: z.boolean(),
  requiresManualApproval: z.boolean().default(false),
  estimatedInputTokens: z.number().int().nonnegative(),
  maxOutputTokens: z.number().int().positive(),
  estimatedCostEur: z.number().nonnegative(),
  metadata: z.record(z.unknown()).default({})
});

export type AIRouterDecision = z.infer<typeof AIRouterDecisionSchema>;

export const AIRouterResponseSchema = z.object({
  id: z.string().min(1),
  model: AIModelSchema,
  outputText: z.string(),
  usage: z.object({
    inputTokens: z.number().int().nonnegative(),
    outputTokens: z.number().int().nonnegative(),
    estimatedCostEur: z.number().nonnegative()
  }),
  metadata: z.record(z.unknown()).default({})
});

export type AIRouterResponse = z.infer<typeof AIRouterResponseSchema>;
