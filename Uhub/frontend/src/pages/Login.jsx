import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Mail, Lock, Eye, EyeOff, User, Shield, 
  AlertCircle, CheckCircle, Loader2, ArrowRight,
  Sparkles, Users, Building2, Zap
} from "lucide-react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import { useToast } from "../context/ToastContext";
import config from "../config";
import Logo from "../components/ui/logo";

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

  const checkUserRoleAndRedirect = async (user) => {
    try {
      // Check if user exists in users table
      const { data: userData } = await supabase
        .from("users")
        .select("role, status")
        .eq("auth_user_id", user.id)
        .single();

      if (userData) {
        setUserRole(userData.role);
        redirectToRolePage(userData.role);
      } else {
        // User not in users table, check if it's the admin user
        if (user.email === adminEmail) {
          // First check if employee already exists
          const { data: existingEmployee } = await supabase
            .from("employees")
            .select("id, full_name, department, position, status")
            .eq("email", user.email)
            .maybeSingle();
          
          let employeeId;
          if (existingEmployee) {
            console.log("Found existing employee record:", existingEmployee);
            employeeId = existingEmployee.id;
          } else {
            // Create new employee record
            const { data: newEmployee } = await supabase.from("employees").upsert({
              full_name: "Ifham",
              email: user.email,
              department: "IT",
              position: "System Administrator",
              employee_id: `EMP_${Date.now()}` // Generate unique employee ID
            }).select().single();
            
            if (newEmployee) {
              employeeId = newEmployee.id;
            }
          }
          
          if (employeeId) {
            // Now create user record linking to the employee
            await supabase.from("users").upsert({
              auth_user_id: user.id,
              employee_id: employeeId,
              email: user.email,
              role: "admin",
              status: "active"
            });
          }
          setUserRole("admin");
          redirectToRolePage("admin");
        } else {
          // Regular user, create basic profile
          // First check if employee already exists
          const { data: existingEmployee } = await supabase
            .from("employees")
            .select("id, full_name, department, position, status")
            .eq("email", user.email)
            .maybeSingle();
          
          let employeeId;
          if (existingEmployee) {
            console.log("Found existing employee record:", existingEmployee);
            employeeId = existingEmployee.id;
          } else {
            // Create new employee record
            const { data: newEmployee } = await supabase.from("employees").upsert({
              full_name: user.email.split("@")[0],
              email: user.email,
              department: "Unassigned",
              position: "Employee",
              employee_id: `EMP_${Date.now()}` // Generate unique employee ID
            }).select().single();
            
            if (newEmployee) {
              employeeId = newEmployee.id;
            }
          }
          
          if (employeeId) {
            // Now create user record linking to the employee
            await supabase.from("users").upsert({
              auth_user_id: user.id,
              employee_id: employeeId,
              email: user.email,
              role: "employee",
              status: "active"
            });
          }
          setUserRole("employee");
          redirectToRolePage("employee");
        }
      }
    } catch (error) {
      console.error("Error checking user role:", error);
      error("Role Check Error", "Failed to determine user role. Please contact support.");
      navigate("/", { replace: true });
    }
  };

  const redirectToRolePage = (role) => {
    console.log('Redirecting to role page:', role);
    
    switch (role) {
      case 'admin':
        console.log('Navigating to admin dashboard');
        navigate('/admin/dashboard', { replace: true });
        break;
      case 'manager':
        console.log('Navigating to manager dashboard');
        navigate('/dashboard', { replace: true });
        break;
      case 'driver_management':
        console.log('Navigating to drivers page');
        navigate('/drivers', { replace: true });
        break;
      case 'hr_manager':
        console.log('Navigating to attendance page');
        navigate('/attendance', { replace: true });
        break;
      case 'cs_manager':
        console.log('Navigating to CSPA page');
        navigate('/cspa', { replace: true });
        break;
      case 'employee':
        console.log('Navigating to tasks page');
        navigate('/tasks', { replace: true });
        break;
      case 'viewer':
        console.log('Navigating to dashboard');
        navigate('/dashboard', { replace: true });
        break;
      default:
        console.log('Default navigation to dashboard');
        navigate('/dashboard', { replace: true });
    }
  };

  async function handleAuth(e) {
    e.preventDefault();
    setErrorMsg("");
    setInfoMsg("");
    setLoading(true);

    try {
      if (isSignup) {
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

  async function handleResendConfirmation() {
    setErrorMsg("");
    setInfoMsg("");
    setLoading(true);

    if (!email) {
      setErrorMsg("Please enter your email first.");
      error("Validation Error", "Please enter your email first.");
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email
      });

      if (error) {
        setErrorMsg("Failed to resend confirmation: " + error.message);
        error("Resend Failed", error.message);
      } else {
        setInfoMsg("Confirmation email sent! Check your inbox and spam folder.");
        success("Confirmation Sent", "Confirmation email sent! Check your inbox and spam folder.");
      }
    } catch (err) {
      setErrorMsg("An unexpected error occurred.");
      error("Unexpected Error", "An unexpected error occurred while resending confirmation.");
    }
    setLoading(false);
  }

  const isAdminEmail = email === adminEmail;

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Hero Section */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 25% 25%, rgba(255,255,255,0.3) 0%, transparent 50%),
                             radial-gradient(circle at 75% 75%, rgba(255,255,255,0.3) 0%, transparent 50%)`,
            backgroundSize: '400px 400px'
          }} />
        </div>
        
        {/* Floating Elements */}
        <motion.div
          animate={{ y: [0, -20, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-20 left-20 w-16 h-16 bg-white/10 rounded-full backdrop-blur-sm"
        />
        <motion.div
          animate={{ y: [0, 20, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute top-40 right-32 w-12 h-12 bg-white/10 rounded-full backdrop-blur-sm"
        />
        <motion.div
          animate={{ y: [0, -15, 0] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute bottom-32 left-32 w-20 h-20 bg-white/10 rounded-full backdrop-blur-sm"
        />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-16 text-white">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mb-8"
          >
            <Logo size="2xl" showText={true} />
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-5xl font-bold mb-6 leading-tight"
          >
            Welcome to the Future of
            <span className="block bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">
              Unified Management
            </span>
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="text-xl text-blue-100 mb-8 leading-relaxed"
          >
            Connect, collaborate, and manage operations across all departments with our integrated platform. 
            From Fleet Management to HR, IT to Customer Service, Marketing to Sales and Finance to Management - 
            everything you need in one place.
          </motion.p>

          {/* Feature Highlights */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="space-y-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                <Users className="w-5 h-5 text-white" />
              </div>
              <span className="text-blue-100">Unified Team Collaboration</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <span className="text-blue-100">Cross-Department Integration</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <span className="text-blue-100">Real-time Operations Management</span>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="w-full max-w-md">
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 overflow-hidden"
          >
            {/* Header */}
            <div className="text-center p-8 pb-6">
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.5 }}
                className="flex justify-center items-center mb-6"
              >
                <div className="relative">
                  <Logo size="xl" showText={true} />
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center"
                  >
                    <Sparkles className="w-3 h-3 text-white" />
                  </motion.div>
                </div>
              </motion.div>
              
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.7 }}
                className="text-3xl font-bold text-gray-900 mb-3"
              >
                Welcome Back
              </motion.h2>
              
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.9 }}
                className="text-gray-600"
              >
                Sign in to your Uhub account
              </motion.p>
            </div>

            {/* Login Form */}
            <div className="px-8 pb-8">
              <form onSubmit={handleAuth} className="space-y-6">
                {/* Error/Success Messages */}
                <AnimatePresence>
                  {errorMsg && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      className="flex flex-col gap-3 p-4 bg-red-50 border border-red-200 rounded-xl shadow-sm"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                          <AlertCircle className="w-4 h-4 text-red-600" />
                        </div>
                        <span className="text-red-700 text-sm font-medium">{errorMsg}</span>
                      </div>
                      {errorMsg.includes("Email not confirmed") && (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={handleResendConfirmation}
                            disabled={loading}
                            className="flex items-center gap-2 px-3 py-2 text-sm text-blue-600 bg-blue-100 hover:bg-blue-200 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Mail className="w-4 h-4" />
                            {loading ? "Sending..." : "Resend Confirmation Email"}
                          </button>
                        </div>
                      )}
                    </motion.div>
                  )}
                  {infoMsg && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl shadow-sm"
                    >
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      </div>
                      <span className="text-green-700 text-sm font-medium">{infoMsg}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Email Field */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 1.1 }}
                >
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Email Address
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 blur-sm"></div>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-blue-500 transition-colors duration-300" />
                      <input
                        type="email"
                        required
                        placeholder="Enter your email"
                        className="w-full pl-12 pr-4 py-4 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 placeholder-gray-400 focus:placeholder-gray-300"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                  </div>
                  {isAdminEmail && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex items-center gap-2 mt-3 text-sm text-blue-600 bg-blue-50 px-3 py-2 rounded-lg"
                    >
                      <Shield className="w-4 h-4" />
                      <span className="font-medium">Administrator Account</span>
                    </motion.div>
                  )}
                </motion.div>

                {/* Password Field */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 1.3 }}
                >
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Password
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 blur-sm"></div>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-blue-500 transition-colors duration-300" />
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        placeholder="Enter your password"
                        className="w-full pl-12 pr-12 py-4 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 placeholder-gray-400 focus:placeholder-gray-300"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                </motion.div>

                {/* Forgot Password Link */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 1.5 }}
                  className="text-right"
                >
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(true)}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors duration-200 hover:underline"
                  >
                    Forgot your password?
                  </button>
                </motion.div>

                {/* Login Button */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 1.7 }}
                >
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white py-4 rounded-xl font-semibold hover:from-blue-700 hover:via-purple-700 hover:to-indigo-700 transition-all duration-300 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      <>
                        <span>Sign In</span>
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </button>
                </motion.div>
              </form>

              {/* Role Information */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 1.9 }}
                className="mt-8 p-6 bg-gradient-to-r from-gray-50 to-blue-50 rounded-2xl border border-gray-100"
              >
                <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                  <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
                  Access Levels
                </h3>
                <div className="space-y-3 text-sm text-gray-600">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-gradient-to-r from-red-500 to-pink-500 rounded-full"></div>
                    <span><strong className="text-gray-700">Admin:</strong> Full system access ({adminEmail})</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"></div>
                    <span><strong className="text-gray-700">Employee:</strong> Limited access to assigned modules</span>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      <AnimatePresence>
        {showForgotPassword && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl border border-gray-100"
            >
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Lock className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Reset Password</h3>
                <p className="text-gray-600">Enter your email to receive a reset link</p>
              </div>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="Enter your email"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                  />
                </div>
                
                <div className="flex gap-3">
                  <button
                    onClick={handleForgotPassword}
                    disabled={loading}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 font-medium"
                  >
                    {loading ? "Sending..." : "Send Reset Link"}
                  </button>
                  <button
                    onClick={() => {
                      setShowForgotPassword(false);
                      setForgotEmail("");
                    }}
                    className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl hover:bg-gray-200 transition-all duration-200 font-medium"
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
