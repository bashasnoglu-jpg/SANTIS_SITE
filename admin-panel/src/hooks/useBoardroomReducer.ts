import { useReducer } from 'react';
import {
  BoardroomOperationsState,
  SovereignEventPayloads,
} from '../types/socketEvents';

const initialState: BoardroomOperationsState = {
  totalRevenue: 0,
  activeSessions: 0,
  staffStatus: {},
};

type BoardroomAction =
  | {
      type: 'ADD_REVENUE';
      payload: SovereignEventPayloads['boardroom:revenue_tick'];
    }
  | {
      type: 'UPDATE_STAFF';
      payload: SovereignEventPayloads['boardroom:staff_status_change'];
    };

const boardroomReducer = (
  state: BoardroomOperationsState,
  action: BoardroomAction,
): BoardroomOperationsState => {
  switch (action.type) {
    case 'ADD_REVENUE':
      return {
        ...state,
        totalRevenue: state.totalRevenue + action.payload.amount,
        lastRevenueTick: action.payload,
      };

    case 'UPDATE_STAFF': {
      const { therapistId, status } = action.payload;

      const nextStaffStatus = {
        ...state.staffStatus,
        [therapistId]: status,
      };

      const activeSessions = Object.values(nextStaffStatus).filter(
        (value) => value === 'IN_SESSION',
      ).length;

      return {
        ...state,
        staffStatus: nextStaffStatus,
        activeSessions,
      };
    }

    default:
      return state;
  }
};

export function useBoardroomReducer() {
  return useReducer(boardroomReducer, initialState);
}
