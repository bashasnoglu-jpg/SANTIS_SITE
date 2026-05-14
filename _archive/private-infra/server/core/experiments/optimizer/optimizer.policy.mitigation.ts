import type { OptimizerAnomaly } from './optimizer.ops.anomaly.contract.ts';
import type { OptimizerRuntimePolicy } from './optimizer.policy.contract.ts';

export interface PolicyMitigationResult {
  nextPolicy: OptimizerRuntimePolicy;
  changedFields: string[];
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function applyAnomalyMitigations(params: {
  basePolicy: OptimizerRuntimePolicy;
  anomalies: OptimizerAnomaly[];
  ttlMinutes?: number;
}): PolicyMitigationResult {
  const ttlMinutes = params.ttlMinutes ?? 30;
  const changedFields = new Set<string>();

  let next: OptimizerRuntimePolicy = {
    ...params.basePolicy,
    source: 'auto_mitigated',
    reason: params.anomalies.map((item) => item.type).join(', '),
    activatedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + ttlMinutes * 60_000).toISOString(),
  };

  for (const anomaly of params.anomalies) {
    switch (anomaly.type) {
      case 'risk_surge': {
        const nextRisk = clamp(next.maxRiskScoreAllowed * 0.8, 10, 100);
        const nextPortfolioRisk = clamp(next.maxTotalRiskScore * 0.8, 15, 100);

        if (nextRisk !== next.maxRiskScoreAllowed) {
          next.maxRiskScoreAllowed = nextRisk;
          changedFields.add('maxRiskScoreAllowed');
        }

        if (nextPortfolioRisk !== next.maxTotalRiskScore) {
          next.maxTotalRiskScore = nextPortfolioRisk;
          changedFields.add('maxTotalRiskScore');
        }
        break;
      }

      case 'exploration_spike': {
        const nextExplorationBonus = clamp(
          next.maxExplorationBonus * 0.7,
          0.03,
          0.2
        );
        const nextMinLearnedWeight = clamp(
          next.minLearnedWeightForExploration + 0.05,
          0.55,
          0.9
        );

        if (nextExplorationBonus !== next.maxExplorationBonus) {
          next.maxExplorationBonus = nextExplorationBonus;
          changedFields.add('maxExplorationBonus');
        }

        if (nextMinLearnedWeight !== next.minLearnedWeightForExploration) {
          next.minLearnedWeightForExploration = nextMinLearnedWeight;
          changedFields.add('minLearnedWeightForExploration');
        }
        break;
      }

      case 'allowed_drop': {
        const nextGuardrail = clamp(
          next.minGuardrailScoreRequired - 0.03,
          0.65,
          0.95
        );
        const nextTrafficCap = clamp(
          next.maxTrafficSharePerVariant + 0.03,
          0.1,
          0.5
        );

        if (nextGuardrail !== next.minGuardrailScoreRequired) {
          next.minGuardrailScoreRequired = nextGuardrail;
          changedFields.add('minGuardrailScoreRequired');
        }

        if (nextTrafficCap !== next.maxTrafficSharePerVariant) {
          next.maxTrafficSharePerVariant = nextTrafficCap;
          changedFields.add('maxTrafficSharePerVariant');
        }
        break;
      }

      case 'blocked_spike': {
        const nextTrafficCap = clamp(
          next.maxTrafficSharePerVariant + 0.02,
          0.1,
          0.5
        );
        const nextPortfolioSize = clamp(
          next.maxPortfolioSize + 1,
          1,
          5
        );

        if (nextTrafficCap !== next.maxTrafficSharePerVariant) {
          next.maxTrafficSharePerVariant = nextTrafficCap;
          changedFields.add('maxTrafficSharePerVariant');
        }

        if (nextPortfolioSize !== next.maxPortfolioSize) {
          next.maxPortfolioSize = nextPortfolioSize;
          changedFields.add('maxPortfolioSize');
        }
        break;
      }
    }
  }

  return {
    nextPolicy: next,
    changedFields: [...changedFields],
  };
}
