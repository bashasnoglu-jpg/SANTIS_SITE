import React from 'react';
import { AlertTriangle, PlaneTakeoff, XCircle } from 'lucide-react';

export default function FlightRiskRadarWidget() {
  // DEMO FIXTURES (UI-SHELL ONLY)
  const mockAnomalies = [
    { id: '1', type: 'code_1006', user: 'guest-01', detail: 'WebSocket Drop', time: '10:45:12' },
    { id: '2', type: 'soft_risk', user: 'guest-09', detail: 'Idle on Checkout (3m)', time: '10:43:05' }
  ];

  return (
    <div className="bg-sovereign-obsidian border border-sovereign-panel hover:border-sovereign-bronze/50 rounded-sm flex flex-col transition-colors animate-fade-in" style={{ animationDelay: '100ms' }}>
      <div className="p-6 border-b border-sovereign-panel relative">
        <div className="absolute top-4 right-4 flex flex-col items-end">
          <div className="flex items-center text-[10px] text-sovereign-gold font-mono uppercase tracking-widest bg-sovereign-gold/10 px-2 py-1 rounded-sm">
            <PlaneTakeoff className="w-3 h-3 mr-1 animate-pulse" />
            DEMO SIGNAL ONLY
          </div>
          <div className="text-[9px] text-sovereign-muted mt-1 uppercase">Awaiting live SovereignSocket stream</div>
        </div>
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-sovereign-bronze" />
          <h3 className="text-sovereign-ink text-sm uppercase tracking-widest font-medium">
            Flight Risk Radarı
          </h3>
        </div>
      </div>

      <div className="p-6 space-y-3 flex-1">
        {mockAnomalies.length === 0 && (
          <div className="text-center text-sovereign-muted text-sm py-8 font-mono">
            No active anomalies detected
          </div>
        )}
        {mockAnomalies.map((anom) => (
          <div key={anom.id} className="flex items-center justify-between p-3 border border-sovereign-panel bg-sovereign-panel/5 rounded-sm">
            <div className="flex items-center gap-3">
              {anom.type === 'code_1006' ? (
                <XCircle className="w-4 h-4 text-[#ff3366]" />
              ) : (
                <PlaneTakeoff className="w-4 h-4 text-sovereign-bronze" />
              )}
              <div>
                <div className="text-xs text-sovereign-ink font-medium">{anom.user}</div>
                <div className="text-[10px] text-sovereign-muted uppercase tracking-wider">{anom.detail}</div>
              </div>
            </div>
            <div className="text-2xs font-mono text-sovereign-sand opacity-60">{anom.time}</div>
          </div>
        ))}
      </div>
      <div className="p-4 border-t border-sovereign-panel bg-sovereign-coal/50">
        <div className="flex justify-between items-center text-[10px] uppercase tracking-widest">
          <span className="text-sovereign-muted">Current Risk Level</span>
          <span className="text-[#ff3366] font-bold animate-pulse">ELEVATED</span>
        </div>
      </div>
    </div>
  );
}
