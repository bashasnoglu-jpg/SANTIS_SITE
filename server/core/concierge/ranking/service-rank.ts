import type { ConciergeServiceCard } from '../contracts/snapshot.contract.ts';

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

export function computeServiceRank(input: {
  price: number | null;
  compareAtPrice: number | null;
  availabilityScore: number;
  commercialPriority: number; // 0..100
}): number {
  const marginProxy =
    input.price && input.compareAtPrice && input.compareAtPrice > 0
      ? clamp01(input.price / input.compareAtPrice)
      : 0.6;

  const commercial = clamp01(input.commercialPriority / 100);
  const availability = clamp01(input.availabilityScore);

  return clamp01(
    marginProxy * 0.25 +
      availability * 0.35 +
      commercial * 0.40
  );
}

export function markRecommendedServices(
  cards: Array<ConciergeServiceCard & { _rankScore: number }>
): ConciergeServiceCard[] {
  const sorted = [...cards].sort((a, b) => b._rankScore - a._rankScore);

  return sorted.map((card, index) => ({
    id: card.id,
    title: card.title,
    category: card.category,
    durationMin: card.durationMin,
    price: card.price,
    compareAtPrice: card.compareAtPrice,
    availabilityScore: card.availabilityScore,
    recommended: index < 2,
    badges: [
      ...(index < 2 ? ['Recommended'] : []),
      ...(card.compareAtPrice && card.price && card.compareAtPrice > card.price
        ? ['Value']
        : []),
      ...(card.availabilityScore > 0.85 ? ['Available Now'] : []),
    ],
  }));
}
