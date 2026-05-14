// ORCHESTRATION LAYER
// IO burada olur — core'a ASLA sızmaz

import { evaluateFlightRisk } from "../core/flight-risk/flight-risk-engine.js";

/**
 * Example: data aggregation from multiple sources
 */
export async function getFlightRiskForSession(sessionId, deps) {
  const { sessionRepo, telemetryRepo } = deps;

  // 🔌 DATA FETCH (B-KOVASI)
  const session = await sessionRepo.get(sessionId);
  const telemetry = await telemetryRepo.get(sessionId);

  // 🧠 NORMALIZATION
  const input = {
    sessionDuration: session.duration,
    inactivityMs: telemetry.inactivityMs,
    scrollDepth: telemetry.scrollDepth,
    interactions: telemetry.interactions,
    exitIntent: telemetry.exitIntent,
  };

  // ⚡ PURE CALL
  const result = evaluateFlightRisk(input);

  return {
    sessionId,
    ...result,
  };
}
