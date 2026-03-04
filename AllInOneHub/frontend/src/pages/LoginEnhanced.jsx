import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Mail, Lock, Eye, EyeOff, User, Shield, 
  AlertCircle, CheckCircle, Loader2, ArrowRight,
  Sparkles, Users, Building2, Zap, Globe, Car, BarChart3, Calendar,
  ChevronLeft, ChevronRight
} from "lucide-react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import { useToast } from "../context/ToastContext";
import config from "../config";
import Logo from "../components/ui/logo";
import activityService from "../services/activityService";

export default function LoginEnhanced() {
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
  const [currentFeatureIndex, setCurrentFeatureIndex] = useState(0);

  const navigate = useNavigate();
  const { success, error, warning } = useToast();

  // Get admin email from config
  const adminEmail = config.app.adminEmail;

  const features = [
    {
      icon: Car,
      title: "Fleet Management",
      description: "Comprehensive driver and vehicle management system with real-time tracking",
      color: "from-green-400 to-emerald-500"
    },
    {
      icon: Users,
      title: "HR Operations", 
      description: "Employee management, performance tracking, and organizational development",
      color: "from-blue-400 to-cyan-500"
    },
    {
      icon: BarChart3,
      title: "Analytics & Reports",
      description: "Data-driven insights and comprehensive performance metrics",
      color: "from-purple-400 to-violet-500"
    },
    {
      icon: Calendar,
      title: "Task Management",
      description: "Efficient task assignment, tracking, and project management",
      color: "from-orange-400 to-red-500"
    }
  ];

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
        if (userData.status === 'inactive') {
          setErrorMsg("Your account is inactive. Please contact your administrator.");
          await supabase.auth.signOut();
          return;
        }
      }

      // Log successful login activity
      await activityService.logLogin('email');
      
      // Redirect to main app
      navigate('/', { replace: true });
    } catch (err) {
      console.error('Error checking user role:', err);
      navigate('/', { replace: true });
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

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!forgotEmail) {
      setErrorMsg("Please enter your email address.");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        setErrorMsg(error.message);
      } else {
        setInfoMsg("Password reset email sent! Check your inbox.");
        setShowForgotPassword(false);
        setForgotEmail("");
      }
    } catch (err) {
      setErrorMsg(err.message || "Failed to send reset email.");
    } finally {
      setLoading(false);
    }
  };

  // Auto-rotate features
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFeatureIndex((prev) => (prev + 1) % features.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Hero Section */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-600">
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/50 via-purple-600/50 to-indigo-600/50"></div>
        </div>
        
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-white/10 rounded-full"
              initial={{
                x: Math.random() * window.innerWidth,
                y: Math.random() * window.innerHeight,
              }}
              animate={{
                x: Math.random() * window.innerWidth,
                y: Math.random() * window.innerHeight,
              }}
              transition={{
                duration: Math.random() * 10 + 10,
                repeat: Infinity,
                repeatType: "reverse",
              }}
            />
          ))}
        </div>

        <div className="relative z-10 flex flex-col justify-center px-12 text-white">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mb-12"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <span className="text-2xl font-bold bg-gradient-to-r from-[#083554] to-[#11278C] bg-clip-text text-transparent">C</span>
              </div>
              <span className="text-3xl font-bold">orevanta</span>
            </div>
            <h1 className="text-5xl font-bold mb-4">
              Welcome to{" "}
              <span className="bg-gradient-to-r from-[#083554] to-[#11278C] bg-clip-text text-transparent">
                Corevanta
              </span>
            </h1>
            <p className="text-xl text-blue-100 leading-relaxed">
              The ultimate unified platform that brings all your departments together as a family, 
              enabling seamless collaboration and efficient operations management.
            </p>
          </motion.div>

          {/* Feature Showcase */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="space-y-6"
          >
            <h2 className="text-3xl font-bold">
              Powerful Features for{" "}
              <span className="bg-gradient-to-r from-blue-200 to-purple-200 bg-clip-text text-transparent">
                Every Department
              </span>
            </h2>
            <p className="text-lg text-blue-100">
              From Fleet Management to HR Operations, comprehensive tools that streamline 
              work processes and boost productivity.
            </p>

            {/* Feature Cards */}
            <div className="grid grid-cols-2 gap-4">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ 
                      opacity: currentFeatureIndex === index ? 1 : 0.7,
                      scale: currentFeatureIndex === index ? 1 : 0.95
                    }}
                    transition={{ duration: 0.5 }}
                    className={`bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 ${
                      currentFeatureIndex === index ? 'bg-white/20' : ''
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-r ${feature.color} flex items-center justify-center mb-3`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="font-semibold text-white mb-1">{feature.title}</h3>
                    <p className="text-sm text-blue-100 leading-relaxed">{feature.description}</p>
                  </motion.div>
                );
              })}
            </div>

            {/* Feature Indicators */}
            <div className="flex justify-center space-x-2 mt-6">
              {features.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentFeatureIndex(index)}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    currentFeatureIndex === index 
                      ? 'bg-white w-8' 
                      : 'bg-white/30 hover:bg-white/50'
                  }`}
                />
              ))}
            </div>
          </motion.div>

          {/* Feature Highlights */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="mt-12 grid grid-cols-3 gap-6"
          >
            <div className="flex items-center gap-3">
              <Shield className="w-6 h-6 text-green-300" />
              <span className="text-white font-medium">Enterprise Security</span>
            </div>
            <div className="flex items-center gap-3">
              <Zap className="w-6 h-6 text-yellow-300" />
              <span className="text-white font-medium">Lightning Fast</span>
            </div>
            <div className="flex items-center gap-3">
              <Globe className="w-6 h-6 text-blue-300" />
              <span className="text-white font-medium">Global Access</span>
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
            className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 overflow-hidden"
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
                transition={{ duration: 0.6, delay: 0.8 }}
                className="text-gray-600"
              >
                Sign in to your account to continue
              </motion.p>
            </div>

            {/* Form */}
            <div className="px-8 pb-8">
              <AnimatePresence mode="wait">
                {!showForgotPassword ? (
                  <motion.form
                    key="login"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    onSubmit={handleAuth}
                    className="space-y-6"
                  >
                    {/* Email Field */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.9 }}
                    >
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Email Address
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/80"
                          placeholder="Enter your email"
                          required
                        />
                      </div>
                    </motion.div>

                    {/* Password Field */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 1.0 }}
                    >
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Password
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/80"
                          placeholder="Enter your password"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </motion.div>

                    {/* Forgot Password */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 1.1 }}
                      className="flex justify-end"
                    >
                      <button
                        type="button"
                        onClick={() => setShowForgotPassword(true)}
                        className="text-sm text-blue-600 hover:text-blue-800 transition-colors font-medium"
                      >
                        Forgot your password?
                      </button>
                    </motion.div>

                    {/* Error/Info Messages */}
                    {(errorMsg || infoMsg) && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`p-3 rounded-xl flex items-center gap-2 ${
                          errorMsg 
                            ? 'bg-red-50 border border-red-200 text-red-700' 
                            : 'bg-green-50 border border-green-200 text-green-700'
                        }`}
                      >
                        {errorMsg ? (
                          <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        ) : (
                          <CheckCircle className="w-4 h-4 flex-shrink-0" />
                        )}
                        <span className="text-sm">{errorMsg || infoMsg}</span>
                      </motion.div>
                    )}

                    {/* Login Button */}
                    <motion.button
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 1.2 }}
                      type="submit"
                      disabled={loading}
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                    >
                      {loading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          Sign In
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </motion.button>
                  </motion.form>
                ) : (
                  <motion.form
                    key="forgot"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    onSubmit={handleForgotPassword}
                    className="space-y-6"
                  >
                    <motion.button
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
                      type="button"
                      onClick={() => setShowForgotPassword(false)}
                      className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors mb-4"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Back to Sign In
                    </motion.button>

                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5 }}
                    >
                      <h3 className="text-xl font-bold text-gray-900 mb-2">Reset Password</h3>
                      <p className="text-gray-600 mb-6">
                        Enter your email address and we'll send you a link to reset your password.
                      </p>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.1 }}
                    >
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Email Address
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                          type="email"
                          value={forgotEmail}
                          onChange={(e) => setForgotEmail(e.target.value)}
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/80"
                          placeholder="Enter your email"
                          required
                        />
                      </div>
                    </motion.div>

                    {/* Error/Info Messages */}
                    {(errorMsg || infoMsg) && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`p-3 rounded-xl flex items-center gap-2 ${
                          errorMsg 
                            ? 'bg-red-50 border border-red-200 text-red-700' 
                            : 'bg-green-50 border border-green-200 text-green-700'
                        }`}
                      >
                        {errorMsg ? (
                          <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        ) : (
                          <CheckCircle className="w-4 h-4 flex-shrink-0" />
                        )}
                        <span className="text-sm">{errorMsg || infoMsg}</span>
                      </motion.div>
                    )}

                    <motion.button
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.2 }}
                      type="submit"
                      disabled={loading}
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                    >
                      {loading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          Send Reset Link
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </motion.button>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Footer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 1.5 }}
            className="text-center mt-8 text-gray-500 text-sm"
          >
            <p>Secure authentication powered by Supabase</p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}