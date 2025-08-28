import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import UserDashboard from '../pages/UserDashboard';

const UserDashboardRoute = () => {
  const { user, userProfile } = useAuth();

  // If user is not authenticated, redirect to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If user is authenticated, show the dashboard
  return <UserDashboard />;
};

export default UserDashboardRoute;
