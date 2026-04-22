import type { ConstraintAwareBanditCandidateInput } from './optimizer.bandit.constraint-aware.adapter.ts';
import type {
  PortfolioCandidate,
  PortfolioConfig,
  PortfolioOutput,
} from './optimizer.portfolio.contract.ts';
import { DEFAULT_PORTFOLIO_CONFIG } from './optimizer.portfolio.contract.ts';
import { selectPortfolioGreedy } from './optimizer.portfolio.selector.greedy.ts';

export interface PortfolioAdaptInput {
  candidates: ConstraintAwareBanditCandidateInput[];
}

export class OptimizerPortfolioAdapter {
  constructor(
    private readonly config: PortfolioConfig = DEFAULT_PORTFOLIO_CONFIG
  ) {}

  adaptRecommendations(input: PortfolioAdaptInput): PortfolioOutput {
    const candidates: PortfolioCandidate[] = input.candidates.map((candidate) => ({
      recommendationId: candidate.recommendationId,
      experimentId: candidate.experimentId,
      variantId: candidate.variantId,
      title: candidate.title,
      summary: candidate.summary,
      recommendationFamily: candidate.recommendationFamily,
      finalBanditScore: candidate.finalBanditScore,
      riskScore: candidate.constraintSignals.riskScore,
      allowed: candidate.constraints?.allowed ?? true,
      blockedReasons: candidate.constraints?.blockedReasons ?? [],
      exploitationScore: candidate.bandit.exploitationScore,
      explorationScore: candidate.bandit.explorationScore,
      posteriorScore: candidate.bandit.posteriorScore,
    }));

    return selectPortfolioGreedy({
      candidates,
      config: this.config,
    });
  }
}
