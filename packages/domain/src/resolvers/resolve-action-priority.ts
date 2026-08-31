import type {
  ActionPriority,
  ActionPriorityResult,
  GuardResult,
  GuardType,
} from "@santis-core/domain-contracts";
import { ActionPriorityResultSchema } from "@santis-core/domain-contracts";

const PRIORITY_RANK: Record<ActionPriority, number> = {
  P0: 0,
  P1: 1,
  P2: 2,
  P3: 3,
  P4: 4,
  P5: 5,
};

const TYPE_ORDER: Record<GuardType, number> = {
  QUARANTINE: 0,
  CONFLICT: 1,
  BRANCH: 2,
  CAPABILITY: 3,
  PAYMENT: 4,
  LOCK: 5,
  DATA_QUALITY: 6,
};

function priorityFor(guard: GuardResult): ActionPriority {
  if (guard.type === "QUARANTINE" && guard.state === "FAIL") return "P0";
  if (guard.type === "CONFLICT") {
    return guard.state === "FAIL" && guard.code === "CONFLICT_HARD_OVERLAP"
      ? "P0"
      : "P1";
  }
  if (guard.type === "BRANCH" || guard.type === "CAPABILITY") return "P1";
  if (guard.type === "PAYMENT") return "P2";
  if (guard.type === "LOCK") return "P3";
  return "P5";
}

export function resolveActionPriority(
  guards: readonly GuardResult[],
): ActionPriorityResult {
  const reasons = guards
    .filter((guard) => guard.state === "WARNING" || guard.state === "FAIL")
    .map((guard) => ({
      code: guard.code ?? `${guard.type}_${guard.state}`,
      priority: priorityFor(guard),
      severity: guard.state,
      source: guard.guard,
      message: guard.message ?? guard.code ?? guard.guard,
      action: guard.suggestedAction ?? "REVIEW",
      typeOrder: TYPE_ORDER[guard.type],
    }))
    .sort((a, b) => {
      return (
        PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] ||
        (a.severity === b.severity ? 0 : a.severity === "FAIL" ? -1 : 1) ||
        a.typeOrder - b.typeOrder ||
        a.code.localeCompare(b.code)
      );
    })
    .map(({ typeOrder: _typeOrder, ...reason }) => reason);

  return ActionPriorityResultSchema.parse({
    highest_priority: reasons[0]?.priority ?? null,
    reasons,
  });
}
