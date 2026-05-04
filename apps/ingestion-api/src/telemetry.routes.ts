import { Router, Request, Response } from "express";
import { IntentEngine } from "./engine/intent.engine";
import type { TelemetryPayload } from "../../../server/core/concierge/telemetry/telemetry.contract";

export const telemetryRouter: Router = Router();

// Endpoint for frontend telemetry beacons
telemetryRouter.post("/telemetry/beacon", (req: Request, res: Response) => {
    // 1. Hemen yanıt dön (Zero-Jank / UX)
    res.status(202).json({ accepted: true });

    // 2. Arka planda asenkron analiz başlat (fire-and-forget)
    // Zod validasyonu burada varsayılmıştır, payload tipini zorluyoruz
    const payload = req.body as TelemetryPayload;
    IntentEngine.evaluateIntent(payload).catch(err => {
        console.error("Background Intent Analysis Failed", err);
    });
});

// Endpoint for safety governor and decision telemetry
telemetryRouter.post("/telemetry/decision", (req: Request, res: Response) => {
    console.log(`🛡️ [Telemetry Decision] Received:`, req.body);
    res.status(202).json({ accepted: true });
});
