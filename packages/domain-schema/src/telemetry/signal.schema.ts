import { z } from 'zod';

export const SignalTypeSchema = z.enum([
  'stress_index', 
  'hesitation_index', 
  'abandon_risk', 
  'therapist_stress'
]);

export const telemetryContextSchema = z.object({
  page: z.string().optional(),
  component: z.string().optional(),
  sessionId: z.string().optional(),
  pathname: z.string().optional(),
  frictionSource: z.string().optional()
});

export const insertSignalSchema = z.object({
  userId: z.string().max(255),
  signalType: SignalTypeSchema,
  value: z.number().int(),
  context: telemetryContextSchema.optional().nullable(),
});

export const selectSignalSchema = insertSignalSchema.extend({
  id: z.string().uuid(),
  createdAt: z.date().optional().nullable(),
});

export type TelemetrySignal = z.infer<typeof selectSignalSchema>;

