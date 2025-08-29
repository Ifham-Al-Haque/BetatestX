import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, Plus, Edit, Trash, Eye, EyeOff, Shield, 
  UserCheck, UserX, Mail, Phone, MapPin, Briefcase,
  Search, Filter, MoreVertical, Save, X, Lock, 
  TrendingUp, Activity, Clock, Star
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { 
  useUserManagement, 
  useCreateUser, 
  useUpdateUser, 
  useDeleteUser, 
  useToggleUserStatus 
} from '../hooks/useApi';
import { useToast } from '../context/ToastContext';

import InvitationManager from '../components/InvitationManager';

export default function UserManagement() {
  const { user } = useAuth();
  const { success, error: showError } = useToast();
  
  const [showUserForm, setShowUserForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [showPassword, setShowPassword] = useState(false);
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'grid'
  
  // Password strength indicator
  const getPasswordStrength = (password) => {
    if (!password) return { strength: 'none', color: 'text-gray-400', text: '', width: '0%' };
    if (password.length < 6) return { strength: 'weak', color: 'text-red-500', text: 'Weak', width: '25%' };
    if (password.length < 8) return { strength: 'medium', color: 'text-yellow-500', text: 'Medium', width: '50%' };
    if (password.length >= 8) return { strength: 'strong', color: 'text-green-500', text: 'Strong', width: '100%' };
    return { strength: 'none', color: 'text-gray-400', text: '', width: '0%' };
  };

  const [userFormData, setUserFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    role: 'employee',
    status: 'active'
  });

  // Use React Query hooks
  const { data: users = [], isLoading, error } = useUserManagement();
  const createUserMutation = useCreateUser();
  const updateUserMutation = useUpdateUser();
  const deleteUserMutation = useDeleteUser();
  const toggleStatusMutation = useToggleUserStatus();

  const roles = [
    { value: 'admin', label: 'Administrator', color: 'bg-gradient-to-r from-red-500 to-pink-500', icon: Shield, bgColor: 'bg-red-50', textColor: 'text-red-700' },
    { value: 'data_operator', label: 'Data Operator', color: 'bg-gradient-to-r from-orange-500 to-amber-500', icon: Briefcase, bgColor: 'bg-orange-50', textColor: 'text-orange-700' },
    { value: 'finance', label: 'Finance', color: 'bg-gradient-to-r from-emerald-500 to-green-500', icon: Briefcase, bgColor: 'bg-emerald-50', textColor: 'text-emerald-700' },
    { value: 'it_management', label: 'IT Management', color: 'bg-gradient-to-r from-cyan-500 to-blue-500', icon: Briefcase, bgColor: 'bg-cyan-50', textColor: 'text-cyan-700' },
    { value: 'manager', label: 'Manager', color: 'bg-gradient-to-r from-blue-500 to-indigo-500', icon: Briefcase, bgColor: 'bg-blue-50', textColor: 'text-blue-700' },
    { value: 'driver_management', label: 'Driver Management', color: 'bg-gradient-to-r from-green-500 to-emerald-500', icon: MapPin, bgColor: 'bg-green-50', textColor: 'text-green-700' },
    { value: 'hr_manager', label: 'HR Manager', color: 'bg-gradient-to-r from-purple-500 to-violet-500', icon: Users, bgColor: 'bg-purple-50', textColor: 'text-purple-700' },
    { value: 'cs_manager', label: 'CS Manager', color: 'bg-gradient-to-r from-indigo-500 to-blue-500', icon: Phone, bgColor: 'bg-indigo-50', textColor: 'text-indigo-700' },
    { value: 'employee', label: 'Employee', color: 'bg-gradient-to-r from-gray-500 to-slate-500', icon: UserCheck, bgColor: 'bg-gray-50', textColor: 'text-gray-700' },
    { value: 'viewer', label: 'Viewer', color: 'bg-gradient-to-r from-orange-500 to-amber-500', icon: Eye, bgColor: 'bg-orange-50', textColor: 'text-orange-700' }
  ];

  const handleCreateUser = useCallback(async (e) => {
    e.preventDefault();

    console.log('🎯 handleCreateUser called with:', userFormData);

    // Validate password
    if (userFormData.password && userFormData.password.length < 6) {
      showError("Error", "Password must be at least 6 characters long");
      return;
    }

    // Validate password confirmation
    if (userFormData.password && userFormData.password !== userFormData.confirmPassword) {
      showError("Error", "Passwords do not match");
      return;
    }

    console.log('✅ Validation passed, calling createUserMutation...');

    try {
      await createUserMutation.mutateAsync(userFormData);
      
      setShowUserForm(false);
      setUserFormData({
        email: '',
        password: '',
        confirmPassword: '',
        role: 'employee',
        status: 'active'
      });
      setShowPassword(false);
      success("Success", "User account created successfully with login credentials!");
    } catch (err) {
      showError("Error", err.message);
    }
  }, [userFormData, createUserMutation, success, showError]);

  const handleUpdateUser = useCallback(async (e) => {
    e.preventDefault();

    try {
      await updateUserMutation.mutateAsync({
        id: editingUser.id,
        data: {
          role: userFormData.role,
          status: userFormData.status
        }
      });
      
      setShowUserForm(false);
      setEditingUser(null);
      setUserFormData({
        email: '',
        password: '',
        confirmPassword: '',
        role: 'employee',
        status: 'active'
      });
      success("Success", "User updated successfully!");
    } catch (err) {
      showError("Error", err.message);
    }
  }, [userFormData, editingUser, updateUserMutation, success, showError]);

  const handleDeleteUser = useCallback(async (userId) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;

    try {
      await deleteUserMutation.mutateAsync(userId);
      success("Success", "User deleted successfully!");
    } catch (err) {
      showError("Error", err.message);
    }
  }, [deleteUserMutation, success, showError]);

  const handleToggleStatus = useCallback(async (userId, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    
    try {
      await toggleStatusMutation.mutateAsync({ id: userId, status: newStatus });
      success("Success", `User ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully!`);
    } catch (err) {
      showError("Error", err.message);
    }
  }, [toggleStatusMutation, success, showError]);

  const startEdit = useCallback((user) => {
    setEditingUser(user);
    setUserFormData({
      email: user.email,
      role: user.role,
      status: user.status
    });
    setShowUserForm(true);
  }, []);

  const cancelEdit = useCallback(() => {
    setShowUserForm(false);
    setEditingUser(null);
    setUserFormData({
      email: '',
      password: '',
      confirmPassword: '',
      role: 'employee',
      status: 'active'
    });
    setShowPassword(false);
  }, []);

  // Filter users based on search and filters
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.department?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    
    return matchesSearch && matchesStatus && matchesRole;
  });

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <h3 className="text-red-800 font-medium">Error Loading Users</h3>
        <p className="text-red-600 mt-1">{error.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Enhanced Stats Cards */}
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-4 gap-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
      >
        <EnhancedStatCard
          icon={Users}
          title="Total Users"
          value={users.length}
          subtitle="All registered users"
          color="from-blue-500 to-blue-600"
          bgColor="bg-blue-50"
          iconColor="text-blue-600"
          trend="+12%"
          trendColor="text-green-600"
        />
        <EnhancedStatCard
          icon={UserCheck}
          title="Active Users"
          value={users.filter(u => u.status === 'active').length}
          subtitle="Currently active"
          color="from-green-500 to-emerald-600"
          bgColor="bg-green-50"
          iconColor="text-green-600"
          trend="+8%"
          trendColor="text-green-600"
        />
        <EnhancedStatCard
          icon={Shield}
          title="Admins"
          value={users.filter(u => u.role === 'admin').length}
          subtitle="Administrators"
          color="from-red-500 to-pink-600"
          bgColor="bg-red-50"
          iconColor="text-red-600"
          trend="+2"
          trendColor="text-blue-600"
        />
        <EnhancedStatCard
          icon={UserX}
          title="Inactive"
          value={users.filter(u => u.status === 'inactive').length}
          subtitle="Deactivated users"
          color="from-yellow-500 to-amber-600"
          bgColor="bg-yellow-50"
          iconColor="text-yellow-600"
          trend="-5%"
          trendColor="text-red-600"
        />
      </motion.div>

      {/* User Invitations Section */}
      <div>
        <InvitationManager />
      </div>

      {/* Enhanced Controls */}
      <motion.div 
        className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <div className="flex flex-col lg:flex-row gap-6 items-center justify-between">
          <div className="flex flex-col lg:flex-row gap-4 flex-1">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search users by name, email, or department..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 backdrop-blur-sm transition-all duration-200 hover:bg-white/80"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 backdrop-blur-sm transition-all duration-200 hover:bg-white/80"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 backdrop-blur-sm transition-all duration-200 hover:bg-white/80"
            >
              <option value="all">All Roles</option>
              <option value="admin">Administrator</option>
              <option value="manager">Manager</option>
              <option value="driver_management">Driver Management</option>
              <option value="hr_manager">HR Manager</option>
              <option value="employee">Employee</option>
              <option value="viewer">Viewer</option>
            </select>
          </div>
          <div className="flex items-center gap-3">
            {/* View Mode Toggle */}
            <div className="flex bg-slate-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('table')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                  viewMode === 'table' 
                    ? 'bg-white text-slate-700 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Table
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                  viewMode === 'grid' 
                    ? 'bg-white text-slate-700 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Grid
              </button>
            </div>
            <button
              onClick={() => setShowUserForm(true)}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 rounded-xl transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              <Plus className="w-5 h-5" />
              Add User
            </button>
          </div>
        </div>
      </motion.div>

      {/* Enhanced Users Display */}
      <motion.div 
        className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
      >
        {isLoading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-slate-600 text-lg">Loading users...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-12 h-12 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-2">No users found</h3>
            <p className="text-slate-600">Try adjusting your search or filters</p>
          </div>
        ) : viewMode === 'table' ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50/80">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Department
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white/50 divide-y divide-slate-200/50">
                {filteredUsers.map((user, index) => (
                  <motion.tr
                    key={user.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="hover:bg-slate-50/80 transition-colors duration-200"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-12 w-12">
                          <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                            <span className="text-sm font-bold text-white">
                              {user.full_name?.charAt(0) || user.email?.charAt(0)}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-semibold text-slate-900">{user.full_name || 'Unnamed User'}</div>
                          <div className="text-sm text-slate-500">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {(() => {
                          const role = roles.find(r => r.value === user.role);
                          const Icon = role?.icon || Users;
                          return (
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${role?.bgColor} ${role?.textColor} border border-current/20`}>
                              <Icon className="w-3 h-3 mr-1" />
                              {role?.label || user.role}
                            </span>
                          );
                        })()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                      {user.department || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                        user.status === 'active' 
                          ? 'bg-green-100 text-green-800 border border-green-200' 
                          : 'bg-red-100 text-red-800 border border-red-200'
                      }`}>
                        <div className={`w-2 h-2 rounded-full mr-2 ${user.status === 'active' ? 'bg-green-400' : 'bg-red-400'}`}></div>
                        {user.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => startEdit(user)}
                          className="p-2 text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50 rounded-lg transition-all duration-200"
                          title="Edit user"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(user.id, user.status)}
                          disabled={toggleStatusMutation.isLoading}
                          className={`p-2 rounded-lg transition-all duration-200 ${
                            user.status === 'active' 
                              ? 'text-red-600 hover:text-red-900 hover:bg-red-50' 
                              : 'text-green-600 hover:text-green-900 hover:bg-green-50'
                          }`}
                          title={user.status === 'active' ? 'Deactivate user' : 'Activate user'}
                        >
                          {user.status === 'active' ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          disabled={deleteUserMutation.isLoading}
                          className="p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-lg transition-all duration-200"
                          title="Delete user"
                        >
                          <Trash className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredUsers.map((user, index) => (
                <motion.div
                  key={user.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="bg-white/60 backdrop-blur-sm rounded-xl border border-white/20 p-4 hover:shadow-lg transition-all duration-200 hover:-translate-y-1"
                >
                  <div className="flex items-center mb-4">
                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg mr-3">
                      <span className="text-sm font-bold text-white">
                        {user.full_name?.charAt(0) || user.email?.charAt(0)}
                      </span>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-900 line-clamp-1">{user.full_name || 'Unnamed User'}</h3>
                      <p className="text-xs text-slate-500 line-clamp-1">{user.email}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      {(() => {
                        const role = roles.find(r => r.value === user.role);
                        const Icon = role?.icon || Users;
                        return (
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${role?.bgColor} ${role?.textColor}`}>
                            <Icon className="w-3 h-3 mr-1" />
                            {role?.label || user.role}
                          </span>
                        );
                      })()}
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        user.status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        <div className={`w-2 h-2 rounded-full mr-1 ${user.status === 'active' ? 'bg-green-400' : 'bg-red-400'}`}></div>
                        {user.status}
                      </span>
                    </div>
                    
                    <div className="text-xs text-slate-600">
                      <p><strong>Department:</strong> {user.department || 'N/A'}</p>
                    </div>
                    
                    <div className="flex items-center gap-2 pt-2">
                      <button
                        onClick={() => startEdit(user)}
                        className="flex-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-3 py-2 rounded-lg text-xs font-medium transition-colors duration-200 flex items-center justify-center gap-1"
                      >
                        <Edit className="w-3 h-3" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleToggleStatus(user.id, user.status)}
                        disabled={toggleStatusMutation.isLoading}
                        className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-colors duration-200 flex items-center justify-center gap-1 ${
                          user.status === 'active' 
                            ? 'bg-red-50 hover:bg-red-100 text-red-700' 
                            : 'bg-green-50 hover:bg-green-100 text-green-700'
                        }`}
                      >
                        {user.status === 'active' ? <UserX className="w-3 h-3" /> : <UserCheck className="w-3 h-3" />}
                        {user.status === 'active' ? 'Deactivate' : 'Activate'}
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </motion.div>

      {/* Enhanced User Form Modal */}
      <AnimatePresence>
        {showUserForm && (
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
              className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="sticky top-0 bg-gradient-to-r from-slate-50 to-blue-50 rounded-t-2xl p-6 border-b border-slate-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
                      <Users className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800">
                      {editingUser ? 'Edit User' : 'Add New User'}
                    </h3>
                  </div>
                  <button
                    onClick={cancelEdit}
                    className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all duration-200"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>
              
              <div className="p-6">
                <form onSubmit={editingUser ? handleUpdateUser : handleCreateUser} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Email Address</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <input
                          type="email"
                          value={userFormData.email}
                          onChange={(e) => setUserFormData({ ...userFormData, email: e.target.value })}
                          required
                          disabled={!!editingUser}
                          className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-50 transition-all duration-200"
                          placeholder="user@company.com"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Password</label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={userFormData.password}
                          onChange={(e) => setUserFormData({ ...userFormData, password: e.target.value })}
                          required={!editingUser}
                          disabled={!!editingUser}
                          className="w-full pl-10 pr-12 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-50 transition-all duration-200"
                          placeholder="Enter password (required for login)"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center"
                          disabled={!!editingUser}
                        >
                          {showPassword ? (
                            <EyeOff className="h-5 w-5 text-slate-400 hover:text-slate-600" />
                          ) : (
                            <Eye className="h-5 w-5 text-slate-400 hover:text-slate-600" />
                          )}
                        </button>
                      </div>
                      {userFormData.password && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className={getPasswordStrength(userFormData.password).color}>
                              {getPasswordStrength(userFormData.password).text}
                            </span>
                            <span className="text-slate-500">
                              {userFormData.password.length}/8 characters
                            </span>
                          </div>
                          <div className="w-full bg-slate-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full transition-all duration-300 ${
                                getPasswordStrength(userFormData.password).strength === 'weak' ? 'bg-red-500' :
                                getPasswordStrength(userFormData.password).strength === 'medium' ? 'bg-yellow-500' :
                                getPasswordStrength(userFormData.password).strength === 'strong' ? 'bg-green-500' : 'bg-slate-200'
                              }`}
                              style={{ width: getPasswordStrength(userFormData.password).width }}
                            ></div>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Confirm Password</label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={userFormData.confirmPassword}
                          onChange={(e) => setUserFormData({ ...userFormData, confirmPassword: e.target.value })}
                          required={!editingUser}
                          disabled={!!editingUser}
                          className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-50 transition-all duration-200"
                          placeholder="Confirm password (required)"
                        />
                      </div>
                      {userFormData.password && userFormData.confirmPassword && (
                        <div className="flex items-center gap-2 text-xs">
                          {userFormData.password === userFormData.confirmPassword ? (
                            <div className="flex items-center gap-1 text-green-600">
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                              Passwords match
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 text-red-600">
                              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                              Passwords do not match
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Role</label>
                      <select
                        value={userFormData.role}
                        onChange={(e) => setUserFormData({ ...userFormData, role: e.target.value })}
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      >
                        {roles.map(role => (
                          <option key={role.value} value={role.value}>{role.label}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Status</label>
                      <select
                        value={userFormData.status}
                        onChange={(e) => setUserFormData({ ...userFormData, status: e.target.value })}
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </div>
                  </div>
                
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 p-4 rounded-xl">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Shield className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-blue-900 mb-2">Important Information</h4>
                        <p className="text-sm text-blue-800 mb-2">
                          This creates a user account with login credentials. Employee details (name, department, position, etc.) are managed separately in the Employee Records section.
                        </p>
                        {!editingUser && (
                          <p className="text-xs text-blue-700">
                            <strong>Password:</strong> Required for login access. Users can log in immediately with the provided password.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                
                  <div className="flex gap-3 pt-6">
                    <button
                      type="submit"
                      disabled={createUserMutation.isLoading || updateUserMutation.isLoading}
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-3 rounded-xl transition-all duration-200 flex items-center gap-2 disabled:opacity-50 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 font-medium"
                    >
                      <Save className="w-5 h-5" />
                      {createUserMutation.isLoading || updateUserMutation.isLoading 
                        ? 'Saving...' 
                        : (editingUser ? 'Update User' : 'Create User')
                      }
                    </button>
                    <button
                      type="button"
                      onClick={cancelEdit}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-8 py-3 rounded-xl transition-all duration-200 font-medium"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const EnhancedStatCard = ({ icon: Icon, title, value, subtitle, color, bgColor, iconColor, trend, trendColor }) => (
  <motion.div
    className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
    whileHover={{ scale: 1.02 }}
  >
    <div className="flex items-center justify-between mb-4">
      <div className={`p-3 rounded-xl ${bgColor}`}>
        <Icon className={`w-6 h-6 ${iconColor}`} />
      </div>
      {trend && (
        <div className={`text-xs font-semibold ${trendColor} flex items-center gap-1`}>
          <TrendingUp className="w-3 h-3" />
          {trend}
        </div>
      )}
    </div>
    <div>
      <p className="text-3xl font-bold text-slate-800 mb-1">{value}</p>
      <p className="text-sm font-medium text-slate-600 mb-1">{title}</p>
      <p className="text-xs text-slate-500">{subtitle}</p>
    </div>
    <div className={`mt-4 w-full h-1 rounded-full ${color} opacity-20`}></div>
  </motion.div>
); 