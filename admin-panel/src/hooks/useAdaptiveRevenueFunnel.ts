import { useMemo } from 'react';
import { deriveAdaptiveRevenueFunnel } from '../lib/adaptive-funnel/funnel.adapter.ts';

export function useAdaptiveRevenueFunnel(input: any) {
  return useMemo(() => deriveAdaptiveRevenueFunnel(input), [input]);
}
