import { z } from "zod";

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

export type Region = z.infer<typeof RegionSchema>;
export type Locale = z.infer<typeof LocaleSchema>;
export type Currency = z.infer<typeof CurrencySchema>;
export type Mood = z.infer<typeof MoodSchema>;
export type GuestSegment = z.infer<typeof GuestSegmentSchema>;
export type ExperienceSource = z.infer<typeof ExperienceSourceSchema>;
export type AnimationMode = z.infer<typeof AnimationModeSchema>;
export type FallbackReason = z.infer<typeof FallbackReasonSchema>;

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

export const SantisEventSchema = z.discriminatedUnion("eventType", [
  MoodSelectedEventSchema,
  FlowAbandonedEventSchema,
  TherapistUpsellAcceptedEventSchema,
  FallbackEngagedEventSchema,
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

export const SantisCommandSchema = z.discriminatedUnion("commandType", [
  SelectMoodCommandSchema,
  CalculateOfferCommandSchema,
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
