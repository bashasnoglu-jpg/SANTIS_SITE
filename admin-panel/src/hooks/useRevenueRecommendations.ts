// admin-panel/src/hooks/useRevenueRecommendations.ts

import { useEffect, useState } from "react";

export function useRevenueRecommendations() {
  const [data, setData] = useState<{ ranked: any[]; resolved: any | null; temporal: any | null; curve: any | null }>({
    ranked: [],
    resolved: null,
    temporal: null,
    curve: null,
  });

  useEffect(() => {
    fetch("/api/v1/revenue/recommendations")
      .then((res) => res.json())
      .then((json) => {
        if (Array.isArray(json)) {
          // fallback for older structure if needed
          setData({ ranked: json, resolved: null, temporal: null, curve: null });
        } else {
          setData({ 
            ranked: json.ranked || [], 
            resolved: json.resolved || null,
            temporal: json.temporal || null,
            curve: json.curve || null
          });
        }
      })
      .catch((err) => console.error("Failed to fetch revenue recommendations:", err));
  }, []);

  return data;
}
