import type { BanditRankedCandidate } from './optimizer.bandit.adapter.ts';
import type {
  BanditCandidateConstraintInput,
  BanditConstraintBlockReason,
  BanditConstraintConfig,
} from './optimizer.bandit.constraints.contract.ts';
import { DEFAULT_BANDIT_CONSTRAINT_CONFIG } from './optimizer.bandit.constraints.contract.ts';
import { evaluateBanditCandidateConstraints } from './optimizer.bandit.constraints.ts';
import type {
  BanditDecisionTelemetryEvent,
  BanditDecisionTelemetrySummary,
} from './optimizer.bandit.telemetry.contract.ts';
import { summarizeBanditDecisionTelemetry } from './optimizer.bandit.telemetry.ts';

export interface ConstraintAwareBanditCandidateInput
  extends BanditRankedCandidate {
  constraintSignals: {
    riskScore: number | null;
    projectedTrafficShare: number | null;
    liveGuardrailScore: number | null;
  };
}

export interface ConstraintAwareBanditRecommendation
  extends BanditRankedCandidate {
  constraintSignals: {
    riskScore: number | null;
    projectedTrafficShare: number | null;
    liveGuardrailScore: number | null;
  };
  constraints: {
    allowed: boolean;
    blockedReasons: BanditConstraintBlockReason[];
  };
}

export interface ConstraintAwareBanditOutput {
  ranked: ConstraintAwareBanditRecommendation[];
  telemetry: {
    events: BanditDecisionTelemetryEvent[];
    summary: BanditDecisionTelemetrySummary;
  };
}

export class ConstraintAwareBanditAdapter {
  constructor(
    private readonly config: BanditConstraintConfig =
      DEFAULT_BANDIT_CONSTRAINT_CONFIG
  ) {}

  adaptRecommendations(
    input: ConstraintAwareBanditCandidateInput[]
  ): ConstraintAwareBanditOutput {
    const familyWinnerCounts = new Map<string, number>();
    const telemetryEvents: BanditDecisionTelemetryEvent[] = [];
    const ranked: ConstraintAwareBanditRecommendation[] = [];

    const sorted = [...input].sort(
      (a, b) => b.finalBanditScore - a.finalBanditScore
    );

    for (const candidate of sorted) {
      const baseConstraintDecision = evaluateBanditCandidateConstraints(
        {
          recommendationId: candidate.recommendationId,
          experimentId: candidate.experimentId,
          variantId: candidate.variantId,
          recommendationFamily: candidate.recommendationFamily,
          riskScore: candidate.constraintSignals.riskScore,
          projectedTrafficShare: candidate.constraintSignals.projectedTrafficShare,
          liveGuardrailScore: candidate.constraintSignals.liveGuardrailScore,
        },
        this.config
      );

      const currentFamilyWinnerCount =
        familyWinnerCounts.get(candidate.recommendationFamily) ?? 0;

      const fairnessReasons = [...baseConstraintDecision.reasons];

      const fairnessExceeded =
        baseConstraintDecision.allowed &&
        currentFamilyWinnerCount >= this.config.maxWinnersPerFamily;

      if (fairnessExceeded) {
        fairnessReasons.push('family_fairness_exceeded');
      }

      const allowed = fairnessReasons.length === 0;

      if (allowed) {
        familyWinnerCounts.set(
          candidate.recommendationFamily,
          currentFamilyWinnerCount + 1
        );
      }

      ranked.push({
        ...candidate,
        constraintSignals: candidate.constraintSignals,
        constraints: {
          allowed,
          blockedReasons: fairnessReasons,
        },
      });

      telemetryEvents.push({
        experimentId: candidate.experimentId,
        variantId: candidate.variantId,
        recommendationId: candidate.recommendationId,
        recommendationFamily: candidate.recommendationFamily,
        finalBanditScore: candidate.finalBanditScore,
        exploitationScore: candidate.bandit.exploitationScore,
        explorationScore: candidate.bandit.explorationScore,
        posteriorScore: candidate.bandit.posteriorScore,
        allowed,
        blockedReasons: fairnessReasons,
        evaluatedAt: new Date().toISOString(),
      });
    }

    return {
      ranked,
      telemetry: {
        events: telemetryEvents,
        summary: summarizeBanditDecisionTelemetry(telemetryEvents),
      },
    };
  }
}
