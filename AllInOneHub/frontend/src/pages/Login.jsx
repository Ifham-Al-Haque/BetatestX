import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Mail, Lock, Eye, EyeOff, Shield, 
  AlertCircle, CheckCircle, Loader2, ArrowRight,
  Sparkles, Users, Zap, Star, TrendingUp, 
  Globe, ShieldCheck, Rocket, Heart
} from "lucide-react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import { useToast } from "../context/ToastContext";
import { useTheme } from "../context/ThemeContext";
import config from "../config";
import Logo from "../components/ui/logo";
import DarkModeToggle from "../components/DarkModeToggle";
import activityService from "../services/activityService";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [infoMsg, setInfoMsg] = useState("");
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { success, error } = useToast();
  const { isDark } = useTheme();

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
        redirectToRolePage(userData.role);
      } else {
        // User not in users table, check if it's an admin user
        const adminEmails = (process.env.REACT_APP_ADMIN_EMAILS || process.env.REACT_APP_ADMIN_EMAIL || '').split(',').map((e) => e.trim()).filter(Boolean);
        if (adminEmails.includes(user.email)) {
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
              full_name: user.email.split('@')[0],
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
    console.log('🔍 Redirecting user with role:', role, 'to welcome page');
    // All users go to welcome page first, then role-based access controls what they can see
    navigate('/', { replace: true });
  };

  async function handleAuth(e) {
    e.preventDefault();
    setErrorMsg("");
    setInfoMsg("");
    setLoading(true);

    try {
      // User registration is disabled - only login is allowed
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
        
        // Log successful login activity
        await activityService.logLogin('email');
        
        await checkUserRoleAndRedirect(data.user);
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
    <div className={`min-h-screen flex ${isDark ? 'bg-[#0f1419]' : 'bg-gradient-to-br from-gray-50 to-blue-50'}`}>
      {/* Theme Toggle */}
      <div className="absolute top-4 right-4 z-50">
        <DarkModeToggle />
      </div>
      
      {/* Mobile Hero Section - Hidden on desktop */}
      <div className="lg:hidden absolute inset-0 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 opacity-20" />
      
      {/* Mobile Hero Content */}
      <div className="lg:hidden absolute top-20 left-4 right-4 z-20 text-center">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mb-4"
        >
          <Logo size="lg" showText={true} />
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-2xl font-bold text-white mb-2"
        >
          Welcome to Corevanta
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="text-white/80 text-sm"
        >
          Unified platform for all departments
        </motion.p>
      </div>
      {/* Left Side - Hero Section */}
      <div className={`hidden lg:flex lg:w-1/2 ${isDark ? 'bg-gradient-to-br from-[#0f1419] via-[#1a1f2e] to-[#242938]' : 'bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700'} relative overflow-hidden`}>
        {/* Enhanced Background Pattern */}
        <div className="absolute inset-0 opacity-15">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 25% 25%, rgba(255,255,255,0.4) 0%, transparent 50%),
                             radial-gradient(circle at 75% 75%, rgba(255,255,255,0.4) 0%, transparent 50%),
                             radial-gradient(circle at 50% 10%, rgba(59,130,246,0.3) 0%, transparent 50%)`,
            backgroundSize: '400px 400px, 600px 600px, 800px 800px'
          }} />
        </div>
        
        {/* Enhanced Floating Elements */}
        <motion.div
          animate={{ 
            y: [0, -30, 0],
            rotate: [0, 180, 360],
            scale: [1, 1.1, 1]
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-20 left-20 w-16 h-16 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full backdrop-blur-sm border border-white/20"
        >
          <div className="flex items-center justify-center h-full">
            <Star className="w-6 h-6 text-white/80" />
          </div>
        </motion.div>
        
        <motion.div
          animate={{ 
            y: [0, 25, 0],
            x: [0, 10, 0],
            rotate: [0, -90, 0]
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute top-40 right-32 w-12 h-12 bg-gradient-to-br from-emerald-400/20 to-cyan-400/20 rounded-full backdrop-blur-sm border border-white/20"
        >
          <div className="flex items-center justify-center h-full">
            <TrendingUp className="w-5 h-5 text-white/80" />
          </div>
        </motion.div>
        
        <motion.div
          animate={{ 
            y: [0, -20, 0],
            rotate: [0, 90, 0],
            scale: [1, 0.9, 1]
          }}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute bottom-32 left-32 w-20 h-20 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full backdrop-blur-sm border border-white/20"
        >
          <div className="flex items-center justify-center h-full">
            <Rocket className="w-8 h-8 text-white/80" />
          </div>
        </motion.div>

        {/* Additional floating elements */}
        <motion.div
          animate={{ 
            y: [0, 15, 0],
            x: [0, -10, 0],
            rotate: [0, -45, 0]
          }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
          className="absolute top-60 left-1/4 w-8 h-8 bg-gradient-to-br from-yellow-400/20 to-orange-400/20 rounded-full backdrop-blur-sm border border-white/20"
        >
          <div className="flex items-center justify-center h-full">
            <Globe className="w-4 h-4 text-white/80" />
          </div>
        </motion.div>

        <motion.div
          animate={{ 
            y: [0, -25, 0],
            x: [0, 15, 0],
            rotate: [0, 45, 0]
          }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
          className="absolute bottom-60 right-1/4 w-10 h-10 bg-gradient-to-br from-red-400/20 to-pink-400/20 rounded-full backdrop-blur-sm border border-white/20"
        >
          <div className="flex items-center justify-center h-full">
            <Heart className="w-5 h-5 text-white/80" />
          </div>
        </motion.div>

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
            className="text-6xl font-bold mb-6 leading-tight"
          >
            Welcome to the
            <span className="block bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent animate-pulse">
              Future of Innovation
            </span>
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="text-xl text-[#e2e8f0] mb-8 leading-relaxed max-w-lg"
          >
            Experience the power of unified management across all departments. 
            <span className="text-white font-semibold">Seamlessly connect</span> your teams, 
            <span className="text-white font-semibold">streamline operations</span>, and 
            <span className="text-white font-semibold">accelerate growth</span> with our cutting-edge platform.
          </motion.p>

          {/* Enhanced Feature Highlights */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="space-y-4"
          >
            <motion.div 
              whileHover={{ scale: 1.05, x: 10 }}
              className="flex items-center gap-4 p-3 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-all duration-300"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-blue-400/30 to-purple-400/30 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/20">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <span className="text-white font-semibold block">Unified Team Collaboration</span>
                <span className="text-[#e2e8f0] text-sm">Connect your entire organization</span>
              </div>
            </motion.div>
            
            <motion.div 
              whileHover={{ scale: 1.05, x: 10 }}
              className="flex items-center gap-4 p-3 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-all duration-300"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-400/30 to-cyan-400/30 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/20">
                <ShieldCheck className="w-6 h-6 text-white" />
              </div>
              <div>
                <span className="text-white font-semibold block">Enterprise Security</span>
                <span className="text-[#e2e8f0] text-sm">Bank-grade security & compliance</span>
              </div>
            </motion.div>
            
            <motion.div 
              whileHover={{ scale: 1.05, x: 10 }}
              className="flex items-center gap-4 p-3 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-all duration-300"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-purple-400/30 to-pink-400/30 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/20">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div>
                <span className="text-white font-semibold block">Real-time Analytics</span>
                <span className="text-[#e2e8f0] text-sm">Instant insights & reporting</span>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className={`flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 relative z-10 ${isDark ? 'bg-[#0f1419]' : 'bg-gradient-to-br from-gray-50 to-blue-50'}`}>
        <div className="w-full max-w-md">
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className={`backdrop-blur-md rounded-3xl shadow-2xl overflow-hidden border-2 ${isDark ? 'bg-[rgba(26,31,46,0.8)] border-[rgba(255,255,255,0.3)] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)]' : 'bg-white/90 border-white/30 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.2)]'}`}
          >
            {/* Enhanced Header */}
            <div className="text-center p-8 pb-6 relative">
              {/* Decorative gradient background */}
              <div className={`absolute inset-0 rounded-t-3xl ${isDark ? 'bg-gradient-to-b from-blue-500/10 to-transparent' : 'bg-gradient-to-b from-blue-100/50 to-transparent'}`} />
              
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.5 }}
                className="flex justify-center items-center mb-6 relative z-10"
              >
                <div className="relative">
                  <Logo size="xl" showText={true} />
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="absolute -top-2 -right-2 w-7 h-7 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center shadow-lg"
                  >
                    <Sparkles className="w-4 h-4 text-white" />
                  </motion.div>
                </div>
              </motion.div>
              
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.7 }}
                className={`text-4xl font-bold mb-3 relative z-10 ${isDark ? 'text-white' : 'text-gray-900'}`}
              >
                Welcome Back
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 0.8, delay: 1 }}
                  className={`h-1 mt-2 mx-auto rounded-full bg-gradient-to-r from-blue-400 to-purple-500`}
                />
              </motion.h2>
              
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.9 }}
                className={`text-lg relative z-10 ${isDark ? 'text-[#e2e8f0]' : 'text-gray-600'}`}
              >
                Sign in to continue your journey
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
                      className="flex flex-col gap-3 p-4 bg-red-900/20 border border-red-500/30 rounded-xl shadow-sm"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-red-500/20 rounded-full flex items-center justify-center">
                          <AlertCircle className="w-4 h-4 text-red-400" />
                        </div>
                        <span className="text-red-300 text-sm font-medium">{errorMsg}</span>
                      </div>
                      {errorMsg.includes("Email not confirmed") && (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={handleResendConfirmation}
                            disabled={loading}
                            className="flex items-center gap-2 px-3 py-2 text-sm text-blue-300 bg-blue-500/20 hover:bg-blue-500/30 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
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
                      className={`flex items-center gap-4 p-5 rounded-2xl border-2 shadow-lg backdrop-blur-sm ${isDark 
                        ? 'bg-gradient-to-r from-emerald-500/20 via-green-500/20 to-teal-500/20 border-emerald-400/50 shadow-emerald-500/25' 
                        : 'bg-gradient-to-r from-emerald-50 via-green-50 to-teal-50 border-emerald-200 shadow-emerald-500/15'
                      }`}
                    >
                      <motion.div 
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${isDark 
                          ? 'bg-gradient-to-r from-emerald-400 to-green-400 shadow-lg shadow-emerald-500/30' 
                          : 'bg-gradient-to-r from-emerald-500 to-green-500 shadow-md shadow-emerald-500/20'
                        }`}
                      >
                        <motion.div
                          initial={{ rotate: -180, scale: 0 }}
                          animate={{ rotate: 0, scale: 1 }}
                          transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                        >
                          <CheckCircle className={`w-5 h-5 ${isDark ? 'text-white' : 'text-white'}`} />
                        </motion.div>
                      </motion.div>
                      <div className="flex-1">
                        <motion.div
                          initial={{ x: -20, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: 0.4 }}
                          className={`font-semibold ${isDark ? 'text-emerald-200' : 'text-emerald-700'}`}
                        >
                          🎉 Login Successful!
                        </motion.div>
                        <motion.div
                          initial={{ x: -20, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: 0.5 }}
                          className={`text-sm ${isDark ? 'text-emerald-300/80' : 'text-emerald-600'}`}
                        >
                          Welcome back! Redirecting you now...
                        </motion.div>
                      </div>
                      <motion.div
                        animate={{ 
                          scale: [1, 1.1, 1],
                          rotate: [0, 5, 0]
                        }}
                        transition={{ 
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                        className="text-2xl"
                      >
                        ✨
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Email Field */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 1.1 }}
                >
                  <label className={`block text-sm font-semibold mb-3 ${isDark 
                    ? 'text-white bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent' 
                    : 'text-gray-700 bg-gradient-to-r from-gray-700 to-blue-600 bg-clip-text text-transparent'
                  }`}>
                    Email Address
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-500 rounded-xl opacity-0 group-focus-within:opacity-20 transition-all duration-500 blur-sm scale-105"></div>
                    <div className="relative">
                      <Mail className={`absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 group-focus-within:text-blue-400 group-hover:scale-110 transition-all duration-300 ${isDark ? 'text-[#94a3b8]' : 'text-gray-400'}`} />
                      <input
                        type="email"
                        required
                        placeholder="Enter your email"
                        className={`w-full pl-12 pr-4 py-4 rounded-xl border-2 focus:ring-4 focus:ring-blue-400/30 focus:border-blue-400 transition-all duration-300 hover:border-blue-300/50 ${isDark 
                          ? 'bg-gradient-to-r from-[#1a1f2e] to-[#242938] border-[rgba(255,255,255,0.2)] text-white placeholder-[#94a3b8] focus:placeholder-[#e2e8f0] hover:bg-gradient-to-r hover:from-[#242938] hover:to-[#2e3442] shadow-lg shadow-black/20' 
                          : 'bg-gradient-to-r from-white to-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:placeholder-gray-300 hover:border-blue-200 hover:bg-gradient-to-r hover:from-gray-50 hover:to-blue-50 shadow-md shadow-gray-200/50'
                        }`}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                  </div>
                  {isAdminEmail && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className={`flex items-center gap-3 mt-3 text-sm px-4 py-3 rounded-xl border-2 ${isDark 
                        ? 'text-blue-200 bg-gradient-to-r from-blue-500/30 to-indigo-500/30 border-blue-400/40 shadow-lg shadow-blue-500/20' 
                        : 'text-blue-700 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 shadow-md shadow-blue-500/10'
                      }`}
                    >
                      <div className={`p-1.5 rounded-lg ${isDark ? 'bg-blue-400/20' : 'bg-blue-100'}`}>
                        <Shield className={`w-4 h-4 ${isDark ? 'text-blue-300' : 'text-blue-600'}`} />
                      </div>
                      <span className="font-semibold">Administrator Account</span>
                    </motion.div>
                  )}
                </motion.div>

                {/* Password Field */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 1.3 }}
                >
                  <label className={`block text-sm font-semibold mb-3 ${isDark 
                    ? 'text-white bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent' 
                    : 'text-gray-700 bg-gradient-to-r from-gray-700 to-blue-600 bg-clip-text text-transparent'
                  }`}>
                    Password
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-500 rounded-xl opacity-0 group-focus-within:opacity-20 transition-all duration-500 blur-sm scale-105"></div>
                    <div className="relative">
                      <Lock className={`absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 group-focus-within:text-blue-400 group-hover:scale-110 transition-all duration-300 ${isDark ? 'text-[#94a3b8]' : 'text-gray-400'}`} />
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        placeholder="Enter your password"
                        className={`w-full pl-12 pr-12 py-4 rounded-xl border-2 focus:ring-4 focus:ring-blue-400/30 focus:border-blue-400 transition-all duration-300 hover:border-blue-300/50 ${isDark 
                          ? 'bg-gradient-to-r from-[#1a1f2e] to-[#242938] border-[rgba(255,255,255,0.2)] text-white placeholder-[#94a3b8] focus:placeholder-[#e2e8f0] hover:bg-gradient-to-r hover:from-[#242938] hover:to-[#2e3442] shadow-lg shadow-black/20' 
                          : 'bg-gradient-to-r from-white to-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:placeholder-gray-300 hover:border-blue-200 hover:bg-gradient-to-r hover:from-gray-50 hover:to-blue-50 shadow-md shadow-gray-200/50'
                        }`}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                      <motion.button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className={`absolute right-4 top-1/2 transform -translate-y-1/2 p-1 rounded-lg transition-all duration-200 ${isDark ? 'text-[#94a3b8] hover:text-white hover:bg-white/10' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </motion.button>
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
                  <motion.button
                    type="button"
                    onClick={() => setShowForgotPassword(true)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`text-sm font-medium transition-all duration-200 hover:underline ${isDark ? 'text-blue-300 hover:text-blue-200' : 'text-blue-600 hover:text-blue-700'}`}
                  >
                    Forgot your password?
                  </motion.button>
                </motion.div>

                {/* Login Button */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 1.7 }}
                >
                  <motion.button
                    type="submit"
                    disabled={loading}
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    className={`w-full py-4 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-2xl border-2 ${isDark 
                      ? 'bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-500 hover:from-blue-600 hover:via-purple-600 hover:to-indigo-600 border-transparent' 
                      : 'bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 hover:from-blue-700 hover:via-purple-700 hover:to-indigo-700 border-transparent'
                    } text-white`}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Signing in...</span>
                      </>
                    ) : (
                      <>
                        <span>Sign In</span>
                        <motion.div
                          animate={{ x: [0, 4, 0] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                        >
                          <ArrowRight className="w-5 h-5" />
                        </motion.div>
                      </>
                    )}
                  </motion.button>
                </motion.div>
              </form>

              {/* Role Information - Hidden for beta testing */}
              {/* <motion.div
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
              </motion.div> */}
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
