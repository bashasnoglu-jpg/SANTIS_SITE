import type { NormalizedAvailabilitySlot } from '../schemas/normalized.schemas.ts';
import type { SlotSuggestion } from '../contracts/snapshot.contract.ts';

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

export function rankSlots(slots: NormalizedAvailabilitySlot[]): SlotSuggestion[] {
  return [...slots]
    .map((slot) => {
      const rankScore = clamp01(
        slot.confidence * 0.45 +
          slot.therapistSuitability * 0.25 +
          slot.commercialPriority * 0.30
      );

      return {
        serviceId: slot.serviceId,
        startIso: slot.startIso,
        therapistId: slot.therapistId,
        confidence: slot.confidence,
        rankScore,
      };
    })
    .sort((a, b) => b.rankScore - a.rankScore)
    .slice(0, 8);
}
