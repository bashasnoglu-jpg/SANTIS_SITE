import type { ConsoleActionItem } from './console.contract.ts';

export function mapActionsToConsoleQueue(actions: any[]): ConsoleActionItem[] {
  return actions.map((action) => ({
    id: action.id,
    requestId: action.requestId,
    quoteId: action.quoteId,
    intentId: action.intentId,
    type: action.type,
    severity: action.severity,
    autoExecutable: action.autoExecutable,
    explanationCodes: action.explanationCodes ?? [],
    payload: action.payload,
    status: action.autoExecutable ? 'executed' : 'pending',
    createdAt: new Date().toISOString(),
  }));
}
