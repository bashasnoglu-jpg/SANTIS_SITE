import { z } from "zod";

export const RitualCategorySchema = z.enum([
  "massage",
  "hamam",
  "skin",
  "medical",
  "sport",
  "signature",
  "recovery",
  "beauty",
  "wellness"
]);
export type RitualCategory = z.infer<typeof RitualCategorySchema>;

export const RitualIntensitySchema = z.enum([
  "low",
  "medium",
  "high",
  "clinical"
]);
export type RitualIntensity = z.infer<typeof RitualIntensitySchema>;

export const ContraindicationTagSchema = z.enum([
  "pregnancy",
  "heat",
  "deep_pressure",
  "skin_sensitivity",
  "cardiovascular",
  "post_surgery",
  "inflammation",
  "allergy",
  "medical_review_required"
]);
export type ContraindicationTag = z.infer<typeof ContraindicationTagSchema>;

export const BodyFocusSchema = z.enum([
  "back",
  "neck_shoulders",
  "legs",
  "full_body",
  "face",
  "scalp",
  "lymphatic",
  "respiratory",
  "nervous_system",
  "skin_barrier"
]);
export type BodyFocus = z.infer<typeof BodyFocusSchema>;

export const RecoveryGoalSchema = z.enum([
  "relax",
  "detox",
  "pain_relief",
  "sleep",
  "mobility",
  "skin_glow",
  "stress_reset",
  "post_travel_recovery",
  "athletic_recovery",
  "emotional_balance"
]);
export type RecoveryGoal = z.infer<typeof RecoveryGoalSchema>;

export const SequenceRoleSchema = z.enum([
  "standalone",
  "opener",
  "core",
  "closer",
  "add_on"
]);
export type SequenceRole = z.infer<typeof SequenceRoleSchema>;

export const VisualMoodSchema = z.object({
  texture: z.string(),
  lighting: z.string(),
  motion: z.string(),
  colorTemperature: z.string()
});
export type VisualMood = z.infer<typeof VisualMoodSchema>;

export const ResourceRequirementsSchema = z.object({
  roomType: z.string(),
  therapistSkillTags: z.array(z.string()),
  equipmentTags: z.array(z.string()),
  requiresWetArea: z.boolean(),
  requiresQuietRoom: z.boolean()
});
export type ResourceRequirements = z.infer<typeof ResourceRequirementsSchema>;

export const SafetyGateSchema = z.object({
  requiresHostReview: z.boolean(),
  suppressIfTags: z.array(ContraindicationTagSchema),
  cautionIfTags: z.array(ContraindicationTagSchema),
  notes: z.string()
});
export type SafetyGate = z.infer<typeof SafetyGateSchema>;

export const RitualGraphNodeSchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  category: RitualCategorySchema,
  durationMinutes: z.number(),
  basePrice: z.number(),
  currency: z.string().default("EUR"),
  emotionalPromise: z.string(),
  bodyFocus: z.array(BodyFocusSchema),
  idealFor: z.string(),
  contraindications: z.array(ContraindicationTagSchema),
  recoveryGoals: z.array(RecoveryGoalSchema),
  intensity: RitualIntensitySchema,
  sequenceRole: SequenceRoleSchema,
  visualMood: VisualMoodSchema,
  resourceRequirements: ResourceRequirementsSchema,
  safetyGate: SafetyGateSchema
});
export type RitualGraphNode = z.infer<typeof RitualGraphNodeSchema>;
