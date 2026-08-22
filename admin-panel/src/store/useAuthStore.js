import { create } from 'zustand';
import { getAdminSession, loginAdmin, logoutAdmin } from '../api/auth';

const useAuthStore = create((set, get) => ({
    user: null,
    authStatus: 'unknown',

    bootstrap: async () => {
        if (get().authStatus === 'checking') return false;
        set({ authStatus: 'checking' });
        try {
            const result = await getAdminSession();
            if (result?.authenticated !== true) throw new Error('AUTH_NOT_PROVEN');
            set({
                user: result.subject_id ? { subjectId: result.subject_id } : null,
                authStatus: 'authenticated',
            });
            return true;
        } catch {
            set({ user: null, authStatus: 'unauthenticated' });
            return false;
        }
    },

    login: async (email, password) => {
        set({ authStatus: 'checking' });
        try {
            const result = await loginAdmin(email, password);
            if (result?.authenticated !== true) throw new Error('AUTH_NOT_PROVEN');
            set({
                user: { email, ...(result.subject_id ? { subjectId: result.subject_id } : {}) },
                authStatus: 'authenticated',
            });
            return true;
        } catch (error) {
            set({ user: null, authStatus: 'unauthenticated' });
            throw error;
        }
    },

    logout: async () => {
        await logoutAdmin();
        set({ user: null, authStatus: 'unauthenticated' });
        return true;
    },

    markUnauthenticated: () => set({ user: null, authStatus: 'unauthenticated' }),

    updateUser: (userData) => set((state) => ({
        user: state.user ? { ...state.user, ...userData } : { ...userData },
    })),
}));

export default useAuthStore;
