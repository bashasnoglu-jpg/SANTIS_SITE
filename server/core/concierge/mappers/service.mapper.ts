import { RawServiceSchema, type RawService } from '../schemas/raw-provider.schemas.ts';
import {
  NormalizedServiceSchema,
  type NormalizedService,
} from '../schemas/normalized.schemas.ts';

function coerceBoolean(value: unknown): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value > 0;
  if (typeof value === 'string') {
    const v = value.trim().toLowerCase();
    return v === 'true' || v === '1' || v === 'yes' || v === 'active';
  }
  return false;
}

function parseDurationMin(value: string | number): number {
  if (typeof value === 'number') return Math.max(1, Math.round(value));
  const match = value.match(/\d+/);
  return match ? Math.max(1, Number(match[0])) : 50;
}

function normalizeCategory(raw?: string): NormalizedService['category'] {
  const v = (raw || '').trim().toLowerCase();
  if (['massage', 'masaj'].includes(v)) return 'massage';
  if (['hamam', 'hammam'].includes(v)) return 'hamam';
  if (['facial', 'cilt', 'skincare'].includes(v)) return 'facial';
  if (['ritual', 'signature'].includes(v)) return 'ritual';
  if (['body'].includes(v)) return 'body';
  return 'other';
}

export function mapRawServiceToNormalized(input: RawService): NormalizedService {
  const raw = RawServiceSchema.parse(input);

  return NormalizedServiceSchema.parse({
    id: raw.id,
    title: raw.name,
    durationMin: parseDurationMin(raw.duration),
    category: normalizeCategory(raw.category),
    isActive: coerceBoolean(raw.active ?? true),
    commercialPriority:
      typeof raw.commercialPriority === 'string'
        ? Number(raw.commercialPriority)
        : (raw.commercialPriority ?? 50),
  });
}
