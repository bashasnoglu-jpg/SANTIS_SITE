import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import axios from 'axios'; // Import direct axios for login request if needed, or use api instance carefully

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
                    // FastAPI OAuth2PasswordRequestForm expects form-data
                    const formData = new FormData();
                    formData.append('username', email);
                    formData.append('password', password);

                    const response = await axios.post('/api/v1/auth/login', formData, {
                        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
                    });

                    const { access_token } = response.data;
                    set({
                        user: { email }, // We can fetch full profile later
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
