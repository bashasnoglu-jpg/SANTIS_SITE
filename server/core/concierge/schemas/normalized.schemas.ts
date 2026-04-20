import { z } from 'zod';

export const NormalizedServiceSchema = z.object({
  id: z.string(),
  title: z.string(),
  durationMin: z.number().int().positive(),
  category: z.enum(['massage', 'hamam', 'facial', 'ritual', 'body', 'other']),
  isActive: z.boolean(),
  commercialPriority: z.number().min(0).max(100),
});

export const NormalizedPriceSchema = z.object({
  serviceId: z.string(),
  amount: z.number().nonnegative(),
  currency: z.enum(['EUR']),
  compareAtAmount: z.number().nonnegative().nullable(),
  isAvailable: z.boolean(),
});

export const NormalizedAvailabilitySlotSchema = z.object({
  serviceId: z.string(),
  startIso: z.string(),
  therapistId: z.string().optional(),
  confidence: z.number().min(0).max(1),
  therapistSuitability: z.number().min(0).max(1),
  commercialPriority: z.number().min(0).max(1),
});

export type NormalizedService = z.infer<typeof NormalizedServiceSchema>;
export type NormalizedPrice = z.infer<typeof NormalizedPriceSchema>;
export type NormalizedAvailabilitySlot = z.infer<typeof NormalizedAvailabilitySlotSchema>;
