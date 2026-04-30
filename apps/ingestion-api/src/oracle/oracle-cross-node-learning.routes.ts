import { Router, Request, Response } from "express";
import { oracleActionMemoryStore } from "./oracle-action-memory.store.js";
import { oracleCrossNodeLearningStore } from "./oracle-cross-node-learning.store.js";

export const oracleCrossNodeLearningRouter: import('express').Router = Router();

oracleCrossNodeLearningRouter.get("/cross-node-learning", async (req: Request, res: Response) => {
  const limit = Number(req.query.limit || 250);
  const records = await oracleActionMemoryStore.replay(Number.isFinite(limit) ? limit : 250);
  const data = oracleCrossNodeLearningStore.evaluate(records);

  return res.status(200).json({
    success: true,
    timestamp: new Date().toISOString(),
    data,
  });
});
