import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Mail, Lock, Eye, EyeOff, User, Shield, 
  AlertCircle, CheckCircle, Loader2, ArrowRight,
  Sparkles, Users, Building2, Zap, UserPlus
} from "lucide-react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import { useToast } from "../context/ToastContext";
import config from "../config";
import Logo from "../components/ui/logo";
import UserCreationService from "../services/userCreationService";

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
  const [showCreateAccount, setShowCreateAccount] = useState(false);
  const [createAccountData, setCreateAccountData] = useState({
    full_name: "",
    department: "",
    position: "",
    phone: "",
    location: ""
  });

  const navigate = useNavigate();
  const { success, error, warning } = useToast();

  // Get admin email from config
  const adminEmail = config.app.adminEmail;

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
      navigate("/", { replace: true });
    }
  };

  const redirectToRolePage = (role) => {
    navigate('/', { replace: true });
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
        // Enhanced login flow that handles existing employees without auth accounts
        const result = await handleEnhancedLogin(email, password);
        
        if (result.success) {
          if (result.action === 'login') {
            // Normal login successful
            setInfoMsg("Login successful! Redirecting...");
            success("Login Successful", "Welcome back!");
            await checkUserRoleAndRedirect(result.user);
          } else if (result.action === 'account_created') {
            // Auth account was created for existing employee
            setInfoMsg("Authentication account created! Please check your email to confirm.");
            success("Account Created", "Authentication account created successfully. Please check your email for confirmation.");
            setLoading(false);
            return;
          }
        } else {
          setErrorMsg(result.error);
          setLoading(false);
          return;
        }
      }
    } catch (err) {
      setErrorMsg(err.message || "Authentication failed.");
      error("Authentication Error", err.message || "Authentication failed.");
      setLoading(false);
    }
  }

  /**
   * Enhanced login that handles existing employees without auth accounts
   */
  async function handleEnhancedLogin(email, password) {
    try {
      // Step 1: Try normal login first
      const { data, error } = await supabase.auth.signInWithPassword({ 
        email, 
        password 
      });

      if (data?.user) {
        return { success: true, action: 'login', user: data.user };
      }

      // Step 2: If login fails, check if it's an existing employee without auth account
      if (error?.message?.includes('Invalid login credentials') || 
          error?.message?.includes('Email not confirmed')) {
        
        const existingEmployee = await checkExistingEmployee(email);
        
        if (existingEmployee && !existingEmployee.auth_user_id) {
          // Employee exists but no auth account - offer to create one
          setShowCreateAccount(true);
          setCreateAccountData({
            full_name: existingEmployee.full_name || email.split("@")[0],
            department: existingEmployee.department || "Unassigned",
            position: existingEmployee.position || "Employee",
            phone: existingEmployee.phone || "",
            location: existingEmployee.location || ""
          });
          
          return {
            success: false,
            action: 'show_create_account',
            message: 'Employee found but no authentication account. Please create one below.'
          };
        }
      }

      // Step 3: Return the original error
      return { success: false, error: error?.message || "Login failed" };

    } catch (err) {
      return { success: false, error: err.message || "Authentication failed" };
    }
  }

  /**
   * Check if an employee exists in the database
   */
  async function checkExistingEmployee(email) {
    try {
      const { data: employee, error } = await supabase
        .from("employees")
        .select("*")
        .eq("email", email)
        .maybeSingle();

      if (error) {
        console.error("Error checking employee:", error);
        return null;
      }

      return employee;
    } catch (err) {
      console.error("Error in checkExistingEmployee:", err);
      return null;
    }
  }

  /**
   * Create authentication account for existing employee
   */
  async function handleCreateAuthAccount() {
    setLoading(true);
    setErrorMsg("");
    setInfoMsg("");

    try {
      // Validate required fields
      if (!createAccountData.full_name.trim()) {
        setErrorMsg("Full name is required");
        setLoading(false);
        return;
      }

      if (password.length < 6) {
        setErrorMsg("Password must be at least 6 characters long");
        setLoading(false);
        return;
      }

      // Create auth account for existing employee
      const result = await UserCreationService.createAuthForExistingEmployee(
        email,
        password
      );

      if (result.success) {
        // Update employee record with additional information
        const { error: updateError } = await supabase
          .from("employees")
          .update({
            full_name: createAccountData.full_name,
            department: createAccountData.department,
            position: createAccountData.position,
            phone: createAccountData.phone || null,
            location: createAccountData.location || null,
            updated_at: new Date().toISOString()
          })
          .eq("email", email);

        if (updateError) {
          console.warn("Failed to update employee details:", updateError);
        }

        setInfoMsg("Authentication account created successfully! Please check your email to confirm.");
        success("Account Created", "Authentication account created successfully. Please check your email for confirmation.");
        setShowCreateAccount(false);
        setLoading(false);
      } else {
        setErrorMsg(result.error);
        setLoading(false);
      }

    } catch (err) {
      setErrorMsg("Failed to create authentication account: " + err.message);
      error("Creation Failed", "Failed to create authentication account. Please try again.");
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
    <div className="min-h-screen flex">
      {/* Left Side - Hero Section */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative z-10 flex flex-col justify-center items-center text-white p-12">
          <div className="text-center mb-8">
            <Logo className="w-24 h-24 mb-6" />
            <h1 className="text-4xl font-bold mb-4">Welcome to UHub</h1>
            <p className="text-xl text-blue-100">
              Your comprehensive business management platform
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-6 text-center">
            <div className="flex flex-col items-center">
              <Users className="w-8 h-8 mb-2 text-blue-200" />
              <span className="text-sm">Employee Management</span>
            </div>
            <div className="flex flex-col items-center">
              <Building2 className="w-8 h-8 mb-2 text-blue-200" />
              <span className="text-sm">Department Control</span>
            </div>
            <div className="flex flex-col items-center">
              <Zap className="w-8 h-8 mb-2 text-blue-200" />
              <span className="text-sm">Task Management</span>
            </div>
            <div className="flex flex-col items-center">
              <Shield className="w-8 h-8 mb-2 text-blue-200" />
              <span className="text-sm">Role-Based Access</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md">
          <div className="text-center mb-8 lg:hidden">
            <Logo className="w-16 h-16 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900">Welcome to UHub</h1>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold text-center mb-6">
              {showCreateAccount ? "Create Authentication Account" : "Sign In"}
            </h2>

            {!showCreateAccount ? (
              // Normal Login Form
              <form onSubmit={handleAuth} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter your email"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter your password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Signing In...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      Sign In
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </div>
                  )}
                </button>
              </form>
            ) : (
              // Create Account Form for Existing Employee
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <div className="flex items-center">
                    <UserPlus className="w-5 h-5 text-blue-600 mr-2" />
                    <span className="text-sm text-blue-800">
                      Employee found: {email}. Creating authentication account...
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={createAccountData.full_name}
                    onChange={(e) => setCreateAccountData(prev => ({ ...prev, full_name: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter full name"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Department
                    </label>
                    <input
                      type="text"
                      value={createAccountData.department}
                      onChange={(e) => setCreateAccountData(prev => ({ ...prev, department: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Department"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Position
                    </label>
                    <input
                      type="text"
                      value={createAccountData.position}
                      onChange={(e) => setCreateAccountData(prev => ({ ...prev, position: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Position"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={createAccountData.phone}
                      onChange={(e) => setCreateAccountData(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Phone number"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Location
                    </label>
                    <input
                      type="text"
                      value={createAccountData.location}
                      onChange={(e) => setCreateAccountData(prev => ({ ...prev, location: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Location"
                    />
                  </div>
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={handleCreateAuthAccount}
                    disabled={loading}
                    className="flex-1 bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {loading ? (
                      <div className="flex items-center justify-center">
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Creating...
                      </div>
                    ) : (
                      <div className="flex items-center justify-center">
                        <UserPlus className="w-5 h-5 mr-2" />
                        Create Account
                      </div>
                    )}
                  </button>
                  <button
                    onClick={() => setShowCreateAccount(false)}
                    className="px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Error and Info Messages */}
            {errorMsg && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center">
                  <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
                  <span className="text-sm text-red-700">{errorMsg}</span>
                </div>
              </div>
            )}

            {infoMsg && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-blue-500 mr-2" />
                  <span className="text-sm text-blue-700">{infoMsg}</span>
                </div>
              </div>
            )}

            {/* Forgot Password */}
            {!showCreateAccount && (
              <div className="mt-6 text-center">
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(true)}
                  className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                >
                  Forgot your password?
                </button>
              </div>
            )}

            {/* Forgot Password Modal */}
            {showForgotPassword && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
                  <h3 className="text-lg font-semibold mb-4">Reset Password</h3>
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4"
                  />
                  <div className="flex space-x-3">
                    <button
                      onClick={handleForgotPassword}
                      className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
                    >
                      Send Reset Link
                    </button>
                    <button
                      onClick={() => setShowForgotPassword(false)}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
