import { z } from "zod";
import { GuardSeveritySchema } from "./booking-guard.schema.js";

export const ActionPrioritySchema = z.enum(["P0", "P1", "P2", "P3", "P4", "P5"]);
export type ActionPriority = z.infer<typeof ActionPrioritySchema>;

export const ActionReasonSchema = z
  .object({
    code: z.string().min(1),
    priority: ActionPrioritySchema,
    severity: GuardSeveritySchema,
    source: z.string().min(1),
    message: z.string().min(1),
    action: z.string().min(1),
  })
  .strict();
export type ActionReason = z.infer<typeof ActionReasonSchema>;

export const ActionPriorityResultSchema = z
  .object({
    highest_priority: ActionPrioritySchema.nullable(),
    reasons: z.array(ActionReasonSchema),
  })
  .strict()
  .superRefine((value, ctx) => {
    if (value.reasons.length === 0 && value.highest_priority !== null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["highest_priority"],
        message: "highest_priority must be null when reasons is empty.",
      });
    }
    if (value.reasons.length > 0 && value.highest_priority === null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["highest_priority"],
        message: "highest_priority is required when reasons exist.",
      });
    }
    if (
      value.reasons.length > 0 &&
      value.highest_priority !== null &&
      value.reasons[0]?.priority !== value.highest_priority
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["highest_priority"],
        message: "highest_priority must match the first deterministically sorted reason.",
      });
    }
  });
export type ActionPriorityResult = z.infer<typeof ActionPriorityResultSchema>;
