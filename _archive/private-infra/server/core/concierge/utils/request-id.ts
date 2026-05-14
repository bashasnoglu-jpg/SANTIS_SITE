import crypto from 'node:crypto';

export function createRequestId(prefix = 'concierge'): string {
  return `${prefix}_${crypto.randomUUID()}`;
}
