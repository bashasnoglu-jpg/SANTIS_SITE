import type {
  ConciergeServiceCard,
  ConciergeSnapshot,
  SnapshotRequestContext,
} from '../contracts/snapshot.contract.ts';
import { serviceCatalogAdapter } from '../adapters/service-catalog/service-catalog.adapter.ts';
import { pricingAdapter } from '../adapters/pricing/pricing.adapter.ts';
import { availabilityAdapter } from '../adapters/availability/availability.adapter.ts';
import { computeServiceRank, markRecommendedServices } from '../ranking/service-rank.ts';
import { rankSlots } from '../ranking/slot-rank.ts';
import { deriveDegradedCapabilities } from '../policies/degraded-mode.ts';
import { createRequestId } from '../utils/request-id.ts';
import { nowIso } from '../utils/datetime.ts';
import { maxNumberOrUndefined } from '../utils/money.ts';
import { buildWarnings } from '../utils/warnings.ts';
import type {
  NormalizedAvailabilitySlot,
  NormalizedPrice,
  NormalizedService,
} from '../schemas/normalized.schemas.ts';
import { RevenuePricingAdapter } from '../adapters/revenue-pricing.adapter.ts';

function groupBestAvailabilityByService(
  slots: NormalizedAvailabilitySlot[]
): Map<string, { availabilityScore: number }> {
  const map = new Map<string, { availabilityScore: number }>();

  for (const slot of slots) {
    const score =
      slot.confidence * 0.6 +
      slot.therapistSuitability * 0.2 +
      slot.commercialPriority * 0.2;

    const existing = map.get(slot.serviceId);
    if (!existing || score > existing.availabilityScore) {
      map.set(slot.serviceId, { availabilityScore: score });
    }
  }

  return map;
}

function toCards(input: {
  services: NormalizedService[];
  prices: NormalizedPrice[];
  availabilitySlots: NormalizedAvailabilitySlot[];
  canShowLivePrices: boolean;
}): Array<ConciergeServiceCard & { _rankScore: number }> {
  const pricesByServiceId = new Map(input.prices.map((p) => [p.serviceId, p]));
  const availabilityByServiceId = groupBestAvailabilityByService(input.availabilitySlots);

  return input.services.map((service) => {
    const price = pricesByServiceId.get(service.id);
    const avail = availabilityByServiceId.get(service.id);

    const livePrice = input.canShowLivePrices ? price?.amount ?? null : null;
    const compareAt = input.canShowLivePrices ? price?.compareAtAmount ?? null : null;
    const availabilityScore = avail?.availabilityScore ?? 0;

    const rank = computeServiceRank({
      price: livePrice,
      compareAtPrice: compareAt,
      availabilityScore,
      commercialPriority: service.commercialPriority,
    });

    return {
      id: service.id,
      title: service.title,
      category: service.category,
      durationMin: service.durationMin,
      price: livePrice,
      compareAtPrice: compareAt,
      availabilityScore,
      recommended: false,
      badges: [],
      _rankScore: rank,
    };
  });
}

export async function buildConciergeSnapshot(
  input: SnapshotRequestContext
): Promise<ConciergeSnapshot> {
  const requestId = createRequestId();
  const generatedAt = nowIso();

  const services = await serviceCatalogAdapter.getServices({
    tenantId: input.tenantId,
    locale: input.locale,
  });

  const serviceIds = services.map((s) => s.id);

  const [pricesResult, availabilityResult] = await Promise.allSettled([
    pricingAdapter.getPrices({
      tenantId: input.tenantId,
      serviceIds,
      currency: input.currency,
      partySize: input.partySize,
      memberTier: input.memberTier,
      date: input.date,
    }),
    availabilityAdapter.getAvailability({
      tenantId: input.tenantId,
      serviceIds,
      date: input.date,
      partySize: input.partySize,
    }),
  ]);

  const pricingOk = pricesResult.status === 'fulfilled';
  const availabilityOk = availabilityResult.status === 'fulfilled';

  let prices = pricingOk ? pricesResult.value : [];

  if (pricingOk && input.sessionId) {
    prices = prices.map((p) => ({
      ...p,
      amount: RevenuePricingAdapter.applyRevenueLogic(p.amount, input.sessionId),
    }));
  }

  const availabilitySlots = availabilityOk ? availabilityResult.value : [];

  const capabilities = deriveDegradedCapabilities({
    pricingOk,
    availabilityOk,
  });

  const cards = toCards({
    services,
    prices,
    availabilitySlots,
    canShowLivePrices: capabilities.canShowLivePrices,
  });

  const rankedServices = markRecommendedServices(cards);

  const nextAvailableSlots = capabilities.canShowLiveAvailability
    ? rankSlots(availabilitySlots)
    : [];

  const allPrices = rankedServices.map((s) => s.compareAtPrice);
  const anchorPrice = maxNumberOrUndefined(allPrices);

  const therapistLoadIndex = availabilityOk ? 0.58 : 0.8;
  const capacityHealth =
    therapistLoadIndex >= 0.85
      ? 'critical'
      : therapistLoadIndex >= 0.65
      ? 'tight'
      : 'healthy';

  return {
    requestId,
    generatedAt,
    tenantId: input.tenantId,
    locale: input.locale,
    currency: input.currency,
    guestContext: {
      partySize: input.partySize,
      vipKnown: input.memberTier === 'gold' || input.memberTier === 'black',
      memberTier: input.memberTier,
      source: input.source,
    },
    services: rankedServices,
    nextAvailableSlots,
    merchandising: {
      anchorPriceVisible: Boolean(anchorPrice),
      anchorPrice,
      upsellEnabled: false,
      recommendedBundleIds: [],
    },
    operational: {
      therapistLoadIndex,
      capacityHealth,
      pricingFreshnessSec: pricingOk ? 30 : 999,
      availabilityFreshnessSec: availabilityOk ? 15 : 999,
    },
    policy: {
      bookingAllowed: capabilities.canBookDirectly,
      quoteAllowed: true,
      directCheckoutAllowed: capabilities.canBookDirectly,
      humanConciergePreferred: capabilities.mustEscalateToHuman,
    },
    warnings: buildWarnings({
      pricingOk,
      availabilityOk,
    }),
  };
}
