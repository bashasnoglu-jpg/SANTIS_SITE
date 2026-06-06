import React, { useContext } from 'react';
import { AlertTriangle, PlaneTakeoff, XCircle, Activity, Crosshair } from 'lucide-react';
import { SovereignSocketContext } from '../../context/SovereignSocketContext';

export default function FlightRiskRadarWidget() {
  const { flightRisks } = useContext(SovereignSocketContext);

  const getRiskColor = (score) => {
    if (score >= 80) return 'text-red-500 bg-red-500/10 border-red-500/30';
    if (score >= 50) return 'text-amber-500 bg-amber-500/10 border-amber-500/30';
    return 'text-sovereign-bronze bg-sovereign-panel/5 border-sovereign-panel';
  };

  const getRiskLabel = (score) => {
    if (score >= 80) return 'CRITICAL';
    if (score >= 50) return 'ELEVATED';
    return 'MONITORING';
  };

  const getIcon = (type) => {
    switch(type) {
       case 'exit_intent': return <PlaneTakeoff className="w-4 h-4" />;
       case 'rage_scroll': return <Activity className="w-4 h-4" />;
       case 'idle': return <Crosshair className="w-4 h-4" />;
       default: return <AlertTriangle className="w-4 h-4" />;
    }
  };

  const hasRealData = flightRisks && flightRisks.length > 0;
  // Get max risk score to determine overall panel color
  const maxScore = hasRealData ? Math.max(...flightRisks.map(r => r.riskScore)) : 0;
  
  const headerGlow = maxScore >= 80 ? 'border-b-red-500/50 shadow-[0_4px_12px_rgba(239,68,68,0.1)]' : 
                     maxScore >= 50 ? 'border-b-amber-500/50' : 'border-b-sovereign-panel';

  return (
    <div className="bg-sovereign-obsidian border border-sovereign-panel hover:border-sovereign-bronze/50 rounded-sm flex flex-col transition-colors animate-fade-in" style={{ animationDelay: '100ms' }}>
      <div className={`p-6 border-b relative transition-all duration-700 ${headerGlow}`}>
        {!hasRealData && (
          <div className="absolute top-4 right-4 flex flex-col items-end">
            <div className="flex items-center text-2xs text-sovereign-gold font-mono uppercase tracking-widest bg-sovereign-gold/10 px-2 py-1 rounded-sm">
              <PlaneTakeoff className="w-3 h-3 mr-1 animate-pulse" />
              AWAITING SENSORS
            </div>
            <div className="text-2xs text-sovereign-muted mt-1 uppercase">Listening for Anomalies</div>
          </div>
        )}
        <div className="flex items-center gap-3">
          <AlertTriangle className={`w-5 h-5 ${maxScore >= 80 ? 'text-red-500 animate-pulse' : maxScore >= 50 ? 'text-amber-500' : 'text-sovereign-bronze'}`} />
          <h3 className="text-sovereign-ink text-sm uppercase tracking-widest font-medium">
            Flight Risk Radarı
          </h3>
        </div>
      </div>

      <div className="p-6 space-y-3 flex-1 overflow-y-auto max-h-[300px]">
        {!hasRealData && (
          <div className="text-center text-sovereign-muted text-sm py-8 font-mono">
            No active anomalies detected
          </div>
        )}
        {flightRisks.map((anom) => {
          const colorClasses = getRiskColor(anom.riskScore);
          const isCritical = anom.riskScore >= 80;
          
          return (
            <div key={anom.id} className={`flex items-center justify-between p-3 border rounded-sm transition-all duration-500 ${colorClasses} ${isCritical ? 'animate-pulse' : ''}`}>
              <div className="flex items-center gap-3">
                <div className={`${isCritical ? 'text-red-500' : ''}`}>
                  {getIcon(anom.anomalyType)}
                </div>
                <div>
                  <div className="text-xs text-sovereign-ink font-medium">{anom.user}</div>
                  <div className="text-2xs uppercase tracking-wider opacity-80 font-mono">
                    {anom.anomalyType.replace('_', ' ')}
                  </div>
                </div>
              </div>
              <div className="text-right">
                 <div className="text-xs font-mono font-bold">{anom.riskScore}/100</div>
                 <div className="text-2xs font-mono opacity-60">{new Date(anom.time).toLocaleTimeString('tr-TR')}</div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="p-4 border-t border-sovereign-panel bg-sovereign-coal/50">
        <div className="flex justify-between items-center text-2xs uppercase tracking-widest">
          <span className="text-sovereign-muted">Current Peak Risk</span>
          <span className={`font-bold ${maxScore >= 80 ? 'text-red-500 animate-pulse' : maxScore >= 50 ? 'text-amber-500' : 'text-sovereign-bronze'}`}>
             {getRiskLabel(maxScore)}
          </span>
        </div>
      </div>
    </div>
  );
}
