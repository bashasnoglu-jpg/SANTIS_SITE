import React from 'react';

export function ServiceChoiceRail(props) {
  if (!props.reduced) return null;

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-neutral-400 mb-4 animate-in fade-in duration-300">
      Choices reduced for clarity. Showing {props.visibleCount} of {props.totalCount} options.
    </div>
  );
}
