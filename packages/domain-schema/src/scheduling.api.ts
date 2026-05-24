import { z } from "zod";
import { 
  BookingSchema,
  LocationSchema,
  SpaAreaSchema,
  TreatmentRoomSchema,
  TherapistSchema,
  ServiceSchema
} from "./scheduling.contract.js";

// --- RESOURCE LIST ---
export const SchedulingResourcesRequestSchema = z.object({
  tenant_id: z.string().uuid(), // Required: Tenant isolation boundary
});

export const SchedulingResourcesResponseSchema = z.object({
  locations: z.array(LocationSchema),
  spa_areas: z.array(SpaAreaSchema),
  rooms: z.array(TreatmentRoomSchema),
  therapists: z.array(TherapistSchema),
  services: z.array(ServiceSchema),
});

// --- AVAILABILITY QUERY ---
export const AvailabilityRequestSchema = z.object({
  tenant_id: z.string().uuid(),
  spa_area_id: z.string().uuid(),
  service_id: z.string().uuid(),
  date: z.string().date(), // YYYY-MM-DD
});

export const AvailabilitySlotSchema = z.object({
  slot_start: z.string().datetime(),
  slot_end: z.string().datetime(),
  service_end_time: z.string().datetime(),
  cleanup_end_time: z.string().datetime(),
  room_id: z.string().uuid(),
  therapist_id: z.string().uuid(),
  reason: z.string().nullable().optional(),
  confidence: z.number().min(0).max(100).default(100),
  is_advisory: z.literal(true).describe("Availability is advisory. Final transactional check required on POST."),
});

export const AvailabilityResponseSchema = z.object({
  slots: z.array(AvailabilitySlotSchema),
});

// --- BOOKING CREATION ---
// CreateBooking Request uses the BookingSchema but omits auto-generated fields like ID
export const CreateBookingRequestSchema = BookingSchema.omit({
  id: true,
}).extend({
  tenant_id: z.string().uuid(), // Re-enforced here
});

export const CreateBookingResponseSchema = z.object({
  success: z.boolean(),
  booking: BookingSchema.optional(),
  error: z.string().optional(),
});

// --- BOOKING LIST ---
export const BookingListRequestSchema = z.object({
  tenant_id: z.string().uuid(),
  spa_area_id: z.string().uuid(),
  date: z.string().date(),
});

export const BookingListResponseSchema = z.object({
  bookings: z.array(BookingSchema),
});

// --- TYPES ---
export type SchedulingResourcesRequest = z.infer<typeof SchedulingResourcesRequestSchema>;
export type SchedulingResourcesResponse = z.infer<typeof SchedulingResourcesResponseSchema>;
export type AvailabilityRequest = z.infer<typeof AvailabilityRequestSchema>;
export type AvailabilitySlot = z.infer<typeof AvailabilitySlotSchema>;
export type AvailabilityResponse = z.infer<typeof AvailabilityResponseSchema>;
export type CreateBookingRequest = z.infer<typeof CreateBookingRequestSchema>;
export type CreateBookingResponse = z.infer<typeof CreateBookingResponseSchema>;
export type BookingListRequest = z.infer<typeof BookingListRequestSchema>;
export type BookingListResponse = z.infer<typeof BookingListResponseSchema>;
