import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  UserPlus, Users, Mail, Shield, Building2, 
  Briefcase, Phone, MapPin, Save, X, 
  CheckCircle, AlertCircle, Loader2, Eye, EyeOff,
  Download, Upload, FileText, Trash2, Edit
} from 'lucide-react';
import { supabase } from '../supabaseClient';
import UserCreationService from '../services/userCreationService';
import { useToast } from '../context/ToastContext';

export default function AdminUserManager() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: 'employee',
    full_name: '',
    department: 'Unassigned',
    position: 'Employee',
    phone: '',
    location: '',
    bio: '',
    emailConfirmed: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [bulkImportData, setBulkImportData] = useState('');
  const [showBulkImport, setShowBulkImport] = useState(false);

  const { success, error, warning } = useToast();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // Fetch users from employees table
      const { data: employees, error: employeeError } = await supabase
        .from('employees')
        .select('*')
        .order('created_at', { ascending: false });

      if (employeeError) {
        throw employeeError;
      }

      // Check which employees have auth accounts
      const usersWithAuthStatus = employees.map(employee => ({
        ...employee,
        hasAuthAccount: !!employee.auth_user_id,
        status: employee.auth_user_id ? 'Active' : 'No Auth Account'
      }));

      setUsers(usersWithAuthStatus);
    } catch (err) {
      console.error('Error fetching users:', err);
      error('Fetch Error', 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form data
    const validation = UserCreationService.validateUserData(formData);
    if (!validation.isValid) {
      error('Validation Error', validation.errors.join(', '));
      return;
    }

    try {
      setLoading(true);

      if (editingUser) {
        // Update existing user
        const { error: updateError } = await supabase
          .from('employees')
          .update({
            full_name: formData.full_name,
            role: formData.role,
            department: formData.department,
            position: formData.position,
            phone: formData.phone || null,
            location: formData.location || null,
            bio: formData.bio || null,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingUser.id);

        if (updateError) throw updateError;

        success('User Updated', 'User information updated successfully');
        setEditingUser(null);
      } else {
        // Create new user
        const result = await UserCreationService.createCompleteUser(formData);
        
        if (result.success) {
          success('User Created', result.data.message);
          setFormData({
            email: '',
            password: '',
            role: 'employee',
            full_name: '',
            department: 'Unassigned',
            position: 'Employee',
            phone: '',
            location: '',
            bio: '',
            emailConfirmed: false
          });
          setShowCreateForm(false);
        } else {
          error('Creation Failed', result.error);
          return;
        }
      }

      // Refresh user list
      await fetchUsers();
      
    } catch (err) {
      console.error('Error saving user:', err);
      error('Save Error', 'Failed to save user');
    } finally {
      setLoading(false);
    }
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setFormData({
      email: user.email,
      password: '', // Don't show password for editing
      role: user.role,
      full_name: user.full_name || '',
      department: user.department || 'Unassigned',
      position: user.position || 'Employee',
      phone: user.phone || '',
      location: user.location || '',
      bio: user.bio || '',
      emailConfirmed: !!user.auth_user_id
    });
    setShowCreateForm(true);
  };

  const handleCancelEdit = () => {
    setEditingUser(null);
    setFormData({
      email: '',
      password: '',
      role: 'employee',
      full_name: '',
      department: 'Unassigned',
      position: 'Employee',
      phone: '',
      location: '',
      bio: '',
      emailConfirmed: false
    });
    setShowCreateForm(false);
  };

  const handleCreateAuthAccount = async (user) => {
    try {
      setLoading(true);
      
      // Generate a temporary password
      const tempPassword = `Temp${Math.random().toString(36).substring(2, 8)}!`;
      
      const result = await UserCreationService.createAuthForExistingEmployee(
        user.email,
        tempPassword
      );

      if (result.success) {
        success('Auth Account Created', `Authentication account created for ${user.email}. Temporary password: ${tempPassword}`);
        await fetchUsers();
      } else {
        error('Creation Failed', result.error);
      }
    } catch (err) {
      console.error('Error creating auth account:', err);
      error('Creation Error', 'Failed to create authentication account');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkImport = async () => {
    try {
      setLoading(true);
      
      // Parse CSV data
      const lines = bulkImportData.trim().split('\n');
      const headers = lines[0].split(',').map(h => h.trim());
      const usersData = [];

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        const userData = {};
        
        headers.forEach((header, index) => {
          userData[header] = values[index] || '';
        });

        // Add default password if not provided
        if (!userData.password) {
          userData.password = `Temp${Math.random().toString(36).substring(2, 8)}!`;
        }

        usersData.push(userData);
      }

      // Create users
      const result = await UserCreationService.bulkCreateUsers(usersData);
      
      if (result.successful > 0) {
        success('Bulk Import', `Successfully created ${result.successful} users. ${result.failed} failed.`);
        setBulkImportData('');
        setShowBulkImport(false);
        await fetchUsers();
      } else {
        error('Bulk Import Failed', 'No users were created successfully');
      }

      if (result.errors.length > 0) {
        console.log('Bulk import errors:', result.errors);
      }

    } catch (err) {
      console.error('Error in bulk import:', err);
      error('Import Error', 'Failed to import users');
    } finally {
      setLoading(false);
    }
  };

  const exportUsers = () => {
    const csvContent = [
      ['Email', 'Role', 'Full Name', 'Department', 'Position', 'Phone', 'Location', 'Status', 'Created At'],
      ...users.map(user => [
        user.email,
        user.role,
        user.full_name || '',
        user.department || '',
        user.position || '',
        user.phone || '',
        user.location || '',
        user.status,
        new Date(user.created_at).toLocaleDateString()
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'users_export.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getRoleColor = (role) => {
    const colors = {
      admin: 'bg-red-100 text-red-800',
      hr_manager: 'bg-purple-100 text-purple-800',
      cs_manager: 'bg-blue-100 text-blue-800',
      driver_management: 'bg-green-100 text-green-800',
      employee: 'bg-gray-100 text-gray-800'
    };
    return colors[role] || colors.employee;
  };

  const getStatusColor = (status) => {
    if (status === 'Active') return 'bg-green-100 text-green-800';
    if (status === 'No Auth Account') return 'bg-yellow-100 text-yellow-800';
    return 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowBulkImport(true)}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center"
          >
            <Upload className="w-4 h-4 mr-2" />
            Bulk Import
          </button>
          <button
            onClick={exportUsers}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center"
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </button>
          <button
            onClick={() => setShowCreateForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Add User
          </button>
        </div>
      </div>

      {/* Create/Edit User Form */}
      {showCreateForm && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-lg p-6 mb-6"
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">
              {editingUser ? 'Edit User' : 'Create New User'}
            </h2>
            <button
              onClick={handleCancelEdit}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="user@udrive.ae"
                  required
                  disabled={!!editingUser}
                />
              </div>

              {!editingUser && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password *
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role *
                </label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="employee">Employee</option>
                  <option value="hr_manager">HR Manager</option>
                  <option value="cs_manager">CS Manager</option>
                  <option value="driver_management">Driver Management</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Department
                </label>
                <input
                  type="text"
                  name="department"
                  value={formData.department}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Department"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Position
                </label>
                <input
                  type="text"
                  name="position"
                  value={formData.position}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Position"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Full Name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Phone number"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location
                </label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Location"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bio
                </label>
                <input
                  type="text"
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Bio"
                />
              </div>
            </div>

            {!editingUser && (
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="emailConfirmed"
                  checked={formData.emailConfirmed}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label className="ml-2 text-sm text-gray-700">
                  Email already confirmed (skip confirmation email)
                </label>
              </div>
            )}

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={handleCancelEdit}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                {editingUser ? 'Update User' : 'Create User'}
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* Bulk Import Modal */}
      {showBulkImport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Bulk Import Users</h3>
              <button
                onClick={() => setShowBulkImport(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                Import users from CSV. Required columns: email, role, full_name. Optional: department, position, phone, location, bio
              </p>
              <textarea
                value={bulkImportData}
                onChange={(e) => setBulkImportData(e.target.value)}
                className="w-full h-64 p-3 border border-gray-300 rounded-lg font-mono text-sm"
                placeholder="email,role,full_name,department,position,phone,location,bio&#10;user1@udrive.ae,employee,John Doe,IT,Developer,+971501234567,Dubai,Software developer&#10;user2@udrive.ae,hr_manager,Jane Smith,HR,Manager,+971502345678,Abu Dhabi,HR Manager"
              />
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowBulkImport(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkImport}
                disabled={loading || !bulkImportData.trim()}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4 mr-2" />
                )}
                Import Users
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Users ({users.length})
          </h3>
        </div>

        {loading ? (
          <div className="p-6 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600" />
            <p className="mt-2 text-gray-600">Loading users...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
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
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <Users className="w-5 h-5 text-blue-600" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {user.full_name || user.email.split('@')[0]}
                          </div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(user.role)}`}>
                        {user.role.replace('_', ' ').toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user.department || 'Unassigned'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(user.status)}`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEditUser(user)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        
                        {!user.hasAuthAccount && (
                          <button
                            onClick={() => handleCreateAuthAccount(user)}
                            className="text-green-600 hover:text-green-900"
                            title="Create authentication account"
                          >
                            <UserPlus className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
