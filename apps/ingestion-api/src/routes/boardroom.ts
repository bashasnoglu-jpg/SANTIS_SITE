import { Router, Request, Response } from "express";
import { BoardroomReadModels } from "../projections/boardroom-projections.js";

export const boardroomRouter: import('express').Router = Router();

// Zırhlı Boardroom rotaları (İleride Role-Based Access eklenebilir)
boardroomRouter.get("/revenue", (req: Request, res: Response) => {
  // Veritabanı sorgusu YOK! O(1) hızında bellekten okuma.
  return res.status(200).json({
    success: true,
    timestamp: new Date().toISOString(),
    data: BoardroomReadModels.revenueMetrics
  });
});

boardroomRouter.get("/mood-heatmap", (req: Request, res: Response) => {
  return res.status(200).json({
    success: true,
    timestamp: new Date().toISOString(),
    data: BoardroomReadModels.moodHeatmap
  });
});

boardroomRouter.get("/snapshot", (req: Request, res: Response) => {
  // Tüm God Mode panosunu tek seferde doldurmak için Master Endpoint
  return res.status(200).json({
    success: true,
    timestamp: new Date().toISOString(),
    data: BoardroomReadModels
  });
});
