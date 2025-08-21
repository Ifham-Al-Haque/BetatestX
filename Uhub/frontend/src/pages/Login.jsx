import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Mail, Lock, Eye, EyeOff, User, Shield, 
  AlertCircle, CheckCircle, Loader2, ArrowRight 
} from "lucide-react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import { useToast } from "../context/ToastContext";
import config from "../config";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignup, setIsSignup] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [infoMsg, setInfoMsg] = useState("");
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userRole, setUserRole] = useState(null);

  const navigate = useNavigate();
  const { success, error, warning } = useToast();

  // Get admin email from config
  const adminEmail = config.app.adminEmail;

  // Check if user is already logged in - removed since App.js handles this

  const checkUserRoleAndRedirect = async (user) => {
    try {
      // Check if user exists in employees table
      const { data: employeeData } = await supabase
        .from("employees")
        .select("role, status")
        .eq("id", user.id)
        .single();

      if (employeeData) {
        setUserRole(employeeData.role);
        
        // Redirect based on user role
        redirectToRolePage(employeeData.role);
      } else {
        // User not in employees table, check if it's the admin user
        if (user.email === adminEmail) {
          // Create admin user in employees table if not exists
          await supabase.from("employees").upsert({
            id: user.id,
            full_name: "Ifham",
            email: user.email,
            role: "admin",
            status: "active",
            department: "IT",
            position: "System Administrator"
          });
          setUserRole("admin");
          redirectToRolePage("admin");
        } else {
          // Regular user, create basic profile
          await supabase.from("employees").upsert({
            id: user.id,
            full_name: user.email.split("@")[0],
            email: user.email,
            role: "employee",
            status: "active",
            department: "Unassigned",
            position: "Employee"
          });
          setUserRole("employee");
          redirectToRolePage("employee");
        }
      }
    } catch (error) {
      console.error("Error checking user role:", error);
      error("Role Check Error", "Failed to determine user role. Please contact support.");
      // Redirect to welcome page if role check fails
      navigate("/", { replace: true });
    }
  };

  const redirectToRolePage = (role) => {
    // Redirect all users to home page after login instead of role-specific pages
    navigate('/', { replace: true });
  };

  async function handleAuth(e) {
    e.preventDefault();
    setErrorMsg("");
    setInfoMsg("");
    setLoading(true);

    try {
      if (isSignup) {
        // Disable signup for now - only admin can create users
        setErrorMsg("User registration is disabled. Please contact your administrator.");
        setLoading(false);
        return;
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ 
          email, 
          password 
        });

        if (error) {
          setErrorMsg("Login failed: " + error.message);
          setLoading(false);
          return;
        }

        if (data.user) {
          setInfoMsg("Login successful! Redirecting...");
          success("Login Successful", "Welcome back!");
          
          // Check user role and redirect
          await checkUserRoleAndRedirect(data.user);
        }
      }
    } catch (err) {
      setErrorMsg(err.message || "Authentication failed.");
      error("Authentication Error", err.message || "Authentication failed.");
      setLoading(false);
    }
  }

  async function handleForgotPassword() {
    setErrorMsg("");
    setInfoMsg("");
    setLoading(true);

    if (!forgotEmail) {
      setErrorMsg("Please enter an email to reset your password.");
      error("Validation Error", "Please enter an email to reset your password.");
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        setErrorMsg("Password reset failed: " + error.message);
        error("Password Reset Failed", error.message);
      } else {
        setInfoMsg("Password reset link sent. Check your email.");
        success("Password Reset", "Password reset link sent. Check your email.");
        setShowForgotPassword(false);
        setForgotEmail("");
      }
    } catch (err) {
      setErrorMsg("An unexpected error occurred.");
      error("Unexpected Error", "An unexpected error occurred during password reset.");
    }
    setLoading(false);
  }

  const isAdminEmail = email === adminEmail;

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "linear-gradient(135deg, #f8fafc 0%, #e0e7ef 100%)" }}>
      <div className="w-full max-w-md px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-8 text-white text-center">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <img src="/Uhub.png" alt="Uhub Logo" className="w-12 h-12" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Welcome to UHub</h1>
            <p className="text-blue-100">Sign in to your account</p>
          </div>

          {/* Login Form */}
          <div className="p-8">
            <form onSubmit={handleAuth} className="space-y-6">
              {/* Error/Success Messages */}
              <AnimatePresence>
                {errorMsg && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg"
                  >
                    <AlertCircle className="w-4 h-4 text-red-600" />
                    <span className="text-red-600 text-sm">{errorMsg}</span>
                  </motion.div>
                )}
                {infoMsg && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg"
                  >
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-green-600 text-sm">{infoMsg}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Email Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="email"
                    required
                    placeholder="Enter your email"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                {isAdminEmail && (
                  <div className="flex items-center gap-2 mt-2 text-sm text-blue-600">
                    <Shield className="w-4 h-4" />
                    <span>Administrator Account</span>
                  </div>
                )}
              </div>

              {/* Password Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="Enter your password"
                    className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Forgot Password Link */}
              <div className="text-right">
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(true)}
                  className="text-sm text-blue-600 hover:text-blue-700 hover:underline transition-colors"
                >
                  Forgot your password?
                </button>
              </div>

              {/* Login Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Role Information */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Access Levels:</h3>
              <div className="space-y-2 text-xs text-gray-600">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span><strong>Admin:</strong> Full system access ({adminEmail})</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span><strong>Employee:</strong> Limited access to assigned modules</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Forgot Password Modal */}
      <AnimatePresence>
        {showForgotPassword && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl p-6 w-full max-w-sm"
            >
              <h3 className="text-lg font-semibold mb-4 text-center text-gray-800">
                Reset Password
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="Enter your email"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleForgotPassword}
                    disabled={loading}
                    className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {loading ? "Sending..." : "Send Link"}
                  </button>
                  <button
                    onClick={() => {
                      setShowForgotPassword(false);
                      setForgotEmail("");
                    }}
                    className="flex-1 bg-gray-300 text-gray-800 py-2 rounded-lg hover:bg-gray-400 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
