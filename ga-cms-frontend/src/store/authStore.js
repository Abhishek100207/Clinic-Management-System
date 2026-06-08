import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export const useAuthStore = create(
  devtools((set) => ({
    user: null,
    accessToken: null,
    isAuthenticated: false,
    unreadChatCount: 0,

    setAuth: (user, token) =>
      set({ user, accessToken: token, isAuthenticated: true }),
    
    setToken: (token) =>
      set({ accessToken: token }),
    
    setUnreadChatCount: (count) =>
      set({ unreadChatCount: count }),
    
    setUser: (user) =>
      set({ user }),
    
    logout: () =>
      set({ user: null, accessToken: null, isAuthenticated: false, unreadChatCount: 0 }),
  }))
);
