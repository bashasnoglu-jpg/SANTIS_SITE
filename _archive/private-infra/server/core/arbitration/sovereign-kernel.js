import { TRUST_WEIGHTS as ENGINE_PRIORITIES } from "./weight-registry.js";

export const synthesizeSovereignDecision = (engineOutputs) => {
  const { pricing, flightRisk, ritual, vipRisk } = engineOutputs;

  // 1. HARD-STOP CHECK (Sağlık İhlali)
  if (
    ritual.level === "LOW" &&
    ritual.suggestedAction === "HIDE_RECOMMENDATION" &&
    ritual.reasons.some((r) => r.includes("contraindication"))
  ) {
    return {
      decision: "DENY_OPERATION",
      priority: "IMMEDIATE",
      finalAction: "CANCEL_AND_REFUND",
      reason: `Sağlık Kısıtlaması Tespit Edildi: ${ritual.reasons.join(", ")}`,
    };
  }

  // 2. CONFLICT ALGEBRA (Pricing vs VIP)
  let overrideAction = null;
  if (vipRisk.score > 80 && pricing.level === "HIGH") {
    overrideAction = "REPRESS_PRICING_FOR_RETENTION";
  }

  // 3. WEIGHTED SCORE CALCULATION
  const weightedSum =
    (pricing.score || 0) * ENGINE_PRIORITIES.PRICING +
    (vipRisk.score || 0) * ENGINE_PRIORITIES.VIP_RISK +
    (flightRisk?.score || 0) * ENGINE_PRIORITIES.FLIGHT_RISK;

  const totalWeight =
    ENGINE_PRIORITIES.PRICING +
    ENGINE_PRIORITIES.VIP_RISK +
    ENGINE_PRIORITIES.FLIGHT_RISK;
  const globalHealthScore = weightedSum / totalWeight;

  return {
    globalScore: Math.round(globalHealthScore),
    decision: overrideAction || "OPTIMIZED_EXECUTION",
    directives: [
      ...(pricing.reasons || []),
      ...(vipRisk.reasons || []),
      ...(ritual.reasons || []),
    ],
    suggestedPayload: {
      pricingAction: overrideAction
        ? "FORCE_BASE_PRICE"
        : pricing.suggestedAction,
      riskLevel: vipRisk.level,
      ritualAction: ritual.suggestedAction,
    },
  };
};
