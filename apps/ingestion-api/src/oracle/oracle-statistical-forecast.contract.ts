import { z } from "zod";

export const OracleStatisticalForecastSchema = z.object({
  baselineForecast: z.number(),
  sevenOutcomeAverage: z.number(),
  thirtyOutcomeAverage: z.number(),
  weightedTrend: z.number(),
  trend: z.enum(["up", "down", "flat", "insufficient_data"]),
  variance: z.number().min(0),
  confidence: z.number().min(0).max(1),
  heuristicComparison: z.enum(["aligned", "overconfidence_flag", "missed_opportunity", "insufficient_data"]),
  hybridConfidence: z.number().min(0).max(1),
  sampleSize: z.number().int().nonnegative(),
  generatedAt: z.string().datetime(),
});

export const OracleStatisticalForecastResponseSchema = z.object({
  success: z.boolean(),
  timestamp: z.string().datetime(),
  data: OracleStatisticalForecastSchema,
});

export type OracleStatisticalForecast = z.infer<typeof OracleStatisticalForecastSchema>;
