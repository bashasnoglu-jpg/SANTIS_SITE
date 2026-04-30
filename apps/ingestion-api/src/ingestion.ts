import { db } from './db.js';
import { events } from '@santis/db';
import { SovereignEvent } from '@santis/event-dictionary';
import { projectBooking } from './projection-engine.js';
import { broadcastEvent } from './realtime.js';
import { evaluateConciergeRules, deriveSignalFromDecision } from '@santis/decision-kernel';

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
  
  // 4.1 Decision Kernel Entegrasyonu
  const payloadData = (parsed.payload || {}) as Record<string, any>;
  const metrics = {
    hesitation_index: Number(payloadData.hesitation_index || 0),
    abandon_risk: Number(payloadData.abandon_risk || 0),
    stress_index: Number(payloadData.stress_index || 0),
    therapist_stress: Number(payloadData.therapist_stress || 0),
  };
  
  const decision = evaluateConciergeRules(metrics);
  const signalType = deriveSignalFromDecision(decision);

  broadcastEvent({
    type: "EVENT_STREAM",
    payload: {
      id: insertedRecord.id,
      tenantId: insertedRecord.tenantId,
      type: signalType ?? insertedRecord.type,
      subject: insertedRecord.subject,
      payload: { ...insertedRecord.payload as any, decision },
      createdAt: insertedRecord.createdAt
    }
  });

  return insertedRecord;
}
