import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { createRequire } from "node:module";

import { ConstitutionalGuard } from "./adapter.ts";
import { HybridBrain } from "./hybrid-brain.ts";
import { RitualRegistry } from "./ritual-registry.ts";
import { TelemetryStore } from "./telemetry-store.ts";
import { ingestSovereignEnvelope } from "./telemetry-gateway.ts";
import {
  MessageOrigin,
  MessageType,
  SOVEREIGN_SCHEMA_VERSION,
  SovereignSubject,
  type SovereignEnvelope,
  type SovereignEventEnvelope,
  type SovereignEventPayload,
} from "./telemetry.ts";

type ShadowPriceUpdatePayload = Extract<
  SovereignEventPayload,
  { action: "SHADOW_PRICE_UPDATE" }
>;

export interface HybridEvaluationInput {
  ritualId: string;
  tenantId?: string | null;
  converted?: boolean;
  outcomeId?: string | null;
  occurredAt?: number | null;
  maxShadowAgeHours?: number | null;
}

export interface HybridEvaluationResult {
  success: boolean;
  eventId?: string;
  reason?: string;
  message?: string;
  telemetryPersisted?: boolean;
  ledgerRecorded?: boolean;
  evaluation?: Extract<SovereignEventPayload, { action: "HYBRID_EVALUATION" }>;
}

type TelemetryPersistence = {
  telemetryRepo: {
    appendEvent(event: {
      type: string;
      visitorId: string;
      sessionId: string;
      page: string;
      source: string;
      data: Record<string, unknown>;
      timestamp: string;
    }): Promise<void>;
  };
  visitorRepo: {
    upsertVisitor(visitorId: string): Promise<void>;
  };
};

type SelfTuningStoreModule = {
  SelfTuningStore: {
    hasOutcomeId(outcomeId: string): boolean;
    recordEvaluation(input: Record<string, unknown>): Record<string, unknown>;
  };
};

const require = createRequire(import.meta.url);

const TELEMETRY_STORAGE_PATH = path.resolve(
  process.cwd(),
  "storage",
  "sovereign_telemetry.jsonl"
);
const DEFAULT_TENANT_ID = "tn_santis_club";
const DEFAULT_MAX_SHADOW_AGE_HOURS = 24;
const LEARNING_RATE = 0.005;
const HOLD_SHIFT_THRESHOLD = 0.000001;
const MIN_WEIGHT = 0.05;
const MAX_WEIGHT = 0.95;

let cachedTelemetryPersistence: TelemetryPersistence | null | undefined;
let cachedSelfTuningStore: SelfTuningStoreModule | null | undefined;

const roundProbability = (value: number) =>
  Number(Math.max(0, Math.min(1, value)).toFixed(6));

const roundWeight = (value: number) => Number(value.toFixed(6));

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

const sigmoid = (value: number) => 1 / (1 + Math.exp(-value));

const toOptionalString = (value: unknown): string | undefined => {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
};

const toOptionalNumber = (value: unknown): number | undefined => {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return undefined;
  }

  return value;
};

const normalizeTenantId = (value: unknown) =>
  toOptionalString(value) ?? DEFAULT_TENANT_ID;

function getTelemetryPersistence(): TelemetryPersistence | null {
  if (cachedTelemetryPersistence !== undefined) {
    return cachedTelemetryPersistence;
  }

  try {
    const telemetryRepo = require("../repositories/telemetry-repository.js");
    const visitorRepo = require("../repositories/visitor-repository.js");

    cachedTelemetryPersistence = {
      telemetryRepo,
      visitorRepo,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "unknown_persistence_boot_error";
    console.warn(
      `[SELF_TUNER] Telemetry persistence unavailable. Hybrid evaluations will stay file-backed only. ${message}`
    );
    cachedTelemetryPersistence = null;
  }

  return cachedTelemetryPersistence;
}

function getSelfTuningStore(): SelfTuningStoreModule | null {
  if (cachedSelfTuningStore !== undefined) {
    return cachedSelfTuningStore;
  }

  try {
    cachedSelfTuningStore = require("./self-tuning-store.js");
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "unknown_self_tuning_store_error";
    console.warn(
      `[SELF_TUNER] Self-tuning ledger unavailable. Evaluations will not be mirrored into a dedicated ledger. ${message}`
    );
    cachedSelfTuningStore = null;
  }

  return cachedSelfTuningStore ?? null;
}

function parseTelemetryLine(rawLine: string): SovereignEnvelope | null {
  try {
    const parsed = JSON.parse(rawLine) as SovereignEnvelope;
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

function extractLatestShadowEvent(input: {
  ritualId: string;
  occurredAt: number;
  maxShadowAgeHours: number;
}): { envelopeId: string; payload: ShadowPriceUpdatePayload } | null {
  if (!existsSync(TELEMETRY_STORAGE_PATH)) {
    return null;
  }

  const canonicalId = RitualRegistry.canonicalize(input.ritualId);
  if (!canonicalId) {
    return null;
  }

  const maxAgeMs = input.maxShadowAgeHours * 60 * 60 * 1000;
  const lines = readFileSync(TELEMETRY_STORAGE_PATH, "utf8")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  for (let index = lines.length - 1; index >= 0; index -= 1) {
    const envelope = parseTelemetryLine(lines[index]);
    if (!envelope || envelope.type !== MessageType.EVENT) {
      continue;
    }

    if (envelope.payload.action !== "SHADOW_PRICE_UPDATE") {
      continue;
    }

    const payload = envelope.payload as ShadowPriceUpdatePayload;
    const shadowCanonicalId = RitualRegistry.canonicalize(payload.ritualId);

    if (!shadowCanonicalId || shadowCanonicalId !== canonicalId) {
      continue;
    }

    if (payload.timestamp > input.occurredAt) {
      continue;
    }

    if (input.occurredAt - payload.timestamp > maxAgeMs) {
      continue;
    }

    return {
      envelopeId: envelope.id,
      payload,
    };
  }

  return null;
}

function buildPredictionScore(shadow: ShadowPriceUpdatePayload): number {
  const genomeScore = shadow.genomeScore ?? shadow.guestGenomeScore ?? 0;
  const occupancyPressure = (shadow.occupancyPercent - 60) / 20;
  const genomePressure = (genomeScore - 0.5) * 2;
  const divergencePressure = shadow.divergence * 40;
  const hybridPressure = (shadow.hybridMultiplier - 1) * 10;

  return (
    occupancyPressure * HybridBrain.W_OCC +
    genomePressure * HybridBrain.W_GEN +
    divergencePressure +
    hybridPressure
  );
}

function deriveTuningAction(shift: number) {
  if (Math.abs(shift) < HOLD_SHIFT_THRESHOLD) {
    return "HOLD_WEIGHTS" as const;
  }

  return shift > 0
    ? ("INCREASE_GENOME_WEIGHT" as const)
    : ("DECREASE_GENOME_WEIGHT" as const);
}

function buildRationale(input: {
  converted: boolean;
  predictedConversionProbability: number;
  shadow: ShadowPriceUpdatePayload;
  tuningAction: "INCREASE_GENOME_WEIGHT" | "DECREASE_GENOME_WEIGHT" | "HOLD_WEIGHTS";
  suggestedWeightShift: number;
}) {
  const conversionLabel = input.converted
    ? "booking converted"
    : "booking did not convert";
  const genomeScore = input.shadow.genomeScore ?? input.shadow.guestGenomeScore;
  const actionText =
    input.tuningAction === "HOLD_WEIGHTS"
      ? "Weights should remain stable in shadow mode."
      : input.tuningAction === "INCREASE_GENOME_WEIGHT"
        ? `Genome weight may increase by ${input.suggestedWeightShift.toFixed(6)}.`
        : `Genome weight may decrease by ${Math.abs(
            input.suggestedWeightShift
          ).toFixed(6)}.`;

  return [
    `Hybrid brain predicted ${(input.predictedConversionProbability * 100).toFixed(
      1
    )}% conversion probability.`,
    `${conversionLabel} after ${input.shadow.verdict} shadow pressure.`,
    `Occupancy ${input.shadow.occupancyPercent.toFixed(1)}% and genome ${((
      genomeScore ?? 0
    ) * 100).toFixed(0)}/100 produced ${(
      input.shadow.divergence * 100
    ).toFixed(1)} bps divergence.`,
    actionText,
  ].join(" ");
}

function buildHybridEvaluationPayload(input: {
  shadowEnvelopeId: string;
  shadow: ShadowPriceUpdatePayload;
  outcomeId: string;
  occurredAt: number;
  converted: boolean;
}) {
  const predictedConversionProbability = roundProbability(
    sigmoid(buildPredictionScore(input.shadow))
  );
  const outcomeValue = input.converted ? 1 : 0;
  const suggestedWeightShift = roundWeight(
    LEARNING_RATE *
      (outcomeValue - predictedConversionProbability) *
      input.shadow.divergence
  );
  const currentGenomeWeight = roundWeight(HybridBrain.W_GEN);
  const currentOccupancyWeight = roundWeight(HybridBrain.W_OCC);
  const recommendedGenomeWeight = roundWeight(
    clamp(currentGenomeWeight + suggestedWeightShift, MIN_WEIGHT, MAX_WEIGHT)
  );
  const recommendedOccupancyWeight = roundWeight(1 - recommendedGenomeWeight);
  const tuningAction = deriveTuningAction(suggestedWeightShift);
  const evaluationLagMinutes = roundWeight(
    (input.occurredAt - input.shadow.timestamp) / 60000
  );
  const rationale = buildRationale({
    converted: input.converted,
    predictedConversionProbability,
    shadow: input.shadow,
    tuningAction,
    suggestedWeightShift,
  });

  return {
    timestamp: input.occurredAt,
    version: SOVEREIGN_SCHEMA_VERSION,
    origin: MessageOrigin.NODE_ORCHESTRATOR,
    subject: SovereignSubject.AUTONOMOUS_CONTROL,
    action: "HYBRID_EVALUATION" as const,
    ritualId: input.shadow.ritualId,
    ritualTitle: input.shadow.ritualTitle,
    ritualCategory: input.shadow.ritualCategory,
    tenantId: input.shadow.tenantId,
    conversionType: "BOOKING" as const,
    outcomeId: input.outcomeId,
    converted: input.converted,
    matchedShadowEventId: input.shadowEnvelopeId,
    matchedShadowTimestamp: input.shadow.timestamp,
    evaluationLagMinutes,
    signalSource: input.shadow.signalSource,
    occupancyPercent: input.shadow.occupancyPercent,
    guestGenomeScore: input.shadow.guestGenomeScore,
    genomeScore: input.shadow.genomeScore,
    occupancyMultiplier: input.shadow.occupancyMultiplier,
    genomeMultiplier: input.shadow.genomeMultiplier,
    hybridMultiplier: input.shadow.hybridMultiplier,
    divergence: input.shadow.divergence,
    verdict: input.shadow.verdict,
    predictedConversionProbability,
    learningRate: LEARNING_RATE,
    suggestedWeightShift,
    currentOccupancyWeight,
    currentGenomeWeight,
    recommendedOccupancyWeight,
    recommendedGenomeWeight,
    tuningAction,
    rationale,
  };
}

function buildHybridEvaluationEnvelope(
  payload: ReturnType<typeof buildHybridEvaluationPayload>
): SovereignEventEnvelope {
  return {
    id: randomUUID(),
    type: MessageType.EVENT,
    tracking: {
      correlationId: randomUUID(),
      causationId: payload.matchedShadowEventId,
    },
    payload,
  };
}

function buildTelemetryEvent(
  envelope: SovereignEventEnvelope,
  payload: ReturnType<typeof buildHybridEvaluationPayload>
) {
  const visitorId = `system:self-tuner:${payload.tenantId}`;
  const sessionId = `hybrid-eval:${payload.ritualId}`;

  return {
    type: "revenue.hybrid_evaluation",
    visitorId,
    sessionId,
    page: "/internal/revenue/hybrid-evaluation",
    source: "self-tuner",
    data: {
      envelopeId: envelope.id,
      matchedShadowEventId: payload.matchedShadowEventId,
      ritualId: payload.ritualId,
      ritualTitle: payload.ritualTitle,
      ritualCategory: payload.ritualCategory,
      conversionType: payload.conversionType,
      outcomeId: payload.outcomeId,
      converted: payload.converted,
      signalSource: payload.signalSource,
      occupancyPercent: payload.occupancyPercent,
      guestGenomeScore: payload.guestGenomeScore ?? null,
      genomeScore: payload.genomeScore ?? null,
      occupancyMultiplier: payload.occupancyMultiplier,
      genomeMultiplier: payload.genomeMultiplier,
      hybridMultiplier: payload.hybridMultiplier,
      divergence: payload.divergence,
      verdict: payload.verdict,
      predictedConversionProbability: payload.predictedConversionProbability,
      learningRate: payload.learningRate,
      suggestedWeightShift: payload.suggestedWeightShift,
      currentOccupancyWeight: payload.currentOccupancyWeight,
      currentGenomeWeight: payload.currentGenomeWeight,
      recommendedOccupancyWeight: payload.recommendedOccupancyWeight,
      recommendedGenomeWeight: payload.recommendedGenomeWeight,
      tuningAction: payload.tuningAction,
      rationale: payload.rationale,
    },
    timestamp: new Date(payload.timestamp).toISOString(),
  };
}

export const SelfTuningEngine = {
  LEARNING_RATE,

  async evaluateBookingOutcome(
    input: HybridEvaluationInput
  ): Promise<HybridEvaluationResult> {
    try {
      const ritual = RitualRegistry.findRitual(input.ritualId);
      if (!ritual) {
        return {
          success: false,
          reason: "RITUAL_NOT_FOUND",
          message: `Unknown ritual: ${input.ritualId}`,
        };
      }

      const outcomeId = toOptionalString(input.outcomeId) ?? `booking:${randomUUID()}`;
      const occurredAt = toOptionalNumber(input.occurredAt) ?? Date.now();
      const maxShadowAgeHours =
        toOptionalNumber(input.maxShadowAgeHours) ?? DEFAULT_MAX_SHADOW_AGE_HOURS;
      const ledgerStore = getSelfTuningStore();

      if (ledgerStore?.SelfTuningStore?.hasOutcomeId(outcomeId)) {
        return {
          success: false,
          reason: "OUTCOME_ALREADY_EVALUATED",
          message: `Outcome ${outcomeId} already exists in self-tuning ledger.`,
        };
      }

      const matchedShadow = extractLatestShadowEvent({
        ritualId: ritual.id,
        occurredAt,
        maxShadowAgeHours,
      });

      if (!matchedShadow) {
        return {
          success: false,
          reason: "NO_SHADOW_CONTEXT",
          message: `No SHADOW_PRICE_UPDATE found for ${ritual.id} within ${maxShadowAgeHours}h.`,
        };
      }

      const payload = buildHybridEvaluationPayload({
        shadowEnvelopeId: matchedShadow.envelopeId,
        shadow: matchedShadow.payload,
        outcomeId,
        occurredAt,
        converted: input.converted !== false,
      });
      const candidateEnvelope = buildHybridEvaluationEnvelope(payload);
      const envelope = ConstitutionalGuard.sanitize(candidateEnvelope);

      if (!envelope || envelope.type !== MessageType.EVENT) {
        return {
          success: false,
          reason: "CONSTITUTIONAL_VIOLATION",
          message: "Hybrid evaluation payload failed constitutional validation.",
        };
      }

      ingestSovereignEnvelope(envelope, {
        channel: "INTERNAL",
        sourceHint: "self-tuner/evaluate-booking",
      });
      TelemetryStore.ingest(envelope);

      const telemetryEvent = buildTelemetryEvent(envelope, payload);
      let telemetryPersisted = false;
      const persistence = getTelemetryPersistence();

      if (persistence) {
        try {
          await persistence.visitorRepo.upsertVisitor(telemetryEvent.visitorId);
          await persistence.telemetryRepo.appendEvent(telemetryEvent);
          telemetryPersisted = true;
        } catch (error) {
          const message =
            error instanceof Error
              ? error.message
              : "unknown_self_tuning_persistence_error";
          console.warn(
            `[SELF_TUNER] Hybrid evaluation ${envelope.id} could not be persisted to SQLite. ${message}`
          );
        }
      }

      let ledgerRecorded = false;
      if (ledgerStore?.SelfTuningStore?.recordEvaluation) {
        ledgerStore.SelfTuningStore.recordEvaluation({
          id: envelope.id,
          timestamp: payload.timestamp,
          outcomeId: payload.outcomeId,
          ritualId: payload.ritualId,
          ritualTitle: payload.ritualTitle,
          conversionType: payload.conversionType,
          converted: payload.converted,
          predictedConversionProbability: payload.predictedConversionProbability,
          suggestedWeightShift: payload.suggestedWeightShift,
          currentOccupancyWeight: payload.currentOccupancyWeight,
          currentGenomeWeight: payload.currentGenomeWeight,
          recommendedOccupancyWeight: payload.recommendedOccupancyWeight,
          recommendedGenomeWeight: payload.recommendedGenomeWeight,
          tuningAction: payload.tuningAction,
          matchedShadowEventId: payload.matchedShadowEventId,
          rationale: payload.rationale,
          hash: `HYBRID-${envelope.id}`,
        });
        ledgerRecorded = true;
      }

      return {
        success: true,
        eventId: envelope.id,
        telemetryPersisted,
        ledgerRecorded,
        evaluation: payload,
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "unknown_self_tuning_error";

      return {
        success: false,
        reason: "SELF_TUNING_FAILURE",
        message,
      };
    }
  },
};
