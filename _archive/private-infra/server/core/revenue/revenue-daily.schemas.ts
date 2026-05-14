import { z } from 'zod';

export const DailyRevenuePointSchema = z.object({
  date: z.string(),
  revenue: z.number(),
  bookings: z.number().int().nonnegative(),
});

export const TopTherapistSchema = z.object({
  id: z.string(),
  name: z.string(),
  revenue: z.number(),
  bookings: z.number().int().nonnegative(),
});

export const TopServiceSchema = z.object({
  id: z.string(),
  title: z.string(),
  revenue: z.number(),
  bookings: z.number().int().nonnegative(),
});

export const RevenueDailyResponseSchema = z.object({
  ok: z.literal(true),
  summary: z.object({
    totalRevenue: z.number(),
    totalBookings: z.number().int().nonnegative(),
    avgBasket: z.number(),
    currency: z.enum(['EUR']),
  }),
  daily: z.array(DailyRevenuePointSchema),
  topTherapists: z.array(TopTherapistSchema),
  topServices: z.array(TopServiceSchema),
});

export type RevenueDailyResponseInput = z.infer<typeof RevenueDailyResponseSchema>;
