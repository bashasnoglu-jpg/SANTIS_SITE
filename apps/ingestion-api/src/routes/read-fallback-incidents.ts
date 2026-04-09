import { Router } from "express";
import type { FallbackIncidentsReadModelRepository } from "../../../packages/application/src/projections/fallback-incidents/repository.js";

export function createFallbackIncidentsReadRouter(params: {
  repo: FallbackIncidentsReadModelRepository;
}) {
  const router = Router();

  router.get("/api/v1/read/fallback-incidents/:tenantId", async (req, res) => {
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
