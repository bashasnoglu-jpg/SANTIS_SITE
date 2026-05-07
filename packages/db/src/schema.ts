import { pgTable, uuid, text, jsonb, timestamp, integer, serial, index } from "drizzle-orm/pg-core";

export const waveMemory = pgTable("wave_memory", {
  key: text("key").primaryKey(),
  total: integer("total").notNull().default(0),
  success: integer("success").notNull().default(0),
  updatedAt: timestamp("updated_at").notNull(),
});

// ==========================================
// KUTSAL KAYIT (EVENT STORE)
// APPEND-ONLY. UPDATE/DELETE KESİNLİKLE YASAK
// ==========================================
export const eventStore = pgTable("event_store", {
  id: uuid("id").defaultRandom().primaryKey(),
  // Monotonic sequence — replay determinism guarantee
  seq: serial("seq").notNull(),
  // Multi-tenant isolation — Phase 4
  tenantId: text("tenant_id").notNull().default("santis"),
  eventId: text("event_id").notNull().unique(),
  eventType: text("event_type").notNull(),
  aggregateId: text("aggregate_id").notNull(),
  payload: jsonb("payload").notNull(),
  traceId: text("trace_id").notNull(),
  occurredAt: timestamp("occurred_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  seqIdx:       index("event_store_seq_idx").on(table.seq),
  occurredAtIdx: index("event_store_occurred_at_idx").on(table.occurredAt),
  tenantIdx:    index("event_store_tenant_idx").on(table.tenantId),
}));

// ==========================================
// LEGACY REALTIME EVENT STREAM
// Kept for ingestion.ts/realtime.ts compatibility.
// ==========================================
export const events = pgTable("events", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: text("tenant_id").notNull(),
  type: text("type").notNull(),
  subject: text("subject").notNull(),
  payload: jsonb("payload").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const bookingProjection = pgTable("booking_projection", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull().unique(),
  tenantId: text("tenant_id").notNull(),
  currentIntent: text("current_intent").notNull(),
  lastUpdated: timestamp("last_updated").notNull(),
});

// ==========================================
// OUTBOX EVENTS
// GÜVENİLİR TESLİMAT İÇİN
// ==========================================
export const outboxEvents = pgTable("outbox_events", {
  id: uuid("id").defaultRandom().primaryKey(),
  eventType: text("event_type").notNull(),
  payload: jsonb("payload").notNull(),
  status: text("status").notNull(), // 'pending', 'published', 'failed'
  traceId: text("trace_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  publishedAt: timestamp("published_at"),
});

// ==========================================
// READ MODELS (Projections)
// ==========================================
export const guestSessions = pgTable("guest_sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: text("tenant_id").notNull(),
  guestId: text("guest_id").notNull(),
  sessionId: text("session_id").notNull().unique(),
  state: jsonb("state").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const intentSnapshots = pgTable("intent_snapshots", {
  id: uuid("id").defaultRandom().primaryKey(),
  sessionId: text("session_id").notNull().unique(),
  intent: text("intent"),
  mood: jsonb("mood"), // mood affinity arrays, etc.
  hesitationIndex: text("hesitation_index"),
  payload: jsonb("payload"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const moodReadModels = pgTable("mood_read_models", {
  id: uuid("id").defaultRandom().primaryKey(),
  hotelId: text("hotel_id").notNull(),
  mood: text("mood").notNull(),
  occurredAt: timestamp("occurred_at").notNull(),
});

export const boardroomReadModels = pgTable("boardroom_read_models", {
  id: uuid("id").defaultRandom().primaryKey(),
  scope: text("scope").notNull().unique(),
  state: jsonb("state").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
