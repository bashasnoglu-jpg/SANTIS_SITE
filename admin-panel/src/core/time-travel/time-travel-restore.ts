type StoreLike<TState> = {
  replaceState: (nextState: TState) => void;
  getState?: () => TState;
};

type ProjectionLike<TProjection> = {
  replace: (nextProjection: TProjection) => void;
  get?: () => TProjection;
};

type TimelineLike = {
  seek: (cursor: number) => void;
  getCursor?: () => number;
};

type TravelSnapshot<TState, TProjection> = {
  id: string;
  ts: number;
  state: TState;
  projection?: TProjection;
  eventCursor?: number;
};

function cloneSafe<T>(value: T): T {
  return typeof structuredClone === 'function'
    ? structuredClone(value)
    : JSON.parse(JSON.stringify(value));
}

export function restoreSnapshot<TState, TProjection>(
  snapshot: TravelSnapshot<TState, TProjection>,
  deps: {
    store: StoreLike<TState>;
    projections?: ProjectionLike<TProjection>;
    timeline?: TimelineLike;
    render?: () => void;
  }
) {
  deps.store.replaceState(cloneSafe(snapshot.state));

  if (deps.projections && snapshot.projection !== undefined) {
    deps.projections.replace(cloneSafe(snapshot.projection));
  }

  if (deps.timeline && typeof snapshot.eventCursor === 'number') {
    deps.timeline.seek(snapshot.eventCursor);
  }

  deps.render?.();
}
