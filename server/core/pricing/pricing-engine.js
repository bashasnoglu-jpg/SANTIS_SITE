// PURE ENGINE — ZERO SIDE EFFECT
// NO DB, NO IO, NO FETCH
import { calculateBaseUplift, PRICING_RULES } from "./pricing-rules.js";
import { applyDiscountCap, evaluateDiscountRisk } from "./discount-policy.js";
import { normalizeCurrency } from "./currency-normalizer.js";

/**
 * @typedef {Object} PricingInput
 * @property {number} baseCost
 * @property {number} listedPrice
 * @property {number} demandScore
 * @property {number} requestedDiscountPercent
 * @property {number} exchangeRate
 */

export function evaluatePricingRisk(input) {
  const {
    baseCost = 0,
    listedPrice = 0,
    demandScore = 0,
    requestedDiscountPercent = 0,
    exchangeRate = 1,
  } = input;

  const normalizedCost = normalizeCurrency(baseCost, exchangeRate);
  const normalizedListedPrice = normalizeCurrency(listedPrice, exchangeRate);

  const upliftedPrice =
    normalizedListedPrice * calculateBaseUplift(demandScore);
  const safeDiscountedPrice = applyDiscountCap(
    upliftedPrice,
    requestedDiscountPercent,
    normalizedCost,
    PRICING_RULES.MIN_MARGIN_PERCENT,
  );

  const riskScore = evaluateDiscountRisk(upliftedPrice, safeDiscountedPrice);

  let level = "LOW";
  if (riskScore >= PRICING_RULES.HIGH_RISK_THRESHOLD) level = "HIGH";
  else if (riskScore > PRICING_RULES.MEDIUM_RISK_THRESHOLD) level = "MEDIUM";

  const reasons = [];
  if (riskScore >= 50) reasons.push("excessive_discount_margin");
  if (safeDiscountedPrice <= normalizedCost * 1.2)
    reasons.push("margin_safety_compromised");

  return {
    score: riskScore,
    level,
    reasons: reasons.length > 0 ? reasons : ["margin_stable"],
    suggestedAction: level === "HIGH" ? "BLOCK_DISCOUNT" : null,
  };
}
