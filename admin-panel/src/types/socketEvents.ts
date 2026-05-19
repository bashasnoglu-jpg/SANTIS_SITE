export type BoardroomDemandLevel = 'low' | 'normal' | 'high';
export type BoardroomRecommendationSeverity = 'info' | 'warning' | 'critical';
export type BoardroomServiceCategory = 'REPAIR' | 'GLOW' | 'DETOX' | 'RELAX';
export type BoardroomStaffStatus = 'AVAILABLE' | 'IN_SESSION' | 'OFF_DUTY';

export interface BoardroomRecommendedAction {
  id: string;
  reason: string;
  action: string;
  severity: BoardroomRecommendationSeverity;
}

export interface BoardroomState {
  revenueToday: number;
  demandLevel: BoardroomDemandLevel;
  vipSessions: number;
  hesitationAlerts: number;
  recommendedActions: BoardroomRecommendedAction[];
}

export interface BoardroomRevenueTickPayload {
  amount: number;
  currency: string;
  serviceCategory: BoardroomServiceCategory;
  timestamp: string;
}

export interface BoardroomStaffStatusChangePayload {
  therapistId: string;
  status: BoardroomStaffStatus;
}

export interface BoardroomOperationsState {
  totalRevenue: number;
  activeSessions: number;
  staffStatus: Record<string, BoardroomStaffStatus>;
  lastRevenueTick?: BoardroomRevenueTickPayload;
}

export type SovereignEventName =
  | 'admin:strategy_report_ready'
  | 'admin:request_strategy_synthesis'
  | 'admin:execute_strategy'
  | 'boardroom:snapshot'
  | 'boardroom:revenue_update'
  | 'boardroom:demand_update'
  | 'boardroom:recommendation_added'
  | 'boardroom:alert'
  | 'boardroom:revenue_tick'
  | 'boardroom:staff_status_change';

export interface SovereignEventPayloads {
  'admin:strategy_report_ready': unknown;
  'admin:request_strategy_synthesis': undefined;
  'admin:execute_strategy': { reportId: string };
  'boardroom:snapshot': BoardroomState;
  'boardroom:revenue_update': { revenueToday: number; delta?: number; timestamp?: string };
  'boardroom:demand_update': { demandLevel: BoardroomDemandLevel; timestamp?: string };
  'boardroom:recommendation_added': BoardroomRecommendedAction;
  'boardroom:alert': { id: string; message: string; severity: BoardroomRecommendationSeverity; timestamp?: string };
  'boardroom:revenue_tick': BoardroomRevenueTickPayload;
  'boardroom:staff_status_change': BoardroomStaffStatusChangePayload;
}

export type SovereignEventHandler<K extends SovereignEventName> = (
  payload: SovereignEventPayloads[K],
  rawMessage: unknown,
) => void;

export type SovereignWebSocketEvent =
  | {
      type: 'OVERRIDE_APPLY_ACK';
      recommendationId: string;
    }
  | {
      type: 'FEEDBACK_CALCULATED';
      decisionId: string;
      feedbackScore: number;
    }
  | {
      type: 'EVENT_REPLAY';
      payload: Array<{
        id: string;
        type: string;
        createdAt: string;
        subject?: string;
        payload?: Record<string, unknown>;
      }>;
    }
  | {
      type: 'EVENT_STREAM';
      payload: {
        id: string;
        type: string;
        createdAt: string;
        subject?: string;
        payload?: Record<string, unknown>;
      };
    }
  | {
      type: 'ROLLOUT_STATUS_UPDATE';
      data: {
        status: 'pending' | 'running' | 'completed' | 'reverted';
        scope?: {
          rolloutPercentage?: number;
        };
        metrics?: {
          riskDelta?: number;
        };
      };
    };

export function isSovereignWebSocketEvent(value: unknown): value is SovereignWebSocketEvent {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const obj = value as Record<string, unknown>;
  if (typeof obj.type !== 'string') {
    return false;
  }
  const allowedTypes = new Set([
    'OVERRIDE_APPLY_ACK',
    'FEEDBACK_CALCULATED',
    'EVENT_REPLAY',
    'EVENT_STREAM',
    'ROLLOUT_STATUS_UPDATE',
  ]);
  return allowedTypes.has(obj.type);
}

