// lib/operatorIdentity.js
// Operator kimlik yönetimi — session bazlı, persist edilebilir.
// v1.1: localStorage + manuel kimlik; v1.3'te RBAC ile değiştirilecek.

const SESSION_KEY  = 'santis_op_session';
const IDENTITY_KEY = 'santis_op_identity';

// ─── Yardımcılar ──────────────────────────────────────────────────────────────
function generateId(prefix = 'op') {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

function now() { return Date.now(); }

// ─── Session Yönetimi ─────────────────────────────────────────────────────────

/**
 * Mevcut session'ı döndürür veya yeni bir tane oluşturur.
 * @returns {{ sessionId: string, startedAt: number }}
 */
export function getOrCreateSession() {
  try {
    const stored = localStorage.getItem(SESSION_KEY);
    if (stored) {
      const session = JSON.parse(stored);
      // Aynı sekme oturumu — 8 saat geçerliliği
      if (now() - session.startedAt < 8 * 60 * 60 * 1000) {
        return session;
      }
    }
  } catch { /* localStorage kullanılamıyor */ }

  const session = { sessionId: generateId('ses'), startedAt: now() };
  try { localStorage.setItem(SESSION_KEY, JSON.stringify(session)); } catch {}
  return session;
}

/**
 * Mevcut operatör kimliğini döndürür veya tanımsız bir kimlik oluşturur.
 * @returns {{ operatorId: string, operatorName: string, role: string }}
 */
export function getOrCreateIdentity() {
  try {
    const stored = localStorage.getItem(IDENTITY_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}

  // İlk kullanımda anonim kimlik — setIdentity() ile güncellenmeli
  const identity = {
    operatorId:   generateId('op'),
    operatorName: 'Anonim Operatör',
    role:         'watcher',
  };
  try { localStorage.setItem(IDENTITY_KEY, JSON.stringify(identity)); } catch {}
  return identity;
}

/**
 * Operatör kimliğini günceller (UI login formu çıktısı).
 * @param {{ operatorId: string, operatorName: string, role: string }} identity
 */
export function setIdentity(identity) {
  const validated = {
    operatorId:   identity.operatorId   || generateId('op'),
    operatorName: identity.operatorName || 'Anonim Operatör',
    role:         identity.role         || 'watcher',
  };
  try { localStorage.setItem(IDENTITY_KEY, JSON.stringify(validated)); } catch {}
  return validated;
}

/**
 * Tam kimlik paketini döndürür — gateway payload'larında kullanılır.
 * @returns {{ operatorId, operatorName, role, sessionId, startedAt }}
 */
export function getIdentityBundle() {
  const identity = getOrCreateIdentity();
  const session  = getOrCreateSession();
  return { ...identity, ...session };
}

/** Session'ı temizler (logout). */
export function clearSession() {
  try {
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(IDENTITY_KEY);
  } catch {}
}
