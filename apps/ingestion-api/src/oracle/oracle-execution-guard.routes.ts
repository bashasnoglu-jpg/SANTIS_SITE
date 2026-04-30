import { Router, Request, Response } from "express";
import { oracleActionMemoryStore } from "./oracle-action-memory.store.js";
import { oracleExecutionGuardStore } from "./oracle-execution-guard.store.js";

export const oracleExecutionGuardRouter: import('express').Router = Router();

oracleExecutionGuardRouter.get("/execution-guard", async (req: Request, res: Response) => {
  const limit = Number(req.query.limit || 250);
  const records = await oracleActionMemoryStore.replay(Number.isFinite(limit) ? limit : 250);
  const data = oracleExecutionGuardStore.evaluate(records);

  return res.status(200).json({
    success: true,
    timestamp: new Date().toISOString(),
    data,
  });
});
