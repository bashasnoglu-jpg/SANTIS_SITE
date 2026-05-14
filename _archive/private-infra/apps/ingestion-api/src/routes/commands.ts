import { Router, Request, Response } from "express";
import { dispatchCommandHandler } from "../handlers/ingest-command.js";
import type { CommandIngressService } from "../services/command-ingress.js";

export function createCommandRoutes(ingress: CommandIngressService): import('express').Router {
  const router = Router();

  // Auth middleware (Bearer token) would be registered before or here
  router.post("/", async (req: Request, res: Response) => {
    try {
      const response = await dispatchCommandHandler(req.body, ingress);

      if (!response.ok) {
        return res.status(response.status).json(response.error);
      }

      const result = response.result;

      if (result.status === "ack") {
        const httpStatus =
          result.mode === "accepted_for_async_processing" ? 202 : 200;
        return res.status(httpStatus).json(result);
      }

      switch (result.reasonCode) {
        case "forbidden":
          return res.status(403).json(result);
        case "conflict":
          return res.status(409).json(result);
        case "rate_limited":
          return res.status(429).json(result);
        case "system_unavailable":
          return res.status(503).json(result);
        case "unknown_command":
          return res.status(404).json(result);
        default:
          return res.status(500).json(result);
      }
    } catch (err) {
       return res.status(500).json({ code: "internal_error", message: "Unexpected server error" });
    }
  });

  return router;
}
