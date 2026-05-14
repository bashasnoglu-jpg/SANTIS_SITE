import { z } from 'zod';

export const ExperimentVariantSchema = z.enum([
  'control',
  'variant_a',
  'variant_b'
]);

export const ExperimentDefinitionSchema = z.object({
  id: z.string(),
  key: z.string(),
  status: z.enum(['draft', 'running', 'paused', 'completed']),

  trafficAllocation: z.object({
    control: z.number(),
    variant_a: z.number(),
    variant_b: z.number().optional()
  }),

  targetMetric: z.enum([
    'revenue',
    'intent_rate',
    'abandonment_rate'
  ])
});
