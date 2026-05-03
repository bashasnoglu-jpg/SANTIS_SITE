// apps/ingestion-api/src/revenue/fusion.ts

export function mergeSignals(values: number[]) {
  if (values.length === 0) return 0;

  const sum = values.reduce((a, b) => a + b, 0);
  return sum / values.length;
}
