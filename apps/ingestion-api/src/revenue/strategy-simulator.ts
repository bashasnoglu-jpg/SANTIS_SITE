import { StrategyProposal } from "./strategy.types.js";

interface Input {
  baseRevenue: number;

  candidates: {
    id: string;
    value: number;
    confidence: number;
    successRate: number;
  }[];
}

export function simulateStrategy(input: Input): StrategyProposal {
  const { baseRevenue, candidates } = input;

  const variants = candidates.map((c) => {
    const projectedRevenue = baseRevenue * (1 + c.value);

    const expectedDelta = projectedRevenue - baseRevenue;

    // risk = inverse confidence + volatility proxy
    const riskScore =
      (1 - c.confidence) * 0.6 +
      (1 - c.successRate) * 0.4;

    return {
      id: c.id,
      label: `${Math.round(c.value * 100)}% pricing change`,

      expectedDelta,
      confidence: c.confidence,
      riskScore,

      reasoning: [
        `value=${c.value}`,
        `confidence=${c.confidence}`,
        `success=${c.successRate}`,
      ],
    };
  });

  // pick best: highest delta but penalize risk
  const scored = variants.map((v) => ({
    ...v,
    score: v.expectedDelta * (1 - v.riskScore),
  }));

  const best = scored.sort((a, b) => b.score - a.score)[0];

  return {
    strategyId: `strat_${Date.now()}`,
    variants,
    recommendedVariantId: best.id,
    createdAt: Date.now(),
  };
}
