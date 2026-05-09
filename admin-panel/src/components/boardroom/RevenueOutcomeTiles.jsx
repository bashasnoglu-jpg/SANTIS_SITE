import React from 'react';

export default function RevenueOutcomeTiles({
  totalAttributedRevenue,
  confirmedIntentRate,
  abandonmentRate,
}) {
  return (
    <div className="grid grid-cols-3 gap-3">
      <Tile label="Attributed Revenue" value={`€${totalAttributedRevenue}`} />
      <Tile label="Intent Confirm Rate" value={String(confirmedIntentRate)} />
      <Tile label="Abandonment Rate" value={String(abandonmentRate)} />
    </div>
  );
}

function Tile({ label, value }) {
  return (
    <div className="rounded-xl border border-sovereign-panel bg-sovereign-obsidian/50 px-3 py-3">
      <div className="mb-1 text-2xs uppercase tracking-widest text-sovereign-bronze">
        {label}
      </div>
      <div className="text-sm font-medium text-sovereign-ink">{value}</div>
    </div>
  );
}
