import { z } from "zod";

export const GuardStateSchema = z.enum([
  "NOT_EVALUATED",
  "PASS",
  "WARNING",
  "FAIL",
  "OVERRIDDEN",
]);
export type GuardState = z.infer<typeof GuardStateSchema>;

export const GuardSeveritySchema = z.enum(["WARNING", "FAIL"]);
export type GuardSeverity = z.infer<typeof GuardSeveritySchema>;

export const GuardTypeSchema = z.enum([
  "QUARANTINE",
  "CONFLICT",
  "BRANCH",
  "CAPABILITY",
  "PAYMENT",
  "LOCK",
  "DATA_QUALITY",
]);
export type GuardType = z.infer<typeof GuardTypeSchema>;

const OverrideAuditSchema = z
  .object({
    overriddenBy: z.string().min(1),
    overrideRole: z.string().min(1),
    overrideReason: z.string().min(1),
    overriddenAt: z.string().datetime({ offset: true }),
    overrideExpiresAt: z.string().datetime({ offset: true }).nullable(),
    correlationId: z.string().min(1),
  })
  .strict();

export const GuardResultSchema = z
  .object({
    guard: z.string().min(1),
    type: GuardTypeSchema,
    state: GuardStateSchema,
    severity: GuardSeveritySchema.nullable(),
    code: z.string().min(1).nullable(),
    message: z.string().min(1).nullable(),
    suggestedAction: z.string().min(1).nullable(),
    evaluatedAt: z.string().datetime({ offset: true }).nullable(),
    ruleVersion: z.string().min(1),
    override: OverrideAuditSchema.nullable().default(null),
  })
  .strict()
  .superRefine((value, ctx) => {
    const alertState = value.state === "WARNING" || value.state === "FAIL";
    if (alertState && value.severity === null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["severity"],
        message: "WARNING and FAIL guard results require severity.",
      });
    }
    if (!alertState && value.severity !== null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["severity"],
        message: "Only WARNING and FAIL guard results may carry severity.",
      });
    }
    if (alertState && value.code === null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["code"],
        message: "WARNING and FAIL guard results require a stable reason code.",
      });
    }
    if (value.state === "OVERRIDDEN" && value.override === null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["override"],
        message: "OVERRIDDEN guard results require immutable override metadata.",
      });
    }
  });
export type GuardResult = z.infer<typeof GuardResultSchema>;
