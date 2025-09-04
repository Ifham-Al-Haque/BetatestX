import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useEffect, useRef } from "react";

export default function AdminRoute({ children }) {
  const { user, userProfile, loading } = useAuth();
  const navigate = useNavigate();
  const hasNavigated = useRef(false);

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

    const userRole = userProfile?.role || user?.role;
    
    // If not admin, redirect to role-appropriate page
    if (userRole !== "admin") {
      hasNavigated.current = true;
      setTimeout(() => {
        redirectToRolePage(userRole);
      }, 0);
      return;
    }
  }, [loading, user, userProfile, navigate]);

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

  // If no user or not admin, don't render children
  if (!user || (userProfile?.role || user?.role) !== "admin") {
    return null;
  }

  return children;

  // Helper function to redirect to role-appropriate page
  function redirectToRolePage(role) {
    console.log('🔍 Redirecting user with role:', role, 'to welcome page');
    // All users go to welcome page first, then role-based access controls what they can see
    navigate('/', { replace: true });
  }
}
