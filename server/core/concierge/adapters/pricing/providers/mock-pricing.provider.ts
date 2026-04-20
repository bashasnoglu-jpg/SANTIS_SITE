import type { PricingAdapter } from '../pricing.adapter.ts';
import type { NormalizedPrice } from '../../../schemas/normalized.schemas.ts';
import { mapRawPriceToNormalized } from '../../../mappers/price.mapper.ts';

export class MockPricingProvider implements PricingAdapter {
  async getPrices(input: {
    tenantId: string;
    serviceIds: string[];
    currency: 'EUR';
    partySize: number;
    memberTier?: 'none' | 'silver' | 'gold' | 'black';
    date?: string;
  }): Promise<NormalizedPrice[]> {
    const FORCE_PRICING_FAILURE = process.env.FORCE_PRICING_FAILURE === '1';

    if (FORCE_PRICING_FAILURE) {
      throw new Error('Mock pricing outage');
    }

    const baseTable: Record<string, { amount: number; compareAtAmount?: number }> = {
      svc_signature_ritual: { amount: 260, compareAtAmount: 390 },
      svc_deep_tissue: { amount: 120, compareAtAmount: 150 },
      svc_hamam_royal: { amount: 170, compareAtAmount: 220 },
      svc_skin_glow: { amount: 140, compareAtAmount: 180 },
    };

    const memberDiscount =
      input.memberTier === 'black'
        ? 0.15
        : input.memberTier === 'gold'
        ? 0.1
        : input.memberTier === 'silver'
        ? 0.05
        : 0;

    return input.serviceIds
      .map((serviceId) => {
        const base = baseTable[serviceId];
        if (!base) return null;

        const adjusted = Math.round(base.amount * (1 - memberDiscount));

        return mapRawPriceToNormalized({
          serviceId,
          amount: adjusted,
          currency: 'EUR',
          compareAtAmount: base.compareAtAmount,
          available: true,
        });
      })
      .filter((v): v is NormalizedPrice => Boolean(v));
  }
}
