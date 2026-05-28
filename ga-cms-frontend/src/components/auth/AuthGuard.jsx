import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { authApi } from '../../api/auth';
import { Spinner } from '../shared/Spinner';

const AuthGuard = ({ children, allowedRoles }) => {
  const { user, isAuthenticated, setAuth } = useAuthStore();
  const [isChecking, setIsChecking] = useState(!isAuthenticated);
  const location = useLocation();

  useEffect(() => {
    const checkAuth = async () => {
      if (!isAuthenticated) {
        try {
          const userData = await authApi.getMe();
          // If we reached here, axios interceptor worked and token is likely valid
          setAuth(userData, useAuthStore.getState().accessToken);
        } catch (e) { // eslint-disable-line no-unused-vars
          // Intentionally empty, handled by interceptor logout
        }
      }
      setIsChecking(false);
    };
    checkAuth();
  }, [isAuthenticated, setAuth]);

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-offwhite">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!user || !isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

export default AuthGuard;
