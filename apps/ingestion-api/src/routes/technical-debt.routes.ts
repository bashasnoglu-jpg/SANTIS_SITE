import { Router, Request, Response } from "express";
import { z } from "zod";
import { TechnicalDebtSignalSchema } from "../technical-debt/technical-debt.contract";
import { ingestTechnicalDebtSignal, getTechnicalDebtSnapshot } from "../technical-debt/technical-debt.ingestion";
import { getTechnicalDebtTrendProjection } from "../technical-debt/technical-debt.trend";
import { createOverrideToken, consumeOverrideToken } from "../boardroom/override-token.service";
import { broadcastToGodMode } from "./sse-streams";

const TechnicalDebtIngestRequestSchema = z.object({
  signals: z.array(TechnicalDebtSignalSchema).min(1),
});

const OverrideTokenRequestSchema = z.object({
  reason: z.string().min(12),
  generatedBy: z.string().min(1).default("boardroom"),
});

const OverrideConsumeRequestSchema = z.object({
  token: z.string().min(1),
  reason: z.string().min(12),
});

function isAuthorized(req: Request) {
  const expected = process.env.SANTIS_TELEMETRY_KEY;
  if (!expected) return true;

  const authorization = req.headers.authorization || "";
  return authorization === `Bearer ${expected}`;
}

export function createTechnicalDebtRouter() {
  const router = Router();

  router.post("/technical-debt", async (req: Request, res: Response) => {
    if (!isAuthorized(req)) {
      return res.status(401).json({ ok: false, error: "UnauthorizedTechnicalDebtTelemetry" });
    }

    const parsed = TechnicalDebtIngestRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ ok: false, error: "InvalidTechnicalDebtPayload", issues: parsed.error.issues });
    }

    const accepted = await Promise.all(parsed.data.signals.map(signal => ingestTechnicalDebtSignal(signal)));
    const snapshot = await getTechnicalDebtSnapshot();

    broadcastToGodMode("TECH_DEBT_UPDATE", snapshot);

    return res.status(202).json({ ok: true, accepted: accepted.length, snapshot });
  });

  router.get("/technical-debt/snapshot", async (_req: Request, res: Response) => {
    return res.json({ ok: true, snapshot: await getTechnicalDebtSnapshot() });
  });

  router.get("/technical-debt/trend", async (req: Request, res: Response) => {
    const windowDays = Number(req.query.windowDays || 30);
    const thresholdEuro = Number(req.query.thresholdEuro || 5000);
    return res.json({
      ok: true,
      projection: await getTechnicalDebtTrendProjection({ windowDays, thresholdEuro }),
    });
  });

  router.post("/boardroom/override-token", async (req: Request, res: Response) => {
    if (!isAuthorized(req)) {
      return res.status(401).json({ ok: false, error: "UnauthorizedOverrideTokenRequest" });
    }

    const parsed = OverrideTokenRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ ok: false, error: "InvalidOverrideTokenRequest", issues: parsed.error.issues });
    }

    const token = createOverrideToken(parsed.data.reason, parsed.data.generatedBy);
    broadcastToGodMode("ARCHITECT_OVERRULE", {
      generatedBy: parsed.data.generatedBy,
      reason: parsed.data.reason,
      expiresAt: token.expiresAt,
    });

    return res.status(201).json({ ok: true, event: "ARCHITECT_OVERRULE", ...token });
  });

  router.post("/boardroom/override-token/consume", async (req: Request, res: Response) => {
    if (!isAuthorized(req)) {
      return res.status(401).json({ ok: false, error: "UnauthorizedOverrideTokenConsume" });
    }

    const parsed = OverrideConsumeRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ ok: false, error: "InvalidOverrideConsumeRequest", issues: parsed.error.issues });
    }

    const result = await consumeOverrideToken(parsed.data.token);
    if (!result.valid) {
      return res.status(403).json({ ok: false, error: result.reason });
    }

    const snapshot = await getTechnicalDebtSnapshot();
    broadcastToGodMode("TECH_DEBT_UPDATE", snapshot);

    return res.json({ ok: true, event: "ARCHITECT_OVERRULE", consumed: true, snapshot });
  });

  return router;
}
