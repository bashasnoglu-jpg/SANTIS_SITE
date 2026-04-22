import type { OptimizerPolicyProposal } from './optimizer.policy.approval.contract.ts';
import type { OptimizerRuntimePolicy } from './optimizer.policy.contract.ts';
import type {
  PolicySimulationCandidate,
  PolicySimulationResponse,
  PolicySimulationScenarioResult,
  PolicySimulationSnapshotInput,
} from './optimizer.policy.simulation.contract.ts';
import { buildPolicySimulationDiff } from './optimizer.policy.simulation.diff.ts';

function evaluateCandidateAgainstPolicy(params: {
  candidate: PolicySimulationCandidate;
  policy: OptimizerRuntimePolicy;
}): { allowed: boolean; blockedReasons: string[] } {
  const reasons: string[] = [];

  if (
    params.candidate.riskScore !== null &&
    params.candidate.riskScore > params.policy.maxRiskScoreAllowed
  ) {
    reasons.push('risk_ceiling_exceeded');
  }

  if (
    params.candidate.projectedTrafficShare !== null &&
    params.candidate.projectedTrafficShare > params.policy.maxTrafficSharePerVariant
  ) {
    reasons.push('traffic_cap_exceeded');
  }

  if (
    params.candidate.liveGuardrailScore !== null &&
    params.candidate.liveGuardrailScore < params.policy.minGuardrailScoreRequired
  ) {
    reasons.push('guardrail_score_too_low');
  }

  return {
    allowed: reasons.length === 0,
    blockedReasons: reasons,
  };
}

function simulateScenario(params: {
  policy: OptimizerRuntimePolicy;
  snapshot: PolicySimulationSnapshotInput;
}): PolicySimulationScenarioResult {
  const evaluated = params.snapshot.candidates.map((candidate) => {
    const policyDecision = evaluateCandidateAgainstPolicy({
      candidate,
      policy: params.policy,
    });

    return {
      ...candidate,
      allowed: policyDecision.allowed,
      blockedReasons: policyDecision.blockedReasons,
    };
  });

  const allowed = evaluated
    .filter((candidate) => candidate.allowed)
    .sort((a, b) => b.finalBanditScore - a.finalBanditScore);

  const selected: typeof allowed = [];
  const familyCounts = new Map<string, number>();
  let totalRiskScore = 0;
  let totalPortfolioScore = 0;

  for (const candidate of allowed) {
    if (selected.length >= params.policy.maxPortfolioSize) {
      continue;
    }

    const familyCount = familyCounts.get(candidate.recommendationFamily) ?? 0;
    if (familyCount >= params.policy.maxWinnersPerFamily) {
      continue;
    }

    const nextRisk = totalRiskScore + (candidate.riskScore ?? 0);
    if (nextRisk > params.policy.maxTotalRiskScore) {
      continue;
    }

    selected.push(candidate);
    totalRiskScore = nextRisk;
    totalPortfolioScore += candidate.finalBanditScore;
    familyCounts.set(candidate.recommendationFamily, familyCount + 1);
  }

  return {
    policy: params.policy,
    allowedVariantIds: allowed.map((item) => item.variantId),
    blocked: evaluated
      .filter((item) => !item.allowed)
      .map((item) => ({
        variantId: item.variantId,
        blockedReasons: item.blockedReasons,
      })),
    selectedVariantIds: selected.map((item) => item.variantId),
    totalRiskScore,
    totalPortfolioScore,
  };
}

export class OptimizerPolicySimulationEngine {
  simulateProposal(params: {
    proposal: OptimizerPolicyProposal;
    snapshot: PolicySimulationSnapshotInput;
  }): PolicySimulationResponse {
    const baseline = simulateScenario({
      policy: params.proposal.basePolicy,
      snapshot: params.snapshot,
    });

    const simulated = simulateScenario({
      policy: params.proposal.proposedPolicy,
      snapshot: params.snapshot,
    });

    return {
      experimentId: params.snapshot.experimentId,
      proposalId: params.proposal.proposalId,
      generatedAt: new Date().toISOString(),
      baseline,
      simulated,
      diff: buildPolicySimulationDiff({
        baseline,
        simulated,
      }),
    };
  }
}
