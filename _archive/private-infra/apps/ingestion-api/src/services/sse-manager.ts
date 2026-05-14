import { Request, Response } from "express";
import { SsePatchEnvelopeSchema } from "@santis/domain-schema";
import { isOriginAllowed } from "../security/origin-policy.js";

// Sequence ID for deterministic patching

/**
 * SseManager (Production-Grade Strategy Feed)
 * Handles global broadcast of CoreState patches to all connected Boardroom operators.
 */
export class SseManager {
  private clients = new Set<Response>();
  private sequence = 0;

  constructor() {
    // Global Heartbeat to prevent proxy timeouts
    setInterval(() => this.broadcastHeartbeat(), 15000);
  }

  /**
   * Registers a new SSE client.
   * Ensures headers are set for persistent streaming as per Santis OS Sovereign Standards.
   */
  addClient(req: Request, res: Response) {
    const origin = req.header("Origin");
    const allowedOrigin = origin && isOriginAllowed(origin) ? origin : undefined;

    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no", // Disable buffering for Nginx/Proxies
      ...(allowedOrigin ? { "Access-Control-Allow-Origin": allowedOrigin } : {}),
      ...(allowedOrigin ? { "Access-Control-Allow-Credentials": "true" } : {}),
    });

    // Send an initial handshake
    res.write(`: connected\n\n`);

    this.clients.add(res);

    res.on("close", () => {
      this.clients.delete(res);
    });
  }

  private broadcastHeartbeat() {
    this.clients.forEach(client => {
      try {
        client.write(`event: heartbeat\ndata: {}\n\n`);
      } catch (err) {
        this.clients.delete(client);
      }
    });
  }

  /**
   * Broadcasts a deterministic state patch to all registered clients.
   * Follows the Santis SSE Core Law (seq, ts, scope, patch).
   */
  broadcastPatch(
    scope: "strategy" | "revenue" | "core_state" | "command" | "action_rail" | "oracle_delta", 
    patch: Record<string, unknown>,
    event: "strategy_update" | "command_ack" | "action_rail_update" | "oracle_delta" = "strategy_update"
  ) {
    const seq = ++this.sequence;
    
    const payloadRaw = {
      event,
      data: {
        seq,
        ts: Math.floor(Date.now() / 1000),
        scope,
        patch
      }
    };

    // 🔒 Zod Boundary Enforcement
    const envelope = SsePatchEnvelopeSchema.parse(payloadRaw);
    const payload = JSON.stringify(envelope);
    
    // Write SSE formatted message
    const message = `event: ${envelope.event}\ndata: ${payload}\n\n`;
    
    this.clients.forEach(client => {
      try {
        client.write(message);
      } catch (err) {
        this.clients.delete(client);
      }
    });

    console.log(`[SSE] Broadcasted ${event} seq:${seq} scope:${scope}`);
  }

  getConnectedCount(): number {
    return this.clients.size;
  }
}

// Singleton for system-wide access
export const sseManager = new SseManager();
