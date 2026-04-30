import { Router, Request, Response } from "express";
import { intentSseRegistry } from "../services/sse-registry.js";
import type { IntentSnapshotRepository } from "@santis/application/repositories/intent-snapshot-repository";

export function createSseRoutes(
  intentSnapshotRepo: IntentSnapshotRepository
): import('express').Router {
  const router = Router();

  /**
   * GET /api/v1/streams/intent/:sessionId
   * Establishes a Server-Sent Events (SSE) stream for God Mode 
   * to watch real-time canonical projection updates for a specific session.
   */
  router.get("/intent/:sessionId", async (req: Request, res: Response) => {
    const sessionId = req.params.sessionId;

    if (!sessionId) {
      return res.status(400).json({ error: "sessionId is required" });
    }

    // SSE zorunlu HTTP Anayasa Kuralları (Headers)
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    // Flush headers to establish the SSE connection immediately
    res.flushHeaders();

    // Registry'e bu connection'ı kaydet (Subscriber)
    intentSseRegistry.addClient(sessionId, res);

    // Initial payload (İlk bağlantı anındaki Snapshot'ı yakala ve yolla)
    try {
      const currentSnapshot = await intentSnapshotRepo.findBySessionId(sessionId);
      if (currentSnapshot) {
         // İlk snapshot'ı traceId olmadan ana data formatıyla yolla
         res.write(`data: ${JSON.stringify({
            type: "intent.snapshot.initial",
            sessionId,
            data: {
              moodAffinity: currentSnapshot.moodAffinity,
              updatedAt: currentSnapshot.updatedAt
            }
         })}\n\n`);
      } else {
        // Eğer boşsa sessizce bekle veya boş snapshot sinyali ver
        res.write(`data: ${JSON.stringify({
           type: "intent.snapshot.empty",
           sessionId
        })}\n\n`);
      }
    } catch (err) {
      // Hatayı görmezden gel, akış devam etsin
    }

    // Heartbeat: Bağlantının kopmasını engellemek için her 15 saniyede bir boş comment yolla
    const heartbeatInterval = setInterval(() => {
      res.write(":\n\n");
    }, 15000);

  // Bağlantı Koptuğunda (Cleanup)
    req.on("close", () => {
      clearInterval(heartbeatInterval);
      intentSseRegistry.removeClient(sessionId, res);
    });
  });

  /**
   * GET /api/v1/streams/god
   * Universal God Mode stream for overarching alerts (Revenue Pulse, System Radar, etc.)
   */
  router.get("/god", (req: Request, res: Response) => {
    console.log("📡 [Matrix] Yeni bir God Mode Radarı (SSE) bağlandı.");

    // SSE için zorunlu olan HTTP Başlıkları (Fiber Optik Standartları)
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    // CORS sorunları yaşamamak için
    res.setHeader("Access-Control-Allow-Origin", "*");

    // Flush headers
    res.flushHeaders();

    // İlk bağlantı kurulduğunda "ONLINE" sinyali gönder
    res.write(`data: ${JSON.stringify({ eventType: "system.status", payload: "ONLINE" })}\n\n`);

    // İstemciyi (Tarayıcıyı) aktif havuza ekle
    activeGodStreamClients.add(res);

    // Heartbeat: Bağlantının kopmasını engellemek için her 15 saniyede bir boş comment yolla
    const heartbeatInterval = setInterval(() => {
      res.write(":\n\n");
    }, 15000);

    // Bağlantı koptuğunda havuzdan temizle (Memory Leak önlemi)
    req.on("close", () => {
      clearInterval(heartbeatInterval);
      console.log("🔌 [Matrix] God Mode Radarı bağlantıyı kesti.");
      activeGodStreamClients.delete(res);
    });
  });

  return router;
}

// Bağlı olan tüm God Mode komutanlarını tutacağımız aktif bağlantı havuzu
export const activeGodStreamClients = new Set<any>();

// ============================================================================
// Otonom Event Fırlatıcı (Outbox Worker veya Application Service bunu çağıracak)
// ============================================================================
export function broadcastToGodMode(eventType: string, payload: any) {
  const eventString = `data: ${JSON.stringify({ eventType, payload })}\n\n`;
  activeGodStreamClients.forEach(client => client.write(eventString));
}
