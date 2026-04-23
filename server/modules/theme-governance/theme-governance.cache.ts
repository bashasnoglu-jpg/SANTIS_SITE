type CacheEntry<T> = {
  value: T;
  expiresAt: number;
};

const store = new Map<string, CacheEntry<unknown>>();

export const THEME_CACHE_TTL_MS = 30_000;

export function getCache<T>(key: string): T | null {
  const entry = store.get(key);
  if (!entry) return null;

  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    return null;
  }

  return entry.value as T;
}

export function setCache<T>(key: string, value: T, ttlMs = THEME_CACHE_TTL_MS) {
  store.set(key, {
    value,
    expiresAt: Date.now() + ttlMs
  });
}

export function deleteCache(key: string) {
  store.delete(key);
}

export function clearByPrefix(prefix: string) {
  for (const key of store.keys()) {
    if (key.startsWith(prefix)) {
      store.delete(key);
    }
  }
}

export function buildResolvedThemeCacheKey(tenantId?: string | null) {
  return `resolved-theme:${tenantId || 'global'}`;
}
