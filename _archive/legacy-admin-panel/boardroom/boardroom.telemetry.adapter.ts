/**
 * boardroom/boardroom.telemetry.adapter.ts
 * REST fetch wrapper — tüm Boardroom API çağrıları buradan geçer.
 * AbortController ile timeout desteği.
 */

const BASE = '/api/v1/boardroom';
const TIMEOUT_MS = 8_000;

async function _fetch<T>(path: string, params?: Record<string, string | number>): Promise<T> {
  const url = new URL(BASE + path, window.location.origin);
  if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, String(v)));

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(url.toString(), {
      signal: ctrl.signal,
      headers: { 'Accept': 'application/json' },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    return res.json() as Promise<T>;
  } finally {
    clearTimeout(timer);
  }
}

// ─── Veri Tipleri ─────────────────────────────────────────────────────────────
export interface BoardroomSummary {
  deniedLastHour:       number;
  activeIncidents:      number;
  finalizedBytesToday:  number;
  reaperCleanupsDay:    number;
  generatedAt:          string;
}

export interface Incident {
  incident_key:      string;
  incident_type:     string;
  tenant_id:         string | null;
  subject:           string | null;
  status:            'OPEN' | 'RESOLVED' | 'SUPPRESSED';
  first_seen_at:     string;
  last_seen_at:      string;
  occurrence_count:  number;
  last_payload_json: string | null;
}

export interface AuditEvent {
  id:            string;
  event_type:    string;
  severity:      'INFO' | 'WARN' | 'ERROR' | 'CRITICAL';
  upload_id:     string | null;
  file_id:       string | null;
  subject:       string | null;
  tenant_id:     string | null;
  status_before: string | null;
  status_after:  string | null;
  payload_json:  string | null;
  created_at:    string;
}

export interface QuotaPressureRow {
  subject:    string;
  tenant_id:  string | null;
  deny_count?: number;
  total_bytes?: number;
  orphan_count?: number;
}

// ─── API Çağrıları ────────────────────────────────────────────────────────────
export const boardroomAdapter = {
  getSummary:       () => _fetch<BoardroomSummary>('/summary'),
  getIncidents:     (params?: { limit?: number; status?: string }) =>
                      _fetch<{ incidents: Incident[]; count: number }>('/incidents', params as any),
  getLiveFeed:      (params?: { limit?: number }) =>
                      _fetch<{ events: AuditEvent[]; count: number }>('/live-feed', params as any),
  getQuotaPressure: () =>
                      _fetch<{ topDenied: QuotaPressureRow[]; topBytes: QuotaPressureRow[]; topOrphans: QuotaPressureRow[] }>('/quota-pressure'),
};
