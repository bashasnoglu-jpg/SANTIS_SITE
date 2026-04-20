import { useCallback, useMemo, useState } from "react";
import type { SovereignAction } from "../engine/action-engine.types";
import { transitionActionStatus } from "../engine/action-engine";

type ApplyPatchResult = {
  ok: boolean;
  patchId: string;
  appliedAt: string;
};

type ApplyPatchFn = (action: SovereignAction) => Promise<ApplyPatchResult>;

export function useSovereignActionRail(
  initialActions: SovereignAction[],
  applyPatch: ApplyPatchFn
) {
  const [actions, setActions] = useState<SovereignAction[]>(initialActions);

  const updateAction = useCallback(
    (actionId: string, updater: (action: SovereignAction) => SovereignAction) => {
      setActions((prev) =>
        prev.map((action) => (action.id === actionId ? updater(action) : action))
      );
    },
    []
  );

  const acknowledge = useCallback(
    (actionId: string) => {
      updateAction(actionId, (action) => {
        if (action.status !== "new") return action;
        return transitionActionStatus(action, "acknowledged");
      });
    },
    [updateAction]
  );

  const reject = useCallback(
    (actionId: string) => {
      updateAction(actionId, (action) => {
        if (action.status !== "new" && action.status !== "acknowledged") {
          return action;
        }
        return transitionActionStatus(action, "rejected");
      });
    },
    [updateAction]
  );

  const approve = useCallback(
    async (actionId: string) => {
      const target = actions.find((item) => item.id === actionId);
      if (!target) return;

      if (!target.requiresApproval) return;

      let approvedAction: SovereignAction | null = null;

      updateAction(actionId, (action) => {
        if (action.status !== "new" && action.status !== "acknowledged") {
          return action;
        }
        approvedAction = transitionActionStatus(action, "approved");
        return approvedAction;
      });

      if (!approvedAction) return;

      const result = await applyPatch(approvedAction);

      if (!result.ok) return;

      updateAction(actionId, (action) => {
        if (action.status !== "approved") return action;
        return transitionActionStatus(action, "applied");
      });
    },
    [actions, applyPatch, updateAction]
  );

  const stats = useMemo(() => {
    const total = actions.length;
    const byStatus = {
      new: actions.filter((a) => a.status === "new").length,
      acknowledged: actions.filter((a) => a.status === "acknowledged").length,
      approved: actions.filter((a) => a.status === "approved").length,
      rejected: actions.filter((a) => a.status === "rejected").length,
      applied: actions.filter((a) => a.status === "applied").length,
    };

    return { total, byStatus };
  }, [actions]);

  return {
    actions,
    stats,
    acknowledge,
    reject,
    approve,
    setActions,
  };
}
