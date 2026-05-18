import React from 'react';

export default function AbandonmentClusterCard({ clusters }) {
  return (
    <div className="rounded-2xl border border-sovereign-panel bg-sovereign-obsidian/50 p-4">
      <div className="mb-3 text-2xs uppercase tracking-widest text-sovereign-bronze">
        Abandonment Clusters
      </div>

      <div className="space-y-2">
        {!clusters || clusters.length === 0 ? (
          <div className="text-sm text-sovereign-bronze">No abandonment clusters detected.</div>
        ) : (
          clusters.map((cluster) => (
            <div
              key={cluster.event}
              className="flex items-center justify-between rounded-xl border border-sovereign-danger/20 bg-sovereign-danger/10 px-3 py-2 text-sm text-sovereign-sand"
            >
              <span className="font-mono">{cluster.event}</span>
              <span className="text-sovereign-danger font-bold">{cluster.count}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
