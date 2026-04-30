import { Router, Request, Response } from "express";
import { oracleActionMemoryStore } from "./oracle-action-memory.store.js";
import { oracleNodeSyncStore } from "./oracle-node-sync.store.js";

export const oracleNodeSyncRouter = Router();

oracleNodeSyncRouter.get("/node-sync", async (req: Request, res: Response) => {
  const limit = Number(req.query.limit || 250);
  const nodeId = typeof req.query.nodeId === "string" ? req.query.nodeId : undefined;
  const records = await oracleActionMemoryStore.replay(Number.isFinite(limit) ? limit : 250);
  const filteredRecords = oracleNodeSyncStore.filterByNode(records, nodeId);

  return res.status(200).json({
    success: true,
    timestamp: new Date().toISOString(),
    data: {
      nodes: oracleNodeSyncStore.buildSnapshots(records),
      decisions: filteredRecords,
    },
  });
});
