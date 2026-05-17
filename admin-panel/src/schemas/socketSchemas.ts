import { z } from 'zod';
import { SovereignEventName } from '../types/socketEvents';

export const SovereignSocketPayloadSchemas = {
  'admin:strategy_report_ready': z.unknown(),
  'admin:request_strategy_synthesis': z.undefined(),
  'admin:execute_strategy': z.object({
    reportId: z.string().min(1),
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
