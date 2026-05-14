/**
 * SANTIS Sovereign OS - Constitutional Telemetry Layer
 * Phase 0: Constitutional Freeze (Zod Schema)
 */

import { z } from "zod";

export const SOVEREIGN_SCHEMA_VERSION = "1.0.0";

/**
 * 1) Subject Dictionary
 * enum yerine literal object + union
 */
export const SovereignSubject = {
  REVENUE: "REVENUE",
  GUEST_GENOME: "GUEST_GENOME",
  QUANTUM_UI: "QUANTUM_UI",
  AUTONOMOUS_CONTROL: "AUTONOMOUS_CONTROL",
  SYSTEM_INTEGRITY: "SYSTEM_INTEGRITY",
  UPLOAD_GOVERNANCE: "UPLOAD_GOVERNANCE",
} as const;

export type SovereignSubject =
  (typeof SovereignSubject)[keyof typeof SovereignSubject];

export const RevenueSignalSource = {
  OCCUPANCY: "OCCUPANCY",
  GUEST_GENOME: "GUEST_GENOME",
  HYBRID: "HYBRID",
} as const;

export type RevenueSignalSource =
  (typeof RevenueSignalSource)[keyof typeof RevenueSignalSource];

export const MessageType = {
  COMMAND: "COMMAND",
  EVENT: "EVENT",
} as const;

export type MessageType = (typeof MessageType)[keyof typeof MessageType];

export const MessageOrigin = {
  NODE_ORCHESTRATOR: "NODE_ORCHESTRATOR",
  PYTHON_INTELLIGENCE: "PYTHON_INTELLIGENCE",
  CORE_KERNEL: "CORE_KERNEL",
  EDGE_ROUTER: "EDGE_ROUTER",
  BOARDROOM_UI: "BOARDROOM_UI",
} as const;

export type MessageOrigin =
  (typeof MessageOrigin)[keyof typeof MessageOrigin];

/**
 * 2) Base Schemas
 */
const basePayloadSchema = z.object({
  timestamp: z.number().int().nonnegative(),
  version: z.string().min(1),
  origin: z.enum([
    MessageOrigin.NODE_ORCHESTRATOR,
    MessageOrigin.PYTHON_INTELLIGENCE,
    MessageOrigin.CORE_KERNEL,
    MessageOrigin.EDGE_ROUTER,
    MessageOrigin.BOARDROOM_UI,
  ]),
});

const metadataSchema = z.record(
  z.string(),
  z.union([z.string(), z.number(), z.boolean()])
);

/**
 * 3) Command Schemas
 */
const adjustPriceCommandPayloadSchema = basePayloadSchema.extend({
  subject: z.literal(SovereignSubject.REVENUE),
  action: z.literal("ADJUST_PRICE"),
  ritualId: z.string().min(1),
  multiplier: z.number().positive(),
  tenantId: z.string().min(1).optional(),
  currency: z.string().min(1).optional(),
  reason: z.string().min(1).optional(),
  metadata: metadataSchema.optional(),
});

const executeUiHydrationCommandPayloadSchema = basePayloadSchema.extend({
  subject: z.literal(SovereignSubject.QUANTUM_UI),
  action: z.literal("EXECUTE_HYDRATION"),
  route: z.string().min(1),
});

const triggerUploadReaperCommandPayloadSchema = basePayloadSchema.extend({
  subject: z.literal(SovereignSubject.UPLOAD_GOVERNANCE),
  action: z.literal("TRIGGER_REAPER"),
});

export const sovereignCommandPayloadSchema = z.discriminatedUnion("action", [
  adjustPriceCommandPayloadSchema,
  executeUiHydrationCommandPayloadSchema,
  triggerUploadReaperCommandPayloadSchema,
]);

export type SovereignCommandPayload = z.infer<
  typeof sovereignCommandPayloadSchema
>;

/**
 * 4) Event Schemas
 */
const priceAdjustedEventPayloadSchema = basePayloadSchema.extend({
  subject: z.literal(SovereignSubject.REVENUE),
  action: z.literal("PRICE_ADJUSTED"),
  ritualId: z.string().min(1),
  requestedRitualId: z.string().min(1).optional(),
  affectedRitualIds: z.array(z.string().min(1)).min(1),
  ritualTitle: z.string().min(1),
  ritualCategory: z.string().min(1),
  previousPrice: z.number().nonnegative(),
  newPrice: z.number().nonnegative(),
  multiplier: z.number().positive(),
  currency: z.string().min(1),
  tenantId: z.string().min(1).optional(),
  metadata: metadataSchema.optional(),
});

const uiMountedEventPayloadSchema = basePayloadSchema.extend({
  subject: z.literal(SovereignSubject.QUANTUM_UI),
  action: z.literal("UI_MOUNTED"),
  route: z.string().min(1),
  interactionType: z.literal("MOUNT"),
});

const uiTornDownEventPayloadSchema = basePayloadSchema.extend({
  subject: z.literal(SovereignSubject.QUANTUM_UI),
  action: z.literal("UI_TORN_DOWN"),
  route: z.string().min(1),
  interactionType: z.literal("TEARDOWN"),
});

const uiHydratedEventPayloadSchema = basePayloadSchema.extend({
  subject: z.literal(SovereignSubject.QUANTUM_UI),
  action: z.literal("UI_HYDRATED"),
  route: z.string().min(1),
  interactionType: z.literal("HYDRATE"),
});

// Geriye dönük upload uyumluluğunu Anayasaya geçirme
const uploadInitAcceptedEventPayloadSchema = basePayloadSchema.extend({
  subject: z.literal(SovereignSubject.UPLOAD_GOVERNANCE),
  action: z.literal("UPLOAD_INIT_ACCEPTED"),
  fileId: z.string().optional(),
  tenantId: z.string().optional(),
});

const uploadDeniedEventPayloadSchema = basePayloadSchema.extend({
  subject: z.literal(SovereignSubject.UPLOAD_GOVERNANCE),
  action: z.literal("UPLOAD_DENIED"),
  reason: z.string().optional(),
});

const uploadFinalizedEventPayloadSchema = basePayloadSchema.extend({
  subject: z.literal(SovereignSubject.UPLOAD_GOVERNANCE),
  action: z.literal("UPLOAD_FINALIZED"),
  fileId: z.string().optional(),
  actualBytes: z.number().optional(),
});

const resourceSealedEventPayloadSchema = basePayloadSchema.extend({
  subject: z.literal(SovereignSubject.SYSTEM_INTEGRITY),
  action: z.literal("RESOURCE_SEALED"),
  tenantId: z.string().min(1),
  assetId: z.string().min(1),
  publicId: z.string().min(1),
  uploadId: z.string().min(1).optional(),
  checksumSha256: z.string().min(1).optional(),
  byteSize: z.number().int().nonnegative().optional(),
  mimeType: z.string().min(1).optional(),
  filename: z.string().min(1).optional(),
  storageKey: z.string().min(1).optional(),
  deliveryCard: z.string().min(1).optional(),
  deliveryHero: z.string().min(1).optional(),
  deliveryThumb: z.string().min(1).optional(),
});

const shadowPriceUpdateEventPayloadSchema = basePayloadSchema.extend({
  subject: z.literal(SovereignSubject.AUTONOMOUS_CONTROL),
  action: z.literal("SHADOW_PRICE_UPDATE"),
  ritualId: z.string().min(1),
  ritualTitle: z.string().min(1),
  ritualCategory: z.string().min(1),
  tenantId: z.string().min(1),
  signalSource: z.enum([
    RevenueSignalSource.OCCUPANCY,
    RevenueSignalSource.GUEST_GENOME,
    RevenueSignalSource.HYBRID,
  ]),
  occupancyPercent: z.number().min(0).max(100),
  guestGenomeScore: z.number().min(0).max(1).optional(),
  genomeScore: z.number().min(0).max(1).optional(),
  originalPrice: z.number().nonnegative(),
  simulatedPrice: z.number().nonnegative(),
  suggestedMultiplier: z.number().positive(),
  occupancyMultiplier: z.number().positive(),
  genomeMultiplier: z.number().positive(),
  hybridMultiplier: z.number().positive(),
  divergence: z.number(),
  verdict: z.enum([
    "OCCUPANCY_ALIGNED",
    "DESIRE_DRIVEN",
    "CONFLICTED",
  ]),
  lookaheadHours: z.number().int().positive().optional(),
  confidence: z.number().min(0).max(1),
  mode: z.literal("SHADOW"),
  rationale: z.string().min(1),
});

const hybridEvaluationEventPayloadSchema = basePayloadSchema.extend({
  subject: z.literal(SovereignSubject.AUTONOMOUS_CONTROL),
  action: z.literal("HYBRID_EVALUATION"),
  ritualId: z.string().min(1),
  ritualTitle: z.string().min(1),
  ritualCategory: z.string().min(1),
  tenantId: z.string().min(1),
  conversionType: z.literal("BOOKING"),
  outcomeId: z.string().min(1),
  converted: z.boolean(),
  matchedShadowEventId: z.string().uuid(),
  matchedShadowTimestamp: z.number().int().nonnegative(),
  evaluationLagMinutes: z.number().nonnegative(),
  signalSource: z.enum([
    RevenueSignalSource.OCCUPANCY,
    RevenueSignalSource.GUEST_GENOME,
    RevenueSignalSource.HYBRID,
  ]),
  occupancyPercent: z.number().min(0).max(100),
  guestGenomeScore: z.number().min(0).max(1).optional(),
  genomeScore: z.number().min(0).max(1).optional(),
  occupancyMultiplier: z.number().positive(),
  genomeMultiplier: z.number().positive(),
  hybridMultiplier: z.number().positive(),
  divergence: z.number(),
  verdict: z.enum([
    "OCCUPANCY_ALIGNED",
    "DESIRE_DRIVEN",
    "CONFLICTED",
  ]),
  predictedConversionProbability: z.number().min(0).max(1),
  learningRate: z.number().positive(),
  suggestedWeightShift: z.number(),
  currentOccupancyWeight: z.number().min(0).max(1),
  currentGenomeWeight: z.number().min(0).max(1),
  recommendedOccupancyWeight: z.number().min(0).max(1),
  recommendedGenomeWeight: z.number().min(0).max(1),
  tuningAction: z.enum([
    "INCREASE_GENOME_WEIGHT",
    "DECREASE_GENOME_WEIGHT",
    "HOLD_WEIGHTS",
  ]),
  rationale: z.string().min(1),
});

const autonomousComparatorSchema = z.object({
  occupancyMultiplier: z.number().positive(),
  hybridMultiplier: z.number().positive(),
  divergence: z.number(),
  verdict: z.enum([
    "OCCUPANCY_ALIGNED",
    "DESIRE_DRIVEN",
    "CONFLICTED",
  ]),
});

const autoPriceAdjustedEventPayloadSchema = basePayloadSchema.extend({
  subject: z.literal(SovereignSubject.AUTONOMOUS_CONTROL),
  action: z.literal("AUTO_PRICE_ADJUSTED"),
  ritualId: z.string().min(1),
  ritualTitle: z.string().min(1),
  ritualCategory: z.string().min(1),
  tenantId: z.string().min(1),
  signalSource: z.enum([
    RevenueSignalSource.OCCUPANCY,
    RevenueSignalSource.GUEST_GENOME,
    RevenueSignalSource.HYBRID,
  ]),
  occupancyPercent: z.number().min(0).max(100),
  guestGenomeScore: z.number().min(0).max(100).optional(),
  previousPrice: z.number().nonnegative(),
  newPrice: z.number().nonnegative(),
  multiplier: z.number().positive(),
  policyId: z.string().min(1),
  rollbackWindowMinutes: z.number().int().positive(),
  advisoryId: z.string().min(1).optional(),
  actionId: z.string().min(1),
  gatewayMode: z.enum(["GATEWAY", "DIRECT"]),
  comparator: autonomousComparatorSchema,
});

const autonomousRollbackEventPayloadSchema = basePayloadSchema.extend({
  subject: z.literal(SovereignSubject.AUTONOMOUS_CONTROL),
  action: z.literal("AUTONOMOUS_ROLLBACK"),
  ritualId: z.string().min(1),
  ritualTitle: z.string().min(1),
  ritualCategory: z.string().min(1),
  tenantId: z.string().min(1),
  previousMultiplier: z.number().positive(),
  restoredMultiplier: z.number().positive(),
  previousPrice: z.number().nonnegative(),
  restoredPrice: z.number().nonnegative(),
  rollbackWindowMinutes: z.number().int().positive(),
  detailViewDropRatio: z.number().min(0).max(1).optional(),
  bookingDropRatio: z.number().min(0).max(1).optional(),
  triggerMetric: z.enum(["DETAIL_VIEWS", "BOOKINGS", "HYBRID"]),
  policyId: z.string().min(1),
  originalActionId: z.string().min(1).optional(),
  actionId: z.string().min(1),
  gatewayMode: z.enum(["GATEWAY", "DIRECT"]),
});

export const standardRevenueExecutePayloadSchema = z.object({
  command: z.literal("ADJUST_PRICE"),
  ritualId: z.string().min(1),
  multiplier: z.number().positive(),
});

export type StandardRevenueExecutePayload = z.infer<
  typeof standardRevenueExecutePayloadSchema
>;

const advisorySuggestionPayloadSchema = basePayloadSchema.extend({
  subject: z.literal(SovereignSubject.AUTONOMOUS_CONTROL),
  action: z.literal("SUGGESTION_GENERATED"),
  riskScore: z.number().min(0).max(1),
  impactArea: z.enum(["REVENUE", "SYSTEM", "EXPERIENCE"]),
  recommendation: z.string(),
  executePayload: z.union([
    standardRevenueExecutePayloadSchema,
    z.record(z.string(), z.any()),
  ]),
});

export type AdvisorySuggestion = z.infer<typeof advisorySuggestionPayloadSchema>;

export const sovereignEventPayloadSchema = z.discriminatedUnion("action", [
  priceAdjustedEventPayloadSchema,
  uiMountedEventPayloadSchema,
  uiTornDownEventPayloadSchema,
  uiHydratedEventPayloadSchema,
  uploadInitAcceptedEventPayloadSchema,
  uploadDeniedEventPayloadSchema,
  uploadFinalizedEventPayloadSchema,
  resourceSealedEventPayloadSchema,
  shadowPriceUpdateEventPayloadSchema,
  hybridEvaluationEventPayloadSchema,
  autoPriceAdjustedEventPayloadSchema,
  autonomousRollbackEventPayloadSchema,
  advisorySuggestionPayloadSchema,
]);

export type SovereignEventPayload = z.infer<typeof sovereignEventPayloadSchema>;

/**
 * 5) Base Envelope and Trace Metadata
 * Enforces Causation and Correlation standardisation
 */
const trackingMetadataSchema = z.object({
  correlationId: z.string().uuid().optional(),
  causationId: z.string().uuid().optional(),
});

/**
 * 6) Envelope Schemas
 */
export const sovereignCommandEnvelopeSchema = z.object({
  id: z.string().uuid(),
  type: z.literal(MessageType.COMMAND),
  signature: z.string().min(1).optional(),
  tracking: trackingMetadataSchema.optional(),
  payload: sovereignCommandPayloadSchema,
});

export const sovereignEventEnvelopeSchema = z.object({
  id: z.string().uuid(),
  type: z.literal(MessageType.EVENT),
  signature: z.string().min(1).optional(),
  tracking: trackingMetadataSchema.optional(),
  payload: sovereignEventPayloadSchema,
});

export const sovereignEnvelopeSchema = z.union([
  sovereignCommandEnvelopeSchema,
  sovereignEventEnvelopeSchema,
]);

export type SovereignCommandEnvelope = z.infer<
  typeof sovereignCommandEnvelopeSchema
>;
export type SovereignEventEnvelope = z.infer<typeof sovereignEventEnvelopeSchema>;
export type SovereignEnvelope = z.infer<typeof sovereignEnvelopeSchema>;

/**
 * 7) Runtime Validation
 * Boundary girişinde unknown kabul edilir, any yasaktır.
 */
export function validateSovereignEnvelope(
  input: unknown
): input is SovereignEnvelope {
  return sovereignEnvelopeSchema.safeParse(input).success;
}

export function parseSovereignEnvelope(input: unknown): SovereignEnvelope {
  return sovereignEnvelopeSchema.parse(input);
}
