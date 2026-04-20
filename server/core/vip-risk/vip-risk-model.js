import {
  evaluateDissatisfaction,
  evaluateLoyaltyDecay,
} from "./churn-signals.js";

export function calculateVipRisk(input) {
  const dissatisfactionScore = evaluateDissatisfaction(
    input.complaintCount,
    input.hasDowngradeRisk,
  );
  const loyaltyDecayScore = evaluateLoyaltyDecay(input.daysSinceLastVisit);

  let totalRisk = dissatisfactionScore + loyaltyDecayScore;

  if (input.isHighSpender && totalRisk >= 40) {
    totalRisk += 15;
  }

  return Math.min(totalRisk, 100);
}
