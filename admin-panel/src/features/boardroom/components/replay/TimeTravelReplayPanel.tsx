import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  FastForward,
  Rewind,
  RotateCcw,
  ShieldCheck,
} from 'lucide-react';

// ─── Types (mirrors boardroom-replay-state.ts shape) ────────────────────────

type ReplayAuditEntry = {
  eventId: string;
  eventType: string;
  actionId?: string;
  occurredAt: string;
};

type ReplayActiveAction = {
  id: string;
  type: string;
  title: string;
  impactScore: number;
};

type ReplayState = {
  activeActions: ReplayActiveAction[];
  resolvedActionIds: string[];
  auditTrail: ReplayAuditEntry[];
  lastEventId: string | null;
  status: 'idle' | 'replaying';
};

type ReplayResponse = {
  success: boolean;
  duration: string;
  lastSeq: number;
  state: ReplayState;
  error?: string;
};

// ─── Constants ───────────────────────────────────────────────────────────────

const API_BASE = '/admin/replay/boardroom';
const MAX_SEQ  = 999;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtTime(iso: string): string {
  try {
    return new Intl.DateTimeFormat('tr-TR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function eventTypeLabel(t: string): string {
  return t.replace(/\./g, ' › ').replace(/_/g, ' ');
}

// ─── Component ───────────────────────────────────────────────────────────────

export function TimeTravelReplayPanel() {
  const [targetSeq, setTargetSeq]   = useState<number>(MAX_SEQ);
  const [inputSeq, setInputSeq]     = useState<string>(String(MAX_SEQ));
  const [result, setResult]         = useState<ReplayResponse | null>(null);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState<string | null>(null);
  const [autoPlay, setAutoPlay]     = useState(false);
  const [playSeq, setPlaySeq]       = useState(0);
  const intervalRef                 = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Fetch hydrated state at a specific seq ──────────────────────────────

  const fetchAt = useCallback(async (seq: number) => {
    setLoading(true);
    setError(null);
    try {
      const url = seq >= MAX_SEQ ? API_BASE : `${API_BASE}?toSeq=${seq}`;
      const res = await fetch(url, { headers: { Accept: 'application/json' } });
      const json: ReplayResponse = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error ?? `HTTP ${res.status}`);
      setResult(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Replay failed');
      setResult(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Auto-play ───────────────────────────────────────────────────────────

  useEffect(() => {
    if (!autoPlay) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    setPlaySeq(0);
    intervalRef.current = setInterval(() => {
      setPlaySeq((prev: number) => {
        const next = prev + 1;
        if (next > MAX_SEQ) { setAutoPlay(false); return prev; }
        void fetchAt(next);
        return next;
      });
    }, 600);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [autoPlay, fetchAt]);

  // ── Commit seq ─────────────────────────────────────────────────────────

  const commitSeq = useCallback((seq: number) => {
    const clamped = Math.max(0, Math.min(MAX_SEQ, seq));
    setTargetSeq(clamped);
    setInputSeq(String(clamped));
    void fetchAt(clamped);
  }, [fetchAt]);

  const handleReset = () => { setAutoPlay(false); commitSeq(MAX_SEQ); };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    commitSeq(Number(e.target.value));

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const parsed = parseInt(inputSeq, 10);
      if (!isNaN(parsed)) commitSeq(parsed);
    }
  };

  const displaySeq = autoPlay ? playSeq : targetSeq;

  return (
    <section className="bg-sovereign-obsidian border border-sovereign-panel rounded-sm p-6 animate-fade-in space-y-6">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between border-b border-sovereign-panel pb-4">
        <div className="flex items-center gap-3">
          <Clock className="w-5 h-5 text-sovereign-accent" />
          <h3 className="text-sm uppercase tracking-widest text-sovereign-ink font-medium">
            Time Travel Replay
          </h3>
          <span className="text-2xs uppercase tracking-widest text-sovereign-bronze border border-sovereign-panel px-2 py-0.5 rounded-sm">
            seq-driven
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setAutoPlay((v) => !v)}
            className={`inline-flex items-center gap-1.5 border rounded-sm px-3 py-1.5 text-xs uppercase tracking-widest transition-colors ${
              autoPlay
                ? 'border-sovereign-accent text-sovereign-accent bg-sovereign-accent/10 hover:bg-sovereign-accent/20'
                : 'border-sovereign-panel text-sovereign-bronze hover:border-sovereign-accent hover:text-sovereign-accent'
            }`}
          >
            {autoPlay ? <FastForward className="w-3.5 h-3.5" /> : <Rewind className="w-3.5 h-3.5" />}
            {autoPlay ? 'Playing…' : 'Auto-play'}
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 border border-sovereign-panel text-sovereign-bronze rounded-sm px-3 py-1.5 text-xs uppercase tracking-widest hover:border-sovereign-accent hover:text-sovereign-accent transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Latest
          </button>
        </div>
      </div>

      {/* ── Seq Controller ──────────────────────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-2xs uppercase tracking-widest text-sovereign-bronze">
          <span>Seq 0</span>
          <span>
            Hedef: <span className="text-sovereign-accent font-mono text-xs">{displaySeq}</span>
            {result && (
              <span className="ml-3 opacity-60">son: {result.lastSeq} · {result.duration}</span>
            )}
          </span>
          <span>Seq {MAX_SEQ}</span>
        </div>

        <input
          type="range"
          min={0}
          max={MAX_SEQ}
          step={1}
          value={displaySeq}
          onChange={handleSliderChange}
          disabled={autoPlay || loading}
          className="w-full accent-sovereign-accent cursor-pointer disabled:opacity-40"
        />

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => commitSeq(targetSeq - 1)}
            disabled={autoPlay || loading || targetSeq <= 0}
            className="border border-sovereign-panel text-sovereign-bronze rounded-sm p-1.5 hover:border-sovereign-accent hover:text-sovereign-accent transition-colors disabled:opacity-30"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <input
            type="number"
            min={0}
            max={MAX_SEQ}
            value={inputSeq}
            onChange={(e) => setInputSeq(e.target.value)}
            onKeyDown={handleInputKeyDown}
            disabled={autoPlay || loading}
            className="w-24 bg-sovereign-coal border border-sovereign-panel rounded-sm px-2 py-1 text-xs font-mono text-sovereign-ink text-center focus:outline-none focus:border-sovereign-accent disabled:opacity-40"
          />

          <button
            type="button"
            onClick={() => commitSeq(targetSeq + 1)}
            disabled={autoPlay || loading || targetSeq >= MAX_SEQ}
            className="border border-sovereign-panel text-sovereign-bronze rounded-sm p-1.5 hover:border-sovereign-accent hover:text-sovereign-accent transition-colors disabled:opacity-30"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => { const p = parseInt(inputSeq, 10); if (!isNaN(p)) commitSeq(p); }}
            disabled={autoPlay || loading}
            className="ml-auto border border-sovereign-accent text-sovereign-accent rounded-sm px-3 py-1.5 text-xs uppercase tracking-widest hover:bg-sovereign-accent/10 transition-colors disabled:opacity-40"
          >
            {loading ? 'Yükleniyor…' : 'Git →'}
          </button>
        </div>
      </div>

      {/* ── Error ───────────────────────────────────────────────────────── */}
      {error && (
        <div className="border border-red-500/40 bg-red-950/20 text-red-200 text-xs px-3 py-2 rounded-sm font-mono">
          {error}
        </div>
      )}

      {/* ── Result ──────────────────────────────────────────────────────── */}
      {result && !loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* Active Actions */}
          <div className="border border-sovereign-panel bg-sovereign-coal/30 rounded-sm p-4 space-y-3">
            <div className="text-2xs uppercase tracking-widest text-sovereign-accent mb-2">
              Aktif Aksiyonlar
              <span className="ml-2 text-sovereign-bronze">({result.state.activeActions.length})</span>
            </div>

            {result.state.activeActions.length === 0 ? (
              <div className="text-xs text-sovereign-bronze opacity-60 text-center py-4 border border-dashed border-sovereign-panel rounded-sm">
                Bu seq noktasında aksiyon yok.
              </div>
            ) : (
              result.state.activeActions.map((a: ReplayActiveAction) => (
                <div
                  key={a.id}
                  className="border border-sovereign-panel/50 bg-sovereign-obsidian rounded-sm px-3 py-2 flex items-center justify-between gap-2"
                >
                  <div>
                    <div className="text-xs text-sovereign-ink">{a.title}</div>
                    <div className="text-2xs uppercase tracking-widest text-sovereign-bronze mt-0.5">
                      {a.type.replace(/_/g, ' ')}
                    </div>
                  </div>
                  <div className="text-xs font-mono text-sovereign-accent shrink-0">
                    {Math.round(a.impactScore * 100)}%
                  </div>
                </div>
              ))
            )}

            {result.state.resolvedActionIds.length > 0 && (
              <div className="pt-2 border-t border-sovereign-panel/30">
                <div className="text-2xs uppercase tracking-widest text-sovereign-bronze mb-1.5 flex items-center gap-1.5">
                  <ShieldCheck className="w-3 h-3" />
                  Mühürlenmiş ({result.state.resolvedActionIds.length})
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {result.state.resolvedActionIds.map((id: string) => (
                    <span
                      key={id}
                      className="font-mono text-2xs text-sovereign-bronze bg-sovereign-panel/30 px-1.5 py-0.5 rounded-sm"
                    >
                      {id.slice(0, 8)}…
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Audit Trail */}
          <div className="border border-sovereign-panel bg-sovereign-coal/30 rounded-sm p-4 space-y-2">
            <div className="text-2xs uppercase tracking-widest text-sovereign-accent mb-2">
              Audit Trail
              <span className="ml-2 text-sovereign-bronze">({result.state.auditTrail.length} event)</span>
            </div>

            {result.state.auditTrail.length === 0 ? (
              <div className="text-xs text-sovereign-bronze opacity-60 text-center py-4 border border-dashed border-sovereign-panel rounded-sm">
                Bu seq noktasında audit kaydı yok.
              </div>
            ) : (
              <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                {result.state.auditTrail.map((entry: ReplayAuditEntry, idx: number) => (
                  <div
                    key={entry.eventId ?? idx}
                    className="border border-sovereign-panel/40 bg-sovereign-obsidian rounded-sm px-3 py-2 text-xs"
                  >
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <span className="text-sovereign-accent font-mono truncate">
                        {eventTypeLabel(entry.eventType)}
                      </span>
                      <span className="text-sovereign-bronze shrink-0 font-mono">
                        {fmtTime(entry.occurredAt)}
                      </span>
                    </div>
                    {entry.actionId && (
                      <div className="text-2xs text-sovereign-bronze opacity-60 font-mono">
                        actionId: {entry.actionId.slice(0, 12)}…
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Status badge ────────────────────────────────────────────────── */}
      {result && (
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-sovereign-panel/30">
          <span className="text-2xs uppercase tracking-widest text-sovereign-bronze">State status:</span>
          <span className={`text-2xs uppercase tracking-widest px-2 py-0.5 border rounded-sm ${
            result.state.status === 'replaying'
              ? 'border-sovereign-accent text-sovereign-accent bg-sovereign-accent/10'
              : 'border-sovereign-panel text-sovereign-bronze'
          }`}>
            {result.state.status}
          </span>
          {result.state.lastEventId && (
            <span className="text-2xs text-sovereign-bronze font-mono opacity-60">
              lastEvent: {result.state.lastEventId.slice(0, 8)}…
            </span>
          )}
        </div>
      )}
    </section>
  );
}
