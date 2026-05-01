import { z } from "zod";

export const SCPBreakdownSchema = z.object({
  grossRevenue: z.number(),
  serviceCost: z.number(),
  therapistCost: z.number(),
  facilityCost: z.number(),
  overhead: z.number(),

  netContribution: z.number(),
  margin: z.number(), // 0-1
  score: z.number(),  // 0-100

  currency: z.string()
});

export type SCPBreakdown = z.infer<typeof SCPBreakdownSchema>;

export const BoardroomScpPatchSchema = z.object({
  type: z.literal("SANTIS_CORE_STATE_PATCH"),
  payload: z.object({
    boardroom: z.object({
      metrics: z.object({
        totalRevenue: z.number(),
        scp: SCPBreakdownSchema
      }),
      pricingFeedback: z.object({
        mode: z.literal("advisory"),
        signal: z.enum([
          "premium_bias_up",
          "discount_risk",
          "balanced",
          "high_margin_focus"
        ]),
        confidence: z.number()
      })
    })
  })
});
