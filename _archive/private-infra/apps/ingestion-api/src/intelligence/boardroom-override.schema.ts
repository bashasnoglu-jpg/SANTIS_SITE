import { z } from "zod";

export const BoardroomOverrideCommandSchema = z.object({
  recommendationId: z.string().min(1),
  sessionId: z.string().min(1),
  operatorId: z.string().min(1),
  action: z.enum([
    "force_reduce_ui",
    "handoff_to_human",
    "lock_recommendation",
    "suppress_upsell",
    "freeze_session",
    "suggest_price_increase"
  ]),
  reason: z.enum([
    "high_hesitation",
    "demand_spike",
    "vip_exception",
    "pricing_risk",
    "clinical_safety",
    "system_conflict"
  ]),
  createdAt: z.string().datetime()
});

export type BoardroomOverrideCommand = z.infer<
  typeof BoardroomOverrideCommandSchema
>;
