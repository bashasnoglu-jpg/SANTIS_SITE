import {
  RawAvailabilitySlotSchema,
  type RawAvailabilitySlot,
} from '../schemas/raw-provider.schemas.ts';
import {
  NormalizedAvailabilitySlotSchema,
  type NormalizedAvailabilitySlot,
} from '../schemas/normalized.schemas.ts';

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function parseRatio(value: unknown, fallback: number): number {
  if (typeof value === 'number') return clamp01(value);
  if (typeof value === 'string') {
    const n = Number(value);
    if (Number.isFinite(n)) {
      return n > 1 ? clamp01(n / 100) : clamp01(n);
    }
  }
  return fallback;
}

export function mapRawAvailabilityToNormalized(
  input: RawAvailabilitySlot
): NormalizedAvailabilitySlot {
  const raw = RawAvailabilitySlotSchema.parse(input);

  return NormalizedAvailabilitySlotSchema.parse({
    serviceId: raw.serviceId,
    startIso: new Date(raw.slot_start).toISOString(),
    therapistId: raw.therapist_id,
    confidence: parseRatio(raw.confidence, 0.8),
    therapistSuitability: parseRatio(raw.therapistSuitability, 0.75),
    commercialPriority: parseRatio(raw.commercialPriority, 0.7),
  });
}
