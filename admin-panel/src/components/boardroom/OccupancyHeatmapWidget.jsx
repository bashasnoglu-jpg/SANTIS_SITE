import React from 'react';
import { Grid } from 'lucide-react';

export default function OccupancyHeatmapWidget() {
  const isFallback = true;
  const seedData = [
    { time: '10:00', load: 80 },
    { time: '12:00', load: 45 },
    { time: '14:00', load: 95 },
    { time: '16:00', load: 60 },
    { time: '18:00', load: 20 },
  ];

  return (
    <div className="bg-sovereign-obsidian border border-sovereign-panel hover:border-sovereign-earth/50 rounded-sm p-8 flex flex-col transition-colors animate-fade-in md:col-span-2 xl:col-span-1" style={{ animationDelay: '500ms' }}>
      <div className="flex items-center justify-between mb-6 border-b border-sovereign-panel pb-4">
        <div className="flex items-center gap-3">
          <Grid className="w-5 h-5 text-sovereign-accent" />
          <h3 className="text-sovereign-ink text-sm uppercase tracking-widest font-medium">Occupancy Heatmap</h3>
        </div>
        {isFallback && (
          <span className="text-2xs uppercase tracking-widest bg-sovereign-earth/20 text-sovereign-earth px-2 py-1 rounded-sm whitespace-nowrap">
            AWAITING LIVE OCCUPANCY STREAM
          </span>
        )}
      </div>

      <p className="text-sovereign-bronze text-xs leading-relaxed mb-6">
        Tesis içerisindeki tahmini yoğunluk ve kapasite durumu (Deterministic Fallback).
      </p>

      <div className="mt-auto space-y-4">
        {seedData.map((slot, index) => (
          <div key={index} className="flex items-center gap-4">
            <span className="text-sovereign-sand text-xs w-12">{slot.time}</span>
            <div className="flex-1 h-2 bg-sovereign-coal rounded-full overflow-hidden flex">
              <div
                className={`h-full ${slot.load > 80 ? 'bg-sovereign-accent shadow-accent-glow' : slot.load > 50 ? 'bg-sovereign-sand' : 'bg-sovereign-earth'}`}
                style={{ width: `${slot.load}%` }}
              ></div>
            </div>
            <span className="text-sovereign-ink text-xs w-8 text-right">{slot.load}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
