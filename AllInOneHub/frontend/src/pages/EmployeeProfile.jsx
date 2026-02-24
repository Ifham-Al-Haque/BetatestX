// src/pages/EmployeeProfile.jsx
import { useParams, Link } from "react-router-dom";
import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  User, Mail, Phone, MapPin, Calendar, Building, 
  Shield, Monitor, Briefcase, Edit, ArrowLeft,
  CheckCircle, AlertCircle, Clock, Star, Plus, Trash,
  Upload, Download, Target, Award, Heart, FileText,
  TrendingUp, BarChart3, PieChart, Activity, Users,
  GraduationCap, BookOpen, Clock3, AlertTriangle,
  ChevronDown, ChevronRight, Eye, EyeOff, Globe,
  Zap, Crown, Trophy, CalendarDays, MapPinIcon,
  Car, Package, CreditCard
} from "lucide-react";
import { supabase } from "../supabaseClient";
import UserDropdown from "../components/UserDropdown";
import DarkModeToggle from "../components/DarkModeToggle";

export default function EmployeeProfile() {
  const { id } = useParams();
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  const fetchEmployee = useCallback(async () => {
    setLoading(true);

    const { data: empData, error: empError } = await supabase
      .from("employees")
      .select(`
        *,
        reporting_manager:reporting_manager_id ( full_name, name, employee_id )
      `)
      .eq("id", id)
      .single();

    if (empError) {
      console.error("Error fetching employee:", empError.message);
      setLoading(false);
      return;
    }

    // Fetch additional access data from employee_access table if needed
    const { data: accessList } = await supabase
      .from("employee_access")
      .select("*")
      .eq("employee_id", id);

    let authUserData = null;
    if (empData.auth_user_id) {
      const { data: userData } = await supabase
        .from("profiles")
        .select("email, role, is_verified")
        .eq("id", empData.auth_user_id)
        .single();

      authUserData = userData;
    }

    setEmployee({
      ...empData,
      auth_user: authUserData,
      // Use the JSONB fields from the employees table directly
      // The asset_list and access_list are already in empData as JSONB arrays
    });

    setLoading(false);
  }, [id]);

  useEffect(() => {
    fetchEmployee();
  }, [fetchEmployee]);

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'active': return 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-700';
      case 'inactive': return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-700';
      case 'pending': return 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-700';
      default: return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600';
    }
  };

  const getAccessLevelColor = (level) => {
    switch (level?.toLowerCase()) {
      case 'admin': return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-700';
      case 'semi-admin': return 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-700';
      case 'owner': return 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-700';
      case 'viewer': return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-700';
      default: return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600';
    }
  };

  // Helper function to safely handle JSONB arrays
  const getArrayData = (data) => {
    if (Array.isArray(data)) {
      return data;
    }
    if (typeof data === 'string') {
      // If it's a string, try to split by newlines or commas
      return data.split(/[\n,]/).filter(item => item.trim() !== '');
    }
    return [];
  };

  if (loading) {
    return (
      <div className="min-h-screen font-sans bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="flex">
                    <main className="flex-1 ml-64 p-8">
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600 dark:text-gray-400">Loading employee profile...</p>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="min-h-screen font-sans bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="flex">
                    <main className="flex-1 ml-64 p-8">
            <div className="text-center">
              <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-600 mb-2">Employee Not Found</h2>
              <p className="text-gray-500">The employee you're looking for doesn't exist.</p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: User },
    { id: 'performance', label: 'Performance', icon: TrendingUp },
    { id: 'system_access', label: 'System Access', icon: Shield },
    { id: 'assets', label: 'Assets Assignments', icon: CreditCard },
    { id: 'documents', label: 'Documents', icon: FileText },
    { id: 'skills', label: 'Skills', icon: Award },
    { id: 'leave', label: 'Leave', icon: CalendarDays },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 }
  ];

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Contact Information Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 border border-gray-200 dark:border-gray-600 hover:shadow-md transition-all duration-200"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
              <Mail className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">Email</p>
              <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                {employee.email || 'Not provided'}
              </p>
            </div>
          </div>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 border border-gray-200 dark:border-gray-600 hover:shadow-md transition-all duration-200"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
              <Phone className="w-4 h-4 text-green-600 dark:text-green-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">Phone</p>
              <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                {employee.phone || 'Not provided'}
              </p>
            </div>
          </div>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 border border-gray-200 dark:border-gray-600 hover:shadow-md transition-all duration-200"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
              <Calendar className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">Join Date</p>
              <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                {employee.hire_date ? new Date(employee.hire_date).toLocaleDateString() : 'Not provided'}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
          className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 border border-gray-200 dark:border-gray-600 hover:shadow-md transition-all duration-200"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
              <MapPin className="w-4 h-4 text-orange-600 dark:text-orange-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">Location</p>
              <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                {employee.location || 'Not provided'}
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Additional Information */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Personal Details */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
          className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6 border border-gray-200 dark:border-gray-600"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-blue-600" />
            Personal Details
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-600">
              <span className="text-sm text-gray-600 dark:text-gray-400">Full Name</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">{employee.full_name || employee.name}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-600">
              <span className="text-sm text-gray-600 dark:text-gray-400">Position</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">{employee.position || employee.designation || 'Not specified'}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-600">
              <span className="text-sm text-gray-600 dark:text-gray-400">Employee ID</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">{employee.employee_id}</span>
            </div>
            {employee.salary && (
              <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-600">
                <span className="text-sm text-gray-600 dark:text-gray-400">Salary</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">${employee.salary.toLocaleString()}</span>
              </div>
            )}
          </div>
        </motion.div>

        {/* Work Information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.5 }}
          className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6 border border-gray-200 dark:border-gray-600"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-green-600" />
            Work Information
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-600">
              <span className="text-sm text-gray-600 dark:text-gray-400">Department</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">{employee.department || 'Not assigned'}</span>
            </div>
            {employee.reporting_manager && (
              <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-600">
                <span className="text-sm text-gray-600 dark:text-gray-400">Manager</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {employee.reporting_manager.full_name || employee.reporting_manager.name}
                </span>
              </div>
            )}
            <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-600">
              <span className="text-sm text-gray-600 dark:text-gray-400">Experience Level</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">{employee.experience_level || 'Not specified'}</span>
            </div>
            {employee.termination_date && (
              <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-600">
                <span className="text-sm text-gray-600 dark:text-gray-400">Termination Date</span>
                <span className="text-sm font-medium text-red-600 dark:text-red-400">
                  {new Date(employee.termination_date).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Key Responsibilities */}
      {employee.key_roles && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.6 }}
          className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6 border border-gray-200 dark:border-gray-600"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-purple-600" />
            Key Responsibilities
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {getArrayData(employee.key_roles).map((role, i) => (
              <div key={i} className="flex items-center gap-2 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span className="text-sm text-gray-700 dark:text-gray-300">{role}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );

  const renderPerformance = () => (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">Performance Metrics</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-1">4.8</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Performance Rating</div>
          </div>
          <div className="text-center p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400 mb-1">95%</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Task Completion</div>
          </div>
          <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 mb-1">12</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Projects Completed</div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSystemAccess = () => (
    <div className="space-y-6">
      {/* Authentication & Role Information */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5 text-blue-600" />
          System Access & Permissions
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* User Account Information */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-700 dark:text-gray-300">Account Details</h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <span className="text-sm text-gray-600 dark:text-gray-400">User ID:</span>
                <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                  {employee.auth_user_id || 'Not assigned'}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <span className="text-sm text-gray-600 dark:text-gray-400">Email:</span>
                <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                  {employee.email || 'Not provided'}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <span className="text-sm text-gray-600 dark:text-gray-400">Role:</span>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getAccessLevelColor(employee.auth_user?.role || 'employee')}`}>
                  {employee.auth_user?.role || 'employee'}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <span className="text-sm text-gray-600 dark:text-gray-400">Verification:</span>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  employee.auth_user?.is_verified ? 'bg-green-100 text-green-800 border-green-200' : 'bg-red-100 text-red-800 border-red-200'
                }`}>
                  {employee.auth_user?.is_verified ? 'Verified' : 'Not Verified'}
                </span>
              </div>
            </div>
          </div>

          {/* Access Permissions */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-700 dark:text-gray-300">Access Permissions</h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <span className="text-sm text-gray-600 dark:text-gray-400">Access Level:</span>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getAccessLevelColor(employee.access_level || 'viewer')}`}>
                  {employee.access_level || 'viewer'}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <span className="text-sm text-gray-600 dark:text-gray-400">Last Login:</span>
                <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                  {employee.last_login ? new Date(employee.last_login).toLocaleDateString() : 'Never'}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <span className="text-sm text-gray-600 dark:text-gray-400">Account Status:</span>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  employee.account_status === 'active' ? 'bg-green-100 text-green-800 border-green-200' : 'bg-red-100 text-red-800 border-red-200'
                }`}>
                  {employee.account_status || 'active'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* System Features Access */}
        {employee.access_list && employee.access_list.length > 0 && (
          <div className="mt-6">
            <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-3">System Features Access</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {getArrayData(employee.access_list).map((access, i) => (
                <div key={i} className="flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
                  <CheckCircle className="w-4 h-4 text-blue-600" />
                  <span className="text-sm text-blue-800 dark:text-blue-200">{access}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Department Access & Permissions */}
        <div className="mt-6">
          <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-3">Department Access & Permissions</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
              <div className="flex items-center gap-2 mb-2">
                <Building className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Primary Department</span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {employee.department || 'Not assigned'}
              </p>
            </div>
            
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Reporting Manager</span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {employee.reporting_manager?.full_name || employee.reporting_manager?.name || 'Not assigned'}
              </p>
            </div>
          </div>
        </div>

        {/* Security & Compliance */}
        <div className="mt-6">
          <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-3">Security & Compliance</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-700">
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span className="text-xs font-medium text-amber-800 dark:text-amber-200">Access Level</span>
              </div>
              <p className="text-sm text-amber-700 dark:text-amber-300">
                {employee.access_level || 'Standard'}
              </p>
            </div>
            
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
              <div className="flex items-center gap-2 mb-1">
                <Shield className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-medium text-blue-800 dark:text-blue-200">Role</span>
              </div>
              <p className="text-sm text-blue-700 dark:text-blue-300 capitalize">
                {employee.auth_user?.role || 'employee'}
              </p>
            </div>
            
            <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-700">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-xs font-medium text-green-800 dark:text-green-200">Status</span>
              </div>
              <p className="text-sm text-green-700 dark:text-green-300 capitalize">
                {employee.status || 'active'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAssetsAssignments = () => (
    <div className="space-y-6">
      {/* IT Assets */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
          <Monitor className="w-5 h-5 text-green-600" />
          IT Assets Assigned
        </h3>
        
        {employee.asset_list && employee.asset_list.length > 0 ? (
          <div className="space-y-4">
            {/* Asset Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="text-center p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border border-green-200 dark:border-green-700">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400 mb-1">
                  {getArrayData(employee.asset_list).length}
                </div>
                <div className="text-sm text-green-700 dark:text-green-300">Total Assets</div>
              </div>
              <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-900/40 rounded-xl border border-blue-200 dark:border-blue-700">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-1">
                  {getArrayData(employee.asset_list).filter(asset => asset.includes('Laptop') || asset.includes('Computer')).length}
                </div>
                <div className="text-sm text-blue-700 dark:text-blue-300">Computers</div>
              </div>
              <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-900/40 rounded-xl border border-purple-200 dark:border-purple-700">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 mb-1">
                  {getArrayData(employee.asset_list).filter(asset => asset.includes('Phone') || asset.includes('Mobile')).length}
                </div>
                <div className="text-sm text-purple-700 dark:text-purple-300">Mobile Devices</div>
              </div>
            </div>

            {/* Asset List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {getArrayData(employee.asset_list).map((asset, i) => (
                <div key={i} className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border border-green-200 dark:border-green-700">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-green-100 dark:bg-green-900/40 rounded-lg">
                      <Monitor className="w-5 h-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-800 dark:text-gray-200">Asset {i + 1}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{asset}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                      <Clock className="w-3 h-3" />
                      <span>Assigned</span>
                    </div>
                    <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                      Active
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <Monitor className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No IT assets assigned yet</p>
          </div>
        )}
      </div>

      {/* Vehicle Assignments */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
          <Car className="w-5 h-5 text-blue-600" />
          Vehicle Assignments
        </h3>
        
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <Car className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No vehicle assignments available</p>
        </div>
      </div>

      {/* Other Equipment */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
          <Package className="w-5 h-5 text-purple-600" />
          Other Equipment
        </h3>
        
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No other equipment assigned</p>
        </div>
      </div>
    </div>
  );

  const renderDocuments = () => (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">Documents</h3>
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No documents uploaded yet</p>
        </div>
      </div>
    </div>
  );

  const renderSkills = () => (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">Skills & Competencies</h3>
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <Award className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No skills recorded yet</p>
        </div>
      </div>
    </div>
  );

  const renderLeave = () => (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">Leave Management</h3>
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <CalendarDays className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No leave records available</p>
        </div>
      </div>
    </div>
  );

  const renderAnalytics = () => (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">Analytics Dashboard</h3>
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Analytics data not available yet</p>
        </div>
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview();
      case 'performance':
        return renderPerformance();
      case 'system_access':
        return renderSystemAccess();
      case 'assets':
        return renderAssetsAssignments();
      case 'documents':
        return renderDocuments();
      case 'skills':
        return renderSkills();
      case 'leave':
        return renderLeave();
      case 'analytics':
        return renderAnalytics();
      default:
        return renderOverview();
    }
  };

  return (
    <div className="min-h-screen font-sans bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="flex">
                <main className="flex-1 ml-64 p-6">
          {/* Enhanced Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-3xl p-6 text-white shadow-2xl mb-6"
          >
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-4">
                <Link
                  to="/employees"
                  className="p-2 bg-white/20 hover:bg-white/30 rounded-xl transition-all duration-200 border border-white/30 backdrop-blur-sm"
                >
                  <ArrowLeft className="w-5 h-5 text-white" />
                </Link>
                <div>
                  <h1 className="text-3xl font-bold mb-2">Employee Profile</h1>
                  <p className="text-blue-100 text-lg">View and manage employee information</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Link
                  to={`/employee/${employee.id}/edit`}
                  className="bg-white/20 hover:bg-white/30 text-white px-5 py-2.5 rounded-xl transition-all duration-200 flex items-center gap-2 border border-white/30 backdrop-blur-sm"
                >
                  <Edit className="w-4 h-4" />
                  Edit Profile
                </Link>
                <DarkModeToggle />
                <UserDropdown />
              </div>
            </div>

            {/* Profile Header */}
            <div className="flex items-center gap-6">
              <div className="relative">
                {(employee.profile_picture || employee.photo_url) ? (
                  <img
                    key={`${employee.id}-${employee.profile_picture || employee.photo_url || 'no-pic'}`}
                    src={employee.profile_picture || employee.photo_url}
                    alt={employee.full_name || employee.name}
                    className="w-20 h-20 rounded-full border-4 border-white shadow-lg object-cover"
                    data-employee-id={employee.id}
                    onError={(e) => {
                      e.target.style.display = 'none';
                      const avatarContainer = e.target.parentElement;
                      if (avatarContainer) {
                        avatarContainer.innerHTML = `
                          <div class="w-20 h-20 rounded-full border-4 border-white shadow-lg bg-white/20 flex items-center justify-center">
                            <div class="text-white text-xl font-bold">
                              ${(employee.full_name || employee.name || 'U').charAt(0).toUpperCase()}
                            </div>
                          </div>
                        `;
                      }
                    }}
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full border-4 border-white shadow-lg bg-white/20 flex items-center justify-center">
                    <span className="text-white text-xl font-bold">
                      {(employee.full_name || employee.name || 'U').charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center">
                  <CheckCircle className="w-3 h-3 text-white" />
                </div>
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold mb-2">{employee.full_name || employee.name}</h2>
                <p className="text-lg text-blue-100 mb-2">
                  {employee.position || employee.designation} — {employee.department}
                </p>
                <div className="flex items-center gap-4 text-blue-100 text-sm">
                  <span className="flex items-center gap-1">
                    <Building className="w-4 h-4" />
                    {employee.employee_id}
                  </span>
                  {employee.status && (
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(employee.status)}`}>
                      {employee.status}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Tab Navigation */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 mb-6 overflow-hidden"
          >
            <div className="flex overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Tab Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {renderTabContent()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

