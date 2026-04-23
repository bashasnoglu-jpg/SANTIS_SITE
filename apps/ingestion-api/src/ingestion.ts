import { db } from './db.js';
import { events } from '@santis/db';
import { SovereignEvent } from '@santis/event-dictionary';
import { projectBooking } from './projection-engine.js';
import { broadcastEvent } from './realtime.js';

export async function ingestEvent(raw: unknown) {
  // 1. Zod Otokrasisi: "Parse, Don't Validate"
  // Hatalı veri varsa anında Error fırlatır (silent failure yok).
  const parsed = SovereignEvent.parse(raw);

  // 2. Kutsal Kayıt (Append-Only Event Store)
  const [insertedRecord] = await db.insert(events).values({
    tenantId: parsed.payload.tenantId,
    type: parsed.type,
    subject: parsed.subject,
    payload: parsed.payload,
  }).returning();

  // 3. Tek Kullanımlık Projeksiyonlar (Read Model)
  try {
    await projectBooking(parsed);
  } catch (error) {
    console.error(`[PROJECTION_ERROR] Failed to project event ${parsed.type}`, error);
    // KIRMIZI ÇİZGİ: Projection hata verirse broadcast yapılmayacak.
    // HTTP response'a hata gitmesi için throw ediyoruz.
    throw error;
  }

  // 4. Neural Bridge (WebSocket Broadcast)
  // Sadece DB'ye yazılan ve Projection'ı tamamlanan kayıt anons edilir.
  broadcastEvent({
    type: "EVENT_STREAM",
    payload: {
      id: insertedRecord.id,
      tenantId: insertedRecord.tenantId,
      type: insertedRecord.type,
      subject: insertedRecord.subject,
      payload: insertedRecord.payload as any,
      createdAt: insertedRecord.createdAt,
    }
  });

  return insertedRecord;
}
