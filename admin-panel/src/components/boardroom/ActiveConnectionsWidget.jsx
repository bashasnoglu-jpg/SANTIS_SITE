import React, { useContext } from 'react';
import { Activity, ShieldAlert, Wifi } from 'lucide-react';
import { SovereignSocketContext } from '../../context/SovereignSocketContext';

export default function ActiveConnectionsWidget() {
  const { connections } = useContext(SovereignSocketContext);

  const hasRealData = connections && connections.length > 0;

  return (
    <div className="bg-sovereign-obsidian border border-sovereign-panel hover:border-sovereign-gold/30 rounded-sm flex flex-col transition-colors animate-fade-in">
      <div className="p-6 border-b border-sovereign-panel relative">
        <div className="flex items-center gap-3">
          <Activity className="w-5 h-5 text-sovereign-accent" />
          <h3 className="text-sovereign-ink text-sm uppercase tracking-widest font-medium">
            Active Connections (God's Eye)
          </h3>
        </div>
      </div>

      <div className="p-6 overflow-y-auto" style={{ maxHeight: '250px' }}>
        {!hasRealData ? (
          <div className="flex flex-col items-center justify-center py-8 text-center animate-pulse">
            <Wifi className="w-8 h-8 text-sovereign-panel mb-3" />
            <span className="text-xs uppercase tracking-widest text-sovereign-muted">
              Awaiting Sovereign Telemetry...
            </span>
            <span className="text-2xs text-sovereign-panel mt-1">Listening on Port 8080</span>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-sovereign-panel/50">
                <th className="pb-2 text-2xs uppercase tracking-widest text-sovereign-muted font-normal">Session ID</th>
                <th className="pb-2 text-2xs uppercase tracking-widest text-sovereign-muted font-normal">Location</th>
                <th className="pb-2 text-2xs uppercase tracking-widest text-sovereign-muted font-normal">Network</th>
                <th className="pb-2 text-2xs uppercase tracking-widest text-sovereign-muted font-normal text-right">State</th>
              </tr>
            </thead>
            <tbody>
              {connections.map((conn) => (
                <tr key={conn.id} className="border-b border-sovereign-panel/30 hover:bg-sovereign-panel/10 transition-colors">
                  <td className="py-3 text-xs font-mono text-sovereign-sand">{conn.id.substring(0, 8)}...</td>
                  <td className="py-3 text-xs text-sovereign-ink font-medium">{conn.page}</td>
                  <td className="py-3 text-xs font-mono text-sovereign-muted">{conn.ipMask}</td>
                  <td className="py-3 text-right">
                    <span className={`inline-block w-2 h-2 rounded-full ${conn.status === 'active' ? 'bg-sovereign-accent' : 'bg-sovereign-bronze'} animate-pulse`}></span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <div className="p-4 border-t border-sovereign-panel bg-sovereign-coal/50 text-center">
        <span className="text-xs text-sovereign-muted flex items-center justify-center">
          <ShieldAlert className="w-3 h-3 mr-2" />
          Global Shield is Active
        </span>
      </div>
    </div>
  );
}
