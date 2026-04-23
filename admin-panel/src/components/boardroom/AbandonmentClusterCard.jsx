import React from 'react';

export default function AbandonmentClusterCard({ clusters }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="mb-3 text-2xs uppercase tracking-[0.24em] text-neutral-500">
        Abandonment Clusters
      </div>

      <div className="space-y-2">
        {!clusters || clusters.length === 0 ? (
          <div className="text-sm text-neutral-500">No abandonment clusters detected.</div>
        ) : (
          clusters.map((cluster) => (
            <div
              key={cluster.event}
              className="flex items-center justify-between rounded-xl border border-rose-500/10 bg-rose-500/5 px-3 py-2 text-sm text-neutral-300"
            >
              <span className="font-mono">{cluster.event}</span>
              <span className="text-rose-400 font-bold">{cluster.count}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
