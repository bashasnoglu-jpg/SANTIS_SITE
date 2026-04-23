import React from 'react';

export function BoardroomView({
  data,
  origin
}: {
  data: Record<string, unknown>;
  origin?: 'real' | 'mock' | 'stale';
}) {
  return (
    <div className="relative">
      {origin === 'mock' && (
        <div className="mb-3 text-2xs tracking-[0.24em] uppercase text-amber-300/80">
          Simulated Data
        </div>
      )}

      <pre className="text-xs text-white/80 overflow-auto">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
}
