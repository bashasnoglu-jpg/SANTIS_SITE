import { RawPriceSchema, type RawPrice } from '../schemas/raw-provider.schemas.ts';
import {
  NormalizedPriceSchema,
  type NormalizedPrice,
} from '../schemas/normalized.schemas.ts';

function coerceBoolean(value: unknown): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value > 0;
  if (typeof value === 'string') {
    const v = value.trim().toLowerCase();
    return v === 'true' || v === '1' || v === 'yes' || v === 'available';
  }
  return false;
}

function parseMoney(value: string | number): number {
  if (typeof value === 'number') return value;
  const normalized = value.replace(/[^\d.,-]/g, '').replace(',', '.');
  const amount = Number(normalized);
  return Number.isFinite(amount) ? amount : 0;
}

export function mapRawPriceToNormalized(input: RawPrice): NormalizedPrice {
  const raw = RawPriceSchema.parse(input);

  return NormalizedPriceSchema.parse({
    serviceId: raw.serviceId,
    amount: parseMoney(raw.amount),
    currency: 'EUR',
    compareAtAmount:
      raw.compareAtAmount !== undefined ? parseMoney(raw.compareAtAmount) : null,
    isAvailable: coerceBoolean(raw.available ?? true),
  });
}
