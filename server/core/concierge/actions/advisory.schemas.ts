import { z } from 'zod';

export const AdvisoryActionSchema = z.object({
  id: z.string(),
  requestId: z.string().optional(),
  type: z.string(),
  severity: z.enum(['low', 'medium', 'high']),
  autoExecutable: z.boolean(),
  explanationCodes: z.array(z.string()),
  payload: z.record(z.string(), z.unknown()).optional(),
});
