import type { SovereignAction } from "@santis/domain-schema/src/core-state.interface";
import type { RitualPathCandidate } from "./bounded-pathfinding.service";

export type PricingTier = "ESSENTIAL" | "SIGNATURE" | "SOVEREIGN";

export type PricingContext = {
  candidate: RitualPathCandidate;
  demandFactor?: number; // 0.8..1.4 operational demand signal
};

export type TieredPrice = {
  tier: PricingTier;
  baseCost: number;
  multiplier: number;
  finalPrice: number;
  explanation: {
    alignmentScore: number;
    synergyScore: number;
    loadPenalty: number;
    demandFactor: number;
    boundedByTenantPolicy: boolean;
  };
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function psychologicalRound(price: number) {
  if (price < 100) return Math.round(price / 5) * 5;
  return Math.round(price / 10) * 10;
}

function resolveTier(alignment: number, synergy: number, penalty: number): PricingTier {
  if (alignment >= 0.85 && synergy >= 1.25 && penalty <= 0.05) return "SOVEREIGN";
  if (alignment >= 0.6 && synergy >= 1.1 && penalty <= 0.2) return "SIGNATURE";
  return "ESSENTIAL";
}

export const priceRitualPath: SovereignAction<PricingContext, TieredPrice> = async (ctx, payload) => {
  const score = payload.candidate.score;
  const demandFactor = clamp(payload.demandFactor ?? 1, 0.8, 1.4);

  const minMultiplier = 0.8;
  const maxMultiplier = 1.8;

  const alignmentPremium = Math.pow(score.alignmentScore, 1.35) * 0.45;
  const synergyPremium = Math.max(0, score.synergyScore - 1) * 0.55;
  const penaltyDiscount = score.loadPenalty * 0.35;
  const demandPremium = (demandFactor - 1) * 0.25;

  const rawMultiplier = 1 + alignmentPremium + synergyPremium + demandPremium - penaltyDiscount;
  const multiplier = clamp(rawMultiplier, minMultiplier, maxMultiplier);
  const tier = resolveTier(score.alignmentScore, score.synergyScore, score.loadPenalty);
  const finalPrice = psychologicalRound(score.totalCost * multiplier);

  return {
    tier,
    baseCost: score.totalCost,
    multiplier,
    finalPrice,
    explanation: {
      alignmentScore: score.alignmentScore,
      synergyScore: score.synergyScore,
      loadPenalty: score.loadPenalty,
      demandFactor,
      boundedByTenantPolicy: rawMultiplier !== multiplier,
    },
  };
};
