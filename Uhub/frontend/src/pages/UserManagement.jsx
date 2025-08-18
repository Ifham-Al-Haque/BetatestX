import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, Plus, Edit, Trash, Eye, EyeOff, Shield, 
  UserCheck, UserX, Mail, Phone, MapPin, Briefcase,
  Search, Filter, MoreVertical, Save, X, Lock
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
import Sidebar from '../components/Sidebar';
import UserDropdown from '../components/UserDropdown';
import DarkModeToggle from '../components/DarkModeToggle';
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
  
  // Password strength indicator
  const getPasswordStrength = (password) => {
    if (!password) return { strength: 'none', color: 'text-gray-400', text: '' };
    if (password.length < 6) return { strength: 'weak', color: 'text-red-500', text: 'Weak' };
    if (password.length < 8) return { strength: 'medium', color: 'text-yellow-500', text: 'Medium' };
    if (password.length >= 8) return { strength: 'strong', color: 'text-green-500', text: 'Strong' };
    return { strength: 'none', color: 'text-gray-400', text: '' };
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
    { value: 'admin', label: 'Admin', color: 'bg-red-100 text-red-800 border-red-200' },
    { value: 'manager', label: 'Manager', color: 'bg-blue-100 text-blue-800 border-blue-200' },
    { value: 'driver_management', label: 'Driver Management', color: 'bg-green-100 text-green-800 border-green-200' },
    { value: 'employee', label: 'Employee', color: 'bg-green-100 text-green-800 border-green-200' },
    { value: 'view', label: 'View Only', color: 'bg-gray-100 text-gray-800 border-gray-200' }
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
      <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900">
        <Sidebar />
        <div className="ml-64 p-6 w-full">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 className="text-red-800 font-medium">Error Loading Users</h3>
            <p className="text-red-600 mt-1">{error.message}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen font-sans" style={{ background: "linear-gradient(135deg, #f8fafc 0%, #e0e7ef 100%)" }}>
      <div className="flex">
        <Sidebar />
        <main className="flex-1 ml-64 p-10">
          {/* Header */}
          <div className="flex justify-between items-center mb-10">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Users className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <h1 className="text-4xl font-bold tracking-tight">User Management</h1>
                <p className="text-gray-600">Manage system users and their permissions</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <DarkModeToggle />
              <UserDropdown />
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <StatCard
              icon={Users}
              title="Total Users"
              value={users.length}
              subtitle="All registered users"
              color="bg-blue-500"
            />
            <StatCard
              icon={UserCheck}
              title="Active Users"
              value={users.filter(u => u.status === 'active').length}
              subtitle="Currently active"
              color="bg-green-500"
            />
            <StatCard
              icon={Shield}
              title="Admins"
              value={users.filter(u => u.role === 'admin').length}
              subtitle="Administrators"
              color="bg-red-500"
            />
            <StatCard
              icon={UserX}
              title="Inactive"
              value={users.filter(u => u.status === 'inactive').length}
              subtitle="Deactivated users"
              color="bg-yellow-500"
            />
          </div>

          {/* User Invitations Section */}
          <div className="mb-8">
            <InvitationManager />
          </div>

          {/* Controls */}
          <div className="bg-white rounded-xl shadow border border-gray-200 p-6 mb-8">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="flex flex-col md:flex-row gap-4 flex-1">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Roles</option>
                  <option value="admin">Admin</option>
                  <option value="manager">Manager</option>
                  <option value="employee">Employee</option>
                  <option value="viewer">Viewer</option>
                </select>
              </div>
              <button
                onClick={() => setShowUserForm(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add User
              </button>
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Department
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {isLoading ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-4 text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="mt-2 text-gray-600">Loading users...</p>
                      </td>
                    </tr>
                  ) : filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                        No users found
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user) => (
                      <motion.tr
                        key={user.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="hover:bg-gray-50"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                <span className="text-sm font-medium text-blue-600">
                                  {user.full_name?.charAt(0) || user.email?.charAt(0)}
                                </span>
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{user.full_name}</div>
                              <div className="text-sm text-gray-500">{user.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full border ${
                            roles.find(r => r.value === user.role)?.color || 'bg-gray-100 text-gray-800 border-gray-200'
                          }`}>
                            {roles.find(r => r.value === user.role)?.label || user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {user.department || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            user.status === 'active' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {user.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => startEdit(user)}
                              className="text-indigo-600 hover:text-indigo-900"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleToggleStatus(user.id, user.status)}
                              disabled={toggleStatusMutation.isLoading}
                              className={`${
                                user.status === 'active' 
                                  ? 'text-red-600 hover:text-red-900' 
                                  : 'text-green-600 hover:text-green-900'
                              }`}
                            >
                              {user.status === 'active' ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                            </button>
                            <button
                              onClick={() => handleDeleteUser(user.id)}
                              disabled={deleteUserMutation.isLoading}
                              className="text-red-600 hover:text-red-900"
                            >
                              <Trash className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* User Form Modal */}
          <AnimatePresence>
            {showUserForm && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
              >
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
                >
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold">
                      {editingUser ? 'Edit User' : 'Add New User'}
                    </h3>
                    <button
                      onClick={cancelEdit}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                  
                  <form onSubmit={editingUser ? handleUpdateUser : handleCreateUser} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                        <input
                          type="email"
                          value={userFormData.email}
                          onChange={(e) => setUserFormData({ ...userFormData, email: e.target.value })}
                          required
                          disabled={!!editingUser}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                        <div className="relative">
                                                     <input
                             type={showPassword ? 'text' : 'password'}
                             value={userFormData.password}
                             onChange={(e) => setUserFormData({ ...userFormData, password: e.target.value })}
                             required={!editingUser}
                             disabled={!!editingUser}
                             className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                             placeholder="Enter password (required for login)"
                           />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center"
                            disabled={!!editingUser}
                          >
                            {showPassword ? (
                              <EyeOff className="h-5 w-5 text-gray-400" />
                            ) : (
                              <Eye className="h-5 w-5 text-gray-400" />
                            )}
                          </button>
                        </div>
                        {userFormData.password && (
                          <div className="mt-1">
                            <span className={`text-xs ${getPasswordStrength(userFormData.password).color}`}>
                              {getPasswordStrength(userFormData.password).text}
                            </span>
                            <span className="text-xs text-gray-500 ml-2">
                              {userFormData.password.length < 6 ? 'Minimum 6 characters' : ''}
                            </span>
                          </div>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
                        <div className="relative">
                                                     <input
                             type={showPassword ? 'text' : 'password'}
                             value={userFormData.confirmPassword}
                             onChange={(e) => setUserFormData({ ...userFormData, confirmPassword: e.target.value })}
                             required={!editingUser}
                             disabled={!!editingUser}
                             className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                             placeholder="Confirm password (required)"
                           />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center"
                            disabled={!!editingUser}
                          >
                            {showPassword ? (
                              <EyeOff className="h-5 w-5 text-gray-400" />
                            ) : (
                              <Eye className="h-5 w-5 text-gray-400" />
                            )}
                          </button>
                        </div>
                        {userFormData.password && userFormData.confirmPassword && (
                          <div className="mt-1">
                            <span className={`text-xs ${userFormData.password === userFormData.confirmPassword ? 'text-green-500' : 'text-red-500'}`}>
                              {userFormData.password === userFormData.confirmPassword ? 'Passwords match' : 'Passwords do not match'}
                            </span>
                          </div>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                        <select
                          value={userFormData.role}
                          onChange={(e) => setUserFormData({ ...userFormData, role: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          {roles.map(role => (
                            <option key={role.value} value={role.value}>{role.label}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                        <select
                          value={userFormData.status}
                          onChange={(e) => setUserFormData({ ...userFormData, status: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                        </select>
                      </div>
                    </div>
                    
                                         <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
                       <p><strong>Note:</strong> This creates a user account with login credentials. Employee details (name, department, position, etc.) are managed separately in the Employee Records section.</p>
                       {!editingUser && (
                         <p className="mt-2 text-xs text-gray-500">
                           <strong>Password:</strong> Required for login access. Users can log in immediately with the provided password.
                         </p>
                       )}
                     </div>
                    
                    <div className="flex gap-2 pt-4">
                      <button
                        type="submit"
                        disabled={createUserMutation.isLoading || updateUserMutation.isLoading}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
                      >
                        <Save className="w-4 h-4" />
                        {createUserMutation.isLoading || updateUserMutation.isLoading 
                          ? 'Saving...' 
                          : (editingUser ? 'Update User' : 'Create User')
                        }
                      </button>
                      <button
                        type="button"
                        onClick={cancelEdit}
                        className="bg-gray-400 hover:bg-gray-500 text-white px-6 py-2 rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

const StatCard = ({ icon: Icon, title, value, subtitle, color }) => (
  <motion.div
    className="bg-white rounded-xl shadow border border-gray-200 p-6"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
  >
    <div className="flex items-center">
      <div className={`p-3 rounded-lg ${color} bg-opacity-10`}>
        <Icon className={`w-6 h-6 ${color.replace('bg-', 'text-')}`} />
      </div>
      <div className="ml-4">
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-xs text-gray-500">{subtitle}</p>
      </div>
    </div>
  </motion.div>
); 