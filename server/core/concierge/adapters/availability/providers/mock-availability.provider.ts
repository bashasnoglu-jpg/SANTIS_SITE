import type { AvailabilityAdapter } from '../availability.adapter.ts';
import type { NormalizedAvailabilitySlot } from '../../../schemas/normalized.schemas.ts';
import { mapRawAvailabilityToNormalized } from '../../../mappers/availability.mapper.ts';

export class MockAvailabilityProvider implements AvailabilityAdapter {
  async getAvailability(input: {
    tenantId: string;
    serviceIds: string[];
    date?: string;
    partySize: number;
  }): Promise<NormalizedAvailabilitySlot[]> {
    const FORCE_AVAILABILITY_FAILURE = process.env.FORCE_AVAILABILITY_FAILURE === '1';

    if (FORCE_AVAILABILITY_FAILURE) {
      throw new Error('Mock availability outage');
    }

    const day = input.date ?? new Date().toISOString().slice(0, 10);

    const raw = input.serviceIds.flatMap((serviceId, i) => [
      {
        serviceId,
        slot_start: `${day}T10:${String((i * 10) % 60).padStart(2, '0')}:00+02:00`,
        therapist_id: `th_${i + 1}`,
        confidence: 0.92,
        therapistSuitability: 0.85,
        commercialPriority: 0.8,
      },
      {
        serviceId,
        slot_start: `${day}T14:${String((i * 10) % 60).padStart(2, '0')}:00+02:00`,
        therapist_id: `th_${i + 2}`,
        confidence: 0.78,
        therapistSuitability: 0.72,
        commercialPriority: 0.7,
      },
    ]);

    return raw.map(mapRawAvailabilityToNormalized);
  }
}
