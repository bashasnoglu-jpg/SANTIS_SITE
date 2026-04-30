import { Router, Request, Response } from "express";
import { oracleActionMemoryStore } from "./oracle-action-memory.store.js";
import { oracleGlobalAggregationStore } from "./oracle-global-aggregation.store.js";

export const oracleGlobalAggregationRouter = Router();

oracleGlobalAggregationRouter.get("/global-aggregation", async (req: Request, res: Response) => {
  const limit = Number(req.query.limit || 250);
  const records = await oracleActionMemoryStore.replay(Number.isFinite(limit) ? limit : 250);
  const data = oracleGlobalAggregationStore.aggregate(records);

  return res.status(200).json({
    success: true,
    timestamp: new Date().toISOString(),
    data,
  });
});
