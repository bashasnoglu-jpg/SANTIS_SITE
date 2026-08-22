import { ConstitutionalGuard } from '../core/adapter';

const AUTH_LOGIN_ENDPOINT = '/api/admin/login';
const AUTH_LOGOUT_ENDPOINT = '/api/admin/logout';
const AUTH_SESSION_ENDPOINT = '/api/admin/session';
const DEFAULT_LOGIN_MESSAGE = 'Giris yetkisi reddedildi. Bilgilerinizi kontrol edin.';

const parseResponseBody = async (response) => {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
};

const requestAuth = async (endpoint, options = {}) => {
  const response = await fetch(endpoint, {
    credentials: 'include',
    cache: 'no-store',
    ...options,
  });
  const body = await parseResponseBody(response);
  if (!response.ok) {
    throw {
      status: response.status,
      response: { status: response.status, data: body },
    };
  }
  return body;
};

const normalizeAuthError = (error) => {
  const status = error?.response?.status ?? error?.status ?? null;
  const payload = error?.response?.data ?? error ?? {};
  let code = payload?.code || payload?.error || null;
  if (!code && status === 401) code = 'AUTH_INVALID_CREDENTIALS';
  else if (!code && status === 403) code = 'AUTH_INSUFFICIENT_PERMISSIONS';
  else if (!code && status === 400) code = 'CONFIG_INVALID_SCHEMA';
  return ConstitutionalGuard.sanitize({ ...payload, code, status }, DEFAULT_LOGIN_MESSAGE);
};

export async function loginAdmin(email, password) {
  try {
    return await requestAuth(AUTH_LOGIN_ENDPOINT, {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
  } catch (error) {
    throw normalizeAuthError(error);
  }
}

export async function logoutAdmin() {
  return requestAuth(AUTH_LOGOUT_ENDPOINT, { method: 'POST', headers: { Accept: 'application/json' } });
}

export async function getAdminSession() {
  return requestAuth(AUTH_SESSION_ENDPOINT, { method: 'GET', headers: { Accept: 'application/json' } });
}
