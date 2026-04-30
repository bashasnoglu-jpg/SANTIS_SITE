import { Router, Request, Response } from "express";
import { EventStore } from "../infrastructure/event-store.js";

export function createHistoryReadRouter(): import('express').Router {
  const router = Router();

  /**
   * GET /api/v1/read/history
   * GodMode arayüzünün ilk açılışta boş kalmaması için 
   * "Akaşik Kayıtları" (son n olayı) getirir.
   */
  router.get("/history", async (req: Request, res: Response) => {
    try {
      const limitRaw = req.query.limit ? Number(req.query.limit) : 50;
      const limit = isNaN(limitRaw) || limitRaw <= 0 ? 50 : Math.min(limitRaw, 500);

      const recentEvents = await EventStore.getTail(limit);

      res.status(200).json({
        success: true,
        data: recentEvents,
        message: `Son ${recentEvents.length} kayıt başarıyla çekildi.`
      });
    } catch (error) {
      console.error("🚨 [SOVEREIGN KALKANI] Geçmiş veriler okunurken hata oluştu:", error);
      res.status(500).json({ 
        success: false, 
        message: "Kayıtlara ulaşılamadı. Sistem bütünlüğü korunuyor." 
      });
    }
  });

  return router;
}
