import { Router, Request, Response } from "express";
import { z } from "zod";
import { OracleActionDecisionSchema } from "./oracle-action-memory.contract.js";
import { oracleActionMemoryStore } from "./oracle-action-memory.store.js";

export const oracleActionMemoryRouter: import('express').Router = Router();

oracleActionMemoryRouter.get("/action-memory", async (req: Request, res: Response) => {
  const limit = Number(req.query.limit || 100);
  const data = await oracleActionMemoryStore.replay(Number.isFinite(limit) ? limit : 100);

  return res.status(200).json({
    success: true,
    timestamp: new Date().toISOString(),
    data,
  });
});

oracleActionMemoryRouter.post("/action-memory", async (req: Request, res: Response) => {
  try {
    const decision = OracleActionDecisionSchema.parse(req.body);
    const record = await oracleActionMemoryStore.append(decision);

    return res.status(201).json({
      success: true,
      timestamp: new Date().toISOString(),
      data: record,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        timestamp: new Date().toISOString(),
        error: {
          type: "ValidationFailed",
          issues: error.errors.map((issue) => ({
            path: issue.path.join("."),
            message: issue.message,
          })),
        },
      });
    }

    console.error("[Oracle Action Memory] Failed to persist decision.", error);
    return res.status(500).json({
      success: false,
      timestamp: new Date().toISOString(),
      error: { type: "InternalSystemError" },
    });
  }
});
