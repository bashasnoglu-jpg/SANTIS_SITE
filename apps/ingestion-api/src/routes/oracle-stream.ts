/**
 * Phase 84 — Live Oracle Stream
 *
 * Route: GET /api/v1/streams/oracle
 *
 * Boardroom operatörlerine SSE üzerinden gerçek zamanlı oracle_delta event'leri
 * iletir. Bağlanan istemciler SseManager'ın global feed'ine dahil edilir;
 * oracle_delta dışındaki event'ler (strategy_update vb.) de bu bağlantı
 * üzerinden iletilebilir.
 */

import { Router, Request, Response } from "express";
import { sseManager } from "../services/sse-manager.js";

export const oracleStreamRouter: import("express").Router = Router();

/**
 * GET /api/v1/streams/oracle
 *
 * SSE bağlantısı kurar ve oracle_delta event'lerini dinler.
 * Frontend `useLiveOracle()` hook bu endpoint'e bağlanır.
 */
oracleStreamRouter.get("/oracle", (req: Request, res: Response) => {
  console.log("📡 [Oracle Stream] Yeni operatör bağlandı.");

  // SseManager'ın addClient() tüm SSE header'larını yönetiyor
  sseManager.addClient(req, res);

  // İlk bağlantıda anlık durum bilgisi
  res.write(
    `event: oracle_ready\ndata: ${JSON.stringify({
      status: "ORACLE_ONLINE",
      timestamp: new Date().toISOString(),
      message: "Boardroom Oracle Feed active. Awaiting governor decisions.",
    })}\n\n`
  );
});
