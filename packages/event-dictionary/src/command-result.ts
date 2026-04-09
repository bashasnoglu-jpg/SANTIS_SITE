import { z } from "zod";

export const CommandAckSchema = z.object({
  status: z.literal("ack"),
  commandId: z.string().uuid(),
  traceId: z.string().uuid(),
  acceptedAt: z.string().datetime(),
  mode: z.enum(["sync_completed", "accepted_for_async_processing"]),
  message: z.string().min(1).optional(),
  resultingEventTypes: z.array(z.string()).default([]),
  correlation: z.object({
    commandType: z.string(),
    resultingEventIds: z.array(z.string().uuid()).default([]),
  }).optional(),
});

export const CommandNackSchema = z.object({
  status: z.literal("nack"),
  commandId: z.string().uuid(),
  traceId: z.string().uuid(),
  rejectedAt: z.string().datetime(),
  reasonCode: z.enum([
    "validation_failed",
    "unauthorized",
    "forbidden",
    "conflict",
    "not_found",
    "rate_limited",
    "handler_failed",
    "unknown_command",
    "system_unavailable",
  ]),
  message: z.string().min(1),
  retryable: z.boolean(),
});

export const CommandResultSchema = z.discriminatedUnion("status", [
  CommandAckSchema,
  CommandNackSchema,
]);

export type CommandAck = z.infer<typeof CommandAckSchema>;
export type CommandNack = z.infer<typeof CommandNackSchema>;
export type CommandResult = z.infer<typeof CommandResultSchema>;
