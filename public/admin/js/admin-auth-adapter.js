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
        const config = {
            ...options,
            credentials: 'include' // Always include cookies for HttpOnly session mode
        };

        const headers = new Headers(options.headers || {});

        // 1. Dev-mode fallback: Bearer token from localStorage
        const fallbackToken = this.getAuthToken();
        if (fallbackToken) {
            headers.set('Authorization', `Bearer ${fallbackToken}`);
        }

        // 2. CSRF Guard: Append x-csrf-token header for state-changing methods
        const method = (options.method || 'GET').toUpperCase();
        if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
            const csrfCookie = document.cookie.split('; ').find(row => row.startsWith('csrf_token='));
            if (csrfCookie) {
                const csrfValue = csrfCookie.split('=')[1];
                headers.set('x-csrf-token', csrfValue);
            }
        }

        config.headers = headers;
        return fetch(url, config);
    }
};

// Expose globally for manual browser console testing (Phase J-W2 Option A)
window.AdminAuth = AdminAuth;
