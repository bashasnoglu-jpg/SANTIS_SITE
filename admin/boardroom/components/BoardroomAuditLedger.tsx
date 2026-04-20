import React from 'react';
import { ScrollText, Hash } from 'lucide-react';

export interface AuditEntry {
  timestamp: string;
  actionId: string;
  title: string;
  status: 'APPROVED' | 'DISMISSED' | 'SYSTEM_AUTO_APPLY';
  operator: string;
  hash: string;
  confidence?: number;
}

interface AuditLedgerProps {
  entries: AuditEntry[];
}

const BoardroomAuditLedger: React.FC<AuditLedgerProps> = ({ entries }) => {
  return (
    <div className="mt-8 border-t border-slate-800 pt-6">
      <div className="flex items-center gap-2 mb-4">
        <ScrollText className="text-blue-400" size={18} />
        <h3 className="text-sm font-bold uppercase tracking-widest text-slate-100">
          Immutable Decision Ledger
        </h3>
      </div>
      
      <div className="bg-black/60 rounded-md border border-slate-800 overflow-hidden">
        <table className="w-full text-left text-[11px] font-mono border-collapse">
          <thead>
            <tr className="bg-slate-900/80 text-slate-500 uppercase">
              <th className="p-2 border-b border-slate-800">Timestamp</th>
              <th className="p-2 border-b border-slate-800">Action ID</th>
              <th className="p-2 border-b border-slate-800">Title</th>
              <th className="p-2 border-b border-slate-800">Decision</th>
              <th className="p-2 border-b border-slate-800 text-right">Integrity Hash</th>
            </tr>
          </thead>
          <tbody>
            {entries.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-4 text-center text-slate-600 italic">
                  No decisions recorded in current session.
                </td>
              </tr>
            ) : (
              entries.map((entry, idx) => {
                const isAuto = entry.status === 'SYSTEM_AUTO_APPLY';
                return (
                <tr key={idx} className={`hover:bg-slate-800/30 border-b border-slate-800/50 text-slate-300 ${isAuto ? 'shadow-[inset_0_0_12px_rgba(96,165,250,0.15)] bg-blue-900/20' : ''}`}>
                  <td className="p-2 text-slate-500">{entry.timestamp}</td>
                  <td className="p-2 font-bold text-blue-400">{entry.actionId}</td>
                  <td className="p-2">{entry.title}</td>
                  <td className="p-2 font-bold">
                    {entry.status === 'SYSTEM_AUTO_APPLY' ? (
                      <span style={{ 
                        backgroundColor: 'rgba(16, 185, 129, 0.15)', 
                        color: '#10b981', 
                        border: '1px solid rgba(16, 185, 129, 0.4)',
                        padding: '2px 8px', 
                        borderRadius: '4px', 
                        fontSize: '11px',
                        fontWeight: 'bold',
                        letterSpacing: '0.5px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10b981', boxShadow: '0 0 8px #10b981' }} />
                        AUTO-HEALED (%{entry.confidence || 99})
                      </span>
                    ) : (
                      <span className={entry.status === 'APPROVED' ? 'text-emerald-400' : 'text-red-400'}>
                        {entry.status}
                      </span>
                    )}
                  </td>
                  <td className="p-2 text-right text-[10px] text-slate-600 flex items-center justify-end gap-1">
                    <Hash size={10} className={isAuto ? 'text-blue-400' : ''} /> {entry.hash}
                  </td>
                </tr>
              )})
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default BoardroomAuditLedger;
