// hooks/useAuditReplay.js — v2.2
// Audit JSONL fetch + replay + search + date filter + session grouping
// [SEC-01] localhost:8080 hardcode kaldırıldı — runtime config'den çözülür.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { groupAuditEntries } from '../lib/groupAuditEntries';

// Öncelik: window.__SANTIS_CONFIG__?.AUDIT_BASE → window.__API_BASE__ → '/api/v1'
function _resolveAuditUrl() {
  if (typeof window === 'undefined') return '/api/v1/audit';
  const cfg = window.__SANTIS_CONFIG__;
  if (cfg?.AUDIT_BASE) return cfg.AUDIT_BASE.replace(/\/$/, '');
  const apiBase = window.__API_BASE__?.replace(/\/$/, '') ?? '/api/v1';
  return `${apiBase}/audit`;
}

const REPLAY_SPEED = 800; // ms per event


export function useAuditReplay() {
  const [entries,   setEntries]   = useState([]);  // Ham, sıralı kayıtlar
  const [visible,   setVisible]   = useState([]);  // Replay'de şimdiye kadar yüklenenler
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState(null);
  const [replaying, setReplaying] = useState(false);

  // ── Filtreler ─────────────────────────────────────────────────────────────
  const [filter,   setFilter]   = useState('ALL');  // ALL | ACK | MUTE | ESCALATE
  const [search,   setSearch]   = useState('');     // eventId veya operatorId substring
  const [dateFrom, setDateFrom] = useState('');     // ISO string veya ''
  const [dateTo,   setDateTo]   = useState('');

  const timerRef = useRef(null);
  const indexRef = useRef(0);

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const fetchAudit = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res  = await fetch(_resolveAuditUrl());
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      // Eskiden yeniye sırala
      setEntries([...data].sort((a, b) => a.timestamp - b.timestamp));
      setVisible([]);
      indexRef.current = 0;
    } catch (err) {
      setError(`Audit verisi alınamadı: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAudit(); }, [fetchAudit]);

  // ── Replay ────────────────────────────────────────────────────────────────
  const startReplay = useCallback(() => {
    if (entries.length === 0) return;
    setVisible([]);
    indexRef.current = 0;
    setReplaying(true);

    const tick = () => {
      const next = entries[indexRef.current];
      if (!next) { setReplaying(false); return; }

      setVisible(prev => [next, ...prev]);
      indexRef.current += 1;

      if (indexRef.current < entries.length) {
        timerRef.current = setTimeout(tick, REPLAY_SPEED);
      } else {
        setReplaying(false);
      }
    };
    timerRef.current = setTimeout(tick, 200);
  }, [entries]);

  const stopReplay = useCallback(() => {
    clearTimeout(timerRef.current);
    setReplaying(false);
  }, []);

  const resetReplay = useCallback(() => {
    stopReplay();
    setVisible([]);
    indexRef.current = 0;
  }, [stopReplay]);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  // ── Filtre + Search + Date ────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const fromTs = dateFrom ? new Date(dateFrom).getTime() : null;
    const toTs   = dateTo   ? new Date(dateTo).getTime()   : null;
    const q      = search.trim().toLowerCase();

    return visible.filter(e => {
      if (filter !== 'ALL' && e.action !== filter) return false;
      if (fromTs && e.timestamp < fromTs) return false;
      if (toTs   && e.timestamp > toTs)   return false;
      if (q && !(
        e.targetEventId?.toLowerCase().includes(q) ||
        e.operatorId?.toLowerCase().includes(q)    ||
        e.action?.toLowerCase().includes(q)
      )) return false;
      return true;
    });
  }, [visible, filter, search, dateFrom, dateTo]);

  // ── Session Grouping ─────────────────────────────────────────────────────
  const grouped = useMemo(() => groupAuditEntries(filtered), [filtered]);

  return {
    // Data
    entries,       // ham kayıtlar (export için)
    visible:      filtered,
    grouped,
    totalCount:   entries.length,
    visibleCount: filtered.length,
    groupCount:   grouped.length,
    // State
    loading, error, replaying,
    // Replay controls
    startReplay, stopReplay, resetReplay, refresh: fetchAudit,
    // Filters
    filter,   setFilter,
    search,   setSearch,
    dateFrom, setDateFrom,
    dateTo,   setDateTo,
  };
}
