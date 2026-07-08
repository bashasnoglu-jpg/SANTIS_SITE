import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Database,
  LockKeyhole,
  Power,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';

const ENDPOINT = '/api/v1/admin/automation-control';

const normalizeText = (value, fallback = '—') => {
  if (value === null || value === undefined || value === '') return fallback;
  if (Array.isArray(value)) return value.join(', ') || fallback;
  return String(value);
};

const statusTone = (value) => {
  const normalized = normalizeText(value, '').toLowerCase();
  if (normalized.includes('passed') || normalized.includes('ready')) {
    return 'border-sovereign-accent/40 text-sovereign-accent bg-sovereign-accent/10';
  }
  if (normalized.includes('draft') || normalized.includes('review')) {
    return 'border-sovereign-earth/50 text-sovereign-sand bg-sovereign-earth/10';
  }
  return 'border-sovereign-panel text-sovereign-bronze bg-sovereign-coal';
};

function Metric({ label, value }) {
  return (
    <div className="bg-sovereign-obsidian border border-sovereign-panel rounded-sm p-5">
      <div className="text-2xs uppercase tracking-widest text-sovereign-bronze">{label}</div>
      <div className="mt-2 font-serif text-3xl text-sovereign-ink">{value}</div>
    </div>
  );
}

function ReadOnlyToggle({ enabled }) {
  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-2xs uppercase tracking-widest ${
        enabled
          ? 'border-sovereign-accent/40 text-sovereign-accent bg-sovereign-accent/10'
          : 'border-sovereign-panel text-sovereign-bronze bg-sovereign-coal'
      }`}
      aria-label={`Read-only observed state: ${enabled ? 'ON' : 'OFF'}`}
      title="Read-only pilot: this control does not mutate Airtable or native automation state."
    >
      <Power className="w-3 h-3" />
      {enabled ? 'ON' : 'OFF'}
    </div>
  );
}

export default function AutomationControlCenter() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [observedAt, setObservedAt] = useState(null);

  const loadRegistry = useCallback(async (signal) => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch(ENDPOINT, {
        method: 'GET',
        credentials: 'include',
        headers: { Accept: 'application/json' },
        signal,
      });

      const payload = await response.json().catch(() => {
        if (response.ok) {
          throw new Error('Invalid JSON response from server.');
        }
        return null;
      });

      if (!response.ok) {
        const message = payload?.detail || `Automation Control read failed (${response.status}).`;
        throw new Error(message);
      }

      setItems(Array.isArray(payload?.items) ? payload.items : []);
      setObservedAt(payload?.observedAt || null);
    } catch (requestError) {
      if (requestError?.name !== 'AbortError') {
        setError(requestError?.message || 'Automation Control registry could not be loaded.');
      }
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    loadRegistry(controller.signal);
    return () => controller.abort();
  }, [loadRegistry]);

  const summary = useMemo(() => {
    return items.reduce(
      (acc, item) => {
        if (String(item.airtableStatus || '').toUpperCase() === 'OFF') acc.off += 1;
        if (item.canActivate) acc.canActivate += 1;
        if (item.canRun) acc.canRun += 1;
        return acc;
      },
      { off: 0, canActivate: 0, canRun: 0 },
    );
  }, [items]);

  return (
    <section className="md:col-span-2 xl:col-span-3 animate-fade-in space-y-6">
      <div className="bg-sovereign-obsidian border border-sovereign-panel rounded-sm p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-sovereign-accent" />
              <h3 className="text-sovereign-ink text-sm uppercase tracking-widest font-medium">
                Automation Control Center
              </h3>
              <span className="text-2xs uppercase tracking-widest text-sovereign-bronze border border-sovereign-panel px-2 py-1 rounded-sm">
                Read-only pilot
              </span>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-sovereign-bronze max-w-3xl">
              Existing Airtable Automation_Control registry is displayed here without changing OFF,
              Can Activate?, Run_Request, Santis OS Status, or native Airtable automation toggles.
            </p>
          </div>

          <button
            type="button"
            onClick={() => loadRegistry()}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 border border-sovereign-panel bg-sovereign-coal px-4 py-2 text-xs text-sovereign-sand hover:border-sovereign-earth disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Metric label="Registry Records" value={items.length} />
        <Metric label="Observed OFF" value={summary.off} />
        <Metric label="Can Activate" value={summary.canActivate} />
        <Metric label="Can Run" value={summary.canRun} />
      </div>

      {error && (
        <div className="bg-sovereign-obsidian border border-sovereign-earth/60 rounded-sm p-6 flex gap-3">
          <AlertTriangle className="w-5 h-5 text-sovereign-sand shrink-0" />
          <div>
            <div className="text-sm text-sovereign-ink">Failed to read registry</div>
            <div className="mt-2 text-xs text-sovereign-bronze leading-relaxed">{error}</div>
          </div>
        </div>
      )}

      {!error && loading && (
        <div className="bg-sovereign-obsidian border border-sovereign-panel rounded-sm p-8 text-xs text-sovereign-bronze animate-pulse">
          Loading Automation_Control registry…
        </div>
      )}

      {!error && !loading && (
        <div className="space-y-4">
          {items.map((item) => {
            const observedOn = String(item.airtableStatus || '').toUpperCase() === 'ON';

            return (
              <article
                key={item.id || item.name}
                className="bg-sovereign-obsidian border border-sovereign-panel hover:border-sovereign-earth/50 rounded-sm p-6 transition-colors"
              >
                <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-2xs uppercase tracking-widest text-sovereign-bronze">
                        #{item.activationOrder ?? '—'}
                      </span>
                      <h4 className="text-sm text-sovereign-ink font-medium">{item.name}</h4>
                    </div>

                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 text-xs">
                      <div>
                        <div className="text-2xs uppercase tracking-widest text-sovereign-bronze">Environment</div>
                        <div className="mt-1 text-sovereign-sand">{normalizeText(item.environment)}</div>
                      </div>
                      <div>
                        <div className="text-2xs uppercase tracking-widest text-sovereign-bronze">Source</div>
                        <div className="mt-1 text-sovereign-sand">{normalizeText(item.sourceTable)}</div>
                      </div>
                      <div>
                        <div className="text-2xs uppercase tracking-widest text-sovereign-bronze">Target</div>
                        <div className="mt-1 text-sovereign-sand">{normalizeText(item.targetTable)}</div>
                      </div>
                      <div>
                        <div className="text-2xs uppercase tracking-widest text-sovereign-bronze">Risk</div>
                        <div className="mt-1 text-sovereign-sand">{normalizeText(item.riskLevel)}</div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap xl:flex-nowrap items-center gap-3">
                    <span className={`border rounded-sm px-3 py-2 text-2xs uppercase tracking-widest ${statusTone(item.santisStatus)}`}>
                      {normalizeText(item.santisStatus)}
                    </span>
                    <span className="inline-flex items-center gap-2 border border-sovereign-panel bg-sovereign-coal px-3 py-2 text-2xs uppercase tracking-widest text-sovereign-bronze rounded-sm">
                      <Database className="w-3 h-3" />
                      Can Run {item.canRun ? '1' : '0'}
                    </span>
                    <ReadOnlyToggle enabled={observedOn} />
                    <span className="inline-flex items-center gap-2 border border-sovereign-panel px-3 py-2 text-2xs uppercase tracking-widest text-sovereign-bronze rounded-sm">
                      <LockKeyhole className="w-3 h-3" />
                      Locked
                    </span>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <div className="text-2xs uppercase tracking-widest text-sovereign-bronze opacity-70">
        Last observed: {observedAt ? new Date(observedAt).toLocaleString() : '—'}
      </div>
    </section>
  );
}
