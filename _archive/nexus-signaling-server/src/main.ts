import "dotenv/config";
import http from "node:http";
import { WebSocketServer } from "ws";
import { RoomStore } from "./room-store.js";
import { decodeTelemetryFrame, TELEMETRY_FRAME_SIZE } from "./telemetry-frame.js";
import { WsRouter, createDevToken } from "./ws-router.js";

const PORT = Number(process.env.PORT ?? 8080);
const WS_PATH = process.env.WS_PATH ?? "/ws";
const TELEMETRY_PATH = process.env.TELEMETRY_PATH ?? "/telemetry";
const HEARTBEAT_TIMEOUT_MS = Number(process.env.HEARTBEAT_TIMEOUT_MS ?? 45000);
const HEARTBEAT_SWEEP_MS = Number(process.env.HEARTBEAT_SWEEP_MS ?? 5000);
const MAX_WS_PAYLOAD = Number(process.env.MAX_WS_PAYLOAD ?? 65536);
const SIGNALING_SECRET = process.env.SIGNALING_SECRET ?? "SANTIS_DEV_SECRET_CHANGE_ME";

const roomStore = new RoomStore();
const router = new WsRouter({
  roomStore,
  signalingSecret: SIGNALING_SECRET,
});

const server = http.createServer((req, res) => {
  const url = req.url ?? "/";

  if (url === "/healthz") {
    res.writeHead(200, { "content-type": "application/json" });
    res.end(
      JSON.stringify({
        ok: true,
        service: "nexus-signaling-server",
        ts: Date.now(),
      }),
    );
    return;
  }

  if (url === "/dev-token") {
    const exp = Math.floor(Date.now() / 1000) + 60 * 60 * 8;
    const token = createDevToken(
      {
        sub: "dev_operator",
        clearance: 9,
        role: "commander",
        exp,
      },
      SIGNALING_SECRET,
    );

    res.writeHead(200, { "content-type": "application/json" });
    res.end(
      JSON.stringify({
        ok: true,
        token,
        note: "development only"
      }),
    );
    return;
  }

  res.writeHead(404, { "content-type": "application/json" });
  res.end(JSON.stringify({ ok: false, error: "not_found" }));
});

const signalingWss = new WebSocketServer({
  server,
  path: WS_PATH,
  maxPayload: MAX_WS_PAYLOAD,
});

const telemetryWss = new WebSocketServer({
  server,
  path: TELEMETRY_PATH,
  maxPayload: TELEMETRY_FRAME_SIZE,
});

signalingWss.on("connection", (ws, req) => {
  console.log(`[NEXUS] signaling peer connected from ${req.socket.remoteAddress ?? "unknown"}`);
  router.onConnection(ws, req);
});

telemetryWss.on("connection", (ws, req) => {
  console.log(`[RADAR] telemetry socket connected from ${req.socket.remoteAddress ?? "unknown"}`);

  ws.on("message", (raw, isBinary) => {
    if (!isBinary) {
      ws.close(4002, "binary_required");
      return;
    }

    try {
      const frame = decodeTelemetryFrame(raw as Buffer);

      console.log(
        `[RADAR] clearance=${frame.clearance} x=${frame.x.toFixed(2)} y=${frame.y.toFixed(2)} flags=${frame.flags}`
      );

      /**
       * Burada ileride:
       * - God's Eye sink
       * - room-aware telemetry routing
       * - audit sampling
       * - WebTransport A/B ingress karşılaştırması
       * yapılabilir.
       */
    } catch (error) {
      console.error("[RADAR] invalid telemetry frame:", error);
    }
  });

  ws.on("close", () => {
    console.log("[RADAR] telemetry socket closed");
  });

  ws.on("error", (error) => {
    console.error("[RADAR] telemetry socket error:", error);
  });
});

setInterval(() => {
  router.sweepDeadPeers(HEARTBEAT_TIMEOUT_MS);
}, HEARTBEAT_SWEEP_MS).unref();

server.listen(PORT, () => {
  console.log("================================================");
  console.log(" SANTIS NEXUS SIGNALING SERVER");
  console.log("================================================");
  console.log(` HTTP       : http://localhost:${PORT}`);
  console.log(` HEALTH     : http://localhost:${PORT}/healthz`);
  console.log(` DEV TOKEN  : http://localhost:${PORT}/dev-token`);
  console.log(` SIGNALING  : ws://localhost:${PORT}${WS_PATH}`);
  console.log(` TELEMETRY  : ws://localhost:${PORT}${TELEMETRY_PATH}`);
  console.log("================================================");
});
