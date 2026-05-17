export type SovereignEventName =
  | 'admin:strategy_report_ready'
  | 'admin:request_strategy_synthesis'
  | 'admin:execute_strategy';

export interface SovereignEventPayloads {
  'admin:strategy_report_ready': unknown;
  'admin:request_strategy_synthesis': undefined;
  'admin:execute_strategy': { reportId: string };
}

export type SovereignEventHandler<K extends SovereignEventName> = (
  payload: SovereignEventPayloads[K],
  rawMessage: unknown,
) => void;
