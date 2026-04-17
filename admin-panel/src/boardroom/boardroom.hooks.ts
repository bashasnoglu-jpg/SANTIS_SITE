import { useEffect, useState } from 'react';
import type { ResourceEnvelope } from '../types/resource-envelope';

export type CoreState = Record<string, unknown>;

export function useBoardroomCoreState() {
  const [resource, setResource] = useState<ResourceEnvelope<CoreState>>({
    origin: 'loading',
    data: null,
    error: null
  });

  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        const res = await fetch('/api/v1/core-state', {
          headers: { Accept: 'application/json' }
        });

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }

        const json = await res.json();

        if (cancelled) return;

        setResource({
          origin: 'real',
          data: json,
          fetchedAt: Date.now(),
          error: null
        });
      } catch (error) {
        if (cancelled) return;

        setResource({
          origin: 'error',
          data: null,
          error: error instanceof Error ? error.message : 'Unknown fetch failure'
        });
      }
    }

    run();

    return () => {
      cancelled = true;
    };
  }, []);

  return resource;
}
