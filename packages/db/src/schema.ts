import { pgTable, uuid, text, jsonb, timestamp } from "drizzle-orm/pg-core";
export { waveMemory } from "../schema/wave-memory.js";

// ==========================================
// KUTSAL KAYIT (EVENT STORE)
// APPEND-ONLY. UPDATE/DELETE KESİNLİKLE YASAK
// ==========================================
export const events = pgTable("events", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: text("tenant_id").notNull(), // İzolasyon için zorunlu
  type: text("type").notNull(),
  subject: text("subject").notNull(),
  payload: jsonb("payload").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ==========================================
// OKUMA MODELLERİ (PROJECTIONS)
// DİSPOSED EDİLEBİLİR (Yeniden üretilebilir)
// ==========================================
export const bookingProjection = pgTable("booking_projection", {
  userId: text("user_id").primaryKey(), // Ziyaretçi ID'si veya session
  tenantId: text("tenant_id").notNull(),
  currentIntent: text("current_intent"),
  lastUpdated: timestamp("last_updated"),
});
