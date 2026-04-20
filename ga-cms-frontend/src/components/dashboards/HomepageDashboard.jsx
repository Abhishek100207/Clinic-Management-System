import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { ROLE_CONFIG } from '../../utils/roleConfig';

const HomepageDashboard = () => {
  const { isAuthenticated, user } = useAuthStore();

  // If not signed in, redirect to login page
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  // Find the role configuration based on the user's backend role
  const cfg = ROLE_CONFIG[user.role];

  // If a valid role config exists, redirect to their respective dashboard
  if (cfg && cfg.dashboardRoute) {
    return <Navigate to={cfg.dashboardRoute} replace />;
  }

  // Fallback in case the user has an unknown role
  return <Navigate to="/unauthorized" replace />;
};

export default HomepageDashboard;
