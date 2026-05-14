import { Router, Request, Response } from "express";
import { oracleActionMemoryStore } from "./oracle-action-memory.store.js";
import { oracleStrategySimulationStore } from "./oracle-strategy-simulation.store.js";

export const oracleStrategySimulationRouter: import('express').Router = Router();

oracleStrategySimulationRouter.get("/strategy-simulation", async (req: Request, res: Response) => {
  const limit = Number(req.query.limit || 250);
  const records = await oracleActionMemoryStore.replay(Number.isFinite(limit) ? limit : 250);
  const data = oracleStrategySimulationStore.simulate(records);

  return res.status(200).json({
    success: true,
    timestamp: new Date().toISOString(),
    data,
  });
});
