import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, Shield, Key, UserPlus, UserMinus, Settings, 
  CheckCircle, XCircle, Clock, AlertTriangle, Search,
  Filter, Plus, Edit, Trash, Eye, EyeOff, Lock, Unlock
} from 'lucide-react';
import { supabase } from '../supabaseClient';
import Sidebar from '../components/Sidebar';
import UserDropdown from '../components/UserDropdown';
import DarkModeToggle from '../components/DarkModeToggle';

export default function AccessManagement() {
  const [users, setUsers] = useState([]);
  const [accessRequests, setAccessRequests] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showUserForm, setShowUserForm] = useState(false);
  const [showRoleForm, setShowRoleForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editingRole, setEditingRole] = useState(null);

  const [userFormData, setUserFormData] = useState({
    email: '',
    full_name: '',
    role: '',
    department: '',
    permissions: []
  });

  const [roleFormData, setRoleFormData] = useState({
    name: '',
    description: '',
    permissions: []
  });

  const availablePermissions = [
    { id: 'dashboard_view', name: 'Dashboard View', description: 'View dashboard and analytics' },
    { id: 'employees_manage', name: 'Employees Management', description: 'Manage employee records' },
    { id: 'assets_manage', name: 'Assets Management', description: 'Manage IT assets' },
    { id: 'expenses_view', name: 'Expenses View', description: 'View expense reports' },
    { id: 'expenses_manage', name: 'Expenses Management', description: 'Manage and approve expenses' },
    { id: 'attendance_view', name: 'Attendance View', description: 'View attendance records' },
    { id: 'attendance_manage', name: 'Attendance Management', description: 'Manage attendance data' },
    { id: 'tickets_view', name: 'Tickets View', description: 'View support tickets' },
    { id: 'tickets_manage', name: 'Tickets Management', description: 'Manage support tickets' },
    { id: 'access_manage', name: 'Access Management', description: 'Manage user access and roles' },
    { id: 'admin_panel', name: 'Admin Panel', description: 'Full administrative access' }
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchUsers(),
        fetchAccessRequests(),
        fetchRoles()
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error) {
      setUsers(data || []);
    }
  };

  const fetchAccessRequests = async () => {
    const { data, error } = await supabase
      .from('access_requests')
      .select(`
        *,
        users (full_name, email)
      `)
      .order('created_at', { ascending: false });

    if (!error) {
      setAccessRequests(data || []);
    }
  };

  const fetchRoles = async () => {
    const { data, error } = await supabase
      .from('roles')
      .select('*')
      .order('name');

    if (!error) {
      setRoles(data || []);
    }
  };

  const handleUserSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingUser) {
        const { error } = await supabase
          .from('users')
          .update({
            full_name: userFormData.full_name,
            role: userFormData.role,
            department: userFormData.department,
            permissions: userFormData.permissions,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingUser.id);

        if (error) throw error;
      } else {
        // Create new user
        const { error } = await supabase.auth.admin.createUser({
          email: userFormData.email,
          password: 'temporary123', // Should be changed on first login
          user_metadata: {
            full_name: userFormData.full_name,
            role: userFormData.role,
            department: userFormData.department
          }
        });

        if (error) throw error;

        // Add to users table
        const { error: profileError } = await supabase
          .from('users')
          .insert({
            email: userFormData.email,
            full_name: userFormData.full_name,
            role: userFormData.role,
            department: userFormData.department,
            permissions: userFormData.permissions
          });

        if (profileError) throw profileError;
      }

      setShowUserForm(false);
      setEditingUser(null);
      fetchUsers();
      alert(editingUser ? 'User updated successfully!' : 'User created successfully!');
    } catch (error) {
      console.error('Error saving user:', error);
      alert('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingRole) {
        const { error } = await supabase
          .from('roles')
          .update({
            name: roleFormData.name,
            description: roleFormData.description,
            permissions: roleFormData.permissions,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingRole.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('roles')
          .insert({
            name: roleFormData.name,
            description: roleFormData.description,
            permissions: roleFormData.permissions
          });

        if (error) throw error;
      }

      setShowRoleForm(false);
      setEditingRole(null);
      fetchRoles();
      alert(editingRole ? 'Role updated successfully!' : 'Role created successfully!');
    } catch (error) {
      console.error('Error saving role:', error);
      alert('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAccessRequest = async (requestId, status) => {
    try {
      const { error } = await supabase
        .from('access_requests')
        .update({
          status: status,
          processed_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (error) throw error;

      fetchAccessRequests();
      alert(`Access request ${status}!`);
    } catch (error) {
      console.error('Error processing request:', error);
      alert('Error: ' + error.message);
    }
  };

  const toggleUserStatus = async (userId, currentStatus) => {
    try {
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
      const { error } = await supabase
        .from('users')
        .update({ status: newStatus })
        .eq('id', userId);

      if (error) throw error;

      fetchUsers();
      alert(`User ${newStatus}!`);
    } catch (error) {
      console.error('Error updating user status:', error);
      alert('Error: ' + error.message);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      user.email?.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter ? user.role === roleFilter : true;
    const matchesStatus = statusFilter ? user.status === statusFilter : true;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const filteredRequests = accessRequests.filter(request => {
    const matchesSearch = 
      request.users?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      request.users?.email?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter ? request.status === statusFilter : true;
    return matchesSearch && matchesStatus;
  });

  const StatCard = ({ icon: Icon, title, value, subtitle, color }) => (
    <motion.div
      className="bg-white p-6 rounded-xl shadow border border-gray-200 hover:shadow-lg transition-shadow"
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className={`text-2xl font-bold ${color}`}>{value}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-full ${color.replace('text-', 'bg-').replace('-600', '-100')}`}>
          <Icon className={`w-6 h-6 ${color}`} />
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen font-sans" style={{ background: "linear-gradient(135deg, #f8fafc 0%, #e0e7ef 100%)" }}>
      <div className="flex">
        <Sidebar />
        <main className="flex-1 ml-64 p-10">
          {/* Header */}
          <div className="flex justify-between items-center mb-10">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Shield className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <h1 className="text-4xl font-bold tracking-tight">Access Management</h1>
                <p className="text-gray-600">Manage user roles, permissions, and access requests</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <DarkModeToggle />
              <UserDropdown />
            </div>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
              icon={Users}
              title="Total Users"
              value={users.length}
              subtitle="Active accounts"
              color="text-blue-600"
            />
            <StatCard
              icon={Clock}
              title="Pending Requests"
              value={accessRequests.filter(r => r.status === 'pending').length}
              subtitle="Awaiting approval"
              color="text-yellow-600"
            />
            <StatCard
              icon={Shield}
              title="Active Roles"
              value={roles.length}
              subtitle="Role definitions"
              color="text-green-600"
            />
            <StatCard
              icon={AlertTriangle}
              title="Inactive Users"
              value={users.filter(u => u.status === 'inactive').length}
              subtitle="Suspended accounts"
              color="text-red-600"
            />
          </div>

          {/* Controls */}
          <div className="bg-white rounded-xl shadow border border-gray-200 p-6 mb-8">
            <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
              <div className="flex flex-col sm:flex-row gap-4 flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search users or requests..."
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <select
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  onChange={(e) => setRoleFilter(e.target.value)}
                >
                  <option value="">All Roles</option>
                  {roles.map(role => (
                    <option key={role.id} value={role.name}>{role.name}</option>
                  ))}
                </select>
                <select
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setEditingUser(null);
                    setUserFormData({
                      email: '',
                      full_name: '',
                      role: '',
                      department: '',
                      permissions: []
                    });
                    setShowUserForm(true);
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                >
                  <UserPlus className="w-4 h-4" />
                  Add User
                </button>
                <button
                  onClick={() => {
                    setEditingRole(null);
                    setRoleFormData({
                      name: '',
                      description: '',
                      permissions: []
                    });
                    setShowRoleForm(true);
                  }}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Role
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Users Section */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Users</h2>
              <div className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredUsers.map(user => (
                        <tr key={user.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <div>
                              <div className="font-medium text-gray-900">{user.full_name}</div>
                              <div className="text-sm text-gray-500">{user.email}</div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                              {user.role || 'No Role'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              user.status === 'active' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {user.status || 'active'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  setEditingUser(user);
                                  setUserFormData({
                                    email: user.email || '',
                                    full_name: user.full_name || '',
                                    role: user.role || '',
                                    department: user.department || '',
                                    permissions: user.permissions || []
                                  });
                                  setShowUserForm(true);
                                }}
                                className="text-blue-600 hover:text-blue-700"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => toggleUserStatus(user.id, user.status)}
                                className={user.status === 'active' ? 'text-red-600 hover:text-red-700' : 'text-green-600 hover:text-green-700'}
                              >
                                {user.status === 'active' ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Access Requests Section */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Access Requests</h2>
              <div className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Request</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredRequests.map(request => (
                        <tr key={request.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <div>
                              <div className="font-medium text-gray-900">{request.users?.full_name}</div>
                              <div className="text-sm text-gray-500">{request.users?.email}</div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-sm text-gray-900">{request.request_type}</div>
                            <div className="text-xs text-gray-500">{request.description}</div>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              request.status === 'approved' 
                                ? 'bg-green-100 text-green-800'
                                : request.status === 'rejected'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {request.status}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            {request.status === 'pending' && (
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleAccessRequest(request.id, 'approved')}
                                  className="text-green-600 hover:text-green-700"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleAccessRequest(request.id, 'rejected')}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <XCircle className="w-4 h-4" />
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          {/* Roles Section */}
          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-4">Roles & Permissions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {roles.map(role => (
                <motion.div
                  key={role.id}
                  className="bg-white rounded-xl shadow border border-gray-200 p-6"
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-800">{role.name}</h3>
                    <button
                      onClick={() => {
                        setEditingRole(role);
                        setRoleFormData({
                          name: role.name,
                          description: role.description,
                          permissions: role.permissions || []
                        });
                        setShowRoleForm(true);
                      }}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">{role.description}</p>
                  <div className="space-y-2">
                    <h4 className="text-xs font-medium text-gray-500 uppercase">Permissions:</h4>
                    <div className="flex flex-wrap gap-1">
                      {(role.permissions || []).map(permission => (
                        <span
                          key={permission}
                          className="inline-flex px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full"
                        >
                          {availablePermissions.find(p => p.id === permission)?.name || permission}
                        </span>
                      ))}
                    </div>
                  </div>
                </motion.div>
              ))}
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
                  <h3 className="text-lg font-semibold mb-4">
                    {editingUser ? 'Edit User' : 'Add New User'}
                  </h3>
                  <form onSubmit={handleUserSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                        <input
                          type="email"
                          value={userFormData.email}
                          onChange={(e) => setUserFormData({ ...userFormData, email: e.target.value })}
                          disabled={!!editingUser}
                          required
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                        <input
                          type="text"
                          value={userFormData.full_name}
                          onChange={(e) => setUserFormData({ ...userFormData, full_name: e.target.value })}
                          required
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                        <select
                          value={userFormData.role}
                          onChange={(e) => setUserFormData({ ...userFormData, role: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="">Select Role</option>
                          {roles.map(role => (
                            <option key={role.id} value={role.name}>{role.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
                        <input
                          type="text"
                          value={userFormData.department}
                          onChange={(e) => setUserFormData({ ...userFormData, department: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Permissions</label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                        {availablePermissions.map(permission => (
                          <label key={permission.id} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={userFormData.permissions.includes(permission.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setUserFormData({
                                    ...userFormData,
                                    permissions: [...userFormData.permissions, permission.id]
                                  });
                                } else {
                                  setUserFormData({
                                    ...userFormData,
                                    permissions: userFormData.permissions.filter(p => p !== permission.id)
                                  });
                                }
                              }}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700">{permission.name}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="submit"
                        disabled={loading}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex-1 disabled:opacity-50"
                      >
                        {loading ? 'Saving...' : (editingUser ? 'Update User' : 'Create User')}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowUserForm(false)}
                        className="bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Role Form Modal */}
          <AnimatePresence>
            {showRoleForm && (
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
                  <h3 className="text-lg font-semibold mb-4">
                    {editingRole ? 'Edit Role' : 'Add New Role'}
                  </h3>
                  <form onSubmit={handleRoleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Role Name</label>
                      <input
                        type="text"
                        value={roleFormData.name}
                        onChange={(e) => setRoleFormData({ ...roleFormData, name: e.target.value })}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                      <textarea
                        value={roleFormData.description}
                        onChange={(e) => setRoleFormData({ ...roleFormData, description: e.target.value })}
                        rows={3}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Permissions</label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                        {availablePermissions.map(permission => (
                          <label key={permission.id} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={roleFormData.permissions.includes(permission.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setRoleFormData({
                                    ...roleFormData,
                                    permissions: [...roleFormData.permissions, permission.id]
                                  });
                                } else {
                                  setRoleFormData({
                                    ...roleFormData,
                                    permissions: roleFormData.permissions.filter(p => p !== permission.id)
                                  });
                                }
                              }}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <div>
                              <span className="text-sm text-gray-700">{permission.name}</span>
                              <p className="text-xs text-gray-500">{permission.description}</p>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="submit"
                        disabled={loading}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors flex-1 disabled:opacity-50"
                      >
                        {loading ? 'Saving...' : (editingRole ? 'Update Role' : 'Create Role')}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowRoleForm(false)}
                        className="bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded-lg transition-colors"
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