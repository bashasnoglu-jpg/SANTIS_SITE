import { z } from 'zod';

export const GovernanceActionExposureSchema = z.object({
  actionId: z.string(),
  requestId: z.string().optional(),
  quoteId: z.string().optional(),
  intentId: z.string().optional(),
  ts: z.string(),
  actionType: z.string(),
  autoExecutable: z.boolean(),
  operatorStatus: z
    .enum(['pending', 'approved', 'rejected', 'executed', 'overridden', 'expired'])
    .optional(),
  explanationCodes: z.array(z.string()),
});

export const GovernanceOutcomeSchema = z.object({
  outcomeId: z.string(),
  requestId: z.string().optional(),
  quoteId: z.string().optional(),
  intentId: z.string().optional(),
  ts: z.string(),
  event: z.enum([
    'QUOTE_CONVERTED',
    'INTENT_CONFIRMED',
    'FLOW_ABANDONED',
    'RECOVERY_ACCEPTED',
    'CONCIERGE_HANDOFF_ACCEPTED',
  ]),
  revenueAmount: z.number().optional(),
  currency: z.enum(['EUR']).optional(),
});
