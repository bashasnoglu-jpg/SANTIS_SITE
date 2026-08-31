import type { IntentType, IntentVector } from "@santis-core/domain-contracts/intent.contract";

export const DefaultIntentVectors: Record<IntentType, IntentVector> = {
  RESET: { intent: "RESET", weight: 1, biologicalTargets: { cortisolReductionTarget: 0.9, muscularRecoveryTarget: 0.35, cellularTurnoverTarget: 0.15, energyOptimizationTarget: 0.25, socialSynchronizationTarget: 0.1 } },
  RECOVER: { intent: "RECOVER", weight: 1, biologicalTargets: { cortisolReductionTarget: 0.45, muscularRecoveryTarget: 0.9, cellularTurnoverTarget: 0.25, energyOptimizationTarget: 0.45, socialSynchronizationTarget: 0.05 } },
  BEAUTY: { intent: "BEAUTY", weight: 1, biologicalTargets: { cortisolReductionTarget: 0.25, muscularRecoveryTarget: 0.1, cellularTurnoverTarget: 0.95, energyOptimizationTarget: 0.25, socialSynchronizationTarget: 0.15 } },
  PERFORMANCE: { intent: "PERFORMANCE", weight: 1, biologicalTargets: { cortisolReductionTarget: 0.25, muscularRecoveryTarget: 0.65, cellularTurnoverTarget: 0.2, energyOptimizationTarget: 0.95, socialSynchronizationTarget: 0.05 } },
  CONNECTION: { intent: "CONNECTION", weight: 1, biologicalTargets: { cortisolReductionTarget: 0.5, muscularRecoveryTarget: 0.2, cellularTurnoverTarget: 0.15, energyOptimizationTarget: 0.35, socialSynchronizationTarget: 0.95 } },
};
