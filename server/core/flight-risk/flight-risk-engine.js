// PURE ENGINE — ZERO SIDE EFFECT
// NO DB, NO IO, NO FETCH

import { calculateRiskScore } from "./risk-model.js";

/**
 * @typedef {Object} FlightRiskInput
 * @property {number} sessionDuration
 * @property {number} inactivityMs
 * @property {number} scrollDepth
 * @property {number} interactions
 * @property {boolean} exitIntent
 */

/**
 * @typedef {Object} FlightRiskOutput
 * @property {number} score
 * @property {"LOW"|"MEDIUM"|"HIGH"} level
 */

export function evaluateFlightRisk(input) {
  const score = calculateRiskScore(input);

  let level = "LOW";
  if (score > 70) level = "HIGH";
  else if (score > 40) level = "MEDIUM";

  return {
    score,
    level,
  };
}
