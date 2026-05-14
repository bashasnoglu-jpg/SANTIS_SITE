import { z } from 'zod';

export const TelemetryEventSchema = z.enum([
  'BOOTLOADER_EVENT',
  'SNAPSHOT_VIEWED',
  'SERVICE_OPENED',
  'SLOT_SELECTED',
  'QUOTE_REQUESTED',
  'QUOTE_RECEIVED',
  'QUOTE_FAILED',
  'INTENT_STARTED',
  'BOOKING_INTENT_SUBMITTED',
  'INTENT_CONFIRMED',
  'INTENT_FAILED',
  'FLOW_ABANDONED',
  'HUMAN_CONCIERGE_REQUESTED',
]);

export const TelemetrySourceSchema = z.string();

export const TelemetryContextSchema = z.object({
  tenantId: z.string().min(1),
  sessionId: z.string().min(1),
  visitorId: z.string().min(1).optional(),
  requestId: z.string().min(1).optional(),
  quoteId: z.string().min(1).optional(),
  intentId: z.string().min(1).optional(),
  degraded: z.boolean().optional(),
  warningCodes: z.array(z.string()).optional(),
  source: TelemetrySourceSchema.optional(),
});

export const TelemetryPayloadSchema = z.object({
  event: TelemetryEventSchema,
  ts: z.string().min(1),
  context: TelemetryContextSchema,
  meta: z.record(z.string(), z.unknown()).optional(),
});

export type TelemetryPayloadInput = z.infer<typeof TelemetryPayloadSchema>;
