import React, { useState } from 'react';
import ActionQueueTable from './ActionQueueTable';
import ActionDecisionDrawer from './ActionDecisionDrawer';
import OperatorAuditRail from './OperatorAuditRail';

export default function ControlConsolePanel({
  queue,
  decisions,
  onDecision,
}) {
  const [selected, setSelected] = useState(null);

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.2fr_.9fr_.9fr]">
      <ActionQueueTable items={queue} onSelect={setSelected} />
      <ActionDecisionDrawer item={selected} onDecision={onDecision} />
      <OperatorAuditRail decisions={decisions} />
    </div>
  );
}
