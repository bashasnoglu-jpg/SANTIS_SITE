import React from 'react';
import { Activity, Server, Database, Wifi } from 'lucide-react';
import { useSovereignSocket } from '../../context/SovereignSocketContext';

export default function SystemHealthWidget() {
  const { socketStatus } = useSovereignSocket();
  const isOnline = socketStatus === 'online';

  return (
    <div className="bg-sovereign-obsidian border border-sovereign-panel hover:border-sovereign-earth/50 rounded-sm p-8 flex flex-col transition-colors animate-fade-in md:col-span-2 xl:col-span-1" style={{ animationDelay: '600ms' }}>
      <div className="flex items-center justify-between mb-6 border-b border-sovereign-panel pb-4">
        <div className="flex items-center gap-3">
          <Activity className={`w-5 h-5 ${isOnline ? 'text-sovereign-accent animate-pulse' : 'text-red-500'}`} />
          <h3 className="text-sovereign-ink text-sm uppercase tracking-widest font-medium">System Pulse</h3>
        </div>
        <div className="flex items-center text-2xs text-sovereign-muted uppercase">
          Read-Only Sync
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-auto">
        <div className="flex items-center gap-3 bg-sovereign-coal/30 p-3 border border-sovereign-panel/50 rounded-sm">
          <Server className="w-4 h-4 text-sovereign-bronze" />
          <div>
            <div className="text-2xs text-sovereign-muted uppercase">CPU Load</div>
            <div className="text-sm font-mono text-sovereign-ink">24.5%</div>
          </div>
        </div>
        <div className="flex items-center gap-3 bg-sovereign-coal/30 p-3 border border-sovereign-panel/50 rounded-sm">
          <Database className="w-4 h-4 text-sovereign-bronze" />
          <div>
            <div className="text-2xs text-sovereign-muted uppercase">Memory</div>
            <div className="text-sm font-mono text-sovereign-ink">4.2 GB</div>
          </div>
        </div>
        <div className="flex items-center gap-3 bg-sovereign-coal/30 p-3 border border-sovereign-panel/50 rounded-sm">
          <Wifi className={`w-4 h-4 ${isOnline ? 'text-sovereign-accent' : 'text-red-500'}`} />
          <div>
            <div className="text-2xs text-sovereign-muted uppercase">Socket</div>
            <div className={`text-sm font-mono ${isOnline ? 'text-sovereign-accent' : 'text-red-500'}`}>
              {isOnline ? '12ms Ping' : 'DISCONNECTED'}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 bg-sovereign-coal/30 p-3 border border-sovereign-panel/50 rounded-sm">
          <Activity className="w-4 h-4 text-sovereign-bronze" />
          <div>
            <div className="text-2xs text-sovereign-muted uppercase">Uptime</div>
            <div className="text-sm font-mono text-sovereign-ink">14d 6h</div>
          </div>
        </div>
      </div>
    </div>
  );
}
