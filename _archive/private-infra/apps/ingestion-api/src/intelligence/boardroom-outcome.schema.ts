import { z } from "zod";

export const BoardroomOutcomeLinkSchema = z.object({
  decisionId: z.string().min(1),
  revenueDelta: z.number().optional(),
  hesitationDelta: z.number().optional(),
  evaluatedAt: z.string().datetime()
});

export type BoardroomOutcomeLink = z.infer<typeof BoardroomOutcomeLinkSchema>;
