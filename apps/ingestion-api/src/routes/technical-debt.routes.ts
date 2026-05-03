import { Router, Request, Response } from "express";
import { z } from "zod";
import { TechnicalDebtSignalSchema } from "../technical-debt/technical-debt.contract";
import { ingestTechnicalDebtSignal, getTechnicalDebtSnapshot } from "../technical-debt/technical-debt.ingestion";
import { broadcastToGodMode } from "./sse-streams";

const TechnicalDebtIngestRequestSchema = z.object({
  signals: z.array(TechnicalDebtSignalSchema).min(1),
});

function isAuthorized(req: Request) {
  const expected = process.env.SANTIS_TELEMETRY_KEY;
  if (!expected) return true;

  const authorization = req.headers.authorization || "";
  return authorization === `Bearer ${expected}`;
}

export function createTechnicalDebtRouter() {
  const router = Router();

  router.post("/technical-debt", (req: Request, res: Response) => {
    if (!isAuthorized(req)) {
      return res.status(401).json({
        ok: false,
        error: "UnauthorizedTechnicalDebtTelemetry",
      });
    }

    const parsed = TechnicalDebtIngestRequestSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        ok: false,
        error: "InvalidTechnicalDebtPayload",
        issues: parsed.error.issues,
      });
    }

    const accepted = parsed.data.signals.map(signal => ingestTechnicalDebtSignal(signal));
    const snapshot = getTechnicalDebtSnapshot();

    broadcastToGodMode("TECH_DEBT_UPDATE", snapshot);

    return res.status(202).json({
      ok: true,
      accepted: accepted.length,
      snapshot,
    });
  });

  router.get("/technical-debt/snapshot", (_req: Request, res: Response) => {
    return res.json({
      ok: true,
      snapshot: getTechnicalDebtSnapshot(),
    });
  });

  return router;
}
