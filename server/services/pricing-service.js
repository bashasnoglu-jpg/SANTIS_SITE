// ORCHESTRATION LAYER
import { evaluatePricingRisk } from "../core/pricing/pricing-engine.js";

export async function getPricingDecision(packageId, deps) {
  const { pricingRepo, tenantConfig } = deps;

  // 🔌 DATA FETCH (B-KOVASI)
  const packageData = await pricingRepo.getPackage(packageId);
  const exchangeRate = tenantConfig.getExchangeRate("EUR", "TRY");

  const input = {
    baseCost: packageData.baseCost,
    listedPrice: packageData.listedPrice,
    demandScore: packageData.currentDemandScore,
    requestedDiscountPercent: packageData.activePromoDiscount,
    exchangeRate,
  };

  const result = evaluatePricingRisk(input);

  return {
    packageId,
    ...result,
  };
}
