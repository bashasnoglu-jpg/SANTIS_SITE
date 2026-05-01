import type { TelemetrySignal } from '@santis/domain-schema/telemetry';
import { z } from "zod";

// Katı Override Modelleri
export type BoardroomOverrideMode = "force_reduce" | "force_normal" | "resume_autonomy";

export type ConciergeEvent = 
  | { type: 'SIGNAL_RECEIVED'; signal: TelemetrySignal }
  | { type: 'BOARDROOM_OVERRIDE'; mode: BoardroomOverrideMode };

/**
 * ============================================================================
 * 1. SHARED CANONICAL ENUM-LIKE SCHEMAS
 * ============================================================================
 */

export const RegionSchema = z.enum(["EU", "MEA", "APAC"]);
export const LocaleSchema = z.enum(["tr", "en", "de", "ru"]);
export const CurrencySchema = z.enum(["EUR", "USD", "TRY", "GBP"]);

export const MoodSchema = z.enum([
  "deep_relaxation",
  "recovery",
  "beauty",
  "detox",
  "couple_connection",
]);

export const GuestSegmentSchema = z.enum([
  "explorer",
  "premium_intent",
  "couple",
  "family",
  "recovery",
  "beauty",
  "detox",
  "vip",
]);

export const ExperienceSourceSchema = z.enum([
  "homepage",
  "ritual_builder",
  "concierge_prompt",
]);

export const AnimationModeSchema = z.enum([
  "immersive",
  "kinetic",
  "assisted",
  "static_luxury",
  "safe_mode",
]);

export const FallbackReasonSchema = z.enum([
  "webgpu_unavailable",
  "module_load_failed",
  "worker_timeout",
  "api_timeout",
  "device_constraint",
]);

export const ExperienceFlowSchema = z.enum([
  "guided_ritual",
  "express_booking",
  "concierge_chat",
  "direct_catalog"
]);

export type Region = z.infer<typeof RegionSchema>;
export type Locale = z.infer<typeof LocaleSchema>;
export type Currency = z.infer<typeof CurrencySchema>;
export type Mood = z.infer<typeof MoodSchema>;
export type GuestSegment = z.infer<typeof GuestSegmentSchema>;
export type ExperienceSource = z.infer<typeof ExperienceSourceSchema>;
export type AnimationMode = z.infer<typeof AnimationModeSchema>;
export type FallbackReason = z.infer<typeof FallbackReasonSchema>;
export type ExperienceFlow = z.infer<typeof ExperienceFlowSchema>;

/**
 * ============================================================================
 * 2. CORE DOMAIN CONTEXTS
 * ============================================================================
 */

export const TenantContextSchema = z.object({
  hotelId: z.string().uuid(),
  hotelCode: z.string().min(2).max(32),
  region: RegionSchema,
  locale: LocaleSchema,
  currency: CurrencySchema,
  activePolicies: z.array(z.string()).default([]),
  fallbackMode: z.boolean().default(false),
});

export type TenantContext = z.infer<typeof TenantContextSchema>;

export const GuestIntentSchema = z.object({
  guestId: z.string().uuid().optional(),
  isReturningGuest: z.boolean(),
  segment: GuestSegmentSchema,
  moodAffinity: z.array(MoodSchema).default([]),
  premiumThreshold: z.number().min(0).max(100),
});

export type GuestIntent = z.infer<typeof GuestIntentSchema>;

/**
 * ============================================================================
 * 3. BASE ENVELOPES
 * ============================================================================
 */

export const SchemaVersionSchema = z.literal("v1");

export const BaseEventSchema = z.object({
  eventId: z.string().uuid(),
  occurredAt: z.string().datetime(),
  tenant: TenantContextSchema,
  intent: GuestIntentSchema,
  traceId: z.string().uuid(),
  sessionId: z.string().min(8),
  schemaVersion: SchemaVersionSchema.default("v1"),
});

export const BaseCommandSchema = z.object({
  commandId: z.string().uuid(),
  requestedAt: z.string().datetime(),
  tenant: TenantContextSchema,
  sessionId: z.string().min(8),
  traceId: z.string().uuid(),
  schemaVersion: SchemaVersionSchema.default("v1"),
});

/**
 * ============================================================================
 * 4. EVENT PAYLOADS
 * ============================================================================
 */

// experience.*
export const MoodSelectedPayloadSchema = z.object({
  mood: MoodSchema,
  source: ExperienceSourceSchema,
  hesitation_index: z.number().optional(),
  abandon_risk: z.number().optional(),
});

export const FlowAbandonedPayloadSchema = z.object({
  step: z.string().min(1),
  timeSpentSeconds: z.number().nonnegative(),
  lastInteractedElement: z.string().min(1).optional(),
});

// commerce.*
export const TherapistUpsellAcceptedPayloadSchema = z.object({
  therapistId: z.string().uuid(),
  upsellAmount: z.number().nonnegative(),
  originalPackageId: z.string().uuid(),
  upgradedPackageId: z.string().uuid().optional(),
});

// risk.*
export const FallbackEngagedPayloadSchema = z.object({
  reason: FallbackReasonSchema,
  fromMode: AnimationModeSchema.exclude(["safe_mode"]),
  toMode: AnimationModeSchema.extract(["assisted", "static_luxury", "safe_mode"]),
});

/**
 * ============================================================================
 * 5. EVENT SCHEMAS
 * ============================================================================
 */

export const MoodSelectedEventSchema = BaseEventSchema.extend({
  eventType: z.literal("experience.interaction.mood_selected"),
  payload: MoodSelectedPayloadSchema,
});

export const FlowAbandonedEventSchema = BaseEventSchema.extend({
  eventType: z.literal("experience.flow.abandoned"),
  payload: FlowAbandonedPayloadSchema,
});

export const TherapistUpsellAcceptedEventSchema = BaseEventSchema.extend({
  eventType: z.literal("commerce.upsell.therapist_accepted"),
  payload: TherapistUpsellAcceptedPayloadSchema,
});

export const FallbackEngagedEventSchema = BaseEventSchema.extend({
  eventType: z.literal("risk.fallback.engaged"),
  payload: FallbackEngagedPayloadSchema,
});

export const RoutingPolicyAppliedEventSchema = BaseEventSchema.extend({
  eventType: z.literal("routing.policy.applied"),
  payload: z.object({
    assignedFlow: z.string(),
    animationTier: z.string(),
    premiumRevealed: z.boolean(),
    policyId: z.string().optional(),
    resolutionReason: z.string(),
    prestigeMultiplier: z.number().optional(),
  }),
});

export type RoutingPolicyAppliedEvent = z.infer<typeof RoutingPolicyAppliedEventSchema>;

export const PricingMidasEngagedEventSchema = BaseEventSchema.extend({
  eventType: z.literal("pricing.midas.engaged"),
  payload: z.object({
    prestigeMultiplier: z.number(),
    dominantMood: MoodSchema,
    thresholdSurpassed: z.number(),
  }),
});

export type PricingMidasEngagedEvent = z.infer<typeof PricingMidasEngagedEventSchema>;

export const CheckoutCompletedEventSchema = BaseEventSchema.extend({
  eventType: z.literal("commerce.checkout.completed"),
  payload: z.object({
    guestId: z.string(),
    totalAmount: z.number().nonnegative(),
    currency: CurrencySchema,
    services: z.array(z.string()).default([]),
  }),
});

export const RiskSignalTriggeredEventSchema = BaseEventSchema.extend({
  eventType: z.literal("risk.signal_triggered"),
  payload: z.object({
    userId: z.string(),
    riskScore: z.number().min(0).max(100),
    reason: z.string(),
  }),
});

import { PricingRecommendationSchema } from "./pricing.schemas";

export const PricingRecommendationEmittedEventSchema = BaseEventSchema.extend({
  eventType: z.literal("pricing.recommendation.emitted"),
  payload: PricingRecommendationSchema
});

export const PricingAutonomousRecommendedEventSchema = BaseEventSchema.extend({
  eventType: z.literal("pricing.autonomous.recommended"),
  payload: PricingRecommendationSchema
});

import { PricingOverrideAppliedSchema } from "./pricing.schemas";

export const PricingOverrideAppliedEventSchema = BaseEventSchema.extend({
  eventType: z.literal("pricing.override.applied"),
  payload: PricingOverrideAppliedSchema.shape.payload
});

export const BoardroomOracleExecutedPayloadSchema = z.object({
  actionId: z.string(),
  sourceEventId: z.string().optional(),
  actionType: z.string(),
  operatorId: z.string(),
  accepted: z.literal(true),
  executedAt: z.string().datetime(),
  metadata: z.record(z.unknown()).optional(),
});

export const BoardroomOracleExecutedEventSchema = BaseEventSchema.extend({
  eventType: z.literal("boardroom.oracle.executed"),
  payload: BoardroomOracleExecutedPayloadSchema,
});

export const BoardroomStrategyAppliedPayloadSchema = z.object({
  strategyId: z.string(),
  sourceRecommendationId: z.string().optional(),
  sourceSessionId: z.string().optional(),
  appliedAction: z.string(),
  appliedDeltaPct: z.number().optional(),
  expectedRevenueDelta: z.number().optional(),
  confidence: z.number().optional(),
  operatorId: z.string(),
  humanSeal: z.literal(true),
  appliedAt: z.string().datetime(),
  metadata: z.record(z.unknown()).optional(),
});

export const BoardroomStrategyAppliedEventSchema = BaseEventSchema.extend({
  eventType: z.literal("boardroom.strategy.applied"),
  payload: BoardroomStrategyAppliedPayloadSchema,
});


export const SantisEventSchema = z.discriminatedUnion("eventType", [
  MoodSelectedEventSchema,
  FlowAbandonedEventSchema,
  TherapistUpsellAcceptedEventSchema,
  FallbackEngagedEventSchema,
  RoutingPolicyAppliedEventSchema,
  PricingMidasEngagedEventSchema,
  CheckoutCompletedEventSchema,
  RiskSignalTriggeredEventSchema,
  PricingRecommendationEmittedEventSchema,
  PricingAutonomousRecommendedEventSchema,
  PricingOverrideAppliedEventSchema,
  BoardroomOracleExecutedEventSchema,
  BoardroomStrategyAppliedEventSchema,
]);

export type SantisEvent = z.infer<typeof SantisEventSchema>;
export type SantisEventType = SantisEvent["eventType"];

/**
 * ============================================================================
 * 6. COMMAND SCHEMAS
 * ============================================================================
 */

export const SelectMoodCommandSchema = BaseCommandSchema.extend({
  commandType: z.literal("guest.select_mood"),
  payload: z.object({
    mood: MoodSchema,
    source: ExperienceSourceSchema,
  }),
});

export const CalculateOfferCommandSchema = BaseCommandSchema.extend({
  commandType: z.literal("pricing.calculate_offer"),
  payload: z.object({
    packageId: z.string().uuid(),
    requestedTimeSlot: z.string().datetime(),
  }),
});

export const ResolveExperienceCommandSchema = BaseCommandSchema.extend({
  commandType: z.literal("routing.resolve_experience"),
  payload: z.object({
    intent: GuestIntentSchema,
  }),
});

export type ResolveExperienceCommand = z.infer<typeof ResolveExperienceCommandSchema>;

export const CommerceRecordCheckoutCommandSchema = BaseCommandSchema.extend({
  commandType: z.literal("commerce.record_checkout"),
  payload: z.object({
    guestId: z.string(),
    totalAmount: z.number().nonnegative(),
    currency: CurrencySchema,
    services: z.array(z.string()).default([]),
  }),
});

export const TriggerRiskSignalCommandSchema = BaseCommandSchema.extend({
  commandType: z.literal("risk.trigger_signal"),
  payload: z.object({
    userId: z.string(),
    riskScore: z.number().min(0).max(100),
    reason: z.string(),
  }),
});

import { PricingOverrideCommandSchema } from "./pricing.schemas";

export const BoardroomOracleExecutePayloadSchema = z.object({
  actionId: z.string(),
  sourceEventId: z.string().optional(),
  actionType: z.enum([
    "acknowledge",
    "suppress",
    "escalate",
    "apply_pricing_override",
    "lock_recommendation"
  ]),
  operatorId: z.string(),
  reason: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const BoardroomOracleExecuteCommandSchema = BaseCommandSchema.extend({
  commandType: z.literal("boardroom.oracle.execute"),
  payload: BoardroomOracleExecutePayloadSchema,
});

export const BoardroomStrategyApplyPayloadSchema = z.object({
  strategyId: z.string(),
  sourceRecommendationId: z.string().optional(),
  sourceSessionId: z.string().optional(),
  simulatedAction: z.string(),
  simulatedDeltaPct: z.number().optional(),
  expectedRevenueDelta: z.number().optional(),
  confidence: z.number().optional(),
  operatorId: z.string(),
  humanSeal: z.literal(true),
  reason: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const BoardroomStrategyApplyCommandSchema = BaseCommandSchema.extend({
  commandType: z.literal("boardroom.strategy.apply"),
  payload: BoardroomStrategyApplyPayloadSchema,
});


export const SantisCommandSchema = z.discriminatedUnion("commandType", [
  SelectMoodCommandSchema,
  CalculateOfferCommandSchema,
  ResolveExperienceCommandSchema,
  CommerceRecordCheckoutCommandSchema,
  TriggerRiskSignalCommandSchema,
  PricingOverrideCommandSchema,
  BoardroomOracleExecuteCommandSchema,
  BoardroomStrategyApplyCommandSchema,
]);

export type SantisCommand = z.infer<typeof SantisCommandSchema>;
export type SantisCommandType = SantisCommand["commandType"];

/**
 * ============================================================================
 * 7. SAFE PARSE HELPERS
 * ============================================================================
 */

export function parseSantisEvent(input: unknown): SantisEvent {
  return SantisEventSchema.parse(input);
}

export function parseSantisCommand(input: unknown): SantisCommand {
  return SantisCommandSchema.parse(input);
}

export function safeParseSantisEvent(input: unknown) {
  return SantisEventSchema.safeParse(input);
}

export function safeParseSantisCommand(input: unknown) {
  return SantisCommandSchema.safeParse(input);
}

export * from './event.types';
export * from './command-result';
export * from './scp.schemas';
export * from './pricing.schemas';
