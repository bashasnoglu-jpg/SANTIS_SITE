import { validateCoreStateRuntime } from './state-validator';

export function sovereignSentinel() {
  return async function (req: any, res: any, next: any) {
    const decision = validateCoreStateRuntime(req.body);

    if (decision.status === 'flow_freeze') {
      return res.status(409).json({
        error: 'FLOW_FREEZE',
        reason: decision.reason,
        invariant: decision.invariant
      });
    }

    if (decision.status === 'soft_sync') {
      req.runtimeAdjustment = decision;
    }

    return next();
  };
}
