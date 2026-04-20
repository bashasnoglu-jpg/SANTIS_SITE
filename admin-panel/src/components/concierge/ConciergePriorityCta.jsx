import React from 'react';

export default function ConciergePriorityCta({ visible, onClick }) {
  if (!visible) return null;

  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-2xl border border-sky-400/20 bg-sky-400/10 px-4 py-3 text-sm text-sky-100 transition hover:bg-sky-400/15"
    >
      Speak to Concierge Now
    </button>
  );
}
