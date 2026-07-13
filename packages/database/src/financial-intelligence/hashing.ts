import { createHash } from 'node:crypto';

export const BUSINESS_FACT_FIELDS = [
  'fact_type',
  'amount_eur',
  'currency',
  'direction',
  'occurred_at',
  'tenant_id',
  'location_id',
  'environment',
  'parent_fact_reference',
] as const;

function normalizeValue(value: unknown): unknown {
  if (value === undefined || value === null) return null;
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw new Error('Non-finite numbers cannot be hashed');
    return value;
  }
  if (Array.isArray(value)) return value.map(normalizeValue);
  if (typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, nested]) => [key, normalizeValue(nested)]),
    );
  }
  return value;
}

export function canonicalSerialize(fields: Record<string, unknown>, includeFields?: readonly string[]): string {
  const keys = (includeFields ?? Object.keys(fields))
    .filter((key) => Object.prototype.hasOwnProperty.call(fields, key))
    .sort();
  const canonical = Object.fromEntries(keys.map((key) => [key, normalizeValue(fields[key])]));
  return JSON.stringify(canonical);
}

export function computeCanonicalHash(fields: Record<string, unknown>, includeFields?: readonly string[]): string {
  return createHash('sha256').update(canonicalSerialize(fields, includeFields), 'utf8').digest('hex');
}

export function computeBusinessFactHash(fields: Record<string, unknown>): string {
  return computeCanonicalHash(fields, BUSINESS_FACT_FIELDS);
}

export function computeSourceSnapshotHash(fields: Record<string, unknown>): string {
  return computeCanonicalHash(fields);
}
