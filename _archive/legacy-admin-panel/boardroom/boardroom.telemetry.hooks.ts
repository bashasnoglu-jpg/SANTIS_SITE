/**
 * boardroom/boardroom.telemetry.hooks.ts
 * React hooks — REST polling + WS live pulse birleşimi.
 *
 * useboardroomSummary()     → 10s polling
 * useBoardroomIncidents()   → 15s polling
 * useBoardroomLiveFeed()    → 5s polling + WS inject
 * useBoardroomQuota()       → 60s polling
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { boardroomAdapter, type AuditEvent, type BoardroomSummary,
         type Incident, type QuotaPressureRow } from './boardroom.telemetry.adapter.js';
import SantisWS from '../../assets/js/core/santis-ws-manager.js';

// ─── Yardımcı: interval polling ───────────────────────────────────────────────
function usePolling<T>(
  fetcher: () => Promise<T>,
  intervalMs: number,
  initial: T,
): { data: T; error: string | null; loading: boolean } {
  const [data,    setData]    = useState<T>(initial);
  const [error,   setError]   = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const mountedRef = useRef(false);

  const run = useCallback(async () => {
    try {
      const result = await fetcher();
      if (mountedRef.current) { setData(result); setError(null); }
    } catch (e: any) {
      if (mountedRef.current) setError(e?.message ?? 'Fetch hatası');
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [fetcher]);

  useEffect(() => {
    mountedRef.current = true;
    run();
    const timer = setInterval(run, intervalMs);
    return () => { mountedRef.current = false; clearInterval(timer); };
  }, [run, intervalMs]);

  return { data, error, loading };
}

// ─── Hook 1: Summary (4 kart) ─────────────────────────────────────────────────
export function useBoardroomSummary() {
  return usePolling<BoardroomSummary>(
    boardroomAdapter.getSummary,
    10_000,
    { deniedLastHour: 0, activeIncidents: 0, finalizedBytesToday: 0, reaperCleanupsDay: 0, generatedAt: '' }
  );
}

// ─── Hook 2: Incidents ────────────────────────────────────────────────────────
export function useBoardroomIncidents(status = 'OPEN') {
  const fetcher = useCallback(
    () => boardroomAdapter.getIncidents({ status, limit: 50 }).then(r => r.incidents),
    [status]
  );
  return usePolling<Incident[]>(fetcher, 15_000, []);
}

// ─── Hook 3: Live Feed (REST + WS inject) ─────────────────────────────────────
const FEED_TYPES = new Set([
  'UPLOAD_DENIED', 'UPLOAD_FINALIZE_REJECTED', 'UPLOAD_FINALIZED',
  'UPLOAD_ORPHAN_REAPED', 'REAPER_ERROR', 'UPLOAD_GOVERNOR_ERROR',
]);

export function useBoardroomLiveFeed(maxEvents = 100) {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const mountedRef = useRef(false);

  // REST ile başlat ve her 5s yenile
  useEffect(() => {
    mountedRef.current = true;

    const load = async () => {
      try {
        const { events: fresh } = await boardroomAdapter.getLiveFeed({ limit: maxEvents });
        if (mountedRef.current) setEvents(fresh);
      } catch (_) {}
    };

    load();
    const timer = setInterval(load, 5_000);
    return () => { mountedRef.current = false; clearInterval(timer); };
  }, [maxEvents]);

  // WS ile canlı inject — REST yenilemeyi beklemeden anlık görünür
  useEffect(() => {
    const offs = [...FEED_TYPES].map(type =>
      SantisWS.on(type, (envelope: any) => {
        if (!mountedRef.current) return;
        const syntheticEvent: AuditEvent = {
          id:            `ws-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          event_type:    type,
          severity:      envelope.payload?.severity ?? (type.includes('ERROR') ? 'ERROR' : 'WARN'),
          upload_id:     envelope.payload?.uploadId  ?? null,
          file_id:       envelope.payload?.fileId    ?? null,
          subject:       envelope.payload?.subject   ?? null,
          tenant_id:     envelope.payload?.tenantId  ?? null,
          status_before: null,
          status_after:  null,
          payload_json:  JSON.stringify(envelope.payload ?? {}),
          created_at:    new Date().toISOString(),
        };
        setEvents(prev => [syntheticEvent, ...prev].slice(0, maxEvents));
      })
    );
    return () => offs.forEach(off => off());
  }, [maxEvents]);

  return { events };
}

// ─── Hook 4: Quota Pressure ───────────────────────────────────────────────────
export function useBoardroomQuota() {
  return usePolling<{ topDenied: QuotaPressureRow[]; topBytes: QuotaPressureRow[]; topOrphans: QuotaPressureRow[] }>(
    boardroomAdapter.getQuotaPressure,
    60_000,
    { topDenied: [], topBytes: [], topOrphans: [] }
  );
}
