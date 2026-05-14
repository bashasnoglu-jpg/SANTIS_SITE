import { evaluatePricingRisk } from "../core/pricing/pricing-engine.js";
import { evaluateVipRisk } from "../core/vip-risk/vip-risk-engine.js";
import { evaluateRitualRecommendation } from "../core/ritual-recommendation/ritual-recommendation-engine.js";
import { synthesizeSovereignDecision } from "../core/arbitration/sovereign-kernel.js";
import { logDecisionEvent } from "./telemetry-service.js";

export const getSovereignCommand = async (guestId, context) => {
  // Parallel execution of all A-Bucket engines
  const [pricing, vipRisk, ritual] = await Promise.all([
    Promise.resolve(evaluatePricingRisk(context.pricing)),
    Promise.resolve(evaluateVipRisk(context.vip)),
    Promise.resolve(evaluateRitualRecommendation(context.ritual)),
  ]);

  const flightRisk = { score: 0, level: "LOW", reasons: [] }; // Opsiyonel şimdilik

  const finalDecision = synthesizeSovereignDecision({
    pricing,
    vipRisk,
    ritual,
    flightRisk,
  });

  const traceObject = {
    traceId: `SOV-${Date.now()}`,
    engineOutputs: { pricing, vipRisk, ritual, flightRisk },
    decision: finalDecision.decision,
    directives: finalDecision.directives,
    context: { guestId },
  };
  logDecisionEvent(traceObject);

  return {
    traceId: traceObject.traceId,
    ...finalDecision,
  };
};
