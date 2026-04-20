import React from 'react';

export function SlotConfidenceHint(props) {
  if (props.hiddenCount <= 0) return null;

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-neutral-400 mt-4 animate-in fade-in duration-300">
      Lower-confidence slots are hidden. Minimum confidence threshold: {(props.minConfidence * 100).toFixed(0)}%
    </div>
  );
}
