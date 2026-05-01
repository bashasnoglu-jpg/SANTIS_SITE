import { Router, Request, Response } from "express";

export const telemetryRouter: Router = Router();

// Endpoint for frontend telemetry beacons
telemetryRouter.post("/telemetry/beacon", (req: Request, res: Response) => {
    // Fire & Forget - no strict validation needed for now, just ingest
    console.log(`📡 [Telemetry Beacon] Received:`, req.body);
    res.status(202).json({ accepted: true });
});

// Endpoint for safety governor and decision telemetry
telemetryRouter.post("/telemetry/decision", (req: Request, res: Response) => {
    console.log(`🛡️ [Telemetry Decision] Received:`, req.body);
    res.status(202).json({ accepted: true });
});
