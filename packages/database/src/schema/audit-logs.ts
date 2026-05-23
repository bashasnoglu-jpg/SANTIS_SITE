import { pgTable, uuid, varchar, jsonb, timestamp, integer, index } from "drizzle-orm/pg-core";

export const auditLogEvents = pgTable("audit_log_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  actorType: varchar("actor_type", { length: 32 }).notNull(), // "user", "system", "service", "ai", "webhook"
  actorId: uuid("actor_id"),
  operatorId: uuid("operator_id"), // backward-friendly alias
  event: varchar("event", { length: 255 }).notNull(),
  payload: jsonb("payload").default({}).notNull(),
  payloadSchemaVersion: integer("payload_schema_version").default(1).notNull(),
  requestId: varchar("request_id", { length: 255 }),
  correlationId: varchar("correlation_id", { length: 255 }),
  ipAddress: varchar("ip_address", { length: 64 }),
  userAgent: varchar("user_agent", { length: 255 }),
  source: varchar("source", { length: 32 }), // "api", "admin", "system", "worker", "webhook"
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => {
  return {
    tenantCreatedIdx: index("audit_log_tenant_created_idx").on(table.tenantId, table.createdAt),
    tenantEventCreatedIdx: index("audit_log_tenant_event_created_idx").on(table.tenantId, table.event, table.createdAt),
    tenantActorCreatedIdx: index("audit_log_tenant_actor_created_idx").on(table.tenantId, table.actorId, table.createdAt),
    correlationIdx: index("audit_log_correlation_idx").on(table.correlationId),
  };
});
