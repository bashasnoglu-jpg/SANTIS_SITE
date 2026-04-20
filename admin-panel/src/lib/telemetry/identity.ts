const VISITOR_ID_KEY = 'santis_visitor_id';

export function getOrCreateVisitorId(): string | undefined {
  if (typeof window === 'undefined' || !window.localStorage) {
    return undefined;
  }

  const existing = window.localStorage.getItem(VISITOR_ID_KEY);
  if (existing) return existing;

  const next = `vis_${crypto.randomUUID()}`;
  window.localStorage.setItem(VISITOR_ID_KEY, next);
  return next;
}

export function createSessionId(): string {
  return `sess_${crypto.randomUUID()}`;
}
