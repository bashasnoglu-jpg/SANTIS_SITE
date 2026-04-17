export type DataOrigin = 'loading' | 'real' | 'mock' | 'stale' | 'error';

export type ResourceEnvelope<T> = {
  origin: DataOrigin;
  data: T | null;
  fetchedAt?: number;
  error?: string | null;
};
