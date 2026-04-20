import { useMemo } from 'react';
import { deriveBoardroomIntelligence } from '../lib/boardroom-intelligence/intelligence.adapter.ts';

export function useBoardroomIntelligence(events: any[]) {
  return useMemo(() => {
    return deriveBoardroomIntelligence({ events });
  }, [events]);
}
