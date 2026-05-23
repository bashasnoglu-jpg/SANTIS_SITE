import { z } from "zod";

export const AuditLogActionSchema = z.enum([
  "LOGIN",
  "LOGOUT",
  "CREATE_RESERVATION",
  "UPDATE_TENANT_SETTINGS",
  "DELETE_RESOURCE",
  "VIEW_AUDIT_LOG",
  // Add canonical actions as needed
]);

export const AuditLogEventSchema = z.object({
  id: z.string().uuid().optional(), // Optional on insert
  tenantId: z.string().uuid(),
  actorOperatorId: z.string().uuid(),
  action: AuditLogActionSchema,
  resourceType: z.string().max(128),
  resourceId: z.string().max(255).nullable().optional(),
  payloadJson: z.record(z.any()).default({}),
  ipHash: z.string().length(64).nullable().optional(),
  userAgentHash: z.string().length(64).nullable().optional(),
  createdAt: z.date().optional(),
});

export type AuditLogAction = z.infer<typeof AuditLogActionSchema>;
export type AuditLogEvent = z.infer<typeof AuditLogEventSchema>;
