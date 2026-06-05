import React, { useContext } from 'react';
import { Activity, ShieldAlert, Wifi } from 'lucide-react';
import { SovereignSocketContext } from '../../context/SovereignSocketContext';

export default function ActiveConnectionsWidget() {
  const { connections } = useContext(SovereignSocketContext);

  // DEMO FIXTURES (UI-SHELL ONLY)
  const mockConnections = [
    { id: 'usr-001', page: '/spa/hamam', status: 'active', ipMask: '192.168.1.***' },
    { id: 'usr-002', page: '/booking/checkout', status: 'idle', ipMask: '88.242.10.***' },
    { id: 'usr-003', page: '/', status: 'active', ipMask: '10.0.0.***' }
  ];

  const hasRealData = connections && connections.length > 0;
  const displayConnections = hasRealData ? connections : mockConnections;

  return (
    <div className="bg-sovereign-obsidian border border-sovereign-panel hover:border-sovereign-gold/30 rounded-sm flex flex-col transition-colors animate-fade-in">
      <div className="p-6 border-b border-sovereign-panel relative">
        {!hasRealData && (
          <div className="absolute top-4 right-4 flex flex-col items-end">
            <div className="flex items-center text-[10px] text-sovereign-gold font-mono uppercase tracking-widest bg-sovereign-gold/10 px-2 py-1 rounded-sm">
              <Wifi className="w-3 h-3 mr-1 animate-pulse" />
              DEMO SIGNAL ONLY
            </div>
            <div className="text-[9px] text-sovereign-muted mt-1 uppercase">Awaiting live SovereignSocket stream</div>
          </div>
        )}
        <div className="flex items-center gap-3">
          <Activity className="w-5 h-5 text-sovereign-accent" />
          <h3 className="text-sovereign-ink text-sm uppercase tracking-widest font-medium">
            Active Connections (God's Eye)
          </h3>
        </div>
      </div>

      <div className="p-6 overflow-y-auto" style={{ maxHeight: '250px' }}>
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
            {displayConnections.map((conn) => (
              <tr key={conn.id} className="border-b border-sovereign-panel/30 hover:bg-sovereign-panel/10 transition-colors">
                <td className="py-3 text-xs font-mono text-sovereign-sand">{conn.id}</td>
                <td className="py-3 text-xs text-sovereign-ink font-medium">{conn.page}</td>
                <td className="py-3 text-xs font-mono text-sovereign-muted">{conn.ipMask}</td>
                <td className="py-3 text-right">
                  <span className={`inline-block w-2 h-2 rounded-full ${conn.status === 'active' ? 'bg-sovereign-accent' : 'bg-sovereign-bronze'} animate-pulse`}></span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
