import React from 'react';

export function TelemetryDebugStrip(props) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-neutral-300">
      <div className="mb-2 text-[10px] uppercase tracking-[0.24em] text-neutral-500">
        Telemetry Debug Strip
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-11">
        <DebugItem label="Request ID" value={props.requestId ?? '—'} />
        <DebugItem label="Degraded" value={props.degraded ? 'YES' : 'NO'} />
        <DebugItem label="Warnings" value={String(props.warningCount)} />
        <DebugItem
          label="Response ms"
          value={props.responseTimeMs != null ? String(props.responseTimeMs) : '—'}
        />
        <DebugItem label="Last Event" value={props.lastEvent ?? '—'} />
        <DebugItem label="Quote ID" value={props.quoteId ?? '—'} />
        <DebugItem label="Quote ms" value={props.quoteMs != null ? String(props.quoteMs) : '—'} />
        <DebugItem label="Intent ID" value={props.intentId ?? '—'} />
        <DebugItem label="Intent" value={props.intentStatus ?? '—'} />
        <DebugItem label="Decision" value={props.decisionAssist ? 'ASSIST' : 'NORMAL'} />
        <DebugItem label="Reasons" value={props.decisionReasons?.join('|') || '—'} />
      </div>
    </div>
  );
}

function DebugItem({ label, value }) {
  return (
    <div className="min-w-0">
      <div className="mb-1 text-[10px] uppercase tracking-[0.18em] text-neutral-500">
        {label}
      </div>
      <div className="truncate font-mono text-[11px] text-neutral-200" title={value}>
        {value}
      </div>
    </div>
  );
}
