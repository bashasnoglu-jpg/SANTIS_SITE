import { useCallback, useMemo, useState } from 'react';
import { mapActionsToConsoleQueue } from '../lib/control-console/console.adapter.ts';

export function useControlConsole(actions: any[]) {
  const [decisions, setDecisions] = useState<any[]>([]);

  const queue = useMemo(() => mapActionsToConsoleQueue(actions), [actions]);

  const applyDecision = useCallback((decision: any) => {
    setDecisions((prev) => [...prev, decision]);
  }, []);

  const resolvedQueue = useMemo(() => {
    return queue.map((item) => {
      const lastDecision = [...decisions]
        .reverse()
        .find((d) => d.actionId === item.id);

      if (!lastDecision) return item;

      if (lastDecision.decision === 'APPROVE') {
        return { ...item, status: 'approved' };
      }
      if (lastDecision.decision === 'REJECT') {
        return { ...item, status: 'rejected' };
      }
      if (lastDecision.decision === 'OVERRIDE') {
        return { ...item, status: 'overridden' };
      }
      if (lastDecision.decision === 'DISMISS') {
        return { ...item, status: 'expired' };
      }

      return item;
    });
  }, [queue, decisions]);

  return {
    queue: resolvedQueue,
    decisions,
    applyDecision,
  };
}
