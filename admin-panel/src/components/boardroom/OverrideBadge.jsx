import React from 'react';

export default function OverrideBadge({ status, severity, autoExecutable }) {
  const statusColor = {
    pending: 'text-neutral-400',
    approved: 'text-emerald-400',
    rejected: 'text-rose-400',
    executed: 'text-sky-400',
    overridden: 'text-amber-400',
    expired: 'text-neutral-500',
  }[status] || 'text-neutral-400';

  return (
    <div className="flex flex-col items-end gap-1 text-2xs uppercase tracking-[0.18em]">
      <span className={autoExecutable ? 'text-amber-400' : 'text-neutral-300'}>{autoExecutable ? 'AUTO' : 'ADVISORY'}</span>
      <span className="text-neutral-500">{severity}</span>
      <span className={`font-bold ${statusColor}`}>{status}</span>
    </div>
  );
}
