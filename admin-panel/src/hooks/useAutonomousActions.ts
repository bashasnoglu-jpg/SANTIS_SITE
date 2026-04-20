import { useMemo } from 'react';
import { deriveAutonomousActions } from '../lib/autonomous-actions/actions.adapter.ts';

export function useAutonomousActions(input: any) {
  return useMemo(() => deriveAutonomousActions(input), [input]);
}
