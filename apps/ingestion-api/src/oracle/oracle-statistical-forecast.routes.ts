import { Router, Request, Response } from "express";
import { oracleExecutionOutcomeStore } from "./oracle-execution-outcome.store.js";
import { oracleStatisticalForecastEngine } from "./oracle-statistical-forecast.engine.js";

export const oracleStatisticalForecastRouter: import('express').Router = Router();

oracleStatisticalForecastRouter.get("/statistical-forecast", async (req: Request, res: Response) => {
  const limit = Number(req.query.limit || 90);
  const outcomes = await oracleExecutionOutcomeStore.replay(Number.isFinite(limit) ? limit : 90);
  const data = oracleStatisticalForecastEngine.forecast(outcomes);

  return res.status(200).json({
    success: true,
    timestamp: new Date().toISOString(),
    data,
  });
});
