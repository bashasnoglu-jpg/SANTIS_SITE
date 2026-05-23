import { z } from 'zod';

export const auditLogItemSchema = z.object({
  id: z.string().uuid().or(z.string()), // UUID or ULID
  type: z.enum(['action.approved', 'action.rejected']),
  actionId: z.string(),
  operatorId: z.string(),
  reason: z.string(),
  occurredAt: z.string().datetime() // ISO 8601
});

export const auditLogResponseSchema = z.object({
  data: z.array(auditLogItemSchema)
});

export const apiErrorSchema = z.object({
  error: z.string(),
  code: z.string(),
  message: z.string()
});

export type AuditLogResponse = z.infer<typeof auditLogResponseSchema>;
export type ApiError = z.infer<typeof apiErrorSchema>;
