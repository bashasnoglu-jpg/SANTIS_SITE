import { useEffect, useReducer } from 'react';
import { useSovereignWebSocket } from './useSovereignWebSocket';
import {
  BoardroomRecommendedAction,
  BoardroomState,
} from '../types/socketEvents';

const initialBoardroomState: BoardroomState = {
  revenueToday: 0,
  demandLevel: 'normal',
  vipSessions: 0,
  hesitationAlerts: 0,
  recommendedActions: [],
};

type BoardroomReducerAction =
  | { type: 'SNAPSHOT'; payload: BoardroomState }
  | {
      type: 'REVENUE_UPDATE';
      payload: {
        revenueToday: number;
      };
    }
  | {
      type: 'DEMAND_UPDATE';
      payload: {
        demandLevel: BoardroomState['demandLevel'];
      };
    }
  | {
      type: 'RECOMMENDATION_ADDED';
      payload: BoardroomRecommendedAction;
    };

function boardroomReducer(
  state: BoardroomState,
  action: BoardroomReducerAction,
): BoardroomState {
  switch (action.type) {
    case 'SNAPSHOT':
      return action.payload;

    case 'REVENUE_UPDATE':
      return {
        ...state,
        revenueToday: action.payload.revenueToday,
      };

    case 'DEMAND_UPDATE':
      return {
        ...state,
        demandLevel: action.payload.demandLevel,
      };

    case 'RECOMMENDATION_ADDED': {
      const nextRecommendations = [
        action.payload,
        ...state.recommendedActions,
      ].slice(0, 20);

      return {
        ...state,
        recommendedActions: nextRecommendations,
      };
    }

    default:
      return state;
  }
}

export function useBoardroomEventStream() {
  const { onSocketEvent } = useSovereignWebSocket();

  const [state, dispatch] = useReducer(
    boardroomReducer,
    initialBoardroomState,
  );

  useEffect(() => {
    const unsubscribeSnapshot = onSocketEvent(
      'boardroom:snapshot',
      (payload) => {
        dispatch({
          type: 'SNAPSHOT',
          payload,
        });
      },
    );

    const unsubscribeRevenue = onSocketEvent(
      'boardroom:revenue_update',
      (payload) => {
        dispatch({
          type: 'REVENUE_UPDATE',
          payload: {
            revenueToday: payload.revenueToday,
          },
        });
      },
    );

    const unsubscribeDemand = onSocketEvent(
      'boardroom:demand_update',
      (payload) => {
        dispatch({
          type: 'DEMAND_UPDATE',
          payload: {
            demandLevel: payload.demandLevel,
          },
        });
      },
    );

    const unsubscribeRecommendation = onSocketEvent(
      'boardroom:recommendation_added',
      (payload) => {
        dispatch({
          type: 'RECOMMENDATION_ADDED',
          payload,
        });
      },
    );

    return () => {
      unsubscribeSnapshot?.();
      unsubscribeRevenue?.();
      unsubscribeDemand?.();
      unsubscribeRecommendation?.();
    };
  }, [onSocketEvent]);

  return state;
}
