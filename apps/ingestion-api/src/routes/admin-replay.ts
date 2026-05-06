import { Router } from 'express';
import type { Router as ExpressRouter } from 'express';
import { SovereignReplayEngine } from '../services/replay-engine';
import {
  boardroomReducer,
  createInitialBoardroomState,
} from '../services/boardroom-replay-state.js';

const router: ExpressRouter = Router();
const replayEngine = new SovereignReplayEngine();

/**
 * GET /admin/replay/boardroom
 * Boardroom durumunu en baştan veya belirli bir seq'e kadar yeniden inşa eder.
 * Bu bir "Time Travel" operasyonudur.
 */
router.get('/boardroom', async (req, res) => {
  try {
    const toSeq = req.query.toSeq ? parseInt(req.query.toSeq as string) : undefined;

    console.log(`⏳ [Admin: Replay] Boardroom durumu yeniden inşaa ediliyor... Hedef Seq: ${toSeq || 'LATEST'}`);

    const startTime = Date.now();
    const { state, lastSeq } = await replayEngine.hydrateState(
      createInitialBoardroomState(),
      boardroomReducer,
      { toSeq }
    );
    const duration = Date.now() - startTime;

    res.json({
      success: true,
      duration: `${duration}ms`,
      lastSeq,
      state
    });
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

export const adminReplayRoutes: ExpressRouter = router;
