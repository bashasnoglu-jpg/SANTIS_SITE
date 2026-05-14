import { randomUUID } from 'node:crypto';
import type { OptimizerRuntimePolicy } from './optimizer.policy.contract.ts';
import type { PolicyDeltaCandidate, PolicyRecommendationPatchOp } from './optimizer.policy.recommender.contract.ts';

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function buildCandidate(params: {
  base: OptimizerRuntimePolicy;
  label: string;
  description: string;
  mutate: (base: OptimizerRuntimePolicy) => OptimizerRuntimePolicy;
  ops: (base: OptimizerRuntimePolicy, next: OptimizerRuntimePolicy) => PolicyRecommendationPatchOp[];
}): PolicyDeltaCandidate {
  const next = params.mutate(params.base);
  const changedFields = Object.keys(next).filter((key) => {
    const typedKey = key as keyof OptimizerRuntimePolicy;
    return next[typedKey] !== params.base[typedKey];
  });
  return {
    candidateId: randomUUID(),
    label: params.label,
    description: params.description,
    policy: next,
    changedFields,
    patch: { ops: params.ops(params.base, next) },
  };
}

export function generatePolicyDeltaCandidates(
  base: OptimizerRuntimePolicy
): PolicyDeltaCandidate[] {
  return [
    buildCandidate({
      base,
      label: 'Safer Risk Posture',
      description: 'Tighten risk ceilings and portfolio risk budget.',
      mutate: (current) => ({
        ...current,
        source: 'auto_mitigated',
        reason: 'recommender:safer_risk_posture',
        maxRiskScoreAllowed: clamp(current.maxRiskScoreAllowed - 5, 10, 100),
        maxTotalRiskScore: clamp(current.maxTotalRiskScore - 8, 15, 100),
      }),
      ops: (current, next) => [
        { op: 'set', path: 'maxRiskScoreAllowed', previousValue: current.maxRiskScoreAllowed, value: next.maxRiskScoreAllowed, reason: 'Reduce exposure to high-risk decisions' },
        { op: 'set', path: 'maxTotalRiskScore', previousValue: current.maxTotalRiskScore, value: next.maxTotalRiskScore, reason: 'Cap aggregate portfolio risk more aggressively' }
      ]
    }),
    buildCandidate({
      base,
      label: 'Controlled Exploration',
      description: 'Reduce exploration bonus and raise exploration quality gate.',
      mutate: (current) => ({
        ...current,
        source: 'auto_mitigated',
        reason: 'recommender:controlled_exploration',
        maxExplorationBonus: clamp(current.maxExplorationBonus - 0.05, 0.03, 0.2),
        minLearnedWeightForExploration: clamp(
          current.minLearnedWeightForExploration + 0.05,
          0.55,
          0.9
        ),
      }),
      ops: (current, next) => [
        { op: 'set', path: 'maxExplorationBonus', previousValue: current.maxExplorationBonus, value: next.maxExplorationBonus, reason: 'Trim exploration bonus to reduce volatility' },
        { op: 'set', path: 'minLearnedWeightForExploration', previousValue: current.minLearnedWeightForExploration, value: next.minLearnedWeightForExploration, reason: 'Require slightly higher confidence for exploration execution' }
      ]
    }),
    buildCandidate({
      base,
      label: 'Slightly Relaxed Throughput',
      description: 'Ease guardrail and traffic cap slightly to recover blocked throughput.',
      mutate: (current) => ({
        ...current,
        source: 'auto_mitigated',
        reason: 'recommender:relaxed_throughput',
        minGuardrailScoreRequired: clamp(
          current.minGuardrailScoreRequired - 0.03,
          0.65,
          0.95
        ),
        maxTrafficSharePerVariant: clamp(
          current.maxTrafficSharePerVariant + 0.03,
          0.1,
          0.5
        ),
      }),
      ops: (current, next) => [
        { op: 'set', path: 'minGuardrailScoreRequired', previousValue: current.minGuardrailScoreRequired, value: next.minGuardrailScoreRequired, reason: 'Ease guardrail to allow more decisions' },
        { op: 'set', path: 'maxTrafficSharePerVariant', previousValue: current.maxTrafficSharePerVariant, value: next.maxTrafficSharePerVariant, reason: 'Allow slightly higher traffic share per variant' }
      ]
    }),
    buildCandidate({
      base,
      label: 'Broader Portfolio',
      description: 'Allow one extra slot in the slate while keeping family cap.',
      mutate: (current) => ({
        ...current,
        source: 'auto_mitigated',
        reason: 'recommender:broader_portfolio',
        maxPortfolioSize: clamp(current.maxPortfolioSize + 1, 1, 5),
      }),
      ops: (current, next) => [
        { op: 'set', path: 'maxPortfolioSize', previousValue: current.maxPortfolioSize, value: next.maxPortfolioSize, reason: 'Increase portfolio slots for broader diversity' }
      ]
    }),
    buildCandidate({
      base,
      label: 'Balanced Hybrid',
      description: 'Slightly tighten risk while slightly reducing exploration.',
      mutate: (current) => ({
        ...current,
        source: 'auto_mitigated',
        reason: 'recommender:balanced_hybrid',
        maxRiskScoreAllowed: clamp(current.maxRiskScoreAllowed - 3, 10, 100),
        maxTotalRiskScore: clamp(current.maxTotalRiskScore - 4, 15, 100),
        maxExplorationBonus: clamp(current.maxExplorationBonus - 0.03, 0.03, 0.2),
      }),
      ops: (current, next) => [
        { op: 'set', path: 'maxRiskScoreAllowed', previousValue: current.maxRiskScoreAllowed, value: next.maxRiskScoreAllowed, reason: 'Moderately tighten single-decision risk' },
        { op: 'set', path: 'maxTotalRiskScore', previousValue: current.maxTotalRiskScore, value: next.maxTotalRiskScore, reason: 'Moderately reduce aggregate risk ceiling' },
        { op: 'set', path: 'maxExplorationBonus', previousValue: current.maxExplorationBonus, value: next.maxExplorationBonus, reason: 'Preserve learning while trimming unnecessary exploration' }
      ]
    }),
  ].filter((candidate) => candidate.changedFields.length > 0);
}
