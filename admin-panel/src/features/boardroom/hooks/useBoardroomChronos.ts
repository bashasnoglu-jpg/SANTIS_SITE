import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  getAuditLog,
  getSnapshots,
  reconstructAt,
} from "../api/boardroom.service";
import type {
  AuditLogEntry,
  BoardroomSnapshot,
} from "../types/boardroom.types";
import { useBoardroomMode } from "../context/BoardroomModeContext";

export function useBoardroomChronos() {
  const { mode, setMode } = useBoardroomMode();
  const [auditLog, setAuditLog] = useState<AuditLogEntry[]>([]);
  const [snapshots, setSnapshots] = useState<BoardroomSnapshot[]>([]);
  const [selectedAuditId, setSelectedAuditId] = useState<string | null>(null);
  const [selectedSnapshot, setSelectedSnapshot] = useState<BoardroomSnapshot | null>(null);
  const [isLoadingSnapshot, setIsLoadingSnapshot] = useState(false);
  const liveBufferRef = useRef<unknown[]>([]);

  const refreshTimeline = useCallback(async () => {
    try {
      const [nextAuditLog, nextSnapshots] = await Promise.all([
        getAuditLog(),
        getSnapshots(),
      ]);

      setAuditLog(nextAuditLog);
      setSnapshots(nextSnapshots);
    } catch (error) {
      console.error("[Chronos] Failed to refresh timeline:", error);
    }
  }, []);

  useEffect(() => {
    void refreshTimeline();

    const interval = window.setInterval(() => {
      if (mode === "LIVE") {
        void refreshTimeline();
      }
    }, 5000);

    return () => window.clearInterval(interval);
  }, [mode, refreshTimeline]);

  const timeline = useMemo(() => {
    return [...auditLog]
      .sort(
        (a, b) =>
          new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime()
      )
      .slice(0, 100);
  }, [auditLog]);

  const inspectAudit = useCallback(async (entry: AuditLogEntry) => {
    setMode("HISTORICAL");
    setSelectedAuditId(entry.id);
    setIsLoadingSnapshot(true);

    try {
      const snapshot = await reconstructAt(entry.occurredAt);
      setSelectedSnapshot(snapshot);
    } catch (error) {
      console.error("[Chronos] Failed to inspect audit:", error);
    } finally {
      setIsLoadingSnapshot(false);
    }
  }, [setMode]);

  const goLive = useCallback(async () => {
    setMode("LIVE");
    setSelectedAuditId(null);
    setSelectedSnapshot(null);
    liveBufferRef.current = [];
    await refreshTimeline();
  }, [setMode, refreshTimeline]);

  const isHistorical = mode === "HISTORICAL";

  return {
    mode,
    isHistorical,
    timeline,
    snapshots,
    selectedAuditId,
    selectedSnapshot,
    isLoadingSnapshot,
    inspectAudit,
    goLive,
  };
}
