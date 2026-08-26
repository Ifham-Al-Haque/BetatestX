import React, { useState, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, Plus, Edit, Trash, Eye, EyeOff, Shield, 
  UserCheck, UserX, Mail, Phone, MapPin, Briefcase,
  Search, Save, X, Lock, Clock, Star, Cpu, Download,
  UserPlus, Activity
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
import { supabase } from '../supabaseClient';

import InvitationManager from '../components/InvitationManager';
import AdminPasswordReset from '../components/AdminPasswordReset';
import AdminStatCard from '../components/AdminStatCard';

const ITEMS_PER_PAGE = 15;

const TABS = [
  { id: 'users', label: 'Users', icon: Users },
  { id: 'invitations', label: 'Invitations', icon: UserPlus },
  { id: 'password-reset', label: 'Password Reset', icon: Lock },
];

export default function UserManagement() {
  const { role } = useAuth();
  const { success, error: showError } = useToast();
  
  const [showUserForm, setShowUserForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [showPassword, setShowPassword] = useState(false);
  const [viewMode, setViewMode] = useState('table');
  const [activeTab, setActiveTab] = useState('users');
  const [currentPage, setCurrentPage] = useState(1);
  
  const isAuthorizedAdmin = role === 'admin';
  
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
    { value: 'finance_viewer', label: 'Finance Viewer', color: 'bg-gradient-to-r from-teal-500 to-emerald-500', icon: Briefcase, bgColor: 'bg-teal-50', textColor: 'text-teal-700' },
    { value: 'it_management', label: 'IT Management', color: 'bg-gradient-to-r from-cyan-500 to-blue-500', icon: Briefcase, bgColor: 'bg-cyan-50', textColor: 'text-cyan-700' },
    { value: 'iot_management', label: 'IOT Management', color: 'bg-gradient-to-r from-cyan-500 to-teal-500', icon: Cpu, bgColor: 'bg-cyan-50', textColor: 'text-cyan-700' },
    { value: 'manager', label: 'Manager', color: 'bg-gradient-to-r from-blue-500 to-indigo-500', icon: Briefcase, bgColor: 'bg-blue-50', textColor: 'text-blue-700' },
    { value: 'driver_management', label: 'Driver Management', color: 'bg-gradient-to-r from-green-500 to-emerald-500', icon: MapPin, bgColor: 'bg-green-50', textColor: 'text-green-700' },
    { value: 'operation_management', label: 'Operation Management', color: 'bg-gradient-to-r from-teal-500 to-cyan-500', icon: MapPin, bgColor: 'bg-teal-50', textColor: 'text-teal-700' },
    { value: 'hr_manager', label: 'HR Manager', color: 'bg-gradient-to-r from-purple-500 to-violet-500', icon: Users, bgColor: 'bg-purple-50', textColor: 'text-purple-700' },
    { value: 'cs_manager', label: 'CS Manager', color: 'bg-gradient-to-r from-indigo-500 to-blue-500', icon: Phone, bgColor: 'bg-indigo-50', textColor: 'text-indigo-700' },
    { value: 'marketing_manager', label: 'Marketing Manager', color: 'bg-gradient-to-r from-pink-500 to-rose-500', icon: Star, bgColor: 'bg-pink-50', textColor: 'text-pink-700' },
    { value: 'marketing_specialist', label: 'Marketing Specialist', color: 'bg-gradient-to-r from-purple-500 to-pink-500', icon: Star, bgColor: 'bg-purple-50', textColor: 'text-purple-700' },
    { value: 'marketing_management', label: 'Marketing Management', color: 'bg-gradient-to-r from-indigo-500 to-purple-500', icon: Star, bgColor: 'bg-indigo-50', textColor: 'text-indigo-700' },
    { value: 'subscribe_now', label: 'Subscribe Now', color: 'bg-gradient-to-r from-emerald-500 to-teal-500', icon: Users, bgColor: 'bg-emerald-50', textColor: 'text-emerald-700' },
    { value: 'employee', label: 'Employee', color: 'bg-gradient-to-r from-gray-500 to-slate-500', icon: UserCheck, bgColor: 'bg-gray-50', textColor: 'text-gray-700' },
    { value: 'viewer', label: 'Viewer', color: 'bg-gradient-to-r from-orange-500 to-amber-500', icon: Eye, bgColor: 'bg-orange-50', textColor: 'text-orange-700' }
  ];

  const handleCreateUser = useCallback(async (e) => {
    e.preventDefault();

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
      // If authorized admin is trying to reset password
      if (isAuthorizedAdmin && userFormData.password && userFormData.password === userFormData.confirmPassword) {
        // Validate password strength
        if (userFormData.password.length < 6) {
          showError("Error", "Password must be at least 6 characters long");
          return;
        }
        
        // Send password reset email using Supabase Auth
        try {
          const { error: resetError } = await supabase.auth.resetPasswordForEmail(
            editingUser.email,
            {
              redirectTo: `${window.location.origin}/reset-password`,
            }
          );
          
          if (resetError) {
            throw resetError;
          }
          
          success(
            "Password Reset Initiated",
            `A password reset link has been sent to ${editingUser.email}. Ask the user to open that email and choose their own password.`
          );
        } catch (resetErr) {
          console.error('Password reset error:', resetErr);
          success(
            "Password Reset Instructions",
            `To reset the password for ${editingUser.email}, use Authentication → Users in the Supabase dashboard, or send a reset email from this page.`
          );
        }
        
        // Continue with regular update
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
        return;
      }
      
      // Regular update (no password change)
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
  }, [userFormData, editingUser, updateUserMutation, success, showError, isAuthorizedAdmin]);

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

  const filteredUsers = useMemo(() => users.filter(user => {
    const q = searchTerm.toLowerCase();
    const matchesSearch = user.full_name?.toLowerCase().includes(q) ||
                         user.email?.toLowerCase().includes(q) ||
                         user.department?.toLowerCase().includes(q);
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return matchesSearch && matchesStatus && matchesRole;
  }), [users, searchTerm, statusFilter, roleFilter]);

  const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const exportUsers = useCallback(() => {
    const headers = ['Email', 'Full Name', 'Role', 'Status', 'Last Login', 'Created'];
    const rows = filteredUsers.map(u => [
      u.email,
      u.full_name || '',
      u.role,
      u.status,
      u.last_login ? new Date(u.last_login).toLocaleString() : 'Never',
      u.created_at ? new Date(u.created_at).toLocaleDateString() : '',
    ]);
    const csv = [headers, ...rows]
      .map(row => row.map(f => `"${String(f).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'uhub_users.csv';
    a.click();
    window.URL.revokeObjectURL(url);
    success('Exported', `${filteredUsers.length} users exported to CSV`);
  }, [filteredUsers, success]);

  const formatLastLogin = (date) => {
    if (!date) return 'Never';
    const d = new Date(date);
    const diff = Date.now() - d.getTime();
    if (diff < 86400000) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (diff < 604800000) return d.toLocaleDateString([], { weekday: 'short' });
    return d.toLocaleDateString();
  };

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <h3 className="text-red-800 font-medium">Error Loading Users</h3>
        <p className="text-red-600 mt-1">{error.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminStatCard icon={Users} title="Total Users" value={users.length} subtitle="All UHub accounts" accentColor="#3b82f6" iconBg="rgba(59,130,246,0.12)" delay={0.05} />
        <AdminStatCard icon={UserCheck} title="Active Users" value={users.filter(u => u.status === 'active').length} subtitle="Currently active" accentColor="#22c55e" iconBg="rgba(34,197,94,0.12)" delay={0.1} />
        <AdminStatCard icon={Shield} title="Admins" value={users.filter(u => u.role === 'admin').length} subtitle="Administrators" accentColor="#ef4444" iconBg="rgba(239,68,68,0.12)" delay={0.15} />
        <AdminStatCard icon={UserX} title="Inactive" value={users.filter(u => u.status === 'inactive' || u.status === 'suspended').length} subtitle="Deactivated / suspended" accentColor="#f59e0b" iconBg="rgba(245,158,11,0.12)" delay={0.2} />
      </div>

      {/* Tab navigation */}
      <div
        className="flex flex-wrap gap-1 p-1 rounded-xl"
        style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-primary)' }}
      >
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200"
            style={{
              background: activeTab === id ? 'var(--card-bg)' : 'transparent',
              color: activeTab === id ? 'var(--text-primary)' : 'var(--text-muted)',
              boxShadow: activeTab === id ? 'var(--shadow-sm)' : 'none',
            }}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
        <Link
          to="/admin/dashboard"
          className="ml-auto flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
          style={{ color: 'var(--text-muted)' }}
        >
          <Activity className="w-4 h-4" />
          Activity Logs
        </Link>
      </div>

      {activeTab === 'invitations' && <InvitationManager embedded />}
      {activeTab === 'password-reset' && <AdminPasswordReset embedded />}

      {activeTab === 'users' && <>
      {/* Controls */}
      <motion.div
        className="rounded-2xl p-5"
        style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', boxShadow: 'var(--shadow-sm)' }}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
          <div className="flex flex-col lg:flex-row gap-3 flex-1 w-full">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Search by name, email, or department..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)' }}
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              className="px-3 py-2.5 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)' }}
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
              <option value="pending">Pending</option>
            </select>
            <select
              value={roleFilter}
              onChange={(e) => { setRoleFilter(e.target.value); setCurrentPage(1); }}
              className="px-3 py-2.5 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)' }}
            >
              <option value="all">All Roles</option>
              {roles.map(role => (
                <option key={role.value} value={role.value}>{role.label}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex rounded-lg p-0.5" style={{ background: 'var(--bg-tertiary)' }}>
              {['table', 'grid'].map(mode => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className="px-3 py-1.5 rounded-md text-sm font-medium capitalize transition-all"
                  style={{
                    background: viewMode === mode ? 'var(--card-bg)' : 'transparent',
                    color: viewMode === mode ? 'var(--text-primary)' : 'var(--text-muted)',
                    boxShadow: viewMode === mode ? 'var(--shadow-sm)' : 'none',
                  }}
                >
                  {mode}
                </button>
              ))}
            </div>
            <button
              onClick={exportUsers}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
              style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)' }}
            >
              <Download className="w-4 h-4" />
              Export
            </button>
            <button
              onClick={() => setShowUserForm(true)}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-5 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 shadow-md"
            >
              <Plus className="w-4 h-4" />
              Add User
            </button>
          </div>
        </div>
      </motion.div>

      {/* Users display */}
      <motion.div
        className="rounded-2xl overflow-hidden"
        style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', boxShadow: 'var(--shadow-sm)' }}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
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
              <thead style={{ background: 'var(--bg-tertiary)' }}>
                <tr>
                  {['User', 'Role', 'Status', 'Last Login', 'Actions'].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginatedUsers.map((user, index) => (
                  <motion.tr
                    key={user.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.03 }}
                    className="transition-colors"
                    style={{ borderBottom: '1px solid var(--border-primary)' }}
                  >
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                          {user.full_name?.charAt(0) || user.email?.charAt(0)}
                        </div>
                        <div>
                          <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{user.full_name || 'Unnamed User'}</div>
                          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      {(() => {
                        const role = roles.find(r => r.value === user.role);
                        const Icon = role?.icon || Users;
                        return (
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${role?.bgColor} ${role?.textColor}`}>
                            <Icon className="w-3 h-3 mr-1" />
                            {role?.label || user.role}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <StatusBadge status={user.status} />
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-sm" style={{ color: 'var(--text-muted)' }}>
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        {formatLastLogin(user.last_login)}
                      </div>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <button onClick={() => startEdit(user)} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Edit">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(user.id, user.status)}
                          disabled={toggleStatusMutation.isLoading}
                          className={`p-2 rounded-lg transition-colors ${user.status === 'active' ? 'text-red-600 hover:bg-red-50' : 'text-green-600 hover:bg-green-50'}`}
                          title={user.status === 'active' ? 'Deactivate' : 'Activate'}
                        >
                          {user.status === 'active' ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                        </button>
                        <button onClick={() => handleDeleteUser(user.id)} disabled={deleteUserMutation.isLoading} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
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
          <div className="p-5">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {paginatedUsers.map((user, index) => (
                <motion.div
                  key={user.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="rounded-xl p-4 transition-all duration-200 hover:-translate-y-0.5"
                  style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-primary)' }}
                >
                  <div className="flex items-center mb-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold mr-3">
                      {user.full_name?.charAt(0) || user.email?.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm truncate" style={{ color: 'var(--text-primary)' }}>{user.full_name || 'Unnamed User'}</h3>
                      <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{user.email}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between flex-wrap gap-1">
                      {(() => {
                        const role = roles.find(r => r.value === user.role);
                        const Icon = role?.icon || Users;
                        return (
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${role?.bgColor} ${role?.textColor}`}>
                            <Icon className="w-3 h-3 mr-1" />
                            {role?.label || user.role}
                          </span>
                        );
                      })()}
                      <StatusBadge status={user.status} />
                    </div>
                    <p className="text-xs flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                      <Clock className="w-3 h-3" />
                      Last login: {formatLastLogin(user.last_login)}
                    </p>
                    <div className="flex gap-2 pt-1">
                      <button onClick={() => startEdit(user)} className="flex-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-3 py-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1">
                        <Edit className="w-3 h-3" /> Edit
                      </button>
                      <button
                        onClick={() => handleToggleStatus(user.id, user.status)}
                        disabled={toggleStatusMutation.isLoading}
                        className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1 ${user.status === 'active' ? 'bg-red-50 hover:bg-red-100 text-red-700' : 'bg-green-50 hover:bg-green-100 text-green-700'}`}
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

        {filteredUsers.length > 0 && totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-4 border-t" style={{ borderColor: 'var(--border-primary)' }}>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              {(currentPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, filteredUsers.length)} of {filteredUsers.length}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 text-sm rounded-lg disabled:opacity-40"
                style={{ background: 'var(--bg-tertiary)', color: 'var(--text-primary)', border: '1px solid var(--border-primary)' }}
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 text-sm rounded-lg disabled:opacity-40"
                style={{ background: 'var(--bg-tertiary)', color: 'var(--text-primary)', border: '1px solid var(--border-primary)' }}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </motion.div>
      </>}

      {/* User form modal */}
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
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Password
                        {editingUser && isAuthorizedAdmin && (
                          <span className="text-xs text-blue-600 font-normal ml-2">(Admin can reset)</span>
                        )}
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={userFormData.password}
                          onChange={(e) => setUserFormData({ ...userFormData, password: e.target.value })}
                          required={!editingUser}
                          disabled={!!editingUser && !isAuthorizedAdmin}
                          className="w-full pl-10 pr-12 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-50 transition-all duration-200"
                          placeholder={editingUser && isAuthorizedAdmin ? "Enter new password to reset" : "Enter password (required for login)"}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center"
                          disabled={!!editingUser && !isAuthorizedAdmin}
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
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Confirm Password
                        {editingUser && isAuthorizedAdmin && (
                          <span className="text-xs text-blue-600 font-normal ml-2">(Admin can reset)</span>
                        )}
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={userFormData.confirmPassword}
                          onChange={(e) => setUserFormData({ ...userFormData, confirmPassword: e.target.value })}
                          required={!editingUser || (editingUser && isAuthorizedAdmin && userFormData.password)}
                          disabled={!!editingUser && !isAuthorizedAdmin}
                          className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-50 transition-all duration-200"
                          placeholder={editingUser && isAuthorizedAdmin ? "Confirm new password" : "Confirm password (required)"}
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
                          <option key={role.value} value={role.value}>
                            {role.label}
                          </option>
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
                        <option value="suspended">Suspended</option>
                        <option value="pending">Pending</option>
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

function StatusBadge({ status }) {
  const styles = {
    active: 'bg-green-100 text-green-800',
    inactive: 'bg-red-100 text-red-800',
    suspended: 'bg-orange-100 text-orange-800',
    pending: 'bg-yellow-100 text-yellow-800',
  };
  const dots = {
    active: 'bg-green-400',
    inactive: 'bg-red-400',
    suspended: 'bg-orange-400',
    pending: 'bg-yellow-400',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${dots[status] || 'bg-gray-400'}`} />
      {status}
    </span>
  );
}