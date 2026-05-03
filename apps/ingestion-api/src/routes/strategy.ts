import { Router } from "express";
import { simulate } from "../revenue/simulation-engine.js";
import { computeRisk } from "../revenue/risk-engine.js";
import {
  buildPriceAdjustmentStrategyKey,
  strategyLearningStore,
} from "../revenue/strategy-learning.store.js";

const router: Router = Router();
const EXPLORATION_RATE = 0.1;

function stableBucket(seed: string) {
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) / 4294967295;
}

function selectRecommendedVariant<T extends {
  id: string;
  score: number;
  learning: { snapshot: { sampleSize: number } | null };
}>(variants: T[], seed: string) {
  const ranked = [...variants].sort((a, b) => b.score - a.score);
  const underTested = ranked
    .filter((variant) => (variant.learning.snapshot?.sampleSize || 0) < 3)
    .sort((a, b) =>
      (a.learning.snapshot?.sampleSize || 0) - (b.learning.snapshot?.sampleSize || 0) ||
      b.score - a.score
    );

  if (underTested.length > 0 && stableBucket(seed) < EXPLORATION_RATE) {
    return {
      variant: underTested[0],
      mode: "deterministic_exploration",
    };
  }

  return {
    variant: ranked[0],
    mode: "exploit",
  };
}

router.get("/propose", async (req, res) => {
  const createdAt = Date.now();
  const strategyId = `strat_${createdAt}`;
  // Mocking getCoreState
  const baseState = {
    boardroom: { revenueToday: 45000 },
    segment: typeof req.query.segment === "string" ? req.query.segment : "default",
    isVIP: false,
  };

  const candidates = [
    { id: "s1", value: 0.05, confidence: 0.8, successRate: 0.7 },
    { id: "s2", value: 0.1, confidence: 0.6, successRate: 0.5 },
    { id: "s3", value: -0.05, confidence: 0.75, successRate: 0.8 },
  ];

  const variants = await Promise.all(candidates.map(async (c) => {
    const strategyKey = buildPriceAdjustmentStrategyKey(c.value);
    const learning = await strategyLearningStore.applyVariantBias({
      strategyKey,
      variantId: c.id,
      segment: baseState.segment,
      confidence: c.confidence,
      successRate: c.successRate,
    });

    const sim = simulate({
      baseState,
      hypotheticalValue: c.value,
    });

    const risk = computeRisk({
      confidence: learning.confidence,
      successRate: learning.successRate,
      historyCount: learning.snapshot?.sampleSize || 0,
    });

    return {
      id: c.id,
      strategyKey,
      label: `${Math.round(c.value * 100)}% pricing change`,
      expectedDelta: sim.expectedDelta,
      riskScore: risk,
      confidence: learning.confidence,
      learning,
      score: sim.expectedDelta * (1 - risk) * learning.rankingMultiplier,
      reasoning: [...sim.policy.reasons, ...learning.reasoning],
    };
  }));

  const recommendation = selectRecommendedVariant(
    variants,
    `${strategyId}|${baseState.segment}|${req.query.seed || ""}`,
  );

  res.json({
    strategyId,
    variants,
    recommendedVariantId: recommendation.variant.id,
    learning: {
      mode: "adaptive_scoring",
      segment: baseState.segment,
      recommendationMode: recommendation.mode,
      explorationRate: EXPLORATION_RATE,
    },
    createdAt,
  });
});

router.get("/state", async (req, res) => {
  // In a real system, this would fetch from a database or shared state service
  // For the Zero-Drift seal, we return the current baseline
  res.json({
    activeStrategy: "AGGRESSIVE_EXPANSION_V4",
    revenueToday: 45000,
    mrr_eur: 842000.50,
    riskLevel: 0.12,
    nodesActive: 7,
    lastUpdate: new Date().toISOString()
  });
});

export default router;
