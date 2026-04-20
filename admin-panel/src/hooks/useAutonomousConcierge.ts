import { useMemo } from 'react';
import { deriveAutonomousConciergeDecision } from '../lib/concierge-decision/decision.adapter';

type SnapshotInput = {
  degraded: boolean;
  warningCodes: string[];
  services?: Array<unknown>;
  nextAvailableSlots?: Array<{ confidence?: number }>;
};

type TelemetryInput = {
  requestId?: string;
  quoteId?: string;
  intentId?: string;
  responseTimeMs?: number;
  quoteLatencyMs?: number;
  lastEvent?: string;
};

type BehavioralInput = {
  serviceOpenCount: number;
  slotSelectionCount: number;
  quoteRequestCount: number;
  quoteFailureCount: number;
  abandonmentRisk?: number;
};

export function useAutonomousConcierge(input: {
  snapshot?: SnapshotInput | null;
  telemetry: TelemetryInput;
  behavioral: BehavioralInput;
}) {
  return useMemo(() => {
    const serviceCount = input.snapshot?.services?.length ?? 0;
    const slotCount = input.snapshot?.nextAvailableSlots?.length ?? 0;

    return deriveAutonomousConciergeDecision({
      snapshot: {
        degraded: input.snapshot?.degraded ?? false,
        warningCodes: input.snapshot?.warningCodes ?? [],
        serviceCount,
        slotCount,
      },
      telemetry: input.telemetry,
      behavioral: input.behavioral,
    });
  }, [input]);
}
