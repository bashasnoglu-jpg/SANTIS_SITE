import { pgTable, uuid, varchar, text, jsonb, timestamp, integer, index } from "drizzle-orm/pg-core";
import { customType } from "drizzle-orm/pg-core";

// Custom vector type for pgvector
const vector = customType<{ data: number[]; driverData: string }>({
  dataType() {
    return 'vector(768)';
  },
  toDriver(value: number[]): string {
    return `[${value.join(',')}]`;
  },
  fromDriver(value: string): number[] {
    return value.replace('[', '').replace(']', '').split(',').map(Number);
  },
});

export const guestProfiles = pgTable(
  "guest_profiles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id").notNull(),
    deviceFingerprint: varchar("device_fingerprint", { length: 255 }),
    email: varchar("email", { length: 255 }),
    phone: varchar("phone", { length: 50 }),
    personaCategory: varchar("persona_category", { length: 50 }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    lastActiveAt: timestamp("last_active_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => {
    return {
      fingerprintIdx: index("idx_guest_profiles_fingerprint").on(table.deviceFingerprint),
      tenantProfilesIdx: index("idx_guest_profiles_tenant").on(table.tenantId),
    };
  }
);

export const guestSessions = pgTable(
  "guest_sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    guestId: uuid("guest_id").references(() => guestProfiles.id).notNull(),
    tenantId: uuid("tenant_id").notNull(),
    channel: varchar("channel", { length: 50 }).notNull(),
    startedAt: timestamp("started_at", { withTimezone: true }).defaultNow().notNull(),
    endedAt: timestamp("ended_at", { withTimezone: true }),
  },
  (table) => {
    return {
      guestSessionIdx: index("idx_guest_sessions_guest").on(table.guestId),
      tenantSessionIdx: index("idx_guest_sessions_tenant").on(table.tenantId),
    };
  }
);

export const guestTraits = pgTable(
  "guest_traits",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    guestId: uuid("guest_id").references(() => guestProfiles.id).notNull(),
    tenantId: uuid("tenant_id").notNull(),
    category: varchar("category", { length: 50 }).notNull(),
    value: text("value").notNull(),
    confidenceScore: integer("confidence_score").default(100),
    source: varchar("source", { length: 50 }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => {
    return {
      guestCategoryIdx: index("idx_guest_traits_guest_category").on(table.guestId, table.category),
      tenantTraitsIdx: index("idx_guest_traits_tenant").on(table.tenantId),
    };
  }
);

export const guestIntents = pgTable(
  "guest_intents",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    guestId: uuid("guest_id").references(() => guestProfiles.id).notNull(),
    tenantId: uuid("tenant_id").notNull(),
    intent: varchar("intent", { length: 100 }).notNull(),
    confidence: integer("confidence").default(0),
    source: varchar("source", { length: 50 }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => {
    return {
      guestIntentIdx: index("idx_guest_intents_guest").on(table.guestId),
      confidenceIdx: index("idx_guest_intents_confidence").on(table.confidence),
      tenantIntentsIdx: index("idx_guest_intents_tenant").on(table.tenantId),
    };
  }
);

export const guestMemoryEmbeddings = pgTable(
  "guest_memory_embeddings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    guestId: uuid("guest_id").references(() => guestProfiles.id).notNull(),
    tenantId: uuid("tenant_id").notNull(),
    memoryText: text("memory_text").notNull(),
    embedding: vector("embedding"),
    contextMetadata: jsonb("context_metadata").default('{}'),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => {
    return {
      guestMemoryIdx: index("idx_guest_memory_guest").on(table.guestId),
      tenantMemoryIdx: index("idx_guest_memory_tenant").on(table.tenantId),
      // Note: HNSW index is not natively supported by standard Drizzle `index()` function without raw SQL
      // Will manually append CREATE INDEX on vector field in the generated migration.
    };
  }
);
