import type {
  BanditDecisionTelemetryEvent,
  BanditDecisionTelemetrySummary,
} from './optimizer.bandit.telemetry.contract.ts';

export function summarizeBanditDecisionTelemetry(
  events: BanditDecisionTelemetryEvent[]
): BanditDecisionTelemetrySummary {
  const blockedReasonCounts: Record<string, number> = {};
  const familyExposureCounts: Record<string, number> = {};

  let allowedCandidates = 0;
  let blockedCandidates = 0;
  let explorationCount = 0;

  for (const event of events) {
    if (event.allowed) {
      allowedCandidates += 1;
      familyExposureCounts[event.recommendationFamily] =
        (familyExposureCounts[event.recommendationFamily] ?? 0) + 1;
    } else {
      blockedCandidates += 1;
    }

    if (event.explorationScore > 0) {
      explorationCount += 1;
    }

    for (const reason of event.blockedReasons) {
      blockedReasonCounts[reason] = (blockedReasonCounts[reason] ?? 0) + 1;
    }
  }

  return {
    totalCandidates: events.length,
    allowedCandidates,
    blockedCandidates,
    explorationRate:
      events.length > 0 ? explorationCount / events.length : 0,
    blockedReasonCounts,
    familyExposureCounts,
  };
}
