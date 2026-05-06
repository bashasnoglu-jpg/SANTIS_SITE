/**
 * Phase 84.1 — Replay-Safe Temporal Oracle
 *
 * useOracleTimeline.ts
 *
 * Oracle sequence log üzerinde timeline scrubbing API'si.
 *
 * Scrubbing: Belirli bir seq veya timestamp'a "geri sarma" yapar.
 * Replay-safe: HISTORICAL mod ile entegre — scrub ederken live patch gelmez.
 *
 * Prensip: "Timeline sadece geri sarar, geriye dönemez."
 * (seq monotonicity korunur, scrubbing sadece görsel — state asla mutate edilmez)
 */

import { useState, useCallback, useMemo } from "react";
import type { OracleDeltaPatch } from "./useLiveOracle";

export interface OracleTimelineResult {
  /** Aktif görüntülenen patch (scrub pozisyonu veya latestDelta) */
  viewedPatch: OracleDeltaPatch | null;
  /** Şu an scrubbing modunda mı? */
  isScrubbing: boolean;
  /** Scrub pozisyonu (seq numarası, null = live head) */
  scrubPosition: number | null;
  /** Timeline'daki ilk seq */
  firstSeq: number | null;
  /** Timeline'daki son seq */
  lastSeq: number | null;
  /** Scrub: belirli bir seq'e git */
  scrubToSeq: (seq: number) => void;
  /** Scrub: belirli bir ts'e en yakın patch'e git */
  scrubToTimestamp: (ts: number) => void;
  /** Scrub'ı bırak → live head'e dön */
  exitScrub: () => void;
  /** Bir önceki delta'ya git */
  stepBack: () => void;
  /** Bir sonraki delta'ya git */
  stepForward: () => void;
}

export function useOracleTimeline(
  sequenceLog: OracleDeltaPatch[],
  latestDelta: OracleDeltaPatch | null
): OracleTimelineResult {
  const [scrubPosition, setScrubPosition] = useState<number | null>(null);
  const isScrubbing = scrubPosition !== null;

  // Seq'e göre sıralı log (defansif)
  const sortedLog = useMemo(
    () => [...sequenceLog].sort((a, b) => a.seq - b.seq),
    [sequenceLog]
  );

  const firstSeq = sortedLog[0]?.seq ?? null;
  const lastSeq = sortedLog[sortedLog.length - 1]?.seq ?? null;

  // Aktif görüntülenen patch
  const viewedPatch = useMemo<OracleDeltaPatch | null>(() => {
    if (!isScrubbing) return latestDelta;
    return sortedLog.find((p) => p.seq === scrubPosition) ?? null;
  }, [isScrubbing, scrubPosition, sortedLog, latestDelta]);

  const scrubToSeq = useCallback((seq: number) => {
    setScrubPosition(seq);
  }, []);

  const scrubToTimestamp = useCallback(
    (ts: number) => {
      // En yakın (≤ ts) patch'i bul
      const closest = [...sortedLog]
        .reverse()
        .find((p) => p.ts <= ts);
      if (closest) setScrubPosition(closest.seq);
    },
    [sortedLog]
  );

  const exitScrub = useCallback(() => {
    setScrubPosition(null);
  }, []);

  const stepBack = useCallback(() => {
    if (sortedLog.length === 0) return;

    const currentSeq = scrubPosition ?? (lastSeq ?? 0);
    const idx = sortedLog.findIndex((p) => p.seq === currentSeq);
    if (idx > 0) {
      setScrubPosition(sortedLog[idx - 1].seq);
    }
  }, [scrubPosition, sortedLog, lastSeq]);

  const stepForward = useCallback(() => {
    if (sortedLog.length === 0) return;

    if (!isScrubbing) return; // Live head'deyiz, ileri gidemeyiz

    const idx = sortedLog.findIndex((p) => p.seq === scrubPosition);
    if (idx >= 0 && idx < sortedLog.length - 1) {
      setScrubPosition(sortedLog[idx + 1].seq);
    } else if (idx === sortedLog.length - 1) {
      // Log sonuna geldik → live head'e dön
      setScrubPosition(null);
    }
  }, [isScrubbing, scrubPosition, sortedLog]);

  return {
    viewedPatch,
    isScrubbing,
    scrubPosition,
    firstSeq,
    lastSeq,
    scrubToSeq,
    scrubToTimestamp,
    exitScrub,
    stepBack,
    stepForward,
  };
}
