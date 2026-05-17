export type BoardroomDemandLevel = 'low' | 'normal' | 'high';
export type BoardroomRecommendationSeverity = 'info' | 'warning' | 'critical';

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

export type SovereignEventName =
  | 'admin:strategy_report_ready'
  | 'admin:request_strategy_synthesis'
  | 'admin:execute_strategy'
  | 'boardroom:snapshot'
  | 'boardroom:revenue_update'
  | 'boardroom:demand_update'
  | 'boardroom:recommendation_added'
  | 'boardroom:alert';

export interface SovereignEventPayloads {
  'admin:strategy_report_ready': unknown;
  'admin:request_strategy_synthesis': undefined;
  'admin:execute_strategy': { reportId: string };
  'boardroom:snapshot': BoardroomState;
  'boardroom:revenue_update': { revenueToday: number; delta?: number; timestamp?: string };
  'boardroom:demand_update': { demandLevel: BoardroomDemandLevel; timestamp?: string };
  'boardroom:recommendation_added': BoardroomRecommendedAction;
  'boardroom:alert': { id: string; message: string; severity: BoardroomRecommendationSeverity; timestamp?: string };
}

export type SovereignEventHandler<K extends SovereignEventName> = (
  payload: SovereignEventPayloads[K],
  rawMessage: unknown,
) => void;
