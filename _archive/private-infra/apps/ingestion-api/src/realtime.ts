import { WebSocketServer, WebSocket } from 'ws';
import type { Server } from 'http';
import type { IncomingMessage } from 'http';

import { RealtimeEnvelope } from '@santis/event-dictionary';
import { db } from './db.js';
import { events } from '@santis/db';
import { desc } from 'drizzle-orm';
import { verifySessionToken } from './security/crypto-token.js';

let wss: WebSocketServer | null = null;

export function initRealtime(server: Server) {
  wss = new WebSocketServer({ server, path: '/events', noServer: false });

  // [SEC-04] Token doğrulaması — bağlantı kurulmadan önce çalışır.
  // ?token=<signed-jwt> parametresi zorunlu; operator veya admin rolü gerekli.
  wss.on('connection', async (ws: WebSocket, req: IncomingMessage) => {
    // Token çıkar
    const url = new URL(req.url ?? '', `http://${req.headers.host ?? 'localhost'}`);
    const token = url.searchParams.get('token');

    if (!token) {
      console.warn('[SOVEREIGN_EVENT_BUS] Bağlantı reddedildi: token eksik');
      ws.close(4401, 'Unauthorized: missing token');
      return;
    }

    let session;
    try {
      session = verifySessionToken(token);
    } catch {
      console.warn('[SOVEREIGN_EVENT_BUS] Bağlantı reddedildi: geçersiz veya süresi dolmuş token');
      ws.close(4403, 'Forbidden: invalid token');
      return;
    }

    // Sadece operator ve admin /events'e bağlanabilir
    if (session.role !== 'operator' && session.role !== 'admin') {
      console.warn(`[SOVEREIGN_EVENT_BUS] Bağlantı reddedildi: yetersiz rol (${session.role})`);
      ws.close(4403, 'Forbidden: operator role required');
      return;
    }

    console.log(`[SOVEREIGN_EVENT_BUS] Dashboard client bağlandı — role:${session.role} session:${session.sessionId}`);

    try {
      // Replay (Catch-up) mantığı
      const lastEvents = await db.query.events.findMany({
        orderBy: [desc(events.createdAt)],
        limit: 20,
      });

      const replayPayload: RealtimeEnvelope = {
        type: "EVENT_REPLAY",
        payload: lastEvents.reverse().map((e: any) => ({
          ...e,
          payload: e.payload as any
        }))
      };

      ws.send(JSON.stringify(replayPayload));
    } catch (error) {
      console.error("[SOVEREIGN_EVENT_BUS] Replay events alınamadı", error);
    }

    ws.on('error', (err) => {
      console.error('[SOVEREIGN_EVENT_BUS] Client error:', err);
    });

    ws.on('close', () => {
      console.log(`[SOVEREIGN_EVENT_BUS] Dashboard client ayrıldı — session:${session.sessionId}`);
    });
  });
  
  console.log('[SOVEREIGN_EVENT_BUS] WebSocket bridge initialized on /events (auth: token required)');
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
