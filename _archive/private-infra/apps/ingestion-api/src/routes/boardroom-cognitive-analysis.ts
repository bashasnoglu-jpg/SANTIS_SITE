/**
 * Phase 83 — Boardroom Oracle Feed
 * Route: GET /api/v1/boardroom/cognitive-analysis
 *
 * Query params:
 *   ?actionId=<string>   → belirli bir aksiyonun envelope'unu döner
 *   ?at=<ISO datetime>   → en yakın snapshot'tan envelope türetir (opsiyonel fallback)
 */

import { Router, Request, Response } from "express";
import { BoardroomReadModels } from "../projections/boardroom-projections.js";
import { deriveCognitiveEnvelope } from "../oracle/oracle-cognitive-decision.engine.js";
import { CognitiveDecisionEnvelopeSchema } from "../oracle/oracle-cognitive-decision.contract.js";

export const cognitiveBoardroomRouter: import("express").Router = Router();

/**
 * GET /api/v1/boardroom/cognitive-analysis
 *
 * Bir Boardroom kararının neden alındığını açıklayan CognitiveDecisionEnvelope döner.
 * Frontend deriveEnvelope() mock'unu bu endpoint ile besler.
 */
cognitiveBoardroomRouter.get("/cognitive-analysis", (req: Request, res: Response) => {
  const { actionId, at } = req.query;

  try {
    // ── 1. Audit kaydını bul ─────────────────────────────────────
    let auditEntry = BoardroomReadModels.auditLog[0]; // fallback: en son karar

    if (actionId) {
      const found = BoardroomReadModels.auditLog.find(
        (e: { id: string; actionId?: string }) =>
          e.id === actionId || e.actionId === actionId
      );
      if (!found) {
        return res.status(404).json({
          success: false,
          message: `No audit entry found for actionId: ${actionId}`,
        });
      }
      auditEntry = found;
    }

    if (!auditEntry) {
      return res.status(404).json({
        success: false,
        message: "No audit records available. System may not have processed any decisions yet.",
      });
    }

    // ── 2. Snapshot'ı bul ────────────────────────────────────────
    const snapshots = BoardroomReadModels.snapshots;
    let snapshot = snapshots[0]; // fallback: en son snapshot

    if (at) {
      const ts = new Date(at as string).getTime();
      const found = snapshots.find(
        (s: { timestamp: string }) => new Date(s.timestamp).getTime() <= ts
      );
      if (found) snapshot = found;
    } else if (auditEntry.actionId) {
      const found = snapshots.find(
        (s: { resolvedActionId: string }) => s.resolvedActionId === auditEntry.actionId
      );
      if (found) snapshot = found;
    }

    if (!snapshot) {
      return res.status(404).json({
        success: false,
        message: "No snapshot available for this decision point.",
      });
    }

    // ── 3. Önceki snapshot (delta hesabı için) ───────────────────
    const snapshotIndex = snapshots.indexOf(snapshot);
    const previousSnapshot = snapshotIndex > 0 ? snapshots[snapshotIndex - 1] : undefined;

    // ── 4. Envelope türet ────────────────────────────────────────
    const envelope = deriveCognitiveEnvelope(auditEntry, snapshot, previousSnapshot);

    // ── 5. Validate & respond ────────────────────────────────────
    const parsed = CognitiveDecisionEnvelopeSchema.safeParse(envelope);
    if (!parsed.success) {
      console.error("[COGNITIVE-ORACLE] Envelope validation failed:", parsed.error.flatten());
      return res.status(500).json({
        success: false,
        message: "Envelope validation failed — schema breach detected.",
        errors: parsed.error.flatten(),
      });
    }

    return res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      data: parsed.data,
    });

  } catch (err) {
    console.error("[COGNITIVE-ORACLE] Unexpected error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal oracle failure",
    });
  }
});
