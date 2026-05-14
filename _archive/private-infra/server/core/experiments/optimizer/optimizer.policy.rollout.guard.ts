import {
  OptimizerRolloutMetricsSnapshot,
  OptimizerRolloutGuard,
} from './optimizer.policy.rollout.contract.ts';

export type RolloutGuardEvaluation =
  | {
      ok: true;
    }
  | {
      ok: false;
      reason: string;
    };

export function evaluateRolloutGuard(
  guard: OptimizerRolloutGuard,
  metrics: OptimizerRolloutMetricsSnapshot,
): RolloutGuardEvaluation {
  const minSampleSize = guard.minSampleSize ?? 30;

  if (metrics.sampleSize < minSampleSize) {
    return { ok: true };
  }

  if (metrics.riskDelta > guard.maxRiskIncrease) {
    return {
      ok: false,
      reason: `Risk delta ${metrics.riskDelta} exceeded maxRiskIncrease ${guard.maxRiskIncrease}`,
    };
  }

  if (metrics.scoreDelta < guard.minScoreDelta) {
    return {
      ok: false,
      reason: `Score delta ${metrics.scoreDelta} fell below minScoreDelta ${guard.minScoreDelta}`,
    };
  }

  if (
    guard.minStabilityDelta !== undefined &&
    metrics.stabilityDelta < guard.minStabilityDelta
  ) {
    return {
      ok: false,
      reason: `Stability delta ${metrics.stabilityDelta} fell below minStabilityDelta ${guard.minStabilityDelta}`,
    };
  }

  return { ok: true };
}
