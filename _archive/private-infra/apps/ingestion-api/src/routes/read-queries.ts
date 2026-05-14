import { Router, Request, Response } from "express";
import type { IntentSnapshotRepository } from "@santis/application/repositories/intent-snapshot-repository";

/**
 * Creates the read model (projection) HTTP endpoints for the Kuantum API.
 * The endpoints exposed here serve as the absolute canonical source of truth 
 * for UI clients and the God Mode to read state asynchronously updated by the command bus.
 */
export function createReadRoutes(
  intentSnapshotRepo: IntentSnapshotRepository
): import('express').Router {
  const router = Router();

  /**
   * GET /api/v1/read/intent/:sessionId
   * Exposes the canonical view of a guest's intent.
   */
  router.get("/intent/:sessionId", async (req: Request, res: Response) => {
    try {
      const sessionId = req.params.sessionId;

      if (!sessionId) {
        return res.status(400).json({
          code: "missing_parameter",
          message: "sessionId URL parametresi zorunludur.",
        });
      }

      const snapshot = await intentSnapshotRepo.findBySessionId(sessionId);

      if (!snapshot) {
        return res.status(404).json({
          code: "intent_not_found",
          message: "Bu session için henüz bir komut/intent materyalize edilmedi.",
        });
      }

      // Return the Canonical Read Model
      return res.status(200).json({
        ok: true,
        data: {
          tenantId: snapshot.tenantId,
          sessionId: snapshot.sessionId,
          moodAffinity: snapshot.moodAffinity,
          updatedAt: snapshot.updatedAt,
          // metadata/trace fields could be injected here if retrieved from projection log
        },
      });
      
    } catch (err) {
      return res.status(500).json({
        code: "internal_error",
        message: "Read Model (Projection) okuma hatası.",
      });
    }
  });

  return router;
}
