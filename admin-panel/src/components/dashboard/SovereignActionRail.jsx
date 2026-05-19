import React from 'react';
import { Zap, Wind, ShieldAlert, RefreshCw, Cpu } from 'lucide-react';
import { useSovereignSocket } from '../../context/SovereignSocketContext.js';

/**
 * ⚡ SOVEREIGN ACTION RAIL
 * Yöneticinin en kritik müdahalelerini barındıran minimalist kontrol katmanı.
 * 'Divine Interventions' (Tanrısal Müdahaleler) için hızlı erişim sağlar.
 */
const SovereignActionRail = () => {
  const { socket } = useSovereignSocket();

  const handleDivineAction = (action, payload) => {
    console.log(`⚡ [Sovereign Command]: ${action} tetikleniyor...`);
    if (socket) {
      socket.emit(`admin:${action}`, payload);
    }
  };

  const actions = [
    { id: 'simulate', icon: Cpu, label: 'Run Simulation', color: 'text-blue-400' },
    { id: 'force_atmosphere', icon: Wind, label: 'Force Atmosphere', color: 'text-indigo-400' },
    { id: 'broadcast_nudge', icon: Zap, label: 'Broadcast Nudge', color: 'text-amber-400' },
    { id: 'reality_sync', icon: RefreshCw, label: 'Reality Sync', color: 'text-emerald-400' },
    { id: 'emergency_lock', icon: ShieldAlert, label: 'Emergency Lock', color: 'text-rose-400' },
  ];

  return (
    <div className="fixed right-6 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-4">
      {actions.map((action, index) => (
        <div key={action.id} className="group relative flex items-center justify-end">
          {/* Tooltip */}
          <span className="absolute right-14 px-3 py-1.5 bg-sovereign-coal border border-sovereign-panel text-sovereign-ink text-xs uppercase tracking-widest rounded-sm opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none whitespace-nowrap translate-x-2 group-hover:translate-x-0">
            {action.label}
          </span>
          
          {/* Action Button */}
          <button
            onClick={() => handleDivineAction(action.id, { timestamp: new Date().toISOString() })}
            className={`w-11 h-11 flex items-center justify-center bg-sovereign-coal/80 backdrop-blur-md border border-sovereign-panel hover:border-sovereign-accent/50 rounded-full transition-all duration-300 group-hover:scale-110 shadow-2xl ${action.color}`}
            style={{ transitionDelay: `${index * 50}ms` }}
          >
            <action.icon className="w-4 h-4" />
          </button>
        </div>
      ))}

      {/* Decorative Line */}
      <div className="absolute right-5 top-full mt-4 h-32 w-px bg-gradient-to-b from-sovereign-panel to-transparent"></div>
      <div className="absolute right-5 bottom-full mb-4 h-32 w-px bg-gradient-to-t from-sovereign-panel to-transparent"></div>
    </div>
  );
};

export default SovereignActionRail;
