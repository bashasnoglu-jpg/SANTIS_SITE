/**
 * SANTIS OS — WebSocket Gateway Bootstrap
 * @description Isolated WebSocket gateway factory.
 * Receives all external deps via injection — owns nothing stateful internally.
 */

import type { IncomingMessage } from "http";
import { WebSocket, WebSocketServer } from "ws";
import { resolveWebSocketGatewayConfig } from "../config/websocket-gateway.config.js";
import { isOriginAllowed } from "../security/origin-policy.js";
import { verifySessionToken, type SessionTokenPayload } from "../security/crypto-token.js";
import type { RuntimeContext } from "./create-runtime-context.js";

type WebSocketUpgradeRequest = IncomingMessage & {
  /** Session payload attached during WS handshake. Transient — lives only on the upgrade request. */
  session?: SessionTokenPayload;
};

type VerifyClientInfo = {
  origin?: string;
  req: WebSocketUpgradeRequest;
};

type VerifyClientCallback = (verified: boolean, code?: number, message?: string) => void;

export function createWebSocketGateway(context: RuntimeContext): WebSocketServer {
  const wsConfig = resolveWebSocketGatewayConfig();

  const wss = new WebSocketServer({
    host: wsConfig.WS_HOST,
    port: wsConfig.WS_PORT,
    path: wsConfig.WS_PATH,
    verifyClient: (info: VerifyClientInfo, callback: VerifyClientCallback) => {
      const origin = info.origin;
      const isAllowed = origin && isOriginAllowed(origin, wsConfig.WS_ALLOWED_ORIGIN_PATTERNS);

      if (!isAllowed) {
        console.warn(
          JSON.stringify({
            event: "WS_CORS_REJECTED",
            severity: "WARNING",
            timestamp: new Date().toISOString(),
            origin: origin || "UNKNOWN",
          })
        );
        return callback(false, 403, "Forbidden Origin");
      }

      try {
        const urlObj = new URL(
          info.req.url || "",
          `http://${info.req.headers.host || "localhost"}`
        );
        const token = urlObj.searchParams.get("token");

        if (!token) {
          console.warn(`🚨 [Security] WS Rejected: Missing bearer query token`);
          return callback(false, 401, "Unauthorized - Missing Token");
        }

        const payload = verifySessionToken(token);
        info.req.session = payload;
        callback(true);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.warn(`🚨 [Security] WS Rejected: Invalid or expired token -> ${message}`);
        return callback(false, 403, "Forbidden Token");
      }
    },
  });

  wss.on("connection", (ws: WebSocket) => {
    console.log(`🔌 [WebSocket Gateway] İstemci bağlandı.`);
    ws.send(
      JSON.stringify({ type: "CONNECTION_ACK", message: "Sovereign WS Gateway Connected." })
    );

    ws.on("error", (err: Error) => {
      console.error("[WS Gateway] Hata:", err);
    });
  });

  console.log(`
  ╔═══════════════════════════════════════════════════╗
  ║  📡 WEBSOCKET GATEWAY ONLINE                      ║
  ║  Host: ${wsConfig.WS_HOST}
  ║  Port: ${wsConfig.WS_PORT}
  ║  Path: ${wsConfig.WS_PATH}
  ╚═══════════════════════════════════════════════════╝
  `);

  return wss;
}
