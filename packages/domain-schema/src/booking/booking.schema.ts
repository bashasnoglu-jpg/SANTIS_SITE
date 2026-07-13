import { z } from "zod";

export const BookingStatusSchema = z.enum([
  "DRAFT",
  "PENDING",
  "CONFIRMED",
  "CHECKED_IN",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
  "NO_SHOW",
]);
export type BookingStatus = z.infer<typeof BookingStatusSchema>;

export const ServiceCategorySchema = z.enum([
  "CLASSIC",
  "RITUAL",
  "MEDICAL",
  "HAMAM",
  "SKINCARE",
  "PREMIUM_SIGNATURE",
]);
export type ServiceCategory = z.infer<typeof ServiceCategorySchema>;

export const GuestPrioritySchema = z.enum(["NONE", "VIP", "SIGNATURE"]);
export type GuestPriority = z.infer<typeof GuestPrioritySchema>;

export const BookingTimeFieldsSchema = z
  .object({
    Scheduled_Start: z.string().datetime({ offset: true }),
    Scheduled_End: z.string().datetime({ offset: true }),
    Planned_Duration_Minutes: z.number().int().positive(),
    Actual_Start: z.string().datetime({ offset: true }).nullable(),
    Actual_End: z.string().datetime({ offset: true }).nullable(),
    Pause_Minutes: z.number().int().min(0).default(0),
    Extension_Minutes: z.number().int().min(0).default(0),
  })
  .strict();
export type BookingTimeFields = z.infer<typeof BookingTimeFieldsSchema>;

export const CanonicalBookingSchema = z
  .object({
    Booking_ID: z.string().min(1),
    Tenant_Link: z.string().min(1),
    Location_Link: z.string().min(1),
    Environment: z.string().min(1),
    Client_Link: z.string().min(1).nullable(),
    Service_Link: z.string().min(1),
    Therapist_Link: z.string().min(1).nullable(),
    Room_Link: z.string().min(1).nullable(),
    Status: BookingStatusSchema,
    Service_Category: ServiceCategorySchema,
    Guest_Tier: GuestPrioritySchema,
    VIP: z.boolean().default(false),
    Manual_Lock: z.boolean().default(false),
    Payment_Status: z.string().min(1),
    Payment_Authorization_Status: z.string().min(1),
  })
  .merge(BookingTimeFieldsSchema)
  .strict();
export type CanonicalBooking = z.infer<typeof CanonicalBookingSchema>;
