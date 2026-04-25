import { Express, Request, Response } from "express";

export function registerCoreStateRoute(app: Express) {
  const coreStateHandler = async (req: Request, res: Response) => {
    const now = new Date().toISOString();

    const coreState = {
      meta: {
        version: "68.0.0",
        generatedAt: now,
        surface: "ADMIN_HQ",
        source: "sovereign-core",
      },

      revenue: {
        today: 0,
        hourlyRateTarget: 150,
        currency: "EUR",
      },

      sessions: {
        active: 0,
        hesitationIndex: 0,
        stressIndex: 0,
        conversionRisk: "low",
      },

      therapists: [],

      catalog: {
        programs: [],
        hammam: [],
        massages: [],
        skincare: [],
        extras: [],
      },

      alerts: [],

      system: {
        status: "online",
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
