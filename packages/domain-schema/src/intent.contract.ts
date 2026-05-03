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

export const DefaultIntentVectors: Record<z.infer<typeof IntentTypeSchema>, z.infer<typeof IntentVectorSchema>> = {
  RESET: {
    intent: "RESET",
    weight: 1,
    biologicalTargets: {
      cortisolReductionTarget: 0.9,
      muscularRecoveryTarget: 0.35,
      cellularTurnoverTarget: 0.15,
      energyOptimizationTarget: 0.25,
      socialSynchronizationTarget: 0.1,
    },
  },
  RECOVER: {
    intent: "RECOVER",
    weight: 1,
    biologicalTargets: {
      cortisolReductionTarget: 0.45,
      muscularRecoveryTarget: 0.9,
      cellularTurnoverTarget: 0.25,
      energyOptimizationTarget: 0.45,
      socialSynchronizationTarget: 0.05,
    },
  },
  BEAUTY: {
    intent: "BEAUTY",
    weight: 1,
    biologicalTargets: {
      cortisolReductionTarget: 0.25,
      muscularRecoveryTarget: 0.1,
      cellularTurnoverTarget: 0.95,
      energyOptimizationTarget: 0.25,
      socialSynchronizationTarget: 0.15,
    },
  },
  PERFORMANCE: {
    intent: "PERFORMANCE",
    weight: 1,
    biologicalTargets: {
      cortisolReductionTarget: 0.25,
      muscularRecoveryTarget: 0.65,
      cellularTurnoverTarget: 0.2,
      energyOptimizationTarget: 0.95,
      socialSynchronizationTarget: 0.05,
    },
  },
  CONNECTION: {
    intent: "CONNECTION",
    weight: 1,
    biologicalTargets: {
      cortisolReductionTarget: 0.5,
      muscularRecoveryTarget: 0.2,
      cellularTurnoverTarget: 0.15,
      energyOptimizationTarget: 0.35,
      socialSynchronizationTarget: 0.95,
    },
  },
};

export type IntentType = z.infer<typeof IntentTypeSchema>;
export type BiologicalTargetVector = z.infer<typeof BiologicalTargetVectorSchema>;
export type IntentVector = z.infer<typeof IntentVectorSchema>;
export type GuestIntentSignal = z.infer<typeof GuestIntentSignalSchema>;
