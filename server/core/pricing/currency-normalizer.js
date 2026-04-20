export function normalizeCurrency(amount, rate = 1) {
  return parseFloat((amount * rate).toFixed(2));
}
