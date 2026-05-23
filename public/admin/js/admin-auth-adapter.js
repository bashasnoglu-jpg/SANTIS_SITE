/**
 * public/admin/js/admin-auth-adapter.js
 * Sovereign Boardroom Central Auth Adapter
 */

const TOKEN_KEY = 'santis_admin_token';

export const AdminAuth = {
    getAuthToken() {
        return localStorage.getItem(TOKEN_KEY) || null;
    },

    setAuthToken(token) {
        if (!token || typeof token !== 'string') {
            console.error('[AdminAuth] Invalid token provided.');
            return;
        }
        localStorage.setItem(TOKEN_KEY, token);
        console.log('[AdminAuth] Token securely stored in localStorage.');
    },

    clearAuthToken() {
        localStorage.removeItem(TOKEN_KEY);
        console.log('[AdminAuth] Token cleared.');
    },

    async fetchWithAuth(url, options = {}) {
        const token = this.getAuthToken();
        if (!token) {
            return Promise.reject(new Error('AUTHENTICATION REQUIRED. TOKEN MISSING.'));
        }

        const headers = new Headers(options.headers || {});
        headers.set('Authorization', `Bearer ${token}`);

        const config = {
            ...options,
            headers
        };

        return fetch(url, config);
    }
};

// Expose globally for manual browser console testing (Phase J-W2 Option A)
window.AdminAuth = AdminAuth;
