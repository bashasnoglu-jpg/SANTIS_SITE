import { z } from 'zod';
import { SovereignEventName } from '../types/socketEvents';

const BoardroomRecommendationSchema = z.object({
  id: z.string().min(1),
  reason: z.string().min(1),
  action: z.string().min(1),
  severity: z.enum(['info', 'warning', 'critical']),
});

const BoardroomStateSchema = z.object({
  revenueToday: z.number(),
  demandLevel: z.enum(['low', 'normal', 'high']),
  vipSessions: z.number(),
  hesitationAlerts: z.number(),
  recommendedActions: z.array(BoardroomRecommendationSchema),
});

export const SovereignSocketPayloadSchemas = {
  'admin:strategy_report_ready': z.unknown(),
  'admin:request_strategy_synthesis': z.undefined(),
  'admin:execute_strategy': z.object({
    reportId: z.string().min(1),
  }),
  'boardroom:snapshot': BoardroomStateSchema,
  'boardroom:revenue_update': z.object({
    revenueToday: z.number(),
    delta: z.number().optional(),
    timestamp: z.string().optional(),
  }),
  'boardroom:demand_update': z.object({
    demandLevel: z.enum(['low', 'normal', 'high']),
    timestamp: z.string().optional(),
  }),
  'boardroom:recommendation_added': BoardroomRecommendationSchema,
  'boardroom:alert': z.object({
    id: z.string().min(1),
    message: z.string().min(1),
    severity: z.enum(['info', 'warning', 'critical']),
    timestamp: z.string().optional(),
  }),
} satisfies Record<SovereignEventName, z.ZodTypeAny>;

export function parseSovereignSocketPayload(
  eventName: string,
  payload: unknown,
) {
  if (!isSovereignEventName(eventName)) {
    return {
      success: false as const,
      error: `Unknown Sovereign socket event: ${eventName}`,
    };
  }

  const result = SovereignSocketPayloadSchemas[eventName].safeParse(payload);

  if (!result.success) {
    return {
      success: false as const,
      error: result.error,
    };
  }

  return {
    success: true as const,
    eventName,
    payload: result.data,
  };
}

export function isSovereignEventName(eventName: string): eventName is SovereignEventName {
  return Object.prototype.hasOwnProperty.call(SovereignSocketPayloadSchemas, eventName);
}
