import { z } from 'zod';

export const OperatorActionStatusSchema = z.enum([
  'pending',
  'approved',
  'rejected',
  'executed',
  'overridden',
  'expired',
]);

export const OperatorDecisionTypeSchema = z.enum([
  'APPROVE',
  'REJECT',
  'OVERRIDE',
  'DISMISS',
]);

export const ConsoleActionItemSchema = z.object({
  id: z.string(),
  requestId: z.string().optional(),
  quoteId: z.string().optional(),
  intentId: z.string().optional(),
  type: z.string(),
  severity: z.enum(['low', 'medium', 'high']),
  autoExecutable: z.boolean(),
  explanationCodes: z.array(z.string()),
  payload: z.record(z.string(), z.unknown()).optional(),
  status: OperatorActionStatusSchema,
  createdAt: z.string(),
});

export const OperatorDecisionSchema = z.object({
  actionId: z.string(),
  operatorId: z.string(),
  decision: OperatorDecisionTypeSchema,
  reason: z.string().optional(),
  ts: z.string(),
});
