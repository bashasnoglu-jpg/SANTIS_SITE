import React from 'react';

export default function OverrideBadge({ status, severity, autoExecutable }) {
  const statusColor = {
    pending: 'text-sovereign-neutral-400',
    approved: 'text-sovereign-success',
    rejected: 'text-sovereign-danger',
    executed: 'text-sovereign-accent',
    overridden: 'text-sovereign-warning',
    expired: 'text-sovereign-bronze',
  }[status] || 'text-sovereign-neutral-400';

  return (
    <div className="flex flex-col items-end gap-1 text-2xs uppercase tracking-widest">
      <span className={autoExecutable ? 'text-sovereign-warning' : 'text-sovereign-sand'}>{autoExecutable ? 'AUTO' : 'ADVISORY'}</span>
      <span className="text-sovereign-bronze">{severity}</span>
      <span className={`font-bold ${statusColor}`}>{status}</span>
    </div>
  );
}
