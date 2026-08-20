import { z } from "zod";

// --- CANONICAL BOOKING STATES ---
export const BookingStateEnum = z.enum([
  "selected_service",
  "date_selected",
  "therapist_selected",
  "guest_details_entered",
  "hold_requested",
  "hold_created",
  "hold_failed",
  "fallback_saved",
  "booking_confirmed"
]);

export type BookingState = z.infer<typeof BookingStateEnum>;

// --- CANONICAL TELEMETRY EVENTS ---
export const TelemetryEventEnum = z.enum([
  "BOOKING_VIEWED",
  "SERVICE_SELECTED",
  "HOLD_REQUESTED",
  "HOLD_CREATED",
  "HOLD_FAILED",
  "FALLBACK_SAVED",
  "BOOKING_ABANDONED",
  "ADMIN_TELEMETRY_VIEWED"
]);

export type TelemetryEvent = z.infer<typeof TelemetryEventEnum>;

// --- SAFE PAYLOAD POLICY ---
// PII is explicitly forbidden from raw payloads in telemetry.
// tenantId and serviceId must be explicit fields.
export const SafeBookingTelemetryPayloadSchema = z.object({
  tenantId: z.string().uuid(),
  serviceId: z.string().uuid().optional(),
  roomId: z.string().uuid().optional(),
  therapistId: z.string().uuid().optional(),
  
  // Explicitly allowing only hashed or redacted guest identifiers
  guestIdHash: z.string().optional(),
  
  // Safe metadata that should be shallow and JSON-safe
  meta: z.record(z.union([z.string(), z.number(), z.boolean(), z.null()])).optional(),

  // Enforcing strict failure if unknown PII fields like 'email' or 'phone' are provided
}).strict().refine((data) => {
  // Extra runtime check to ensure meta doesn't accidentally contain PII keys
  if (data.meta) {
    const forbiddenKeys = ['email', 'phone', 'fullname', 'name', 'tc', 'passport', 'creditcard'];
    const keys = Object.keys(data.meta).map(k => k.toLowerCase());
    for (const fk of forbiddenKeys) {
      if (keys.some(k => k.includes(fk))) {
        return false;
      }
    }
  }
  return true;
}, {
  message: "Payload meta object contains forbidden PII keys."
});

export type SafeBookingTelemetryPayload = z.infer<typeof SafeBookingTelemetryPayloadSchema>;

export const TelemetryBeaconSchema = z.object({
  event_type: TelemetryEventEnum,
  session_id: z.string(),
  client_time: z.string().datetime(),
  current_state: BookingStateEnum.optional(),
  metadata: SafeBookingTelemetryPayloadSchema.optional(),
}).strict();

export type TelemetryBeacon = z.infer<typeof TelemetryBeaconSchema>;
