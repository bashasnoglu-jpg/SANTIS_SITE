import {
  type GuardResult,
  GuardResultSchema,
  type GuardState,
  type GuardType,
} from "@santis/domain-schema";

export type RawGuardInput = {
  guard: string;
  type: GuardType;
  state?: GuardState;
  code?: string | null;
  message?: string | null;
  suggestedAction?: string | null;
  evaluatedAt?: string | null;
  ruleVersion?: string;
};

export function resolveGuardStates(
  rawGuards: readonly RawGuardInput[] = [],
): GuardResult[] {
  return rawGuards.map((guard) => {
    const state = guard.state ?? "NOT_EVALUATED";
    const severity =
      state === "WARNING" || state === "FAIL" ? state : null;

    return GuardResultSchema.parse({
      guard: guard.guard,
      type: guard.type,
      state,
      severity,
      code: guard.code ?? null,
      message: guard.message ?? null,
      suggestedAction: guard.suggestedAction ?? null,
      evaluatedAt: guard.evaluatedAt ?? null,
      ruleVersion: guard.ruleVersion ?? "1.0",
      override: null,
    });
  });
}
