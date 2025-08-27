import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useRoleAccess } from "./RoleBasedRoute";
import { motion } from "framer-motion";
import { useEffect, useRef } from "react";

export default function ProtectedRoute({ children, requiredFeature = null, requiredRole = null, minRoleLevel = null }) {
  const { user, loading } = useAuth();
  const { userRole, roleInfo, hasFeatureAccess, hasRoleLevel } = useRoleAccess();
  const navigate = useNavigate();
  const hasNavigated = useRef(false);

  // Add debugging for CS Manager issues
  console.log('ProtectedRoute Debug:', {
    user,
    userRole,
    roleInfo,
    requiredFeature,
    requiredRole,
    minRoleLevel,
    hasFeatureAccess: requiredFeature ? hasFeatureAccess(requiredFeature) : 'N/A'
  });

  // Handle all navigation logic in useEffect hooks
  useEffect(() => {
    if (loading || hasNavigated.current) return;

    // If no user, redirect to login
    if (!user) {
      hasNavigated.current = true;
      setTimeout(() => {
        navigate("/login", { replace: true });
      }, 0);
      return;
    }

    // Check feature-based access
    if (requiredFeature && !hasFeatureAccess(requiredFeature)) {
      console.log('ProtectedRoute: Feature access denied', { requiredFeature, userRole });
      hasNavigated.current = true;
      setTimeout(() => {
        redirectToRolePage(userRole);
      }, 0);
      return;
    }

    // Check role-based access
    if (requiredRole && userRole !== requiredRole) {
      console.log('ProtectedRoute: Role access denied', { requiredRole, userRole });
      hasNavigated.current = true;
      setTimeout(() => {
        redirectToRolePage(userRole);
      }, 0);
      return;
    }

    // Check minimum role level
    if (minRoleLevel && !hasRoleLevel(minRoleLevel)) {
      console.log('ProtectedRoute: Role level access denied', { minRoleLevel, userRole });
      hasNavigated.current = true;
      setTimeout(() => {
        redirectToRolePage(userRole);
      }, 0);
      return;
    }
  }, [loading, user, userRole, requiredFeature, requiredRole, minRoleLevel, hasFeatureAccess, hasRoleLevel, navigate]);

  // Reset navigation flag when user changes
  useEffect(() => {
    hasNavigated.current = false;
  }, [user]);

  // If still loading, show loading screen
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "linear-gradient(135deg, #f8fafc 0%, #e0e7ef 100%)" }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </motion.div>
      </div>
    );
  }

  // If no user or access denied, don't render children
  if (!user || 
      (requiredFeature && !hasFeatureAccess(requiredFeature)) ||
      (requiredRole && userRole !== requiredRole) ||
      (minRoleLevel && !hasRoleLevel(minRoleLevel))) {
    return null;
  }

  // User has access, render children
  return children;

  // Helper function to redirect to role-appropriate page
  function redirectToRolePage(role) {
    switch (role) {
      case 'admin':
        navigate('/admin/dashboard', { replace: true });
        break;
      case 'manager':
        navigate('/dashboard', { replace: true });
        break;
      case 'driver_management':
        navigate('/drivers', { replace: true });
        break;
      case 'hr_manager':
        navigate('/attendance', { replace: true });
        break;
      case 'cs_manager':
        navigate('/cspa', { replace: true });
        break;
      case 'employee':
        navigate('/tasks', { replace: true });
        break;
      case 'viewer':
        navigate('/dashboard', { replace: true });
        break;
      default:
        navigate('/dashboard', { replace: true });
    }
  }
}
