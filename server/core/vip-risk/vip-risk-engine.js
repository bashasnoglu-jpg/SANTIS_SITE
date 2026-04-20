// PURE ENGINE — ZERO SIDE EFFECT
import { calculateVipRisk } from "./vip-risk-model.js";
import { CHURN_RULES } from "./churn-signals.js";

export function evaluateVipRisk(input) {
  const score = calculateVipRisk(input);

  let level = "LOW";
  let suggestedAction = null;
  const reasons = [];

  if (score >= CHURN_RULES.CRITICAL_THRESHOLD) {
    level = "CRITICAL";
    suggestedAction = "IMMEDIATE_HUMAN_ESCALATION";
    reasons.push("critical_churn_probability");
  } else if (score >= CHURN_RULES.HIGH_THRESHOLD) {
    level = "HIGH";
    suggestedAction = "PROACTIVE_RECOVERY_CAMPAIGN";
    reasons.push("high_loyalty_decay");
  } else if (score >= CHURN_RULES.MEDIUM_THRESHOLD) {
    level = "MEDIUM";
    suggestedAction = "SUBTLE_RE_ENGAGEMENT";
    reasons.push("moderate_inactivity_detected");
  } else {
    reasons.push("vip_status_stable");
  }

  if (input.complaintCount > 0) reasons.push("active_dissatisfaction_signal");

  return {
    score,
    level,
    reasons,
    suggestedAction,
  };
}
