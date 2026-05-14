import type { OptimizerDecisionSnapshot } from './optimizer.ops.snapshot.store.ts';
import type { OptimizerPolicyProposal } from './optimizer.policy.approval.contract.ts';
import type {
  PolicyBacktestReplayResult,
  PolicyBacktestResponse,
} from './optimizer.policy.backtest.contract.ts';
import type { PolicySimulationCandidate } from './optimizer.policy.simulation.contract.ts';
import { buildPolicyBacktestSummary } from './optimizer.policy.backtest.mapper.ts';
import { OptimizerPolicySimulationEngine } from './optimizer.policy.simulation.engine.ts';

function mapSnapshotToSimulationCandidates(
  snapshot: OptimizerDecisionSnapshot
): PolicySimulationCandidate[] {
  return snapshot.constrained.ranked.map((candidate) => ({
    recommendationId: candidate.recommendationId,
    variantId: candidate.variantId,
    recommendationFamily: candidate.recommendationFamily,
    finalBanditScore: candidate.finalBanditScore,
    riskScore: candidate.constraintSignals?.riskScore ?? null,
    projectedTrafficShare: candidate.constraintSignals?.projectedTrafficShare ?? null,
    liveGuardrailScore: candidate.constraintSignals?.liveGuardrailScore ?? null,
    currentlyAllowed: candidate.constraints.allowed,
    currentBlockedReasons: candidate.constraints.blockedReasons,
  }));
}

export class OptimizerPolicyBacktestEngine {
  constructor(
    private readonly simulationEngine: OptimizerPolicySimulationEngine
  ) {}

  runBacktest(params: {
    proposal: OptimizerPolicyProposal;
    snapshots: OptimizerDecisionSnapshot[];
    from: string;
    to: string;
  }): PolicyBacktestResponse {
    const replays: PolicyBacktestReplayResult[] = params.snapshots.map((snapshot) => {
      const simulation = this.simulationEngine.simulateProposal({
        proposal: params.proposal,
        snapshot: {
          experimentId: snapshot.experimentId,
          candidates: mapSnapshotToSimulationCandidates(snapshot),
        },
      });

      return {
        snapshotSavedAt: snapshot.savedAt,
        baseline: simulation.baseline,
        simulated: simulation.simulated,
        deltas: {
          totalRiskDelta: simulation.diff.totalRiskDelta,
          totalPortfolioScoreDelta: simulation.diff.totalPortfolioScoreDelta,
          selectedChanged:
            simulation.diff.addedSelectedVariantIds.length > 0 ||
            simulation.diff.removedSelectedVariantIds.length > 0,
        },
      };
    });

    return {
      experimentId: params.proposal.experimentId,
      proposalId: params.proposal.proposalId,
      from: params.from,
      to: params.to,
      generatedAt: new Date().toISOString(),
      summary: buildPolicyBacktestSummary(replays),
      replays,
    };
  }
}
