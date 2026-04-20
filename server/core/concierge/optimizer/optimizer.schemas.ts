import { z } from 'zod';

export const ThresholdObservationSchema = z.object({
  thresholdKey: z.string(),
  currentValue: z.number(),
  sampleSize: z.number().int().nonnegative(),
  attributedRevenue: z.number(),
  confirmedIntentRate: z.number(),
  abandonmentRate: z.number(),
  assistAcceptanceRate: z.number().optional(),
});

export const ThresholdRecommendationSchema = z.object({
  thresholdKey: z.string(),
  currentValue: z.number(),
  recommendedValue: z.number(),
  direction: z.enum(['increase', 'decrease', 'hold']),
  confidence: z.number().min(0).max(1),
  reasonCodes: z.array(z.string()),
  impactSummary: z.object({
    revenueDelta: z.number().optional(),
    abandonmentDelta: z.number().optional(),
    confirmedIntentDelta: z.number().optional(),
    assistAcceptanceDelta: z.number().optional(),
  }),
});
