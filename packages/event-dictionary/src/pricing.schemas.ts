import { z } from "zod";

export const PricingReasonCodeSchema = z.enum([
  "high_scp_margin",
  "low_scp_margin",
  "premium_intent",
  "vip_signal",
  "low_hesitation",
  "high_hesitation",
  "capacity_pressure",
  "low_demand",
  "discount_risk",
  "luxury_brand_guard"
]);

export const PricingRecommendationSchema = z.object({
  id: z.string().uuid(),
  sessionId: z.string(),
  traceId: z.string().uuid(),

  mode: z.literal("advisory"),

  action: z.enum([
    "increase_price",
    "hold_price",
    "add_value_upgrade",
    "suppress_discount"
  ]),

  suggestedDeltaPct: z.number().min(-0.2).max(0.2),

  confidence: z.number().min(0).max(1),

  reasonCodes: z.array(PricingReasonCodeSchema),

  evidence: z.object({
    scpScore: z.number(),
    scpMargin: z.number(),
    grossRevenue: z.number(),

    demandIndex: z.number().optional(),
    hesitationIndex: z.number().optional(),
    capacityUtilization: z.number().optional(),
    vipSignal: z.boolean()
  }),

  guardrails: z.object({
    requiresHumanApproval: z.literal(true),
    maxDeltaPct: z.number(),
    brandRisk: z.enum(["low", "medium", "high"]),
    luxuryIntegrity: z.boolean(),
    expiresAt: z.string()
  }),

  createdAt: z.string()
});

export const PricingOverrideCommandSchema = z.object({
  commandId: z.string().uuid(),
  commandType: z.literal("pricing.override.apply"),
  recommendationId: z.string().uuid(),
  decision: z.enum([
    "approve",
    "reject",
    "adjust"
  ]),
  appliedDeltaPct: z.number().optional(),
  operatorId: z.string(),
  reason: z.string().optional(),
  createdAt: z.string()
});

export const PricingOverrideAppliedSchema = z.object({
  type: z.literal("pricing.override.applied"),
  payload: z.object({
    recommendationId: z.string(),
    finalAction: z.string(),
    appliedDeltaPct: z.number(),
    operatorId: z.string()
  })
});

export const ShadowPricingDecisionSchema = z.object({
  id: z.string().uuid(),
  sessionId: z.string(),
  traceId: z.string().uuid(),

  recommendationId: z.string(),

  simulatedAction: z.enum([
    "increase_price",
    "hold_price",
    "add_value_upgrade",
    "suppress_discount"
  ]),

  simulatedDeltaPct: z.number(),

  confidence: z.number(),

  expectedOutcome: z.object({
    expectedRevenueDelta: z.number(),
    expectedScpDelta: z.number()
  }),

  createdAt: z.string()
});

export const PricingCalibrationSnapshotSchema = z.object({
  id: z.string().uuid(),

  windowSize: z.number(),

  matchRate: z.number(),            // doğru karar oranı
  avgConfidence: z.number(),        // model confidence ortalaması

  calibrationError: z.number(),     // en kritik metrik

  segments: z.object({
    highConfidence: z.number(),
    mediumConfidence: z.number(),
    lowConfidence: z.number()
  }),

  createdAt: z.string()
});
