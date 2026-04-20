import type { IntelligenceEvent } from './intelligence.contract.ts';

export function averageQuoteLatency(events: IntelligenceEvent[]): number | null {
  const latencies = events
    .map((e) => e.quoteLatencyMs)
    .filter((v): v is number => typeof v === 'number');

  if (latencies.length === 0) return null;

  const total = latencies.reduce((sum, value) => sum + value, 0);
  return Math.round(total / latencies.length);
}

export function calculateDegradedRate(events: IntelligenceEvent[]): number {
  if (events.length === 0) return 0;

  const degradedCount = events.filter((e) => e.degraded).length;
  return Number((degradedCount / events.length).toFixed(2));
}
