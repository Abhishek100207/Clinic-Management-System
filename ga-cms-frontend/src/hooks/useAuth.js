import { useAuthStore } from '../store/authStore';

export const useAuth = () => {
  const { user, accessToken, isAuthenticated, setAuth, logout } = useAuthStore();
  
  return {
    user,
    token: accessToken,
    isAuthenticated,
    setAuth,
    logout
  };
};
