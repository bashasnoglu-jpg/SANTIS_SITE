import { useEffect, useState } from 'react';
import { fetchOptimizerRecommendations } from '../lib/policy-optimizer/optimizer.client.ts';

export function usePolicyOptimizer() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    fetchOptimizerRecommendations()
      .then((result) => {
        if (active) setData(result.output);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return { data, loading };
}
