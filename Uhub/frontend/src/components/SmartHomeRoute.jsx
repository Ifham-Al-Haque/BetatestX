import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useLocation, Navigate } from 'react-router-dom';
import Welcome from '../pages/Welcome';
import UserWelcome from '../pages/UserWelcome';
import Layout from './Layout';
import { isOperationEdition, OPERATION_HOME_PATH } from '../config/edition';

const SmartHomeRoute = () => {
  const { user, loading, userProfile } = useAuth();
  const location = useLocation();
  
  // Debug logging
  console.log('🔍 SmartHomeRoute:', {
    pathname: location.pathname,
    user: !!user,
    userProfile: !!userProfile,
    userRole: userProfile?.role,
    loading
  });

  // Show loading while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Operation-only edition: send authenticated users straight to the fleet/operation home
  if (user && isOperationEdition) {
    return <Navigate to={OPERATION_HOME_PATH} replace />;
  }

  // If user is authenticated, show their personalized welcome page
  // DO NOT redirect - let the sidebar navigation handle routing
  if (user) {
    return (
      <Layout hidePageHeader>
        <UserWelcome />
      </Layout>
    );
  }

  // If user is not authenticated, show public welcome page
  return <Welcome />;
};

export default SmartHomeRoute;
