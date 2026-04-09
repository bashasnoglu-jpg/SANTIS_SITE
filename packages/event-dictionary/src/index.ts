import { z } from "zod";

// ============================================================================
// 0. SHARED PRIMITIVES (Ortak Literal ve Branded Tipler)
// ============================================================================

export const RegionSchema = z.enum(["EU", "MEA", "APAC"]);
export const LocaleSchema = z.enum(["tr", "en", "de", "ru"]);
export const CurrencySchema = z.enum(["EUR", "USD", "GBP", "TRY", "AED"]);

export const MoodSchema = z.enum([
  "deep_relaxation",
  "recovery",
  "beauty",
  "detox",
  "couple_connection"
]);

export const GuestSegmentSchema = z.enum([
  "explorer",
  "premium_intent",
  "couple",
  "family",
  "recovery",
  "beauty",
  "detox",
  "vip"
]);

export const FallbackReasonSchema = z.enum([
  "webgpu_unavailable",
  "module_load_failed",
  "worker_timeout",
  "api_timeout",
  "device_constraint"
]);

export const ExperienceModeSchema = z.enum([
  "immersive",
  "kinetic",
  "assisted",
  "static_luxury",
  "safe_mode"
]);

export const AnimationModeSchema = ExperienceModeSchema;

export const FlowStepSchema = z.enum([
  "hero_intro",
  "mood_selection",
  "ritual_customization",
  "checkout_payment",
  "checkout_success"
]);

export const ExperienceFlowSchema = z.enum([
  "mood_first",
  "package_first",
  "guided_ritual",
  "concierge_first",
  "fast_checkout",
]);

export type ExperienceFlow = z.infer<typeof ExperienceFlowSchema>;

// Branded/Paterned Types
export const SessionIdSchema = z.string().regex(/^[a-zA-Z0-9_-]{8,64}$/, "Geçersiz Session ID formatı");
export const HotelCodeSchema = z.string().regex(/^[A-Z0-9]{2,10}$/, "Geçersiz Hotel Kod formatı");

// ============================================================================
// 1. CORE DOMAIN CONTEXTS (Sistem Bağlamı)
// ============================================================================

export const TenantContextSchema = z.object({
  hotelId: z.string().uuid(),
  hotelCode: HotelCodeSchema,
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

// ============================================================================
// 2. BASE EVENT ENVELOPE (Tüm Olayların Ortak Zarfı)
// ============================================================================

const BaseEventSchema = z.object({
  eventId: z.string().uuid(),
  occurredAt: z.string().datetime(), // ISO 8601 format zorunluluğu
  tenant: TenantContextSchema,
  intent: GuestIntentSchema,
  traceId: z.string().uuid(),        // Observability ve loglama için
  sessionId: SessionIdSchema,
  schemaVersion: z.literal("v1").default("v1"), // Schema Drift'i engellemek için
});

// ============================================================================
// 3. EVENT PAYLOADS (Spesifik Olay Yükleri)
// ============================================================================

// --- Experience Events ---
export const MoodSelectedPayloadSchema = z.object({
  mood: MoodSchema,
  source: z.enum(["homepage", "ritual_builder", "concierge_prompt"]),
});

export const FlowAbandonedPayloadSchema = z.object({
  step: FlowStepSchema,
  timeSpentSeconds: z.number().nonnegative(),
  lastInteractedElement: z.string().optional(),
});

// --- Commerce Events ---
export const TherapistUpsellAcceptedPayloadSchema = z.object({
  therapistId: z.string().uuid(),
  upsellAmount: z.number().nonnegative(),
  originalPackageId: z.string().uuid(),
  upgradedPackageId: z.string().uuid().optional(),
});

// --- Risk & Fallback Events ---
export const FallbackEngagedPayloadSchema = z.object({
  reason: FallbackReasonSchema,
  fromMode: ExperienceModeSchema,
  toMode: ExperienceModeSchema,
});

// ============================================================================
// 4. EVENT SCHEMAS (Zarf + Yük Birleşimi)
// ============================================================================

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

export const RoutingPolicyAppliedPayloadSchema = z.object({
  assignedFlow: ExperienceFlowSchema,
  animationTier: AnimationModeSchema,
  premiumRevealed: z.boolean(),
  policyId: z.string().uuid().optional(),
  prestigeMultiplier: z.number().optional(),
  resolutionReason: z.enum([
    "policy_matched",
    "default_applied",
    "fallback_forced",
  ]),
});

export const RoutingPolicyAppliedEventSchema = BaseEventSchema.extend({
  eventType: z.literal("routing.policy.applied"),
  payload: RoutingPolicyAppliedPayloadSchema,
});

// ============================================================================
// 5. THE SINGLE SOURCE OF TRUTH: SANTIS EVENT (Discriminated Union)
// ============================================================================

export const PricingMidasEngagedPayloadSchema = z.object({
  prestigeMultiplier: z.number().min(1),
  dominantMood: MoodSchema,
  thresholdSurpassed: z.number(), // Midas surge tetikleyen oran (örn: 0.45)
});

export const PricingMidasEngagedEventSchema = BaseEventSchema.extend({
  eventType: z.literal("pricing.midas.engaged"),
  payload: PricingMidasEngagedPayloadSchema,
});

export const SantisEventSchema = z.discriminatedUnion("eventType", [
  MoodSelectedEventSchema,
  FlowAbandonedEventSchema,
  TherapistUpsellAcceptedEventSchema,
  FallbackEngagedEventSchema,
  RoutingPolicyAppliedEventSchema,
  PricingMidasEngagedEventSchema,
]);

export type SantisEvent = z.infer<typeof SantisEventSchema>;
export type RoutingPolicyAppliedEvent = z.infer<typeof RoutingPolicyAppliedEventSchema>;

// ============================================================================
// 6. COMMANDS (Sistemden İstenen Aksiyonlar - UI Tarafından Üretilir)
// ============================================================================

const BaseCommandSchema = z.object({
  commandId: z.string().uuid(),
  requestedAt: z.string().datetime(),
  tenantId: z.string().uuid(),
  sessionId: SessionIdSchema,
  traceId: z.string().uuid(),
});

export const SelectMoodCommandSchema = BaseCommandSchema.extend({
  commandType: z.literal("guest.select_mood"),
  payload: z.object({
    mood: MoodSchema,
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
    preferredSource: z.enum([
      "homepage",
      "ritual_builder",
      "concierge_prompt",
    ]).optional(),
  }),
});

export const SantisCommandSchema = z.discriminatedUnion("commandType", [
  SelectMoodCommandSchema,
  CalculateOfferCommandSchema,
  ResolveExperienceCommandSchema,
]);

export type SantisCommand = z.infer<typeof SantisCommandSchema>;
export type ResolveExperienceCommand = z.infer<typeof ResolveExperienceCommandSchema>;
