import { Express, Request, Response } from "express";
import { BoardroomReadModels } from "../projections/boardroom-projections";

export function registerCoreStateRoute(app: Express) {
  const coreStateHandler = async (req: Request, res: Response) => {
    const now = new Date().toISOString();

    const coreState = {
      meta: {
        version: "1.0.0",
        generatedAt: now,
        surface: "ADMIN_HQ",
        source: "sovereign-core",
      },

      revenue: {
        today: BoardroomReadModels.revenueMetrics.totalRevenue,
        hourlyRateTarget: BoardroomReadModels.revenueMetrics.dailyTarget / 12, // Hourly approximation
        currency: "EUR",
        trend: BoardroomReadModels.revenueMetrics.trend,
        delta: BoardroomReadModels.revenueMetrics.delta
      },

      sessions: {
        active: Object.keys(BoardroomReadModels.sessions).length,
        hesitationIndex: Object.values(BoardroomReadModels.sessions).reduce((acc, s) => acc + s.hesitationIndex, 0) / (Object.keys(BoardroomReadModels.sessions).length || 1),
        stressIndex: Object.values(BoardroomReadModels.sessions).reduce((acc, s) => acc + s.stressIndex, 0) / (Object.keys(BoardroomReadModels.sessions).length || 1),
        conversionRisk: Object.values(BoardroomReadModels.sessions).some(s => s.conversionRisk === "high") ? "high" : "low",
      },

      therapists: BoardroomReadModels.therapists,

      catalog: BoardroomReadModels.catalog,

      alerts: [],

      system: {
        status: "ready",
        websocket: "connected",
        integrity: 100,
      },
    };

    res.setHeader("Cache-Control", "no-store");
    res.json(coreState);
  };

  app.get("/core-state", coreStateHandler);
  app.get("/api/v1/core-state", coreStateHandler);
}
