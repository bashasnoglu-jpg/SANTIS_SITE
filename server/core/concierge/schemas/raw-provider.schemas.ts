import { z } from 'zod';

export const RawServiceSchema = z.object({
  id: z.string(),
  name: z.string(),
  duration: z.union([z.string(), z.number()]),
  category: z.string().optional(),
  active: z.union([z.boolean(), z.string(), z.number()]).optional(),
  commercialPriority: z.union([z.number(), z.string()]).optional(),
});

export const RawPriceSchema = z.object({
  serviceId: z.string(),
  amount: z.union([z.number(), z.string()]),
  currency: z.string().default('EUR'),
  compareAtAmount: z.union([z.number(), z.string()]).optional(),
  available: z.union([z.boolean(), z.string(), z.number()]).optional(),
});

export const RawAvailabilitySlotSchema = z.object({
  serviceId: z.string(),
  slot_start: z.string(),
  therapist_id: z.string().optional(),
  confidence: z.union([z.number(), z.string()]).optional(),
  therapistSuitability: z.union([z.number(), z.string()]).optional(),
  commercialPriority: z.union([z.number(), z.string()]).optional(),
});

export type RawService = z.infer<typeof RawServiceSchema>;
export type RawPrice = z.infer<typeof RawPriceSchema>;
export type RawAvailabilitySlot = z.infer<typeof RawAvailabilitySlotSchema>;
