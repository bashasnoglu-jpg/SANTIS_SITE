import { db } from './db.js';
import { bookingProjection } from '@santis/db';
import { SovereignEventType } from '@santis/event-dictionary';

export async function projectBooking(event: SovereignEventType) {
  if (event.type === 'BOOKING_INTENT_CAPTURED') {
    // If we have a user ID or session ID we project the current intent
    const userId = event.payload.userId || event.payload.sessionId;
    if (!userId) return; // Cannot project without an identifier

    await db.insert(bookingProjection)
      .values({
        userId,
        tenantId: event.payload.tenantId,
        currentIntent: event.payload.intent,
        lastUpdated: new Date(event.payload.timestamp),
      })
      .onConflictDoUpdate({
        target: bookingProjection.userId,
        set: {
          currentIntent: event.payload.intent,
          lastUpdated: new Date(event.payload.timestamp),
        },
      });
  }
}
