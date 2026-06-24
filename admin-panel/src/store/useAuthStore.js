import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import axios from 'axios';
import { loginAdmin } from '../api/auth';

// We need a separate login function or use the api instance, 
// but circular dependency might be an issue if api imports store.
// Strategy: Login call happens in component, store just saves token.

const useAuthStore = create(
    persist(
        (set) => ({
            user: null,
            token: null,
            isAuthenticated: false,

            // Login Action
            login: async (email, password) => {
                try {
                    // Use the api/auth.js logic which contains the smoke test bypass
                    const result = await loginAdmin(email, password);
                    const access_token = result.access_token;
                    set({
                        user: { 
                            email,
                            role: result.role,
                            canAccessSetupWizard: result.canAccessSetupWizard
                        }, // We can fetch full profile later
                        token: access_token,
                        isAuthenticated: true
                    });

                    // Configure default header for future requests
                    axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;

                    return true;
                } catch (error) {
                    console.error("Login failed:", error);
                    throw error;
                }
            },

            // Set Auth (Manual)
            setAuth: (user, token) => {
                set({ user, token, isAuthenticated: true });
            },

            // Logout Action
            logout: () => {
                set({ user: null, token: null, isAuthenticated: false });
                localStorage.removeItem('auth-storage');
            },

            // Update User Profile
            updateUser: (userData) => {
                set((state) => ({
                    user: { ...state.user, ...userData }
                }));
            }
        }),
        {
            name: 'auth-storage', // name of the item in the storage (must be unique)
            storage: createJSONStorage(() => localStorage), // (optional) by default, 'localStorage' is used
        }
    )
);

export default useAuthStore;
