import { RevenueDailyResponseSchema, type RevenueDailyData } from './revenue-daily.schemas.ts';

export type RevenueDailyResult =
  | { ok: true; data: RevenueDailyData }
  | {
      ok: false;
      error: 'HTTP_ERROR' | 'INVALID_PAYLOAD' | 'NETWORK_ERROR';
      status?: number;
      message: string;
    };

export async function fetchRevenueDaily(): Promise<RevenueDailyResult> {
  try {
    const response = await fetch('/api/v1/revenue/daily', {
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
      return {
        ok: false,
        error: 'HTTP_ERROR',
        status: response.status,
        message: `Revenue endpoint returned ${response.status}`,
      };
    }

    const json = await response.json();
    const parsed = RevenueDailyResponseSchema.safeParse(json);

    if (!parsed.success) {
      return {
        ok: false,
        error: 'INVALID_PAYLOAD',
        message: 'Revenue payload shape is invalid',
      };
    }

    return {
      ok: true,
      data: parsed.data,
    };
  } catch (error) {
    return {
      ok: false,
      error: 'NETWORK_ERROR',
      message: error instanceof Error ? error.message : 'Unknown network error',
    };
  }
}
