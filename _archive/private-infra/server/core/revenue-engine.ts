import { randomUUID } from "node:crypto";

import { ConstitutionalGuard } from "./adapter.ts";
import {
  GuestGenomeScorer,
  type GuestGenomeMetrics,
} from "./guest-genome-scorer.ts";
import {
  HybridBrain,
  type HybridVerdict,
} from "./hybrid-brain.ts";
import {
  RitualRegistry,
  type RitualRecord,
} from "./ritual-registry.ts";
import { TelemetryStore } from "./telemetry-store.ts";
import { ingestSovereignEnvelope } from "./telemetry-gateway.ts";
import {
  type AdvisorySuggestion,
  MessageOrigin,
  MessageType,
  RevenueSignalSource,
  SOVEREIGN_SCHEMA_VERSION,
  SovereignSubject,
  type RevenueSignalSource as RevenueSignalSourceType,
  type StandardRevenueExecutePayload,
  type SovereignEventEnvelope,
} from "./telemetry.ts";
import { AdvisoryStore } from "./advisory-store.js";
import { appendEvent } from "../repositories/telemetry-repository.js";
import { upsertVisitor } from "../repositories/visitor-repository.js";

export interface ShadowPriceSimulationInput {
  ritualId: string;
  occupancyPercent: number;
  guestGenomeScore?: number | null;
  guestGenomeMetrics?: GuestGenomeMetrics | null;
  requestedMultiplier?: number | null;
  tenantId?: string | null;
  lookaheadHours?: number | null;
  signalSource?: RevenueSignalSourceType | null;
}

export interface ShadowPriceSimulation {
  timestamp: number;
  version: typeof SOVEREIGN_SCHEMA_VERSION;
  origin: typeof MessageOrigin.NODE_ORCHESTRATOR;
  subject: typeof SovereignSubject.AUTONOMOUS_CONTROL;
  action: "SHADOW_PRICE_UPDATE";
  ritualId: string;
  ritualTitle: string;
  ritualCategory: string;
  tenantId: string;
  signalSource: RevenueSignalSourceType;
  occupancyPercent: number;
  guestGenomeScore?: number;
  genomeScore?: number;
  originalPrice: number;
  simulatedPrice: number;
  suggestedMultiplier: number;
  occupancyMultiplier: number;
  genomeMultiplier: number;
  hybridMultiplier: number;
  divergence: number;
  verdict: HybridVerdict;
  lookaheadHours?: number;
  confidence: number;
  mode: "SHADOW";
  rationale: string;
}

export interface RevenueEngineResult {
  success: boolean;
  eventId?: string;
  reason?: string;
  message?: string;
  simulation?: ShadowPriceSimulation;
  telemetryPersisted?: boolean;
  advisoryStored?: boolean;
  advisoryId?: string;
}

export interface RevenueAdvisorySuggestionInput {
  ritualId: string;
  multiplier: number;
  recommendation: string;
  riskScore: number;
  impactArea?: AdvisorySuggestion["impactArea"];
}

const DEFAULT_LOOKAHEAD_HOURS = 6;
const DEFAULT_TENANT_ID = "tn_santis_club";
const SYSTEM_VISITOR_PREFIX = "system:revenue-engine";

const roundCurrency = (value: number) => Number(value.toFixed(2));
const clampPercent = (value: number) => Math.max(0, Math.min(100, value));
const clampConfidence = (value: number) => Math.max(0, Math.min(1, value));

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

const normalizeCommandMultiplier = (value: unknown): number | null => {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    return null;
  }

  return Number(value.toFixed(3));
};

function findRitualById(ritualId: string): RitualRecord | null {
  return RitualRegistry.findRitual(ritualId);
}

function resolveSignalSource(
  requestedSource: ShadowPriceSimulationInput["signalSource"],
  _guestGenomeScore: number | undefined
): RevenueSignalSourceType {
  if (
    requestedSource === RevenueSignalSource.OCCUPANCY ||
    requestedSource === RevenueSignalSource.GUEST_GENOME ||
    requestedSource === RevenueSignalSource.HYBRID
  ) {
    return requestedSource;
  }

  return RevenueSignalSource.OCCUPANCY;
}

function resolveGuestGenomeScore(
  input: ShadowPriceSimulationInput
): number | undefined {
  const scoredMetrics = GuestGenomeScorer.calculateScore(input.guestGenomeMetrics);
  if (scoredMetrics != null) {
    return scoredMetrics;
  }

  return GuestGenomeScorer.normalizeScore(input.guestGenomeScore);
}

function resolveSuggestedMultiplier(
  signalSource: RevenueSignalSourceType,
  hybridAnalysis: ReturnType<typeof HybridBrain.analyze>,
  requestedMultiplier: number | undefined
): number {
  if (requestedMultiplier && requestedMultiplier > 0) {
    return Number(requestedMultiplier.toFixed(3));
  }

  switch (signalSource) {
    case RevenueSignalSource.GUEST_GENOME:
      return hybridAnalysis.genomeMultiplier;
    case RevenueSignalSource.HYBRID:
      return hybridAnalysis.hybridMultiplier;
    case RevenueSignalSource.OCCUPANCY:
    default:
      return hybridAnalysis.occupancyMultiplier;
  }
}

function resolveConfidence(
  signalSource: RevenueSignalSourceType,
  occupancyPercent: number,
  guestGenomeScore: number | undefined
): number {
  const occupancyConfidence = 0.56 + (occupancyPercent / 100) * 0.28;
  const genomeConfidence =
    guestGenomeScore == null ? 0.42 : 0.48 + guestGenomeScore * 0.22;

  if (signalSource === RevenueSignalSource.GUEST_GENOME) {
    return clampConfidence(genomeConfidence);
  }

  if (signalSource === RevenueSignalSource.HYBRID) {
    return clampConfidence((occupancyConfidence + genomeConfidence) / 2);
  }

  return clampConfidence(occupancyConfidence);
}

function buildRationale(
  ritual: RitualRecord,
  signalSource: RevenueSignalSourceType,
  occupancyPercent: number,
  multiplier: number,
  guestGenomeScore: number | undefined,
  hybridAnalysis: ReturnType<typeof HybridBrain.analyze>
): string {
  const occupancyClause =
    occupancyPercent >= 70
      ? `Operational load elevated (${occupancyPercent.toFixed(1)}% occupancy)`
      : `Operational load stable (${occupancyPercent.toFixed(1)}% occupancy)`;

  const guestGenomeClause =
    guestGenomeScore == null || signalSource === RevenueSignalSource.OCCUPANCY
      ? null
      : `guest genome pressure ${(guestGenomeScore * 100).toFixed(0)}/100`;

  const hybridClause =
    hybridAnalysis.verdict === "DESIRE_DRIVEN"
      ? `Hybrid brain detects desire-led upside (+${(hybridAnalysis.divergence * 100).toFixed(
          1
        )} bps).`
      : hybridAnalysis.verdict === "CONFLICTED"
        ? `Hybrid brain sees conflicting digital demand signals.`
        : `Hybrid brain remains aligned with occupancy.`;

  const sourceLabel =
    signalSource === RevenueSignalSource.OCCUPANCY
      ? "occupancy"
      : signalSource === RevenueSignalSource.GUEST_GENOME
        ? "guest genome"
        : "hybrid pressure";

  return [
    `${ritual.title} shadow pricing simulated from ${sourceLabel}.`,
    occupancyClause + ".",
    guestGenomeClause ? `${guestGenomeClause}.` : null,
    hybridClause,
    `Suggested multiplier ${multiplier.toFixed(3)} remains non-mutating.`,
  ]
    .filter((part): part is string => Boolean(part))
    .join(" ");
}

function buildShadowPriceEnvelope(
  simulation: ShadowPriceSimulation
): SovereignEventEnvelope {
  return {
    id: randomUUID(),
    type: MessageType.EVENT,
    tracking: {
      correlationId: randomUUID(),
      causationId: randomUUID(),
    },
    payload: simulation,
  };
}

export function createStandardRevenuePayload(
  ritualId: string,
  multiplier: number
): StandardRevenueExecutePayload | null {
  const canonicalId = RitualRegistry.canonicalize(ritualId);
  const normalizedMultiplier = normalizeCommandMultiplier(multiplier);

  if (!canonicalId || normalizedMultiplier == null) {
    return null;
  }

  return {
    command: "ADJUST_PRICE",
    ritualId: canonicalId,
    multiplier: normalizedMultiplier,
  };
}

export function createRevenueAdvisorySuggestion(
  input: RevenueAdvisorySuggestionInput
): AdvisorySuggestion | null {
  const executePayload = createStandardRevenuePayload(
    input.ritualId,
    input.multiplier
  );

  if (!executePayload) {
    return null;
  }

  return {
    timestamp: Date.now(),
    version: SOVEREIGN_SCHEMA_VERSION,
    origin: MessageOrigin.CORE_KERNEL,
    subject: SovereignSubject.AUTONOMOUS_CONTROL,
    action: "SUGGESTION_GENERATED",
    riskScore: input.riskScore,
    impactArea: input.impactArea ?? "REVENUE",
    recommendation: input.recommendation,
    executePayload,
  };
}

function buildShadowRevenueRecommendation(
  simulation: ShadowPriceSimulation
): string {
  return `${simulation.ritualTitle} icin golge fiyat onerisi hazir. ${simulation.occupancyPercent.toFixed(
    1
  )}% dolulukta €${simulation.simulatedPrice.toFixed(
    2
  )} öneriliyor. Mühür beklıyor.`;
}

function buildTelemetryEvent(
  envelope: SovereignEventEnvelope,
  simulation: ShadowPriceSimulation
) {
  const visitorId = `${SYSTEM_VISITOR_PREFIX}:${simulation.tenantId}`;
  const sessionId = `shadow:${simulation.ritualId}`;

  return {
    type: "revenue.shadow_price_update",
    visitorId,
    sessionId,
    page: "/internal/revenue/shadow",
    source: "revenue-engine",
    data: {
      envelopeId: envelope.id,
      origin: simulation.origin,
      subject: simulation.subject,
      action: simulation.action,
      ritualId: simulation.ritualId,
      ritualTitle: simulation.ritualTitle,
      ritualCategory: simulation.ritualCategory,
      signalSource: simulation.signalSource,
      occupancyPercent: simulation.occupancyPercent,
      guestGenomeScore: simulation.guestGenomeScore ?? null,
      genomeScore: simulation.genomeScore ?? null,
      originalPrice: simulation.originalPrice,
      simulatedPrice: simulation.simulatedPrice,
      suggestedMultiplier: simulation.suggestedMultiplier,
      occupancyMultiplier: simulation.occupancyMultiplier,
      genomeMultiplier: simulation.genomeMultiplier,
      hybridMultiplier: simulation.hybridMultiplier,
      divergence: simulation.divergence,
      verdict: simulation.verdict,
      lookaheadHours: simulation.lookaheadHours ?? null,
      confidence: simulation.confidence,
      mode: simulation.mode,
      rationale: simulation.rationale,
    },
    timestamp: new Date(simulation.timestamp).toISOString(),
  };
}

function createSimulation(
  input: ShadowPriceSimulationInput
): ShadowPriceSimulation | null {
  const ritual = findRitualById(input.ritualId);

  if (!ritual) {
    return null;
  }

  const occupancyPercent = clampPercent(input.occupancyPercent);
  const guestGenomeScore = resolveGuestGenomeScore(input);
  const requestedMultiplier = toOptionalNumber(input.requestedMultiplier);
  const signalSource = resolveSignalSource(input.signalSource, guestGenomeScore);
  const hybridAnalysis = HybridBrain.analyze({
    occupancyPercent,
    genomeScore: guestGenomeScore,
  });
  const suggestedMultiplier = resolveSuggestedMultiplier(
    signalSource,
    hybridAnalysis,
    requestedMultiplier
  );
  const simulatedPrice = roundCurrency(ritual.price * suggestedMultiplier);
  const confidence = resolveConfidence(
    signalSource,
    occupancyPercent,
    guestGenomeScore
  );

  return {
    timestamp: Date.now(),
    version: SOVEREIGN_SCHEMA_VERSION,
    origin: MessageOrigin.NODE_ORCHESTRATOR,
    subject: SovereignSubject.AUTONOMOUS_CONTROL,
    action: "SHADOW_PRICE_UPDATE",
    ritualId: ritual.id,
    ritualTitle: ritual.title,
    ritualCategory: ritual.cat,
    tenantId: normalizeTenantId(input.tenantId),
    signalSource,
    occupancyPercent,
    guestGenomeScore,
    genomeScore: guestGenomeScore,
    originalPrice: ritual.price,
    simulatedPrice,
    suggestedMultiplier,
    occupancyMultiplier: hybridAnalysis.occupancyMultiplier,
    genomeMultiplier: hybridAnalysis.genomeMultiplier,
    hybridMultiplier: hybridAnalysis.hybridMultiplier,
    divergence: hybridAnalysis.divergence,
    verdict: hybridAnalysis.verdict,
    lookaheadHours:
      Math.max(1, Math.round(toOptionalNumber(input.lookaheadHours) ?? DEFAULT_LOOKAHEAD_HOURS)),
    confidence,
    mode: "SHADOW",
    rationale: buildRationale(
      ritual,
      signalSource,
      occupancyPercent,
      suggestedMultiplier,
      guestGenomeScore,
      hybridAnalysis
    ),
  };
}

function shouldCreateDesireSurgeCandidate(
  simulation: ShadowPriceSimulation
): boolean {
  return HybridBrain.shouldCreateDesireSurgeCandidate(
    {
      occupancyPercent: simulation.occupancyPercent,
      genomeScore: simulation.genomeScore ?? simulation.guestGenomeScore,
    },
    {
      occupancyMultiplier: simulation.occupancyMultiplier,
      genomeMultiplier: simulation.genomeMultiplier,
      hybridMultiplier: simulation.hybridMultiplier,
      divergence: simulation.divergence,
      verdict: simulation.verdict,
      genomeScore: simulation.genomeScore ?? simulation.guestGenomeScore ?? 0,
    }
  );
}

function buildDesireSurgeRecommendation(
  simulation: ShadowPriceSimulation
): string {
  return `DESIRE_SURGE_CANDIDATE: ${simulation.ritualTitle} icin fiziksel doluluk ${simulation.occupancyPercent.toFixed(
    1
  )}% seviyesinde, ancak dijital arzu %${(
    (simulation.genomeScore ?? simulation.guestGenomeScore ?? 0) * 100
  ).toFixed(0)}. Hybrid beyin ${simulation.hybridMultiplier.toFixed(
    2
  )}x öneriyor. Boardroom onayı bekleniyor.`;
}

export const RevenueEngine = {
  currentMultipliers: new Map<string, number>(),

  createAdvisoryAction(
    ritualId: string,
    multiplier: number
  ): StandardRevenueExecutePayload | null {
    return createStandardRevenuePayload(ritualId, multiplier);
  },

  createAdvisorySuggestion(
    input: RevenueAdvisorySuggestionInput
  ): AdvisorySuggestion | null {
    return createRevenueAdvisorySuggestion(input);
  },

  findRitual(ritualId: string): RitualRecord | null {
    return findRitualById(ritualId);
  },

  simulateSurge(input: ShadowPriceSimulationInput): ShadowPriceSimulation | null {
    const simulation = createSimulation(input);

    if (!simulation) {
      return null;
    }

    this.currentMultipliers.set(simulation.ritualId, simulation.suggestedMultiplier);
    return simulation;
  },

  async sealShadowPriceUpdate(
    input: ShadowPriceSimulationInput
  ): Promise<RevenueEngineResult> {
    try {
      const simulation = this.simulateSurge(input);

      if (!simulation) {
        return {
          success: false,
          reason: "RITUAL_NOT_FOUND",
          message: `Unknown ritual: ${input.ritualId}`,
        };
      }

      const candidateEnvelope = buildShadowPriceEnvelope(simulation);
      const envelope = ConstitutionalGuard.sanitize(candidateEnvelope);

      if (!envelope || envelope.type !== MessageType.EVENT) {
        return {
          success: false,
          reason: "CONSTITUTIONAL_VIOLATION",
          message: "Shadow pricing payload failed constitutional validation.",
        };
      }

      ingestSovereignEnvelope(envelope, {
        channel: "INTERNAL",
        sourceHint: "revenue-engine/shadow",
      });
      TelemetryStore.ingest(envelope);

      const telemetryEvent = buildTelemetryEvent(envelope, simulation);
      let telemetryPersisted = false;
      try {
        await upsertVisitor(telemetryEvent.visitorId);
        await appendEvent(telemetryEvent);
        telemetryPersisted = true;
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "unknown_persistence_write_error";
        console.warn(
          `[REVENUE_ENGINE] Shadow event ${envelope.id} could not be persisted. ${message}`
        );
      }

      let advisoryStored = false;
      let advisoryId: string | undefined;
      const desireSurgeCandidate = shouldCreateDesireSurgeCandidate(simulation);

      if (simulation.suggestedMultiplier !== 1 || desireSurgeCandidate) {
        const advisoryMultiplier = desireSurgeCandidate
          ? simulation.hybridMultiplier
          : simulation.suggestedMultiplier;
        const advisorySimulatedPrice = roundCurrency(
          simulation.originalPrice * advisoryMultiplier
        );
        const suggestion = createRevenueAdvisorySuggestion({
          ritualId: simulation.ritualId,
          multiplier: advisoryMultiplier,
          recommendation: desireSurgeCandidate
            ? buildDesireSurgeRecommendation(simulation)
            : buildShadowRevenueRecommendation(simulation),
          riskScore: Number(Math.max(0.1, 1 - simulation.confidence).toFixed(2)),
        });

        if (suggestion && AdvisoryStore.push) {
          const stored = AdvisoryStore.push(suggestion, {
            source: "revenue-engine.shadow",
            context: {
              ritualTitle: simulation.ritualTitle,
              ritualCategory: simulation.ritualCategory,
              occupancyPercent: simulation.occupancyPercent,
              originalPrice: simulation.originalPrice,
              simulatedPrice: advisorySimulatedPrice,
              suggestedMultiplier: advisoryMultiplier,
              confidence: simulation.confidence,
              signalSource: simulation.signalSource,
              advisoryCode: desireSurgeCandidate
                ? "DESIRE_SURGE_CANDIDATE"
                : "SHADOW_PRICE_ADVISORY",
              genomeScore: simulation.genomeScore ?? simulation.guestGenomeScore,
              occupancyMultiplier: simulation.occupancyMultiplier,
              genomeMultiplier: simulation.genomeMultiplier,
              hybridMultiplier: simulation.hybridMultiplier,
              divergence: simulation.divergence,
              verdict: simulation.verdict,
            },
          });

          advisoryStored = Boolean(stored?.id);
          advisoryId = stored?.id;
        }
      }

      return {
        success: true,
        eventId: envelope.id,
        simulation,
        telemetryPersisted,
        advisoryStored,
        advisoryId,
        reason: telemetryPersisted
          ? undefined
          : "TELEMETRY_PERSISTENCE_UNAVAILABLE",
        message: telemetryPersisted
          ? undefined
          : "Shadow event generated, but SQLite telemetry persistence is not available in this environment.",
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "unknown_revenue_engine_error";

      return {
        success: false,
        reason: "REVENUE_ENGINE_FAILURE",
        message,
      };
    }
  },
};
