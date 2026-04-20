import type {
  BoardroomIntelligenceInput,
  BoardroomIntelligenceOutput,
} from './intelligence.contract.ts';
import { countByKey } from './intelligence.grouping.ts';
import { averageQuoteLatency, calculateDegradedRate } from './intelligence.metrics.ts';

export function deriveBoardroomIntelligence(
  input: BoardroomIntelligenceInput
): BoardroomIntelligenceOutput {
  const events = [...input.events].sort((a, b) => a.ts.localeCompare(b.ts));
  const latest = events[events.length - 1];

  const recentDecisionTimeline = events.slice(-20);
  const recentFunnelTimeline = events.slice(-20);

  const abandonmentClustersMap = new Map<string, number>();

  for (const event of events) {
    if (event.event === 'FLOW_ABANDONED') {
      const key = event.event;
      abandonmentClustersMap.set(key, (abandonmentClustersMap.get(key) ?? 0) + 1);
    }
  }

  const abandonmentClusters = [...abandonmentClustersMap.entries()].map(
    ([event, count]) => ({ event, count })
  );

  const decisionCodes = events.flatMap((e) => e.explanationCodes ?? []);
  const funnelCodes = events.flatMap((e) => e.funnelExplanationCodes ?? []);

  return {
    latestDecisionMode: latest?.decisionMode ?? 'NORMAL',
    latestFunnelMode: latest?.funnelMode ?? 'REVENUE_PRIORITY',
    recentDecisionTimeline,
    recentFunnelTimeline,
    abandonmentClusters,
    avgQuoteLatencyMs: averageQuoteLatency(events),
    degradedRate: calculateDegradedRate(events),
    topDecisionReasons: countByKey(decisionCodes),
    topFunnelReasons: countByKey(funnelCodes),
  };
}
