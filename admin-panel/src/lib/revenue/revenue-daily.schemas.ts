import { z } from 'zod';

export const RevenueDailyResponseSchema = z.object({
  ok: z.literal(true),
  summary: z.object({
    totalRevenue: z.number(),
    totalBookings: z.number(),
    avgBasket: z.number(),
    currency: z.enum(['EUR']),
  }),
  daily: z.array(
    z.object({
      date: z.string(),
      revenue: z.number(),
      bookings: z.number(),
    })
  ),
  topTherapists: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      revenue: z.number(),
      bookings: z.number(),
    })
  ),
  topServices: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      revenue: z.number(),
      bookings: z.number(),
    })
  ),
});

export type RevenueDailyData = z.infer<typeof RevenueDailyResponseSchema>;
