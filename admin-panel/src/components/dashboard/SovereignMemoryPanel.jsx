import React, { useEffect, useState, useCallback } from 'react';
import { BookOpen, RefreshCw, CheckCircle, XCircle, Clock } from 'lucide-react';

export default function SovereignMemoryPanel() {
  const [auditLog, setAuditLog] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastFetched, setLastFetched] = useState(null);

  const fetchAuditLog = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/v1/boardroom/audit-log');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setAuditLog(json.data || []);
      setLastFetched(new Date().toISOString());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAuditLog();
  }, [fetchAuditLog]);

  const formatTime = (iso) => {
    if (!iso) return '—';
    const d = new Date(iso);
    return d.toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'medium' });
  };

  return (
    <div className="md:col-span-2 xl:col-span-3 bg-sovereign-obsidian border border-sovereign-panel hover:border-sovereign-earth/50 rounded-sm p-8 flex flex-col transition-colors animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 border-b border-sovereign-panel pb-4">
        <div className="flex items-center gap-3">
          <BookOpen className="w-5 h-5 text-sovereign-accent" />
          <h3 className="text-sovereign-ink text-sm uppercase tracking-widest font-medium">Sovereign Memory</h3>
          <span className="text-sovereign-earth text-2xs uppercase tracking-widest">/ Karar Tarihçesi</span>
        </div>
        <button
          onClick={fetchAuditLog}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-1.5 bg-sovereign-coal border border-sovereign-panel hover:border-sovereign-earth rounded-sm text-sovereign-sand hover:text-sovereign-ink text-xs transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
          Yenile
        </button>
      </div>

      {/* Status bar */}
      {lastFetched && (
        <div className="flex items-center gap-2 text-sovereign-bronze text-2xs uppercase tracking-widest mb-4">
          <Clock className="w-3 h-3" />
          Son güncelleme: {formatTime(lastFetched)}
          <span className="ml-2 text-sovereign-earth">{auditLog.length} / 50 kayıt</span>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="flex items-center gap-2 text-red-400 text-sm mb-4">
          <XCircle className="w-4 h-4" />
          Veri alınamadı: {error}
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && auditLog.length === 0 && (
        <div className="flex-1 flex items-center justify-center py-16 text-sovereign-earth text-sm">
          Henüz karar kaydı bulunmuyor.
        </div>
      )}

      {/* Audit log table */}
      {auditLog.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-sovereign-earth text-2xs uppercase tracking-widest border-b border-sovereign-panel">
                <th className="text-left py-3 pr-4 font-normal">Tür</th>
                <th className="text-left py-3 pr-4 font-normal">Aksiyon ID</th>
                <th className="text-left py-3 pr-4 font-normal">Operatör</th>
                <th className="text-left py-3 pr-4 font-normal">Sebep</th>
                <th className="text-left py-3 font-normal">Zaman</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--sovereign-panel)]">
              {auditLog.map((entry) => (
                <tr key={entry.id} className="hover:bg-sovereign-coal/30 transition-colors">
                  <td className="py-3 pr-4">
                    {entry.type === 'action.approved' ? (
                      <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                        <CheckCircle className="w-3.5 h-3.5" /> Onaylandı
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-red-400 font-medium">
                        <XCircle className="w-3.5 h-3.5" /> Reddedildi
                      </span>
                    )}
                  </td>
                  <td className="py-3 pr-4 text-sovereign-sand font-mono text-xs truncate max-w-[120px]" title={entry.actionId}>
                    {entry.actionId ?? '—'}
                  </td>
                  <td className="py-3 pr-4 text-sovereign-ink text-xs">{entry.operatorId ?? '—'}</td>
                  <td className="py-3 pr-4 text-sovereign-bronze text-xs max-w-[200px] truncate" title={entry.reason}>
                    {entry.reason ?? '—'}
                  </td>
                  <td className="py-3 text-sovereign-earth text-xs whitespace-nowrap">{formatTime(entry.occurredAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
