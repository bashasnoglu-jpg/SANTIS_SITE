/**
 * Phase 84.1 — Replay-Safe Temporal Oracle
 *
 * useLiveOracle.ts (v2)
 *
 * Phase 84'ten farklar:
 * 1. seq monotonicity enforcement — stale/duplicate patch'ler drop edilir
 * 2. LIVE ↔ HISTORICAL reconciliation — mode geçişinde buffer doğru uygulanır
 * 3. Oracle sequence log — son N delta korunur (timeline scrubbing için)
 * 4. Gap detection — seq atlama tespiti
 *
 * Prensip: "Temporal Oracle asla geri gitmez."
 */

import { useState, useEffect, useRef, useCallback } from "react";
import type { CognitiveDecisionEnvelope } from "../types/boardroom.types";
import { useBoardroomMode } from "../context/BoardroomModeContext";

const SSE_BASE =
  (import.meta as unknown as { env: Record<string, string | undefined> }).env
    .VITE_INGESTION_API_BASE_URL ?? "http://localhost:3030/api/v1";

// Sequence log'da tutulacak maksimum delta sayısı
const MAX_SEQUENCE_LOG = 50;

export interface OracleDeltaPatch {
  actionId: string;
  envelope: CognitiveDecisionEnvelope;
  seq: number;
  ts: number;
}

interface RawOracleDeltaPayload {
  event: "oracle_delta";
  data: {
    seq: number;
    ts: number;
    scope: "oracle_delta";
    patch: {
      actionId: string;
      envelope: CognitiveDecisionEnvelope;
    };
  };
}

export type OracleConnectionStatus =
  | "connecting"
  | "connected"
  | "error"
  | "offline"
  | "gap_detected";

export interface UseLiveOracleResult {
  /** En son geçerli Oracle delta patch */
  latestDelta: OracleDeltaPatch | null;
  /** SSE bağlantı durumu */
  connectionStatus: OracleConnectionStatus;
  /** Alınan toplam delta sayısı (dropped dahil değil) */
  deltaCount: number;
  /** Drop edilen stale/duplicate patch sayısı */
  droppedCount: number;
  /** Son N delta — timeline scrubbing için */
  sequenceLog: OracleDeltaPatch[];
  /** En son doğrulanan seq numarası */
  lastSeq: number;
}

export function useLiveOracle(watchActionId?: string): UseLiveOracleResult {
  const { mode } = useBoardroomMode();

  const [latestDelta, setLatestDelta] = useState<OracleDeltaPatch | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<OracleConnectionStatus>("offline");
  const [deltaCount, setDeltaCount] = useState(0);
  const [droppedCount, setDroppedCount] = useState(0);
  const [sequenceLog, setSequenceLog] = useState<OracleDeltaPatch[]>([]);

  // ── Monotonicity state (mutable ref, re-render tetiklemez) ──
  const lastSeqRef = useRef<number>(0);
  const lastTsRef = useRef<number>(0);

  // ── HISTORICAL mod tamponu ──
  const pendingBuffer = useRef<OracleDeltaPatch[]>([]);

  // ── Sequence log (mutable, setSequenceLog ile sync edilir) ──
  const logRef = useRef<OracleDeltaPatch[]>([]);

  const appendToLog = (patch: OracleDeltaPatch) => {
    logRef.current = [...logRef.current, patch].slice(-MAX_SEQUENCE_LOG);
    setSequenceLog([...logRef.current]);
  };

  const applyPatch = useCallback(
    (patch: OracleDeltaPatch) => {
      // ── Monotonicity Gate: stale veya duplicate drop ──────────
      if (patch.seq <= lastSeqRef.current) {
        setDroppedCount((n) => n + 1);
        console.debug(
          `[OracleRail] DROP — stale seq=${patch.seq} (last=${lastSeqRef.current})`
        );
        return;
      }

      // ── Gap Detection ─────────────────────────────────────────
      if (patch.seq > lastSeqRef.current + 1 && lastSeqRef.current > 0) {
        const gap = patch.seq - lastSeqRef.current - 1;
        console.warn(
          `[OracleRail] GAP DETECTED — missed ${gap} seq(s) between ` +
          `${lastSeqRef.current} → ${patch.seq}`
        );
        setConnectionStatus("gap_detected");
        // Gap tespiti akışı kesmez — devam edilir
      }

      // ── actionId filtresi ─────────────────────────────────────
      if (watchActionId && patch.actionId !== watchActionId) {
        // Takip edilmeyen actionId — seq güncelle ama UI'ı tetikleme
        lastSeqRef.current = patch.seq;
        lastTsRef.current = patch.ts;
        return;
      }

      // ── State güncelle ────────────────────────────────────────
      lastSeqRef.current = patch.seq;
      lastTsRef.current = patch.ts;
      setLatestDelta(patch);
      setDeltaCount((n) => n + 1);
      appendToLog(patch);

      if (connectionStatus !== "connected") {
        setConnectionStatus("connected");
      }
    },
    [watchActionId, connectionStatus]
  );

  const handleIncoming = useCallback(
    (patch: OracleDeltaPatch) => {
      if (mode === "HISTORICAL") {
        // Temporal Isolation: buffer'la, uygulama
        pendingBuffer.current.push(patch);
        return;
      }
      applyPatch(patch);
    },
    [mode, applyPatch]
  );

  // ── LIVE moduna dönüşte: buffer'daki son geçerli patch'i uygula ──
  useEffect(() => {
    if (mode === "LIVE" && pendingBuffer.current.length > 0) {
      // Sadece son patch'i uygula (optimistic reconciliation)
      // Ara patch'ler seq log'una eklenirken son durum UI'ya yansır
      const buffered = [...pendingBuffer.current].sort((a, b) => a.seq - b.seq);
      pendingBuffer.current = [];

      // Tüm buffer'ı sıralı uygula
      buffered.forEach(applyPatch);
    }
  }, [mode, applyPatch]);

  // ── SSE bağlantısı ──────────────────────────────────────────────
  useEffect(() => {
    const url = `${SSE_BASE}/streams/oracle`;
    setConnectionStatus("connecting");

    const es = new EventSource(url);

    es.addEventListener("oracle_delta", (e: MessageEvent) => {
      try {
        const raw = JSON.parse(e.data) as RawOracleDeltaPayload;
        const patch: OracleDeltaPatch = {
          actionId: raw.data.patch.actionId,
          envelope: raw.data.patch.envelope,
          seq: raw.data.seq,
          ts: raw.data.ts,
        };
        handleIncoming(patch);
      } catch {
        // Malformed payload — sessizce geç
      }
    });

    es.addEventListener("oracle_ready", () => {
      setConnectionStatus("connected");
    });

    es.addEventListener("heartbeat", () => {
      if (connectionStatus !== "gap_detected") {
        setConnectionStatus("connected");
      }
    });

    es.onopen = () => setConnectionStatus("connected");
    es.onerror = () => setConnectionStatus("error");

    return () => {
      es.close();
      setConnectionStatus("offline");
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    latestDelta,
    connectionStatus,
    deltaCount,
    droppedCount,
    sequenceLog,
    lastSeq: lastSeqRef.current,
  };
}
