import { Response } from "express";
import { SsePatchEnvelopeSchema } from "@santis/domain-schema";

// Persistent sequence ID across module reloads (Hot Reload Safe)
(global as any).SANTIS_SEQ = (global as any).SANTIS_SEQ ?? 0;
const nextSeq = () => ++(global as any).SANTIS_SEQ;

/**
 * SseManager (Production-Grade Strategy Feed)
 * Handles global broadcast of CoreState patches to all connected Boardroom operators.
 */
export class SseManager {
  private clients = new Set<Response>();

  constructor() {
    // Global Heartbeat to prevent proxy timeouts
    setInterval(() => this.broadcastHeartbeat(), 15000);
  }

  /**
   * Registers a new SSE client.
   * Ensures headers are set for persistent streaming as per Santis OS Sovereign Standards.
   */
  addClient(res: Response) {
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no", // Disable buffering for Nginx/Proxies
      "Access-Control-Allow-Origin": "*",
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
    scope: "strategy" | "revenue" | "core_state" | "command", 
    patch: Record<string, any>,
    event: "strategy_update" | "command_ack" = "strategy_update"
  ) {
    const seq = nextSeq();
    
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
