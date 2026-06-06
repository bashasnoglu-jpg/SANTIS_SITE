import React from 'react';
import { BrainCircuit, ArrowRight } from 'lucide-react';

export default function NeuralFeedWidget() {
  const feed = [
    { id: 1, type: 'insight', text: 'Guest behavior suggests high intent for SPA booking.', time: 'Just now' },
    { id: 2, type: 'action', text: 'Dynamic pricing engaged for Salt Room (+12%).', time: '2m ago' },
    { id: 3, type: 'alert', text: 'Checkout abandonment risk elevated.', time: '5m ago' }
  ];

  return (
    <div className="bg-sovereign-obsidian border border-sovereign-panel hover:border-sovereign-accent/30 rounded-sm p-8 flex flex-col transition-colors animate-fade-in md:col-span-2 xl:col-span-1" style={{ animationDelay: '700ms' }}>
      <div className="flex items-center justify-between mb-6 border-b border-sovereign-panel pb-4">
        <div className="flex items-center gap-3">
          <BrainCircuit className="w-5 h-5 text-sovereign-accent" />
          <h3 className="text-sovereign-ink text-sm uppercase tracking-widest font-medium">Neural Feed</h3>
        </div>
        <div className="text-2xs text-sovereign-gold bg-sovereign-gold/10 px-2 py-1 rounded-sm uppercase tracking-widest animate-pulse">
          Live AI Stream
        </div>
      </div>

      <div className="space-y-4 mb-auto">
        {feed.map((item) => (
          <div key={item.id} className="group relative pl-4 border-l border-sovereign-panel hover:border-sovereign-accent transition-colors">
            <div className="absolute w-2 h-2 rounded-full bg-sovereign-coal border border-sovereign-panel group-hover:border-sovereign-accent group-hover:bg-sovereign-accent -left-[5px] top-1 transition-all"></div>
            <div className="text-xs text-sovereign-ink font-medium leading-relaxed">{item.text}</div>
            <div className="text-2xs text-sovereign-muted mt-1 uppercase font-mono">{item.time}</div>
          </div>
        ))}
      </div>
      
      <button className="mt-6 flex items-center justify-center gap-2 w-full py-3 border border-sovereign-panel hover:bg-sovereign-coal/50 text-xs text-sovereign-muted hover:text-sovereign-ink uppercase tracking-widest transition-colors rounded-sm">
        View Full History <ArrowRight className="w-3 h-3" />
      </button>
    </div>
  );
}
