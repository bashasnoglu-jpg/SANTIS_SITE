import type { CurrencyCode, MemberTier } from '../../contracts/snapshot.contract.ts';
import type { NormalizedPrice } from '../../schemas/normalized.schemas.ts';
import { MockPricingProvider } from './providers/mock-pricing.provider.ts';

export interface PricingAdapter {
  getPrices(input: {
    tenantId: string;
    serviceIds: string[];
    currency: CurrencyCode;
    partySize: number;
    memberTier?: MemberTier;
    date?: string;
  }): Promise<NormalizedPrice[]>;
}

export const pricingAdapter: PricingAdapter = new MockPricingProvider();
