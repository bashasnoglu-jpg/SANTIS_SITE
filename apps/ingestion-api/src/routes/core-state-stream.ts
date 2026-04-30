import { Router, Request, Response } from "express";

const activeStreams = new Set<Response>();

export function createCoreStateStreamRouter(): import('express').Router {
  const router = Router();

  router.get("/core-state/stream", (req: Request, res: Response) => {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("Access-Control-Allow-Origin", "*");

    res.flushHeaders();

    // Initial connection ack
    res.write(`data: ${JSON.stringify({ type: "SYSTEM", payload: "STREAM_CONNECTED" })}\n\n`);

    activeStreams.add(res);

    const heartbeatInterval = setInterval(() => {
      res.write(":\n\n"); // SSE comment to keep connection alive
    }, 15000);

    req.on("close", () => {
      clearInterval(heartbeatInterval);
      activeStreams.delete(res);
    });
  });

  return router;
}

export function broadcastCoreStatePatch(patch: any) {
  const payload = `data: ${JSON.stringify({ type: "CORE_STATE_PATCH", patch })}\n\n`;
  activeStreams.forEach((client) => client.write(payload));
}
