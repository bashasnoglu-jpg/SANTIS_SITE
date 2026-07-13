import { z } from "zod";

export const ProgressStateKeySchema = z.enum([
  "NOT_APPLICABLE",
  "NOT_STARTED",
  "NORMAL",
  "DELAY_WARNING",
  "CRITICAL_DELAY",
  "COMPLETED",
]);
export type ProgressStateKey = z.infer<typeof ProgressStateKeySchema>;

export const ProgressStateSchema = z
  .object({
    state: ProgressStateKeySchema,
    elapsedMinutes: z.number().min(0).nullable(),
    totalMinutes: z.number().positive().nullable(),
    progressPercent: z.number().min(0).nullable(),
    delayMinutes: z.number().min(0).nullable(),
    expectedEnd: z.string().datetime({ offset: true }).nullable(),
  })
  .strict()
  .superRefine((value, ctx) => {
    const active = value.state === "NORMAL" || value.state === "DELAY_WARNING" || value.state === "CRITICAL_DELAY";
    if (active) {
      for (const field of ["elapsedMinutes", "totalMinutes", "progressPercent", "expectedEnd"] as const) {
        if (value[field] === null) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: [field],
            message: `${field} is required for active progress states.`,
          });
        }
      }
    }
    if ((value.state === "DELAY_WARNING" || value.state === "CRITICAL_DELAY") && value.delayMinutes === null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["delayMinutes"],
        message: "Delayed progress states require delayMinutes.",
      });
    }
  });
export type ProgressState = z.infer<typeof ProgressStateSchema>;
