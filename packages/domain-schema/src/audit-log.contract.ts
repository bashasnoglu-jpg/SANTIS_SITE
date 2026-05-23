import { z } from "zod";

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
  actorId: z.string().uuid().nullable().optional(),
  operatorId: z.string().uuid().nullable().optional(),
  event: z.string().max(255),
  payload: PayloadSchema,
  payloadSchemaVersion: z.number().int().default(1),
  requestId: z.string().max(255).nullable().optional(),
  correlationId: z.string().max(255).nullable().optional(),
  ipAddress: z.string().max(64).nullable().optional(),
  userAgent: z.string().max(255).nullable().optional(),
  source: z.enum(["api", "admin", "system", "worker", "webhook"]).optional(),
});

export const AuditLogEntrySchema = CreateAuditLogEntrySchema.extend({
  id: z.string().uuid(),
  createdAt: z.date(),
});

export type CreateAuditLogEntry = z.infer<typeof CreateAuditLogEntrySchema>;
export type AuditLogEntry = z.infer<typeof AuditLogEntrySchema>;

