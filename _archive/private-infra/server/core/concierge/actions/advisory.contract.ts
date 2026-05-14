export type AdvisoryAction = {
  id: string;
  requestId?: string;
  type: string;
  severity: 'low' | 'medium' | 'high';
  autoExecutable: boolean;
  explanationCodes: string[];
  payload?: Record<string, unknown>;
};
