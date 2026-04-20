import {
  type GuestGenomeMetrics,
} from "./guest-genome-scorer.ts";
import {
  RevenueEngine,
  type RevenueEngineResult,
} from "./revenue-engine.ts";
import {
  AutonomyGuard,
  type AutonomyDecision,
} from "./autonomy-guard.ts";
import { RitualRegistry } from "./ritual-registry.ts";
import { RevenueSignalSource } from "./telemetry.ts";

export interface OccupancyAdvisoryInput {
  occupancy: number;
  ritualId?: string | null;
  tenantId?: string | null;
  guestGenomeScore?: number | null;
  guestGenomeMetrics?: GuestGenomeMetrics | null;
  requestedMultiplier?: number | null;
  lookaheadHours?: number | null;
}

export interface OccupancyAdvisoryOutput extends RevenueEngineResult {
  normalizedOccupancyPercent?: number;
  autonomy?: AutonomyDecision;
}

const DEFAULT_RITUAL_ID = "geleneksel-bali";

const toOptionalNumber = (value: unknown): number | undefined => {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return undefined;
  }

  return value;
};

const normalizeOccupancy = (value: number) => {
  const asPercent = value <= 1 ? value * 100 : value;
  return Math.max(0, Math.min(100, Number(asPercent.toFixed(2))));
};

export const AdvisoryIngress = {
  async onOccupancyChange(
    input: OccupancyAdvisoryInput
  ): Promise<OccupancyAdvisoryOutput> {
    const normalizedOccupancyPercent = normalizeOccupancy(input.occupancy);

    console.log(
      `[ADVISORY_INGRESS] Occupancy shadow analysis started at ${normalizedOccupancyPercent.toFixed(
        2
      )}%`
    );

    const requestedRitualId = input.ritualId?.trim() || DEFAULT_RITUAL_ID;
    const canonicalRitualId =
      RitualRegistry.normalizeRitualId(requestedRitualId) ?? DEFAULT_RITUAL_ID;

    const result = await RevenueEngine.sealShadowPriceUpdate({
      ritualId: canonicalRitualId,
      occupancyPercent: normalizedOccupancyPercent,
      guestGenomeScore: toOptionalNumber(input.guestGenomeScore),
      guestGenomeMetrics: input.guestGenomeMetrics ?? undefined,
      requestedMultiplier: toOptionalNumber(input.requestedMultiplier),
      tenantId: input.tenantId ?? undefined,
      lookaheadHours: toOptionalNumber(input.lookaheadHours),
      signalSource: RevenueSignalSource.OCCUPANCY,
    });

    const autonomy =
      result.success && result.simulation
        ? await AutonomyGuard.evaluateShadowResult({
            simulation: result.simulation,
            advisoryId: result.advisoryId,
          })
        : undefined;

    return {
      ...result,
      normalizedOccupancyPercent,
      autonomy,
    };
  },
};
