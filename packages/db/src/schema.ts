import { pgTable, uuid, text, jsonb, timestamp, numeric, real } from "drizzle-orm/pg-core";

// ==========================================
// KUTSAL KAYIT (EVENT STORE)
// APPEND-ONLY. UPDATE/DELETE KESİNLİKLE YASAK
// ==========================================
export const events = pgTable("events", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: text("tenant_id").notNull(),
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

// ==========================================
// TECHNICAL DEBT MEMORY
// APPEND-ONLY RISK SIGNALS FOR BOARDROOM INTELLIGENCE
// ==========================================
export const technicalDebtSignals = pgTable("technical_debt_signals", {
  id: text("id").primaryKey(),
  source: text("source").notNull(),
  type: text("type").notNull(),
  severity: text("severity").notNull(),
  title: text("title").notNull(),
  detail: text("detail").notNull(),
  workspace: text("workspace"),
  filePath: text("file_path"),
  detectedAt: timestamp("detected_at").notNull(),
  euroRisk: numeric("euro_risk", { precision: 12, scale: 2 }).notNull(),
  confidence: real("confidence").notNull(),
  remediation: text("remediation").notNull(),
  payload: jsonb("payload").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
