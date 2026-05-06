import { useMemo } from "react";
import type { BoardroomViewModel } from "./boardroom.adapter";
import { createBoardroomIntelligenceSnapshot } from "./boardroom.intelligence";

export function useBoardroomIntelligence(vm: BoardroomViewModel) {
  return useMemo(() => {
    return createBoardroomIntelligenceSnapshot({
      metrics: vm.metrics,
      intents: vm.intents,
      frictionRows: vm.frictionRows,
      therapists: vm.therapists,
      vipItems: vm.vipItems,
    });
  }, [vm]);
}
