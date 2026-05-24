import { z } from "zod";
import { AuditLogEvents } from "./audit-log.events.js";

const FORBIDDEN_PAYLOAD_KEYS = [
  "password",
  "passwordHash",
  "accessToken",
  "refreshToken",
  "secret",
  "apiKey",
  "creditCard",
  "rawPaymentData"
];

function containsForbiddenKeys(obj: any): boolean {
  if (!obj || typeof obj !== "object") return false;
  
  if (Array.isArray(obj)) {
    return obj.some(containsForbiddenKeys);
  }
  
  for (const key of Object.keys(obj)) {
    if (FORBIDDEN_PAYLOAD_KEYS.includes(key)) return true;
    if (containsForbiddenKeys(obj[key])) return true;
  }
  
  return false;
}

const PayloadSchema = z.record(z.any())
  .default({})
  .refine(
    (val) => !containsForbiddenKeys(val),
    { message: "Payload contains forbidden security keys (e.g. password, token, secret)" }
  );

export const CreateAuditLogEntrySchema = z.object({
  tenantId: z.string().uuid(),
  actorType: z.enum(["user", "system", "service", "ai", "webhook"]),
  actorOperatorId: z.string().uuid().nullable().optional(),
  action: z.enum(AuditLogEvents),
  payload: PayloadSchema,
  payloadSchemaVersion: z.number().int().default(1),
  requestId: z.string().max(255).nullable().optional(),
  correlationId: z.string().max(255).nullable().optional(),
  ipHash: z.string().max(64).nullable().optional(),
  userAgentHash: z.string().max(64).nullable().optional(),
  source: z.enum(["api", "admin", "system", "worker", "webhook"]).nullable().optional(),
  resourceId: z.string().max(255).nullable().optional(),
  resourceType: z.string().max(255).nullable().optional(),
});

export const AuditLogEntrySchema = CreateAuditLogEntrySchema.extend({
  id: z.string().uuid(),
  createdAt: z.date(),
});

export const AuditLogQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
  action: z.enum(AuditLogEvents).optional(),
  actorType: z.enum(["user", "system", "service", "ai", "webhook"]).optional(),
  source: z.enum(["api", "admin", "system", "worker", "webhook"]).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional()
}).refine(data => {
  if (data.startDate && data.endDate) {
    return data.startDate <= data.endDate;
  }
  return true;
}, {
  message: "startDate cannot be after endDate",
  path: ["startDate"]
});

export const AuditLogResponseEnvelopeSchema = z.object({
  data: z.array(AuditLogEntrySchema),
  meta: z.object({
    total: z.number().int(),
    limit: z.number().int(),
    offset: z.number().int()
  })
});

export type CreateAuditLogEntry = z.infer<typeof CreateAuditLogEntrySchema>;
export type AuditLogEntry = z.infer<typeof AuditLogEntrySchema>;
export type AuditLogQuery = z.infer<typeof AuditLogQuerySchema>;
export type AuditLogResponseEnvelope = z.infer<typeof AuditLogResponseEnvelopeSchema>;

