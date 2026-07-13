import { z } from "zod";
import {
  BookingStatusSchema,
  GuestPrioritySchema,
  ServiceCategorySchema,
} from "./booking.schema.js";
import { ActionPrioritySchema } from "./booking-action.schema.js";
import { GuardSeveritySchema, GuardTypeSchema } from "./booking-guard.schema.js";
import { ProgressStateKeySchema } from "./booking-progress.schema.js";

export const GuardBadgeSchema = z
  .object({
    type: GuardTypeSchema,
    severity: GuardSeveritySchema,
    code: z.string().min(1),
    label: z.string().min(1),
  })
  .strict();
export type GuardBadge = z.infer<typeof GuardBadgeSchema>;

export const VisualStateSchema = z
  .object({
    statusKey: BookingStatusSchema,
    categoryKey: ServiceCategorySchema,
    guestPriority: GuestPrioritySchema,
    actionPriority: ActionPrioritySchema.nullable(),
    progressPercent: z.number().min(0).nullable(),
    progressState: ProgressStateKeySchema,
    progressLabel: z.string().min(1).nullable(),
    badges: z.array(GuardBadgeSchema),
  })
  .strict()
  .superRefine((value, ctx) => {
    if (value.statusKey !== "IN_PROGRESS" && value.progressPercent !== null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["progressPercent"],
        message: "Progress is visible only when statusKey is IN_PROGRESS.",
      });
    }
    if (value.statusKey !== "IN_PROGRESS" && value.progressLabel !== null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["progressLabel"],
        message: "Progress labels are visible only when statusKey is IN_PROGRESS.",
      });
    }
  });
export type VisualState = z.infer<typeof VisualStateSchema>;
