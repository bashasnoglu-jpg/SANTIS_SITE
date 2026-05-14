import type { ReplayEvent } from './replay-engine.js';
import type { ActionRecommendation } from '@santis/domain-schema';

type BoardroomReplayState = {
  activeActions: ActionRecommendation[];
  resolvedActionIds: string[];
  auditTrail: {
    eventId: string;
    eventType: ReplayEvent['eventType'];
    actionId?: string;
    occurredAt: string;
  }[];
  lastEventId: string | null;
  status: 'idle' | 'replaying';
};

export function createInitialBoardroomState(): BoardroomReplayState {
  return {
    activeActions: [],
    resolvedActionIds: [],
    auditTrail: [],
    lastEventId: null,
    status: 'idle',
  };
}

export function boardroomReducer(
  state: BoardroomReplayState,
  event: ReplayEvent,
): BoardroomReplayState {
  const actionId = 'payload' in event && typeof event.payload === 'object' && event.payload !== null && 'actionId' in event.payload
    ? String(event.payload.actionId)
    : undefined;

  if (event.eventType === 'action.approval.simulated' || event.eventType === 'pricing.recommendation.rejected') {
    return {
      ...state,
      activeActions: actionId ? state.activeActions.filter((action) => action.id !== actionId) : state.activeActions,
      resolvedActionIds: actionId ? [...state.resolvedActionIds, actionId] : state.resolvedActionIds,
      auditTrail: [
        {
          eventId: event.eventId,
          eventType: event.eventType,
          actionId,
          occurredAt: event.occurredAt,
        },
        ...state.auditTrail,
      ],
      lastEventId: event.eventId,
      status: 'replaying',
    };
  }

  return {
    ...state,
    lastEventId: event.eventId,
  };
}
