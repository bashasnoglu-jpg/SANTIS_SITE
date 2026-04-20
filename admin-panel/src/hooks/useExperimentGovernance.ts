import { useMemo } from 'react';

export function useExperimentGovernance(experiments: any[]) {
  return useMemo(() => {
    const running = experiments.filter((e) => e.status === 'running');
    const completed = experiments.filter((e) => e.status === 'completed');
    const paused = experiments.filter((e) => e.status === 'paused');

    return {
      total: experiments.length,
      runningCount: running.length,
      completedCount: completed.length,
      pausedCount: paused.length,
      running,
      completed,
      paused,
    };
  }, [experiments]);
}
