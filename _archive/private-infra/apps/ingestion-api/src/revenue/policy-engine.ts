import { PolicyResult } from "./policy.types.js";

interface Input {
  action: string;
  value: number;

  segment: string;
  isVIP: boolean;

  medicalAlert?: boolean;

  priceCeiling: number;
  priceFloor: number;
}

export function applyPolicy(input: Input): PolicyResult {
  const reasons: string[] = [];

  let value = input.value;

  // 1. MEDICAL BLOCK (HARD STOP)
  if (input.medicalAlert) {
    return {
      allowed: false,
      action: "suppress",
      reasons: ["medical_block"],
    };
  }

  // 2. VIP PROTECTION
  if (input.isVIP && input.action === "increase_price") {
    return {
      allowed: false,
      action: "suppress",
      reasons: ["vip_protection"],
    };
  }

  // 3. PRICE CEILING
  if (value > input.priceCeiling) {
    value = input.priceCeiling;

    reasons.push("clamped_to_ceiling");

    return {
      allowed: true,
      action: "clamp",
      adjustedValue: value,
      reasons,
    };
  }

  // 4. PRICE FLOOR
  if (value < input.priceFloor) {
    value = input.priceFloor;

    reasons.push("clamped_to_floor");

    return {
      allowed: true,
      action: "clamp",
      adjustedValue: value,
      reasons,
    };
  }

  return {
    allowed: true,
    action: "allow",
    adjustedValue: value,
    reasons: ["policy_pass"],
  };
}
