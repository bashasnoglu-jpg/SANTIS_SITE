import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import crypto from "crypto";
import { SantisCommandSchema, SantisEventSchema } from "@santis/event-dictionary";
import { SovereignBus } from "@santis/sovereign-bus";
import { sendAck, sendNack } from "../utils/http-contract.js";

import { CommandIngressService } from "../services/command-ingress";

// Factory pattern to inject the bus since we bootstrap it in index.ts
export const createIngressRouter = (sovereignBus: SovereignBus, commandIngress: CommandIngressService): import('express').Router => {
  const ingressRouter = Router();

  // Test / Bypass endpoint for direct Event injection
  if (process.env.SANTIS_ENABLE_DEV_ROUTES === 'true') {
    ingressRouter.post("/test-event", async (req: Request, res: Response) => {
      try {
        const rawEvent = req.body;
        const validEvent = SantisEventSchema.parse(rawEvent); // Zod Mühürü!
        console.log(`\n🧪 [Test Gate] Sentetik test eventi firlatildi: ${validEvent.eventType}`);
        await sovereignBus.events.publish(validEvent);
        res.json({ status: "TEST_EVENT_FIRED", eventType: validEvent.eventType });
      } catch (error: any) {
        if (error instanceof z.ZodError) {
          console.error("❌ [Test Gate] Validation Hatası:", error.errors);
          return res.status(400).json({ error: "Validation Failed", details: error.errors });
        }
        console.error("❌ [Test Gate] Hata:", error.message);
        res.status(400).json({ error: error.message });
      }
    });

    // GodMode Human-in-the-Loop Override Endpoint
    ingressRouter.post("/commands/override", async (req: Request, res: Response) => {
      try {
        const payload = req.body;
        const traceId = (req.headers["x-trace-id"] as string) || crypto.randomUUID();

        console.log(`\n👑 [Sovereign] Mimar Onayı Alındı! Katalizör Serbest Bırakılıyor. Trace: ${traceId}`);
        
        // Kiosk'a (veya ilgili Frontend'e) doğrudan Event Bus üzerinden Push (SSE) emri gönder.
        // Not: Gerçek sistemde bu "intent" Command'a dönüşmeli, 
        // şimdilik test amaçlı Sentetik Event olarak GodMode'a ve Kiosk'a fırlatıyoruz.
        await sovereignBus.events.publish({
          eventId: crypto.randomUUID(),
          eventType: "commerce.upsell.therapist_accepted", // Temsili bir "kabul edildi" olayı
          occurredAt: new Date().toISOString(),
          traceId: traceId,
          sessionId: payload.sessionId || "anonymous",
          tenant: {
            hotelId: "123e4567-e89b-12d3-a456-426614174002",
            hotelCode: "SANTIS",
            region: "EU",
            locale: "tr",
            currency: "EUR",
            activePolicies: [],
            fallbackMode: false
          },
          intent: {
            guestId: "123e4567-e89b-12d3-a456-426614174003",
            isReturningGuest: true,
            segment: "vip",
            moodAffinity: [],
            premiumThreshold: 100
          },
          payload: {
            therapistId: crypto.randomUUID(),
            upsellAmount: 8500, // VIP Helikopter Transfer Bedeli (Temsili)
            originalPackageId: crypto.randomUUID()
          }
        } as any); // Type bypass for simplicity in demo

        res.status(200).json({ success: true, message: "Katalizör onaylandı ve sahaya gönderildi." });
      } catch (err: any) {
        console.error("❌ [Sovereign] Override Hatası:", err);
        res.status(500).json({ success: false, error: err.message });
      }
    });
  }

  ingressRouter.post("/commands", async (req: Request, res: Response, next: NextFunction) => {
    // 1. TraceId Propagation (Dışarıdan geleni al, yoksa yeni üret)
    const traceId = (req.headers["x-trace-id"] as string) || crypto.randomUUID();
    const sessionId = (req.headers["x-session-id"] as string) || "anonymous-session";

    console.log(`\n🛡️ [Ingress Gate] Sinyal tespit edildi. Trace: ${traceId}`);

    try {
      const result = await commandIngress.ingest(req.body, traceId, sessionId);

      if (!result.ok) {
        if (result.status === 400) {
          console.warn(`🛑 [Ingress Gate] Zod Kalkanı Devrede! Payload reddedildi. Trace: ${traceId}`);
          return sendNack(res, traceId, { type: "ValidationFailed", issues: result.error.details }, 400);
        }
        return sendNack(res, traceId, { type: "CommandRejected", reason: result.error }, result.status);
      }

      console.log(`✅ [Ingress Gate] Gümrük geçildi. Command Result: ${result.result.status}`);

      return sendAck(res, traceId, {
        status: "ACCEPTED",
        commandId: result.result.commandId,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      // İş kuralları veya sistem hataları için bir sonraki Dead-Letter middleware'e aktar
      next(error);
    }
  });

  return ingressRouter;
};
