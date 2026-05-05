import { Router, Request, Response } from "express";
import { BoardroomReadModels } from "../projections/boardroom-projections.js";
import { SovereignBus } from "@santis/sovereign-bus";

export const boardroomRouter: import('express').Router = Router();

// --- CONFIG & FLAGS (Phase 78) ---
const ENABLE_ACTION_RAIL_SIMULATION = process.env.ENABLE_ACTION_RAIL_SIMULATION === 'true' || true;
const ENABLE_ACTION_RAIL_APPROVAL = process.env.ENABLE_ACTION_RAIL_APPROVAL === 'true' || false;

// --- READ ROUTES ---
boardroomRouter.get("/revenue", (req: Request, res: Response) => {
  return res.status(200).json({
    success: true,
    timestamp: new Date().toISOString(),
    data: BoardroomReadModels.revenueMetrics
  });
});

boardroomRouter.get("/mood-heatmap", (req: Request, res: Response) => {
  return res.status(200).json({
    success: true,
    timestamp: new Date().toISOString(),
    data: BoardroomReadModels.moodHeatmap
  });
});

boardroomRouter.get("/snapshot", (req: Request, res: Response) => {
  return res.status(200).json({
    success: true,
    timestamp: new Date().toISOString(),
    data: BoardroomReadModels
  });
});

// --- COMMAND RAIL (Phase 78) ---

/**
 * Aksiyon Onaylama (Approve)
 * POST /api/v1/boardroom/actions/:id/approve
 */
boardroomRouter.post("/actions/:id/approve", async (req: Request, res: Response) => {
  const { id } = req.params;
  const traceId = (req.headers["x-trace-id"] as string) || `cmd-${Date.now()}`;

  console.log(`[BOARDROOM] Action Approval Request: ${id} (Simulation: ${ENABLE_ACTION_RAIL_SIMULATION})`);

  try {
    // 1. Simülasyon Kontrolü
    if (ENABLE_ACTION_RAIL_SIMULATION) {
      // Sovereign Bus üzerinden simülasyon onay event'i yayınla
      const bus = new SovereignBus(); 
      await bus.publish({
        type: "action.approval.simulated",
        eventType: "action.approval.simulated",
        occurredAt: new Date().toISOString(),
        traceId,
        payload: { 
          actionId: id,
          status: "simulated_approved",
          note: "Action approved in simulation mode. No live pricing changes applied."
        }
      });

      return res.status(200).json({
        success: true,
        message: "Action approved (SIMULATION MODE)",
        actionId: id,
        traceId
      });
    }

    // 2. Gerçek Onay Kontrolü (Gelecek faz)
    if (ENABLE_ACTION_RAIL_APPROVAL) {
        // Buraya gerçek state mutasyonları gelecek
        return res.status(200).json({ success: true, message: "Action approved (LIVE MODE)" });
    }

    return res.status(403).json({ success: false, message: "Action approval is currently disabled in this environment." });

  } catch (err) {
    console.error(`[BOARDROOM] Approval Error for ${id}:`, err);
    return res.status(500).json({ success: false, error: "Internal command failure" });
  }
});

/**
 * Aksiyon Reddetme (Reject)
 * POST /api/v1/boardroom/actions/:id/reject
 */
boardroomRouter.post("/actions/:id/reject", async (req: Request, res: Response) => {
  const { id } = req.params;
  const traceId = (req.headers["x-trace-id"] as string) || `cmd-rej-${Date.now()}`;

  try {
    const bus = new SovereignBus();
    await bus.publish({
      type: "pricing.recommendation.rejected",
      eventType: "pricing.recommendation.rejected",
      occurredAt: new Date().toISOString(),
      traceId,
      payload: { 
        actionId: id,
        status: "rejected"
      }
    });

    return res.status(200).json({
      success: true,
      message: "Action rejected and removed from rail",
      actionId: id,
      traceId
    });
  } catch (err) {
    console.error(`[BOARDROOM] Rejection Error for ${id}:`, err);
    return res.status(500).json({ success: false, error: "Internal rejection failure" });
  }
});

// --- AUDIT & TIME TRAVEL (Phase 79) ---

/**
 * Karar Tarihçesi (Audit Log)
 * GET /api/v1/boardroom/audit-log
 */
boardroomRouter.get("/audit-log", (req: Request, res: Response) => {
  return res.status(200).json({
    success: true,
    timestamp: new Date().toISOString(),
    count: BoardroomReadModels.auditLog.length,
    data: BoardroomReadModels.auditLog
  });
});

/**
 * Sistem Snapshot'ları
 * GET /api/v1/boardroom/snapshots
 */
boardroomRouter.get("/snapshots", (req: Request, res: Response) => {
  return res.status(200).json({
    success: true,
    timestamp: new Date().toISOString(),
    data: BoardroomReadModels.snapshots
  });
});

/**
 * Zaman Yolculuğu (Reconstruct State)
 * GET /api/v1/boardroom/reconstruct
 */
boardroomRouter.get("/reconstruct", (req: Request, res: Response) => {
    const { at } = req.query;
    
    if (!at) {
        return res.status(400).json({ success: false, message: "Missing 'at' timestamp query parameter." });
    }

    const timestamp = new Date(at as string).getTime();
    
    // Basit bir arama: İstenen zamana en yakın snapshot'ı bul
    const closestSnapshot = BoardroomReadModels.snapshots
        .find(s => new Date(s.timestamp).getTime() <= timestamp);

    if (!closestSnapshot) {
        return res.status(404).json({ success: false, message: "No snapshot found for the given timestamp." });
    }

    return res.status(200).json({
        success: true,
        reconstructedAt: closestSnapshot.timestamp,
        requestedAt: at,
        state: closestSnapshot
    });
});


