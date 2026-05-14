import { Router, Request, Response } from "express";
import {
  OracleExecutionOutcomeSchema,
} from "./oracle-execution-outcome.contract.js";
import { oracleExecutionOutcomeStore } from "./oracle-execution-outcome.store.js";
import {
  inferStrategyKeyFromVariantId,
  strategyLearningStore,
} from "../revenue/strategy-learning.store.js";

export const oracleExecutionOutcomeRouter: import('express').Router = Router();

oracleExecutionOutcomeRouter.get("/execution-outcomes", async (req: Request, res: Response) => {
  const limit = Number(req.query.limit || 50);
  const data = await oracleExecutionOutcomeStore.summarize(Number.isFinite(limit) ? limit : 50);

  return res.status(200).json({
    success: true,
    timestamp: new Date().toISOString(),
    data,
  });
});

oracleExecutionOutcomeRouter.post("/execution-outcomes", async (req: Request, res: Response) => {
  const parsed = OracleExecutionOutcomeSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      timestamp: new Date().toISOString(),
      error: parsed.error.flatten(),
    });
  }

  const record = await oracleExecutionOutcomeStore.append(parsed.data);
  const learningRecord = await strategyLearningStore.recordExecutionOutcome({
    strategyId: record.planId,
    variantId: record.scenarioId || record.planId,
    strategyKey: inferStrategyKeyFromVariantId(record.scenarioId || record.planId),
    segment: record.targetNodeId || "default",
    executionStatus: record.executionStatus,
    forecastRevenueLift: record.forecastRevenueLift,
    actualRevenueLift: record.actualRevenueLift,
    forecastConfidence: record.forecastConfidence,
    actualConfidence: record.actualConfidence,
  });

  return res.status(201).json({
    success: true,
    timestamp: new Date().toISOString(),
    data: {
      outcome: record,
      learning: learningRecord,
    },
  });
});
