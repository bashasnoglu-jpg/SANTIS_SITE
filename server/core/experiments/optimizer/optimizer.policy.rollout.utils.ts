import { createHash } from 'node:crypto';
import {
  OptimizerPolicyMutationOp,
  OptimizerPolicyPatch,
} from './optimizer.policy.rollout.contract.ts';

export function deepClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

export function getByPath(obj: unknown, path: string): unknown {
  if (!path) return obj;
  const parts = path.split('.');
  let current: any = obj;

  for (const part of parts) {
    if (current == null || typeof current !== 'object') {
      return undefined;
    }
    current = current[part];
  }

  return current;
}

export function setByPath(obj: unknown, path: string, value: unknown): void {
  const parts = path.split('.');
  let current: any = obj;

  for (let i = 0; i < parts.length - 1; i += 1) {
    const part = parts[i];
    if (
      current[part] == null ||
      typeof current[part] !== 'object' ||
      Array.isArray(current[part])
    ) {
      current[part] = {};
    }
    current = current[part];
  }

  current[parts[parts.length - 1]] = value;
}

export function applyPatch<T extends object>(
  target: T,
  patch: OptimizerPolicyPatch,
): T {
  const next = deepClone(target);

  for (const op of patch.ops) {
    if (op.op !== 'set') {
      throw new Error(`Unsupported patch op: ${String((op as any).op)}`);
    }
    setByPath(next, op.path, op.value);
  }

  return next;
}

export function invertPatch(
  currentState: unknown,
  patch: OptimizerPolicyPatch,
): OptimizerPolicyPatch {
  const invertedOps: OptimizerPolicyMutationOp[] = patch.ops.map((op) => ({
    op: 'set',
    path: op.path,
    value:
      op.previousValue !== undefined
        ? op.previousValue
        : getByPath(currentState, op.path),
    previousValue: op.value,
    reason: `Rollback for ${op.reason ?? op.path}`,
  }));

  return { ops: invertedOps };
}

export function fingerprintOf(value: unknown): string {
  const serialized = JSON.stringify(value);
  return createHash('sha256').update(serialized).digest('hex');
}

export function nowIso(): string {
  return new Date().toISOString();
}
