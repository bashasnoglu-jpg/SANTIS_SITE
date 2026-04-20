import { z } from 'zod';

export const ConciergeServiceCardSchema = z.object({
  id: z.string(),
  title: z.string(),
  category: z.enum(['massage', 'hamam', 'facial', 'ritual', 'body', 'other']),
  durationMin: z.number().int().positive(),
  price: z.number().nullable(),
  compareAtPrice: z.number().nullable(),
  availabilityScore: z.number().min(0).max(1),
  recommended: z.boolean(),
  badges: z.array(z.string()),
});

export const SlotSuggestionSchema = z.object({
  serviceId: z.string(),
  startIso: z.string(),
  therapistId: z.string().optional(),
  confidence: z.number().min(0).max(1),
  rankScore: z.number().min(0).max(1),
});

export const SnapshotWarningSchema = z.object({
  code: z.enum(['PRICING_UNAVAILABLE', 'AVAILABILITY_UNAVAILABLE', 'PARTIAL_DATA']),
  severity: z.enum(['info', 'warning', 'critical']),
  message: z.string(),
});
