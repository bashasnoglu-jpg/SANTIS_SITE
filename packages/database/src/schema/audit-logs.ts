import { pgTable, uuid, varchar, jsonb, timestamp, integer, index } from "drizzle-orm/pg-core";
import { desc } from "drizzle-orm";

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id").notNull(),
    actorOperatorId: uuid("actor_operator_id"),
    actorType: varchar("actor_type", { length: 50 }).notNull(),
    action: varchar("action", { length: 100 }).notNull(),
    payload: jsonb("payload").default('{}').notNull(),
    payloadSchemaVersion: integer("payload_schema_version").default(1).notNull(),
    requestId: varchar("request_id", { length: 255 }),
    correlationId: varchar("correlation_id", { length: 255 }),
    ipHash: varchar("ip_hash", { length: 64 }),
    userAgentHash: varchar("user_agent_hash", { length: 64 }),
    source: varchar("source", { length: 50 }),
    resourceId: varchar("resource_id", { length: 255 }),
    resourceType: varchar("resource_type", { length: 255 }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
  },
  (table) => {
    return {
      tenantCreatedIdx: index("idx_audit_logs_tenant_created").on(table.tenantId, table.createdAt),
      tenantActionCreatedIdx: index("idx_audit_logs_tenant_action_created").on(table.tenantId, table.action, table.createdAt),
      tenantResourceIdx: index("idx_audit_logs_tenant_resource").on(table.tenantId, table.resourceType, table.resourceId),
      actorCreatedIdx: index("idx_audit_logs_actor_created").on(table.actorOperatorId, table.createdAt)
    };
  }
);
