import { serviceCatalogAdapter } from '../adapters/service-catalog/service-catalog.adapter';
import { pricingAdapter } from '../adapters/pricing/pricing.adapter';
import { availabilityAdapter } from '../adapters/availability/availability.adapter';
import { deriveDegradedCapabilities } from '../policies/degraded-mode';

export function getConciergeHealth() {
  return {
    ok: true,
    service: 'concierge-facade',
    resolverLoaded: true,
    adaptersLoaded: {
      serviceCatalog: Boolean(serviceCatalogAdapter),
      pricing: Boolean(pricingAdapter),
      availability: Boolean(availabilityAdapter),
    },
    adapterNames: {
      serviceCatalog: serviceCatalogAdapter?.constructor?.name ?? 'unknown',
      pricing: pricingAdapter?.constructor?.name ?? 'unknown',
      availability: availabilityAdapter?.constructor?.name ?? 'unknown',
    },
    degradedModeReady: typeof deriveDegradedCapabilities === 'function',
    tsRuntimeReady: true,
    checkedAt: new Date().toISOString(),
  };
}
