import { pgTable, uuid, varchar, jsonb, timestamp, index } from "drizzle-orm/pg-core";

export const auditLogEvents = pgTable("audit_log_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  actorOperatorId: uuid("actor_operator_id").notNull(),
  action: varchar("action", { length: 128 }).notNull(),
  resourceType: varchar("resource_type", { length: 128 }).notNull(),
  resourceId: varchar("resource_id", { length: 255 }),
  payloadJson: jsonb("payload_json").default({}).notNull(),
  ipHash: varchar("ip_hash", { length: 64 }),
  userAgentHash: varchar("user_agent_hash", { length: 64 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => {
  return {
    tenantCreatedIdx: index("audit_log_tenant_created_idx").on(table.tenantId, table.createdAt), // DESC is typically specified in the query or native index, drizzle handles basic index
    tenantActionCreatedIdx: index("audit_log_tenant_action_created_idx").on(table.tenantId, table.action, table.createdAt),
    tenantResourceIdx: index("audit_log_tenant_resource_idx").on(table.tenantId, table.resourceType, table.resourceId),
    actorCreatedIdx: index("audit_log_actor_created_idx").on(table.actorOperatorId, table.createdAt),
  };
});
