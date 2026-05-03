import { ResolvedDecision } from "./conflict-resolution-engine.js";

export interface ConstraintContext {
  isVip: boolean;
  medicalAlert: boolean;
  currentPrice: number;
  priceCeiling: number;
  priceFloor: number;
}

export interface ConstrainedDecision extends ResolvedDecision {
  isSuppressed: boolean;
  suppressionReason?: string;
  originalNetValue: number;
}

export function applyConstraints(
  decision: ResolvedDecision,
  context: ConstraintContext
): ConstrainedDecision {
  const result: ConstrainedDecision = {
    ...decision,
    isSuppressed: false,
    originalNetValue: decision.netValue,
    reasoning: [...decision.reasoning]
  };

  // 1. Ethical Overrides (Medical/Ethical rules)
  if (context.medicalAlert && decision.finalAction === "increase_price") {
    result.isSuppressed = true;
    result.suppressionReason = "MEDICAL_ETHICAL_OVERRIDE";
    result.netValue = 0;
    result.finalAction = "neutral";
    result.reasoning.push("Constraint: Suppressed due to medical alert");
    return result;
  }

  // 2. VIP Exception Boundaries
  if (context.isVip && decision.finalAction === "increase_price") {
    result.isSuppressed = true;
    result.suppressionReason = "VIP_SUPPRESSION";
    result.netValue = 0;
    result.finalAction = "neutral";
    result.reasoning.push("Constraint: Suppressed up-pricing for VIP");
    return result;
  }

  // 3. Hard Limits (Price Ceiling / Floor)
  const proposedPrice = context.currentPrice * (1 + decision.netValue);
  
  if (proposedPrice > context.priceCeiling) {
    const maxAllowedNet = (context.priceCeiling / context.currentPrice) - 1;
    if (maxAllowedNet <= 0) {
       result.netValue = 0;
       result.finalAction = "neutral";
       result.reasoning.push("Constraint: Price ceiling hit, neutralised");
    } else {
       result.netValue = maxAllowedNet;
       result.reasoning.push(`Constraint: Capped at price ceiling (max allowed net: ${maxAllowedNet.toFixed(4)})`);
    }
  } else if (proposedPrice < context.priceFloor) {
    const minAllowedNet = (context.priceFloor / context.currentPrice) - 1;
    if (minAllowedNet >= 0) {
       result.netValue = 0;
       result.finalAction = "neutral";
       result.reasoning.push("Constraint: Price floor hit, neutralised");
    } else {
       result.netValue = minAllowedNet;
       result.reasoning.push(`Constraint: Capped at price floor (min allowed net: ${minAllowedNet.toFixed(4)})`);
    }
  }

  return result;
}
