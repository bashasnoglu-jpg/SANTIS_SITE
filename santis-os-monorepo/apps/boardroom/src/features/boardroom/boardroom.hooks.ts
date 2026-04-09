import { useState, useEffect, useMemo } from "react";
import type { TenantOption, BoardroomVipView, BoardroomViewModel, BoardroomPulseView } from "./boardroom.adapter";
import { createBoardroomViewModel } from "./boardroom.adapter";
import { RawBoardroomData } from "./mock/boardroom.mock";

export function useBoardroomData() {
  const [data, setData] = useState<RawBoardroomData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const response = await fetch("/api/v1/admin/boardroom/core-state");
        if (!response.ok) throw new Error("Connection Refusal");
        const json: RawBoardroomData = await response.json();
        setData(json);
        setError(null);
      } catch(e) {
        setError("Sovereign Core Disconnected");
      } finally {
        setLoading(false);
      }
    }
    loadData();
    const interval = setInterval(loadData, 4000);
    return () => clearInterval(interval);
  }, []);

  return { data, loading, error };
}

export function useBoardroomState({ tenants, initialActiveNav = "gods-eye" }: { tenants: TenantOption[], initialActiveNav?: string }) {
  const [activeNav, setActiveNav] = useState(initialActiveNav);
  const [selectedTenant, setSelectedTenant] = useState<TenantOption>(
    tenants[0] ?? { key: "global", label: "Global Facilities" }
  );
  useEffect(() => {
      // Re-assign selected tenant if tenants load lazily
      if (tenants.length > 0 && selectedTenant.key === "global" && tenants[0].key !== "global") {
          setSelectedTenant(tenants[0]);
      }
  }, [tenants, selectedTenant]);
  return { activeNav, setActiveNav, selectedTenant, setSelectedTenant };
}

export function useVipRadar(initialItems: BoardroomVipView[]) {
  const [vipItems, setVipItems] = useState<BoardroomVipView[]>(initialItems);
  const [acknowledgingIds, setAcknowledgingIds] = useState<string[]>([]);
  
  useEffect(() => {
    setVipItems((prev) => {
      return initialItems.map(item => {
        if(acknowledgingIds.includes(item.id)) return { ...item, state: 'acknowledged' };
        return item;
      });
    });
  }, [initialItems, acknowledgingIds]);

  function acknowledgeVip(id: string) {
    if (acknowledgingIds.includes(id)) return;
    setAcknowledgingIds((current) => [...current, id]);
    window.setTimeout(() => {
      setVipItems((current) => current.filter((item) => item.id !== id));
      setAcknowledgingIds((current) => current.filter((itemId) => itemId !== id));
    }, 1500);
  }

  const pendingCount = useMemo(
    () => vipItems.filter((item) => item.state === "pending").length,
    [vipItems]
  );
  return { vipItems, acknowledgingIds, pendingCount, acknowledgeVip };
}

export function usePulseStream({ initialEvents, intervalMs = 8000, maxItems = 8 }: { initialEvents: BoardroomPulseView[], intervalMs?: number, maxItems?: number }) {
  // We don't overwrite if the API continuously serves fresh lists.
  // The backend already limits it. So we just wrap the initialEvents.
  return { events: initialEvents };
}
