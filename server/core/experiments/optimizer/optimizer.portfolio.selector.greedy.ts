import type {
  PortfolioCandidate,
  PortfolioConfig,
  PortfolioOutput,
  PortfolioSelectedCandidate,
} from './optimizer.portfolio.contract.ts';
import {
  applyCandidateToPortfolioState,
  canAddCandidateToPortfolio,
  createEmptyPortfolioState,
  getCandidateRiskScore,
} from './optimizer.portfolio.constraints.ts';
import { computeMarginalGain } from './optimizer.portfolio.scorer.ts';

export function selectPortfolioGreedy(params: {
  candidates: PortfolioCandidate[];
  config: PortfolioConfig;
}): PortfolioOutput {
  let state = createEmptyPortfolioState();

  const remaining = [...params.candidates];
  const ranked: PortfolioSelectedCandidate[] = [];

  while (remaining.length > 0) {
    const scored = remaining.map((candidate) => ({
      candidate,
      marginalGain: computeMarginalGain({
        candidate,
        state,
        config: params.config,
      }),
    }));

    scored.sort((a, b) => b.marginalGain - a.marginalGain);

    const best = scored[0];
    if (!best) {
      break;
    }

    const admissibility = canAddCandidateToPortfolio({
      candidate: best.candidate,
      state,
      config: params.config,
    });

    const cumulativeRiskScore =
      state.totalRiskScore + getCandidateRiskScore(best.candidate);

    const selectedCandidate: PortfolioSelectedCandidate = {
      ...best.candidate,
      portfolio: admissibility.allowed
        ? {
            selected: true,
            marginalGain: best.marginalGain,
            cumulativeRiskScore,
            selectionReason: {
              type: 'selected',
              detail: `Selected with marginal gain ${best.marginalGain.toFixed(2)}.`,
            },
          }
        : {
            selected: false,
            marginalGain: best.marginalGain,
            cumulativeRiskScore: state.totalRiskScore,
            selectionReason: {
              type: admissibility.reason,
              detail: admissibility.detail,
            },
          },
    };

    ranked.push(selectedCandidate);

    if (admissibility.allowed) {
      state = applyCandidateToPortfolioState(state, selectedCandidate);
    }

    const index = remaining.findIndex(
      (candidate) =>
        candidate.recommendationId === best.candidate.recommendationId
    );

    remaining.splice(index, 1);
  }

  const selected = ranked.filter((item) => item.portfolio.selected);

  const familyCounts: Record<string, number> = {};
  let totalPortfolioScore = 0;

  for (const item of selected) {
    familyCounts[item.recommendationFamily] =
      (familyCounts[item.recommendationFamily] ?? 0) + 1;
    totalPortfolioScore += item.finalBanditScore;
  }

  return {
    selected,
    ranked,
    summary: {
      selectedCount: selected.length,
      totalRiskScore: state.totalRiskScore,
      totalPortfolioScore,
      familyCounts,
    },
  };
}
