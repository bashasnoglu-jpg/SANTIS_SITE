import { Router, Request, Response } from "express";
import type { FallbackIncidentsReadModelRepository } from "@santis/application/projections/fallback-incidents/repository";

export function createFallbackIncidentsReadRouter(params: {
  repo: FallbackIncidentsReadModelRepository;
}): import('express').Router {
  const router = Router();

  router.get("/api/v1/read/fallback-incidents/:tenantId", async (req: Request, res: Response) => {
    const tenantId = req.params.tenantId;
    const windowRaw = String(req.query.window ?? "5m");
    const window =
      windowRaw === "15m" || windowRaw === "1h" ? windowRaw : "5m";

    const snapshot = await params.repo.getSnapshot({
      tenantId,
      window,
    });

    if (!snapshot) {
      return res.status(404).json({
        code: "not_found",
        message: "Bu tenant için henüz fallback incident projection materyalize edilmedi.",
      });
    }

    return res.status(200).json(snapshot);
  });

  return router;
}
