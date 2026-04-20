export function applyDiscountCap(
  currentPrice,
  recommendedDiscount,
  baseCost,
  minMargin,
) {
  const marginFloor = baseCost * (1 + minMargin / 100);
  const discountedPrice = currentPrice * (1 - recommendedDiscount / 100);
  return Math.max(discountedPrice, marginFloor);
}

export function evaluateDiscountRisk(originalPrice, finalPrice) {
  if (originalPrice === 0) return 0;
  const discountPercent = ((originalPrice - finalPrice) / originalPrice) * 100;
  if (discountPercent > 30) return 90;
  if (discountPercent > 15) return 50;
  return 10;
}
