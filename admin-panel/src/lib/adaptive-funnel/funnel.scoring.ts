function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

export function scoreServiceForFunnel(input: {
  price: number | null;
  compareAtPrice: number | null;
  availabilityScore: number;
  recommended?: boolean;
  category?: string;
}): number {
  const valueSignal =
    input.price != null &&
    input.compareAtPrice != null &&
    input.compareAtPrice > input.price
      ? clamp01(input.price / input.compareAtPrice)
      : 0.55;

  const availabilitySignal = clamp01(input.availabilityScore ?? 0);
  const recommendationSignal = input.recommended ? 0.2 : 0;

  return clamp01(
    valueSignal * 0.3 +
      availabilitySignal * 0.5 +
      recommendationSignal * 0.2
  );
}
