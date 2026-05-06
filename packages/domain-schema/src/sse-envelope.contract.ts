import { z } from "zod";

/**
 * Santis SSE Core Law: 
 * Every message must have a sequence ID (seq) for gap detection,
 * a timestamp (ts), a scope for selective UI updates, and the patch payload.
 */
export const SsePatchEnvelopeSchema = z.object({
  event: z.enum(["strategy_update", "command_ack", "action_rail_update", "oracle_delta"]),
  data: z.object({
    seq: z.number(),
    ts: z.number(),
    scope: z.enum(["strategy", "revenue", "core_state", "command", "action_rail", "oracle_delta"]),
    patch: z.record(z.any())
  })
});

export type SsePatchEnvelope = z.infer<typeof SsePatchEnvelopeSchema>;
