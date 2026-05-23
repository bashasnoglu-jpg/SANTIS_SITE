import { z } from "zod";
import { pgTable, uuid, varchar, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

export const auditLogEvents = pgTable("audit_log_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  actorOperatorId: uuid("actor_operator_id").notNull(),
  action: varchar("action", { length: 128 }).notNull(),
  resourceType: varchar("resource_type", { length: 128 }).notNull(),
  resourceId: varchar("resource_id", { length: 255 }).notNull(),
  payloadJson: jsonb("payload_json").notNull(),
  ipHash: varchar("ip_hash", { length: 255 }),
  userAgentHash: varchar("user_agent_hash", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Zod schemas generated from Drizzle definitions
export const InsertAuditLogEventSchema = createInsertSchema(auditLogEvents);
export const SelectAuditLogEventSchema = createSelectSchema(auditLogEvents);

export type AuditLogEventInsert = z.infer<typeof InsertAuditLogEventSchema>;
export type AuditLogEventSelect = z.infer<typeof SelectAuditLogEventSchema>;
