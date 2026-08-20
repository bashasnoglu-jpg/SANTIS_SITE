import { z } from "zod";

export const SovereignSubjects = z.enum([
  "BOOKING",
  "REVENUE",
  "USER",
  "SESSION",
  "CONCIERGE",
]);

export const BookingIntentEvent = z.object({
  type: z.literal("BOOKING_INTENT_CAPTURED"),
  subject: z.literal("BOOKING"),
  payload: z.object({
    userId: z.string().uuid().optional(),
    sessionId: z.string().optional(),
    tenantId: z.string().min(1),
    intent: z.string(),
    timestamp: z.number(),
  }),
});

export const PriceAdjustedEvent = z.object({
  type: z.literal("PRICE_ADJUSTED"),
  subject: z.literal("REVENUE"),
  payload: z.object({
    ritualId: z.string(),
    tenantId: z.string().min(1),
    basePrice: z.number(),
    finalPrice: z.number(),
    multiplier: z.number().optional(),
    reason: z.string(),
  }),
});

export const SovereignEvent = z.discriminatedUnion("type", [
  BookingIntentEvent,
  PriceAdjustedEvent,
]);

export type SovereignEventType = z.infer<typeof SovereignEvent>;

// DB'den dönen Mühürlü Kayıt Formatı
export const SovereignEventRecordSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string(),
  type: z.string(),
  subject: z.string(),
  payload: z.record(z.any()),
  createdAt: z.union([z.string(), z.date()]).transform((val: string | Date) => new Date(val)),
});

export type SovereignEventRecord = z.infer<typeof SovereignEventRecordSchema>;

// WebSocket Zarf Formatı (Envelope)
export const RealtimeEnvelopeSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("EVENT_REPLAY"),
    payload: z.array(SovereignEventRecordSchema)
  }),
  z.object({
    type: z.literal("EVENT_STREAM"),
    payload: SovereignEventRecordSchema
  }),
  z.object({
    type: z.literal("EVENT_HEALTH"),
    payload: z.object({
      status: z.string(),
      timestamp: z.number()
    })
  })
]);

export type RealtimeEnvelope = z.infer<typeof RealtimeEnvelopeSchema>;
