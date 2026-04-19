import { useAuthStore } from '../store/authStore';

export const useRole = () => {
  const user = useAuthStore((state) => state.user);

  const hasRole = (allowedRoles) => {
    if (!user || !user.role) return false;
    if (typeof allowedRoles === 'string') return user.role === allowedRoles;
    if (Array.isArray(allowedRoles)) return allowedRoles.includes(user.role);
    return false;
  };

  return { role: user?.role, hasRole };
};
