import type { NormalizedAvailabilitySlot } from '../../schemas/normalized.schemas.ts';
import { MockAvailabilityProvider } from './providers/mock-availability.provider.ts';

export interface AvailabilityAdapter {
  getAvailability(input: {
    tenantId: string;
    serviceIds: string[];
    date?: string;
    partySize: number;
  }): Promise<NormalizedAvailabilitySlot[]>;
}

export const availabilityAdapter: AvailabilityAdapter =
  new MockAvailabilityProvider();
