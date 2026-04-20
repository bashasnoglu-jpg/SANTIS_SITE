import type { Request, Response } from 'express';
import { z } from 'zod';
import { buildConciergeSnapshot } from '../../core/concierge/resolvers/build-concierge-snapshot';

const SnapshotQuerySchema = z.object({
  tenantId: z.string().min(1),
  locale: z.string().default('tr'),
  currency: z.enum(['EUR']).default('EUR'),
  date: z.string().optional(),
  partySize: z.coerce.number().int().positive().default(1),
  memberTier: z.enum(['none', 'silver', 'gold', 'black']).optional(),
  source: z.enum(['direct', 'hotel', 'concierge', 'campaign']).optional(),
});

export async function getConciergeSnapshot(req: Request, res: Response) {
  try {
    const input = SnapshotQuerySchema.parse(req.query);

    const snapshot = await buildConciergeSnapshot(input);

    return res.status(200).json(snapshot);
  } catch (error) {
    console.error('[concierge.snapshot] failed', error);
    return res.status(400).json({
      error: 'BAD_CONCIERGE_SNAPSHOT_REQUEST',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
