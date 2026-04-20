// ⚠️ LEGACY COMPAT LAYER
// Bu dosya ileride SİLİNECEK

import { getPricingDecision } from "./pricing-service.js";

export async function pricingHeuristic(packageId) {
  return getPricingDecision(packageId, globalThis.__SANTIS_DEPS__);
}
