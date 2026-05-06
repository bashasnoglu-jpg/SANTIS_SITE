/**
 * Phase 84 — Live Oracle Stream
 *
 * useLiveOracle.ts
 *
 * SSE oracle_delta event'ini dinleyen React hook.
 * Bağlı CognitiveOverlay'leri gerçek zamanlı olarak günceller.
 *
 * Temporal Isolation Garantisi:
 * HISTORICAL modda SSE patch'leri tamponlanır, uygulanmaz.
 * Sadece LIVE modda gerçek zamanlı güncelleme aktif olur.
 */

import { useState, useEffect, useRef, useCallback } from "react";
import type { CognitiveDecisionEnvelope } from "../types/boardroom.types";
import { useBoardroomMode } from "../context/BoardroomModeContext";

const SSE_BASE =
  (import.meta as unknown as { env: Record<string, string | undefined> }).env
    .VITE_INGESTION_API_BASE_URL ?? "http://localhost:3030/api/v1";

interface OracleDeltaPatch {
  actionId: string;
  envelope: CognitiveDecisionEnvelope;
}

interface OracleDeltaEvent {
  event: "oracle_delta";
  data: {
    seq: number;
    ts: number;
    scope: "oracle_delta";
    patch: OracleDeltaPatch;
  };
}

interface UseLiveOracleResult {
  /** En son gelen Oracle delta patch */
  latestDelta: OracleDeltaPatch | null;
  /** SSE bağlantı durumu */
  connectionStatus: "connecting" | "connected" | "error" | "offline";
  /** Kaç delta alındı */
  deltaCount: number;
}

export function useLiveOracle(watchActionId?: string): UseLiveOracleResult {
  const { mode } = useBoardroomMode();
  const [latestDelta, setLatestDelta] = useState<OracleDeltaPatch | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<UseLiveOracleResult["connectionStatus"]>("offline");
  const [deltaCount, setDeltaCount] = useState(0);

  // HISTORICAL modda gelen delta'ları tamponla, uygulama
  const pendingBuffer = useRef<OracleDeltaPatch[]>([]);
  const esRef = useRef<EventSource | null>(null);

  const handleDelta = useCallback(
    (patch: OracleDeltaPatch) => {
      // Temporal Isolation: HISTORICAL modda UI'ı güncelleme
      if (mode === "HISTORICAL") {
        pendingBuffer.current.push(patch);
        return;
      }

      // Belirli bir actionId izleniyorsa filtrele
      if (watchActionId && patch.actionId !== watchActionId) return;

      setLatestDelta(patch);
      setDeltaCount((n) => n + 1);
    },
    [mode, watchActionId]
  );

  // LIVE moda döndüğünde buffer'ı uygula
  useEffect(() => {
    if (mode === "LIVE" && pendingBuffer.current.length > 0) {
      const last = pendingBuffer.current[pendingBuffer.current.length - 1];
      setLatestDelta(last);
      setDeltaCount((n) => n + pendingBuffer.current.length);
      pendingBuffer.current = [];
    }
  }, [mode]);

  // SSE bağlantısı
  useEffect(() => {
    const url = `${SSE_BASE}/streams/oracle`;
    setConnectionStatus("connecting");

    const es = new EventSource(url);
    esRef.current = es;

    es.addEventListener("oracle_delta", (e: MessageEvent) => {
      try {
        const parsed = JSON.parse(e.data) as OracleDeltaEvent;
        handleDelta(parsed.data.patch);
      } catch {
        // Malformed delta — sessizce geç
      }
    });

    es.addEventListener("heartbeat", () => {
      setConnectionStatus("connected");
    });

    es.onopen = () => setConnectionStatus("connected");

    es.onerror = () => {
      setConnectionStatus("error");
    };

    return () => {
      es.close();
      esRef.current = null;
      setConnectionStatus("offline");
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return { latestDelta, connectionStatus, deltaCount };
}
