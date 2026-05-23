import { z } from "zod";

export const AuditLogEventSchema = z.object({
  id: z.string().uuid().optional(),
  tenantId: z.string().uuid(),
  actorType: z.enum(["user", "system", "service", "ai", "webhook"]),
  actorId: z.string().uuid().nullable().optional(),
  operatorId: z.string().uuid().nullable().optional(),
  event: z.string().max(255),
  payload: z.record(z.any()).default({}),
  payloadSchemaVersion: z.number().int().default(1),
  requestId: z.string().max(255).nullable().optional(),
  correlationId: z.string().max(255).nullable().optional(),
  ipAddress: z.string().max(64).nullable().optional(),
  userAgent: z.string().max(255).nullable().optional(),
  source: z.enum(["api", "admin", "system", "worker", "webhook"]).optional(),
  createdAt: z.date().optional(),
});

export type AuditLogEvent = z.infer<typeof AuditLogEventSchema>;
