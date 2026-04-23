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
    <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-3">
      <div className="mb-1 text-2xs uppercase tracking-[0.18em] text-neutral-500">
        {label}
      </div>
      <div className="text-sm font-medium text-neutral-200">{value}</div>
    </div>
  );
}
