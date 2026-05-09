/**
 * boardroom/components/IncidentFilters.tsx
 * Tenant · Severity · Status filtre çubuğu — V1.1
 */

import React from 'react';

export interface FilterState {
  tenant:   string;   // '' = tümü
  severity: string;   // '' = tümü | 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL'
  status:   string;   // 'OPEN' | 'RESOLVED' | 'ALL'
  search:   string;   // subject / incident_key serbest arama
}

interface FiltersProps {
  filters:    FilterState;
  tenants:    string[];   // mevcut tenant listesi (dinamik)
  onChange:   (f: FilterState) => void;
}

const SEV_CHIPS = ['', 'INFO', 'WARN', 'ERROR', 'CRITICAL'] as const;
const SEV_COLOR: Record<string, string> = {
  '':        '#6b7280',
  INFO:      '#4ade80',
  WARN:      '#f59e0b',
  ERROR:     '#f87171',
  CRITICAL:  '#e11d48',
};
const SEV_LABEL: Record<string, string> = {
  '': 'ALL', INFO: 'INFO', WARN: 'WARN', ERROR: 'ERROR', CRITICAL: 'CRIT',
};

export function IncidentFilters({ filters, tenants, onChange }: FiltersProps) {
  const set = (patch: Partial<FilterState>) => onChange({ ...filters, ...patch });

  const inputStyle: React.CSSProperties = {
    background: '#1a1a1e', border: '1px solid #2a2a30', borderRadius: 4,
    color: '#e5e7eb', padding: '5px 10px', fontSize: 12,
    fontFamily: 'monospace', outline: 'none',
  };

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap',
      padding: '10px 16px', background: '#121216', border: '1px solid #1e1e24',
      borderRadius: 6, marginBottom: 12,
    }}>
      {/* Serbest arama */}
      <input
        type="text"
        placeholder="Subject / key ara…"
        value={filters.search}
        onChange={e => set({ search: e.target.value })}
        style={{ ...inputStyle, width: 200 }}
      />

      {/* Tenant dropdown */}
      <select
        title="Tenant Filter"
        value={filters.tenant}
        onChange={e => set({ tenant: e.target.value })}
        style={{ ...inputStyle, cursor: 'pointer' }}
      >
        <option value="">Tüm tenant'lar</option>
        {tenants.map(t => <option key={t} value={t}>{t}</option>)}
      </select>

      {/* Status toggle */}
      {(['OPEN', 'RESOLVED', 'ALL'] as const).map(s => (
        <button
          key={s}
          onClick={() => set({ status: s })}
          style={{
            background: filters.status === s ? '#c6a96b22' : 'transparent',
            border: `1px solid ${filters.status === s ? '#c6a96b' : '#2a2a30'}`,
            color: filters.status === s ? '#c6a96b' : '#6b7280',
            padding: '4px 12px', borderRadius: 4, fontSize: 11,
            cursor: 'pointer', fontFamily: 'monospace', letterSpacing: 1,
          }}
        >
          {s}
        </button>
      ))}

      {/* Severity chips */}
      <div style={{ display: 'flex', gap: 4 }}>
        {SEV_CHIPS.map(sev => {
          const color   = SEV_COLOR[sev];
          const active  = filters.severity === sev;
          return (
            <button
              key={sev}
              onClick={() => set({ severity: sev })}
              style={{
                background: active ? color + '22' : 'transparent',
                border:     `1px solid ${active ? color : '#2a2a30'}`,
                color:      active ? color : '#4b5563',
                padding:    '3px 8px', borderRadius: 4,
                fontSize: 10, cursor: 'pointer', letterSpacing: 1,
              }}
            >
              {SEV_LABEL[sev]}
            </button>
          );
        })}
      </div>

      {/* Reset */}
      {(filters.tenant || filters.severity || filters.search || filters.status !== 'OPEN') && (
        <button
          onClick={() => onChange({ tenant: '', severity: '', status: 'OPEN', search: '' })}
          style={{
            background: 'none', border: 'none', color: '#4b5563',
            fontSize: 11, cursor: 'pointer',
          }}
        >
          ✕ Sıfırla
        </button>
      )}
    </div>
  );
}

// ─── Filtre uygulama fonksiyonu (hook'tan bağımsız, saf) ─────────────────────
export function applyFilters<T extends {
  subject?: string | null;
  tenant_id?: string | null;
  incident_key?: string;
  status?: string;
  severity?: string;
}>(items: T[], filters: FilterState): T[] {
  return items.filter(item => {
    if (filters.status !== 'ALL' && item.status && item.status !== filters.status) return false;
    if (filters.tenant   && item.tenant_id !== filters.tenant) return false;
    if (filters.severity && item.severity  !== filters.severity) return false;
    if (filters.search) {
      const q = filters.search.toLowerCase();
      const haystack = [item.subject, item.incident_key, item.tenant_id]
        .filter(Boolean).join(' ').toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });
}
