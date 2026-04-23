import { WebSocketServer, WebSocket } from 'ws';
import type { Server } from 'http';

import { RealtimeEnvelope } from '@santis/event-dictionary';
import { db } from './db.js';
import { events } from '@santis/db';
import { desc } from 'drizzle-orm';

let wss: WebSocketServer | null = null;

export function initRealtime(server: Server) {
  wss = new WebSocketServer({ server, path: '/events' });

  wss.on('connection', async (ws: WebSocket) => {
    console.log('[SOVEREIGN_EVENT_BUS] New dashboard client connected');

    try {
      // Replay (Catch-up) mantığı
      const lastEvents = await db.query.events.findMany({
        orderBy: [desc(events.createdAt)],
        limit: 20,
      });

      // Eski eventleri en eskiden en yeniye doğru sıralamak için reverse() yapıyoruz,
      // böylece UI kronolojik olarak doğru işler.
      const replayPayload: RealtimeEnvelope = {
        type: "EVENT_REPLAY",
        payload: lastEvents.reverse().map(e => ({
          ...e,
          payload: e.payload as any
        }))
      };

      ws.send(JSON.stringify(replayPayload));
    } catch (error) {
      console.error("[SOVEREIGN_EVENT_BUS] Failed to fetch replay events", error);
    }

    ws.on('error', (err) => {
      console.error('[SOVEREIGN_EVENT_BUS] Client error:', err);
    });

    ws.on('close', () => {
      console.log('[SOVEREIGN_EVENT_BUS] Dashboard client disconnected');
    });
  });
  
  console.log('[SOVEREIGN_EVENT_BUS] WebSocket bridge initialized on /events');
}

/**
 * Broadcasts an event to all connected dashboard clients.
 * This should ONLY be called after the event is successfully persisted to the Database.
 */
export function broadcastEvent(event: RealtimeEnvelope) {
  if (!wss) return;

  const payload = JSON.stringify(event);
  let count = 0;
  
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
      count++;
    }
  });
  
  if (count > 0 && event.type === "EVENT_STREAM") {
    console.log(`[SOVEREIGN_EVENT_BUS] Broadcasted ${event.payload.type} to ${count} client(s)`);
  }
}
