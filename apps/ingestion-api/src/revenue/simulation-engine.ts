import { applyConstraints } from "./constraint-engine.js";
import { applyPolicy } from "./policy-engine.js";

interface SimulationInput {
  baseState: any;
  hypotheticalValue: number;
}

export function simulate(input: SimulationInput) {
  const { baseState, hypotheticalValue } = input;

  // ⚠️ clone yerine projection bazlı hesap
  const baseRevenue = baseState.boardroom?.revenueToday || 45000;

  const simulatedRevenue = baseRevenue * (1 + hypotheticalValue);

  // reuse existing engines (CRITICAL)
  const decision: any = {
    finalAction: hypotheticalValue > 0 ? "increase_price" : (hypotheticalValue < 0 ? "decrease_price" : "neutral"),
    netValue: hypotheticalValue,
    reasoning: ["Simulation hypothetical injection"],
    sources: [],
    idempotencyKey: "sim_" + Date.now()
  };

  const context: any = {
    isVip: baseState.isVIP || false,
    medicalAlert: baseState.medicalAlert || false,
    currentPrice: baseRevenue,
    priceCeiling: baseRevenue * 1.25,
    priceFloor: baseRevenue * 0.75,
  };

  const constrained = applyConstraints(decision, context);

  const policy = applyPolicy({
    action: decision.finalAction,
    value: constrained.netValue,
    segment: baseState.segment || "default",
    isVIP: baseState.isVIP || false,
    priceCeiling: 0.25,
    priceFloor: -0.25,
  });

  return {
    expectedDelta: simulatedRevenue - baseRevenue,
    finalValue: policy.adjustedValue ?? constrained.netValue,
    policy,
  };
}
