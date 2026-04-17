import React from 'react';
import { useBoardroomCoreState } from './boardroom.hooks';
import { BoardroomView } from './BoardroomView';

function SkeletonBoardroom() {
  return (
    <div className="p-6 animate-pulse opacity-70">
      Loading verified live state...
    </div>
  );
}

function SystemFallback({ message }: { message: string }) {
  return (
    <div className="p-6 border border-white/10 rounded-2xl text-sm text-white/70">
      {message}
    </div>
  );
}

export function BoardroomGate() {
  const resource = useBoardroomCoreState();

  if (resource.origin === 'loading') {
    return <SkeletonBoardroom />;
  }

  if (resource.origin === 'error') {
    return <SystemFallback message={resource.error ?? 'State unavailable'} />;
  }

  if (resource.origin !== 'real' || !resource.data) {
    return <SystemFallback message="No verified live data" />;
  }

  return <BoardroomView data={resource.data} />;
}
