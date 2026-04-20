import { randomUUID } from "node:crypto";
import { createRequire } from "node:module";

import WebSocket from "ws";

import { ConstitutionalGuard } from "./adapter.ts";
import { PriceController } from "./price-controller.ts";
import {
  RevenueEngine,
  type ShadowPriceSimulation,
} from "./revenue-engine.ts";
import { RitualRegistry } from "./ritual-registry.ts";
import { TelemetryStore } from "./telemetry-store.ts";
import { ingestSovereignEnvelope } from "./telemetry-gateway.ts";
import {
  MessageOrigin,
  MessageType,
  RevenueSignalSource,
  SOVEREIGN_SCHEMA_VERSION,
  SovereignSubject,
  type SovereignCommandEnvelope,
  type SovereignEventEnvelope,
} from "./telemetry.ts";

const require = createRequire(import.meta.url);

const POLICY_ID = "NARROW_CORRIDOR_V1";
const DEFAULT_TENANT_ID = "tn_santis_club";
const GATEWAY_URL = process.env.SOVEREIGN_GATEWAY_URL ?? "ws://localhost:4040";
const GATEWAY_COMMAND_TIMEOUT_MS = 350;
const MIN_OCCUPANCY_PERCENT = 80;
const MAX_AUTONOMOUS_MULTIPLIER = 1.02;
const ROLLBACK_WINDOW_MINUTES = 20;
const ROLLBACK_TRIGGER_RATIO = 0.3;
const LOW_RISK_RITUAL_WHITELIST = new Set([
  "isvec",
  "sirt-boyun",
  "sirt-boyun-bolgesel",
  "hint-bas",
]);

type AutonomyStoreRecord = {
  actionId?: string | null;
  ritualId?: string | null;
  ritualTitle?: string | null;
  tenantId?: string | null;
  multiplier?: number | null;
  previousPrice?: number | null;
  newPrice?: number | null;
  timestamp?: number | null;
};

type AutonomyStoreModule = {
  AutonomyStore?: {
    recordAutoAdjustment: (input: Record<string, unknown>) => AutonomyStoreRecord;
    recordRollback: (input: Record<string, unknown>) => AutonomyStoreRecord;
    getActivePosition: (ritualId: string) => AutonomyStoreRecord | null;
  };
};

type AdvisoryStoreModule = {
  AdvisoryStore?: {
    remove: (id: string) => boolean;
  };
};

export type ComparatorVerdict =
  | "OCCUPANCY_ALIGNED"
  | "DESIRE_DRIVEN"
  | "CONFLICTED";

export interface AutonomyComparator {
  occupancyMultiplier: number;
  hybridMultiplier: number;
  divergence: number;
  verdict: ComparatorVerdict;
  guestGenomeScore?: number;
}

export interface AutonomyDecision {
  policyId: string;
  eligible: boolean;
  executed: boolean;
  mode: "ADVISORY_ONLY" | "AUTO_APPLIED" | "DIRECT_FALLBACK";
  reasons: string[];
  actionId?: string;
  advisoryId?: string;
  ritualId?: string;
  comparator: AutonomyComparator;
  gatewayMode?: "GATEWAY" | "DIRECT";
}

export interface RollbackSignalInput {
  ritualId: string;
  detailViewDropRatio?: number | null;
  bookingDropRatio?: number | null;
  tenantId?: string | null;
}

export interface RollbackResult {
  evaluated: boolean;
  rolledBack: boolean;
  policyId: string;
  reason?: string;
  ritualId?: string;
  actionId?: string;
  triggerMetric?: "DETAIL_VIEWS" | "BOOKINGS" | "HYBRID";
  gatewayMode?: "GATEWAY" | "DIRECT";
}

let cachedAutonomyStore: AutonomyStoreModule | null | undefined;
let cachedAdvisoryStore: AdvisoryStoreModule | null | undefined;

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

const roundCurrency = (value: number) => Number(value.toFixed(2));

const normalizeDropRatio = (value: unknown): number | undefined => {
  const numeric = toOptionalNumber(value);
  if (numeric == null) {
    return undefined;
  }

  const ratio = numeric > 1 ? numeric / 100 : numeric;
  if (!Number.isFinite(ratio) || ratio < 0) {
    return undefined;
  }

  return Number(Math.min(1, ratio).toFixed(3));
};

function getAutonomyStore() {
  if (cachedAutonomyStore !== undefined) {
    return cachedAutonomyStore;
  }

  try {
    cachedAutonomyStore = require("./autonomy-store.js") as AutonomyStoreModule;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "unknown_autonomy_store_boot_error";
    console.warn(
      `[AUTONOMY_GUARD] Autonomy store unavailable. ${message}`
    );
    cachedAutonomyStore = null;
  }

  return cachedAutonomyStore;
}

function getAdvisoryStore() {
  if (cachedAdvisoryStore !== undefined) {
    return cachedAdvisoryStore;
  }

  try {
    cachedAdvisoryStore = require("./advisory-store.js") as AdvisoryStoreModule;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "unknown_advisory_store_boot_error";
    console.warn(
      `[AUTONOMY_GUARD] Advisory store unavailable. ${message}`
    );
    cachedAdvisoryStore = null;
  }

  return cachedAdvisoryStore;
}

function toAdvisoryActionId(advisoryId: string | undefined): string {
  return advisoryId
    ? `advisory:${advisoryId}:apply`
    : `autonomy:${randomUUID()}:apply`;
}

function buildComparator(
  simulation: ShadowPriceSimulation
): AutonomyComparator {
  return {
    occupancyMultiplier: simulation.occupancyMultiplier ?? simulation.suggestedMultiplier,
    hybridMultiplier: simulation.hybridMultiplier ?? simulation.suggestedMultiplier,
    divergence: simulation.divergence ?? 0,
    verdict: simulation.verdict ?? "OCCUPANCY_ALIGNED",
    guestGenomeScore: simulation.genomeScore ?? simulation.guestGenomeScore,
  };
}

function buildPolicyReasons(simulation: ShadowPriceSimulation): string[] {
  const reasons: string[] = [];
  const canonicalId = RitualRegistry.normalizeRitualId(simulation.ritualId);

  if (!canonicalId || !LOW_RISK_RITUAL_WHITELIST.has(canonicalId)) {
    reasons.push("RITUAL_NOT_WHITELISTED");
  }

  if (simulation.signalSource !== RevenueSignalSource.OCCUPANCY) {
    reasons.push("SIGNAL_SOURCE_NOT_OCCUPANCY");
  }

  if (simulation.occupancyPercent < MIN_OCCUPANCY_PERCENT) {
    reasons.push("OCCUPANCY_BELOW_THRESHOLD");
  }

  if (simulation.suggestedMultiplier <= 1) {
    reasons.push("NO_POSITIVE_PRICE_LIFT");
  }

  if (simulation.suggestedMultiplier > MAX_AUTONOMOUS_MULTIPLIER) {
    reasons.push("MULTIPLIER_EXCEEDS_CAP");
  }

  const activePosition =
    canonicalId != null
      ? getAutonomyStore()?.AutonomyStore?.getActivePosition(canonicalId)
      : null;

  if (activePosition) {
    reasons.push("ACTIVE_AUTONOMOUS_POSITION_PRESENT");
  }

  return reasons;
}

function buildPriceCommandEnvelope(input: {
  ritualId: string;
  multiplier: number;
  tenantId?: string;
  actionId: string;
  reason: string;
}) {
  const envelopeId = randomUUID();

  const envelope = {
    id: envelopeId,
    type: MessageType.COMMAND,
    tracking: {
      correlationId: envelopeId,
      causationId: randomUUID(),
    },
    payload: {
      timestamp: Date.now(),
      version: SOVEREIGN_SCHEMA_VERSION,
      origin: MessageOrigin.NODE_ORCHESTRATOR,
      subject: SovereignSubject.REVENUE,
      action: "ADJUST_PRICE",
      ritualId: input.ritualId,
      multiplier: input.multiplier,
      tenantId: input.tenantId,
      currency: "EUR",
      reason: input.reason,
      metadata: {
        source: "autonomy.guard",
        policyId: POLICY_ID,
        actionId: input.actionId,
        autonomous: true,
      },
    },
  } satisfies SovereignCommandEnvelope;

  return envelope;
}

function buildPriceAdjustedEnvelope(
  commandEnvelope: SovereignCommandEnvelope,
  overrideEntry: {
    canonicalRitualId: string;
    requestedRitualId: string;
    affectedRitualIds: string[];
    ritualTitle: string;
    ritualCategory: string;
    previousPrice: number;
    effectivePrice: number;
    multiplier: number;
    currency: "EUR";
    tenantId: string;
    source: string;
    origin: string;
  }
): SovereignEventEnvelope {
  return {
    id: randomUUID(),
    type: MessageType.EVENT,
    tracking: {
      correlationId: commandEnvelope.tracking?.correlationId ?? commandEnvelope.id,
      causationId: commandEnvelope.id,
    },
    payload: {
      timestamp: Date.now(),
      version: SOVEREIGN_SCHEMA_VERSION,
      origin: MessageOrigin.NODE_ORCHESTRATOR,
      subject: SovereignSubject.REVENUE,
      action: "PRICE_ADJUSTED",
      ritualId: overrideEntry.canonicalRitualId,
      requestedRitualId:
        overrideEntry.requestedRitualId !== overrideEntry.canonicalRitualId
          ? overrideEntry.requestedRitualId
          : undefined,
      affectedRitualIds: overrideEntry.affectedRitualIds,
      ritualTitle: overrideEntry.ritualTitle,
      ritualCategory: overrideEntry.ritualCategory,
      previousPrice: overrideEntry.previousPrice,
      newPrice: overrideEntry.effectivePrice,
      multiplier: overrideEntry.multiplier,
      currency: overrideEntry.currency,
      tenantId: overrideEntry.tenantId,
      metadata: {
        source: overrideEntry.source,
        origin: overrideEntry.origin,
      },
    },
  };
}

function buildAutoAdjustedEvent(input: {
  simulation: ShadowPriceSimulation;
  actionId: string;
  causationId: string;
  advisoryId?: string;
  previousPrice: number;
  newPrice: number;
  comparator: AutonomyComparator;
  gatewayMode: "GATEWAY" | "DIRECT";
}): SovereignEventEnvelope {
  return {
    id: randomUUID(),
    type: MessageType.EVENT,
    tracking: {
      correlationId: randomUUID(),
      causationId: input.causationId,
    },
    payload: {
      timestamp: Date.now(),
      version: SOVEREIGN_SCHEMA_VERSION,
      origin: MessageOrigin.NODE_ORCHESTRATOR,
      subject: SovereignSubject.AUTONOMOUS_CONTROL,
      action: "AUTO_PRICE_ADJUSTED",
      ritualId: input.simulation.ritualId,
      ritualTitle: input.simulation.ritualTitle,
      ritualCategory: input.simulation.ritualCategory,
      tenantId: input.simulation.tenantId,
      signalSource: input.simulation.signalSource,
      occupancyPercent: input.simulation.occupancyPercent,
      guestGenomeScore: input.simulation.guestGenomeScore,
      previousPrice: input.previousPrice,
      newPrice: input.newPrice,
      multiplier: input.simulation.suggestedMultiplier,
      policyId: POLICY_ID,
      rollbackWindowMinutes: ROLLBACK_WINDOW_MINUTES,
      advisoryId: input.advisoryId,
      actionId: input.actionId,
      gatewayMode: input.gatewayMode,
      comparator: {
        occupancyMultiplier: input.comparator.occupancyMultiplier,
        hybridMultiplier: input.comparator.hybridMultiplier,
        divergence: input.comparator.divergence,
        verdict: input.comparator.verdict,
      },
    },
  };
}

function buildRollbackEvent(input: {
  position: AutonomyStoreRecord;
  actionId: string;
  causationId: string;
  triggerMetric: "DETAIL_VIEWS" | "BOOKINGS" | "HYBRID";
  detailViewDropRatio?: number;
  bookingDropRatio?: number;
  gatewayMode: "GATEWAY" | "DIRECT";
}): SovereignEventEnvelope {
  const ritualId = toOptionalString(input.position.ritualId) ?? "unknown-ritual";
  const ritual = RitualRegistry.findRitual(ritualId);
  const restoredPrice = ritual ? roundCurrency(ritual.price) : 0;

  return {
    id: randomUUID(),
    type: MessageType.EVENT,
    tracking: {
      correlationId: randomUUID(),
      causationId: input.causationId,
    },
    payload: {
      timestamp: Date.now(),
      version: SOVEREIGN_SCHEMA_VERSION,
      origin: MessageOrigin.NODE_ORCHESTRATOR,
      subject: SovereignSubject.AUTONOMOUS_CONTROL,
      action: "AUTONOMOUS_ROLLBACK",
      ritualId,
      ritualTitle:
        toOptionalString(input.position.ritualTitle) ?? ritual?.title ?? ritualId,
      ritualCategory: ritual?.cat ?? "unknown",
      tenantId: toOptionalString(input.position.tenantId) ?? DEFAULT_TENANT_ID,
      previousMultiplier: toOptionalNumber(input.position.multiplier) ?? 1,
      restoredMultiplier: 1,
      previousPrice: toOptionalNumber(input.position.newPrice) ?? restoredPrice,
      restoredPrice,
      rollbackWindowMinutes: ROLLBACK_WINDOW_MINUTES,
      detailViewDropRatio: input.detailViewDropRatio,
      bookingDropRatio: input.bookingDropRatio,
      triggerMetric: input.triggerMetric,
      policyId: POLICY_ID,
      originalActionId: toOptionalString(input.position.actionId),
      actionId: input.actionId,
      gatewayMode: input.gatewayMode,
    },
  };
}

function emitValidatedEvent(
  candidateEnvelope: SovereignEventEnvelope,
  sourceHint: string
) {
  const sanitized = ConstitutionalGuard.sanitize(candidateEnvelope);
  if (!sanitized || sanitized.type !== MessageType.EVENT) {
    throw new Error(`AUTONOMY_EVENT_CONSTITUTIONAL_VIOLATION:${sourceHint}`);
  }

  ingestSovereignEnvelope(sanitized, {
    channel: "INTERNAL",
    sourceHint,
  });
  TelemetryStore.ingest(sanitized);

  return sanitized.id;
}

async function dispatchCommandThroughGateway(
  envelope: SovereignCommandEnvelope
): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const ws = new WebSocket(GATEWAY_URL);
    let settled = false;

    const finalize = (fn: () => void) => {
      if (settled) {
        return;
      }

      settled = true;
      try {
        ws.close();
      } catch {
        // Ignore close failures during cleanup.
      }
      fn();
    };

    const timer = setTimeout(() => {
      finalize(resolve);
    }, GATEWAY_COMMAND_TIMEOUT_MS);

    ws.once("open", () => {
      ws.send(JSON.stringify(envelope));
    });

    ws.on("message", (rawPacket) => {
      try {
        const parsed = JSON.parse(rawPacket.toString()) as {
          type?: string;
          payload?: { action?: string; reason?: string };
        };

        if (
          parsed?.type === "COMMAND_REJECTED" &&
          parsed.payload?.action === "ADJUST_PRICE"
        ) {
          clearTimeout(timer);
          finalize(() => {
            reject(new Error(parsed.payload?.reason ?? "COMMAND_REJECTED"));
          });
        }
      } catch {
        // Non-command packets are ignored for autonomous dispatch.
      }
    });

    ws.once("error", (error) => {
      clearTimeout(timer);
      finalize(() => {
        reject(error instanceof Error ? error : new Error("GATEWAY_ERROR"));
      });
    });

    ws.once("close", () => {
      if (settled) {
        return;
      }

      clearTimeout(timer);
      finalize(() => {
        reject(new Error("GATEWAY_CLOSED_BEFORE_ACK"));
      });
    });
  });
}

function applyCommandDirectly(envelope: ReturnType<typeof buildPriceCommandEnvelope>) {
  const overrideEntry = PriceController.applyOverride({
    ritualId: envelope.payload.ritualId,
    multiplier: envelope.payload.multiplier,
    tenantId: envelope.payload.tenantId,
    source: "autonomy.guard",
    origin: envelope.payload.origin,
    correlationId: envelope.id,
  });

  emitValidatedEvent(
    buildPriceAdjustedEnvelope(envelope, overrideEntry),
    "autonomy-guard/direct-price-adjusted"
  );

  return overrideEntry;
}

async function executePriceMutation(
  envelope: ReturnType<typeof buildPriceCommandEnvelope>
) {
  try {
    await dispatchCommandThroughGateway(envelope);
    return { gatewayMode: "GATEWAY" as const };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "unknown_gateway_dispatch_error";
    console.warn(
      `[AUTONOMY_GUARD] Gateway dispatch unavailable, falling back to direct override. ${message}`
    );

    const overrideEntry = applyCommandDirectly(envelope);
    return { gatewayMode: "DIRECT" as const, overrideEntry };
  }
}

function removeRelatedAdvisory(advisoryId: string | undefined) {
  if (!advisoryId) {
    return;
  }

  getAdvisoryStore()?.AdvisoryStore?.remove(advisoryId);
}

export const AutonomyGuard = {
  async evaluateShadowResult(input: {
    simulation: ShadowPriceSimulation;
    advisoryId?: string;
  }): Promise<AutonomyDecision> {
    const comparator = buildComparator(input.simulation);
    const reasons = buildPolicyReasons(input.simulation);
    const eligible = reasons.length === 0;
    const actionId = toAdvisoryActionId(input.advisoryId);

    if (!eligible) {
      return {
        policyId: POLICY_ID,
        eligible,
        executed: false,
        mode: "ADVISORY_ONLY",
        reasons,
        actionId,
        advisoryId: input.advisoryId,
        ritualId: input.simulation.ritualId,
        comparator,
      };
    }

    const activeOverride =
      PriceController.getActiveOverride(input.simulation.ritualId);
    const previousPrice =
      activeOverride?.effectivePrice ?? input.simulation.originalPrice;
    const newPrice = roundCurrency(
      input.simulation.originalPrice * input.simulation.suggestedMultiplier
    );
    const commandEnvelope = buildPriceCommandEnvelope({
      ritualId: input.simulation.ritualId,
      multiplier: input.simulation.suggestedMultiplier,
      tenantId: input.simulation.tenantId,
      actionId,
      reason: `Autonomous corridor engaged at ${input.simulation.occupancyPercent.toFixed(
        1
      )}% occupancy.`,
    });

    const commandResult = await executePriceMutation(commandEnvelope);
    emitValidatedEvent(
      buildAutoAdjustedEvent({
        simulation: input.simulation,
        actionId,
        causationId: commandEnvelope.id,
        advisoryId: input.advisoryId,
        previousPrice,
        newPrice,
        comparator,
        gatewayMode: commandResult.gatewayMode,
      }),
      "autonomy-guard/auto-price-adjusted"
    );

    const storedRecord =
      getAutonomyStore()?.AutonomyStore?.recordAutoAdjustment({
        actionId,
        advisoryId: input.advisoryId,
        ritualId: input.simulation.ritualId,
        ritualTitle: input.simulation.ritualTitle,
        tenantId: input.simulation.tenantId,
        multiplier: input.simulation.suggestedMultiplier,
        previousPrice,
        newPrice,
        occupancyPercent: input.simulation.occupancyPercent,
        signalSource: input.simulation.signalSource,
        policyId: POLICY_ID,
        gatewayMode: commandResult.gatewayMode,
        confidence: input.simulation.confidence,
        comparator,
      });

    removeRelatedAdvisory(input.advisoryId);

    return {
      policyId: POLICY_ID,
      eligible: true,
      executed: true,
      mode:
        commandResult.gatewayMode === "GATEWAY"
          ? "AUTO_APPLIED"
          : "DIRECT_FALLBACK",
      reasons: [],
      actionId: toOptionalString(storedRecord?.actionId) ?? actionId,
      advisoryId: input.advisoryId,
      ritualId: input.simulation.ritualId,
      comparator,
      gatewayMode: commandResult.gatewayMode,
    };
  },

  async evaluateRollbackSignal(
    input: RollbackSignalInput
  ): Promise<RollbackResult> {
    const canonicalId = RitualRegistry.normalizeRitualId(input.ritualId);
    if (!canonicalId) {
      return {
        evaluated: false,
        rolledBack: false,
        policyId: POLICY_ID,
        reason: "UNKNOWN_RITUAL",
      };
    }

    const position =
      getAutonomyStore()?.AutonomyStore?.getActivePosition(canonicalId) ?? null;
    if (!position) {
      return {
        evaluated: true,
        rolledBack: false,
        policyId: POLICY_ID,
        ritualId: canonicalId,
        reason: "NO_ACTIVE_AUTONOMOUS_POSITION",
      };
    }

    const activatedAt = toOptionalNumber(position.timestamp) ?? 0;
    const ageMs = Date.now() - activatedAt;
    if (ageMs > ROLLBACK_WINDOW_MINUTES * 60_000) {
      return {
        evaluated: true,
        rolledBack: false,
        policyId: POLICY_ID,
        ritualId: canonicalId,
        reason: "ROLLBACK_WINDOW_EXPIRED",
      };
    }

    const detailViewDropRatio = normalizeDropRatio(input.detailViewDropRatio);
    const bookingDropRatio = normalizeDropRatio(input.bookingDropRatio);

    let triggerMetric: "DETAIL_VIEWS" | "BOOKINGS" | "HYBRID" | undefined;
    if (
      detailViewDropRatio != null &&
      detailViewDropRatio >= ROLLBACK_TRIGGER_RATIO &&
      bookingDropRatio != null &&
      bookingDropRatio >= ROLLBACK_TRIGGER_RATIO
    ) {
      triggerMetric = "HYBRID";
    } else if (
      detailViewDropRatio != null &&
      detailViewDropRatio >= ROLLBACK_TRIGGER_RATIO
    ) {
      triggerMetric = "DETAIL_VIEWS";
    } else if (
      bookingDropRatio != null &&
      bookingDropRatio >= ROLLBACK_TRIGGER_RATIO
    ) {
      triggerMetric = "BOOKINGS";
    }

    if (!triggerMetric) {
      return {
        evaluated: true,
        rolledBack: false,
        policyId: POLICY_ID,
        ritualId: canonicalId,
        reason: "ROLLBACK_THRESHOLD_NOT_REACHED",
      };
    }

    const actionId = `autonomy:${randomUUID()}:rollback`;
    const commandEnvelope = buildPriceCommandEnvelope({
      ritualId: canonicalId,
      multiplier: 1,
      tenantId: toOptionalString(input.tenantId) ?? toOptionalString(position.tenantId),
      actionId,
      reason: `Autonomous rollback triggered by ${triggerMetric.toLowerCase()} degradation.`,
    });

    const commandResult = await executePriceMutation(commandEnvelope);
    emitValidatedEvent(
      buildRollbackEvent({
        position,
        actionId,
        causationId: commandEnvelope.id,
        triggerMetric,
        detailViewDropRatio,
        bookingDropRatio,
        gatewayMode: commandResult.gatewayMode,
      }),
      "autonomy-guard/autonomous-rollback"
    );

    getAutonomyStore()?.AutonomyStore?.recordRollback({
      actionId,
      originalActionId: position.actionId,
      ritualId: canonicalId,
      ritualTitle: position.ritualTitle,
      tenantId: toOptionalString(input.tenantId) ?? position.tenantId,
      previousMultiplier: position.multiplier,
      multiplier: 1,
      previousPrice: position.newPrice,
      newPrice: RitualRegistry.findRitual(canonicalId)?.price ?? position.previousPrice,
      rollbackWindowMinutes: ROLLBACK_WINDOW_MINUTES,
      detailViewDropRatio,
      bookingDropRatio,
      triggerMetric,
      policyId: POLICY_ID,
      gatewayMode: commandResult.gatewayMode,
      confidence:
        Math.max(detailViewDropRatio ?? 0, bookingDropRatio ?? 0) * 100,
    });

    return {
      evaluated: true,
      rolledBack: true,
      policyId: POLICY_ID,
      ritualId: canonicalId,
      actionId,
      triggerMetric,
      gatewayMode: commandResult.gatewayMode,
    };
  },
};
