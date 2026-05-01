import type { CurrencyCode, MemberTier } from '../../contracts/snapshot.contract';
import type { NormalizedPrice } from '../../schemas/normalized.schemas';
import { MockPricingProvider } from './providers/mock-pricing.provider';

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
