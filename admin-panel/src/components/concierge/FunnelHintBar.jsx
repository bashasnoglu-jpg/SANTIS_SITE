import React from 'react';

export default function FunnelHintBar({
  showUrgency,
  emphasizeConciergePath,
  explanationCodes,
}) {
  if (!showUrgency && !emphasizeConciergePath && (!explanationCodes || explanationCodes.length === 0)) {
    return null;
  }

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-neutral-300 mb-4 animate-in fade-in duration-300">
      <div className="flex flex-wrap items-center gap-2">
        {showUrgency && (
          <span className="rounded-full border border-amber-400/20 bg-amber-400/10 px-2 py-1 text-amber-200">
            Limited high-confidence availability
          </span>
        )}

        {emphasizeConciergePath && (
          <span className="rounded-full border border-sky-400/20 bg-sky-400/10 px-2 py-1 text-sky-200">
            Concierge path recommended
          </span>
        )}
      </div>

      {explanationCodes?.length > 0 && (
        <div className="mt-2 text-[11px] text-neutral-500 font-mono">
          Signals: {explanationCodes.join(', ')}
        </div>
      )}
    </div>
  );
}
