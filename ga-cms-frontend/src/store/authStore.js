import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export const useAuthStore = create(
  devtools((set) => ({
    user: null,
    accessToken: null,
    isAuthenticated: false,

    setAuth: (user, token) =>
      set({ user, accessToken: token, isAuthenticated: true }),
    
    setToken: (token) =>
      set({ accessToken: token }),
    
    logout: () =>
      set({ user: null, accessToken: null, isAuthenticated: false }),
  }))
);
