import { z } from "zod";

// --- ENUMS ---
export const RoomTypeEnum = z.enum([
  "massage",
  "hammam",
  "facial",
  "couple",
  "vip_suite",
  "wet_room",
  "medical",
]);

export const BookingSourceEnum = z.enum([
  "manual",
  "online",
  "hotel_front_desk",
  "concierge",
  "phone",
  "walk_in",
]);

export const BookingStatusEnum = z.enum([
  "draft",
  "confirmed",
  "checked_in",
  "in_progress",
  "completed",
  "cancelled",
  "no_show",
]);

// --- BASE ---
const TenantBase = z.object({
  tenant_id: z.string().uuid(),
});

// --- ENTITIES ---
export const LocationSchema = TenantBase.extend({
  id: z.string().uuid(),
  name: z.string(),
  timezone: z.string(),
});

export const SpaAreaSchema = TenantBase.extend({
  id: z.string().uuid(),
  location_id: z.string().uuid(),
  name: z.string(),
  default_slot_interval_minutes: z.number().int().default(15),
});

export const TreatmentRoomSchema = TenantBase.extend({
  id: z.string().uuid(),
  spa_area_id: z.string().uuid(),
  name: z.string(),
  room_type: RoomTypeEnum,
  capacity: z.number().int().min(1),
  is_active: z.boolean().default(true),
});

export const TherapistSchema = TenantBase.extend({
  id: z.string().uuid(),
  location_id: z.string().uuid(),
  name: z.string(),
  is_active: z.boolean().default(true),
});

export const ServiceSchema = TenantBase.extend({
  id: z.string().uuid(),
  name: z.string(),
  duration_minutes: z.number().int().positive(),
  cleanup_minutes: z.number().int().nonnegative().default(15),
  is_active: z.boolean().default(true),
});

// --- COMPATIBILITIES ---
export const ServiceRoomCompatibilitySchema = TenantBase.extend({
  service_id: z.string().uuid(),
  room_id: z.string().uuid(),
});

export const ServiceTherapistCompatibilitySchema = TenantBase.extend({
  service_id: z.string().uuid(),
  therapist_id: z.string().uuid(),
});

// --- SCHEDULES & BLOCKERS ---
export const OperatingHoursSchema = TenantBase.extend({
  id: z.string().uuid(),
  location_id: z.string().uuid(),
  day_of_week: z.number().int().min(0).max(6), // 0 = Sunday
  open_time: z.string(), // "HH:mm"
  close_time: z.string(), // "HH:mm"
});

export const TherapistShiftSchema = TenantBase.extend({
  id: z.string().uuid(),
  therapist_id: z.string().uuid(),
  location_id: z.string().uuid(),
  starts_at: z.string().datetime(), // ISO 8601
  ends_at: z.string().datetime(),
  recurrence_rule: z.string().nullable(), // Optional RRULE
});

export const BlockerSchema = TenantBase.extend({
  id: z.string().uuid(),
  room_id: z.string().uuid().nullable(),
  therapist_id: z.string().uuid().nullable(),
  starts_at: z.string().datetime(),
  ends_at: z.string().datetime(),
  reason: z.string(),
});

// --- BOOKING ---
export const BookingSchema = TenantBase.extend({
  id: z.string().uuid(),
  service_id: z.string().uuid(),
  room_id: z.string().uuid(),
  therapist_id: z.string().uuid(),
  service_start_time: z.string().datetime(),
  service_end_time: z.string().datetime(),
  cleanup_end_time: z.string().datetime(),
  booking_source: BookingSourceEnum,
  booking_status: BookingStatusEnum,
  customer_info: z.record(z.any()), // e.g., name, phone
  notes: z.string().nullable(),
});

// --- TYPES ---
export type Location = z.infer<typeof LocationSchema>;
export type SpaArea = z.infer<typeof SpaAreaSchema>;
export type TreatmentRoom = z.infer<typeof TreatmentRoomSchema>;
export type Therapist = z.infer<typeof TherapistSchema>;
export type Service = z.infer<typeof ServiceSchema>;
export type TherapistShift = z.infer<typeof TherapistShiftSchema>;
export type Booking = z.infer<typeof BookingSchema>;
