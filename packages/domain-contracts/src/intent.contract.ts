import { z } from "zod";

export const IntentTypeSchema = z.enum([
  "RESET",
  "RECOVER",
  "BEAUTY",
  "PERFORMANCE",
  "CONNECTION",
]);

export const BiologicalTargetVectorSchema = z.object({
  cortisolReductionTarget: z.number().min(0).max(1).default(0),
  muscularRecoveryTarget: z.number().min(0).max(1).default(0),
  cellularTurnoverTarget: z.number().min(0).max(1).default(0),
  energyOptimizationTarget: z.number().min(0).max(1).default(0),
  socialSynchronizationTarget: z.number().min(0).max(1).default(0),
});

export const IntentVectorSchema = z.object({
  intent: IntentTypeSchema,
  weight: z.number().min(0).max(1),
  biologicalTargets: BiologicalTargetVectorSchema,
});

export const GuestIntentSignalSchema = z.object({
  tenantId: z.string().uuid(),
  sessionId: z.string().min(1),
  primaryIntent: IntentTypeSchema,
  secondaryIntents: z.array(IntentTypeSchema).default([]),
  declaredAt: z.string().datetime(),
  confidence: z.number().min(0).max(1),
});

export type IntentType = z.infer<typeof IntentTypeSchema>;
export type BiologicalTargetVector = z.infer<typeof BiologicalTargetVectorSchema>;
export type IntentVector = z.infer<typeof IntentVectorSchema>;
export type GuestIntentSignal = z.infer<typeof GuestIntentSignalSchema>;
