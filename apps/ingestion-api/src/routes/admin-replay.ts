import { Router } from 'express';
import type { Request, Response, Router as ExpressRouter } from 'express';
import { SovereignReplayEngine, fnSource } from '../services/replay-engine.js';
import {
  boardroomReducer,
  createInitialBoardroomState,
} from '../services/boardroom-replay-state.js';
import { resolveTenant } from '../middleware/tenant.js';

// ── Lazy source initialization ────────────────────────────────────────────────
// top-level await removed — replaced with lazy init to avoid ESM module
// ordering issues when imported by index.ts under tsx watch.

let replayEngine: SovereignReplayEngine | null = null;

async function getReplayEngine(): Promise<SovereignReplayEngine> {
  if (replayEngine) return replayEngine;

  let eventSource = fnSource(async () => []);

  if (process.env.DATABASE_URL) {
    try {
      const { db } = await import('../db.js');
      const { PostgresReplayEventSource } = await import('../services/postgres-replay-event-source.js');
      eventSource = new PostgresReplayEventSource(db);
      console.log('[AdminReplay] PostgresReplayEventSource wired — durable replay active.');
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`[AdminReplay] Postgres source failed (${msg}). Using empty stream stub.`);
    }
  } else {
    console.warn('[AdminReplay] DATABASE_URL not set — replay engine in stub mode.');
  }

  replayEngine = new SovereignReplayEngine(eventSource);
  return replayEngine;
}

const router: ExpressRouter = Router();


/**
 * GET /admin/replay/boardroom
 * Boardroom durumunu en baştan veya belirli bir seq'e kadar yeniden inşa eder.
 * Bu bir "Time Travel" operasyonudur.
 */
router.get('/boardroom', resolveTenant, async (req, res) => {
  try {
    const toSeq    = req.query.toSeq ? parseInt(req.query.toSeq as string) : undefined;
    const tenantId = req.tenantId;

    console.log(`⏳ [Admin: Replay] Tenant=${tenantId} | Seq=${toSeq ?? 'LATEST'}`);

    const engine = await getReplayEngine();
    const startTime = Date.now();
    const { state, lastSeq } = await engine.hydrateState(
      createInitialBoardroomState(),
      boardroomReducer,
      { toSeq, tenantId }
    );
    const duration = Date.now() - startTime;

    res.json({ success: true, duration: `${duration}ms`, lastSeq, state });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ success: false, error: message });
  }
});


/**
 * GET /admin/replay/evidence/:eventId
 * Belirli bir olayın neden oluştuğunu (causality) kanıt zinciriyle döner.
 */
router.get('/evidence/:eventId', async (_req, res) => {
  // Gelecek aşamada: causationId ve correlationId üzerinden kök neden analizi
  res.json({ message: 'Evidence chain reconstruction is coming in Phase 4.2' });
});

export const adminReplayRouter: ExpressRouter = router;
