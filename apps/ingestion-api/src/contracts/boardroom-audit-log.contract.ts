import { z } from 'zod';

export const BoardroomAuditEventTypeSchema = z.enum([
  'action.approved',
  'action.rejected'
]);

export const BoardroomAuditLogEntrySchema = z.object({
  id: z.string(),
  type: BoardroomAuditEventTypeSchema,
  actionId: z.string(),
  operatorId: z.string(),
  reason: z.string(),
  occurredAt: z.string()
});

export const BoardroomAuditLogResponseSchema = z.object({
  data: z.array(BoardroomAuditLogEntrySchema)
});

export const ErrorResponseSchema = z.object({
  error: z.string(),
  code: z.string(),
  message: z.string()
});
