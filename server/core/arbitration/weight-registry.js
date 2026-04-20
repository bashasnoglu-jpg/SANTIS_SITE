/**
 * SANTIS WEIGHT REGISTRY (v3)
 * Rule: Immutable constants for decision weights.
 * Update Policy: Config-as-Code / GitOps Approval Required.
 */

export const TRUST_WEIGHTS = {
  HEALTH_GUARD: 1000,
  VIP_RISK: 100, // Baz ağırlık: 100
  FLIGHT_RISK: 80,
  PRICING: 50,
  RITUAL: 30,
  LEARNING_ETA: 0.05,
};

export const WEIGHT_THRESHOLDS = {
  REPRESSION_TRIGGER: 0.85, // Sadakat riski bu seviyeyi aşarsa ticari veto başlar.
  CRITICAL_CHURN_RATE: 0.4, // Shadow Analyzer için alarm eşiği.
};
