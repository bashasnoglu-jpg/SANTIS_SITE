// ⚠️ LEGACY COMPAT LAYER
import { getVipRiskEvaluation } from "./vip-risk-service.js";

export async function vipRiskHeuristic(guestId) {
  return getVipRiskEvaluation(guestId, globalThis.__SANTIS_DEPS__);
}
