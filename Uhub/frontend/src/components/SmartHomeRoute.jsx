import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useLocation } from 'react-router-dom';
import Welcome from '../pages/Welcome';
import UserWelcome from '../pages/UserWelcome';
import Layout from './Layout';

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

  // If user is authenticated, show their personalized welcome page
  // DO NOT redirect - let the sidebar navigation handle routing
  if (user) {
    return (
      <Layout>
        <UserWelcome />
      </Layout>
    );
  }

  // If user is not authenticated, show public welcome page
  return <Welcome />;
};

export default SmartHomeRoute;
