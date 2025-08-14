import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, UserCheck, UserX, Edit, Save, X, AlertCircle } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { useToast } from '../context/ToastContext';

const RoleManager = ({ user, onRoleUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [selectedRole, setSelectedRole] = useState(user?.role || 'employee');
  const [loading, setLoading] = useState(false);
  const { success, error: showError } = useToast();

  const roles = [
    { 
      value: 'admin', 
      label: 'Admin', 
      description: 'Full system access',
      color: 'bg-red-100 text-red-800 border-red-200',
      permissions: ['All operations', 'User management', 'System settings']
    },
    { 
      value: 'manager', 
      label: 'Manager', 
      description: 'Department management',
      color: 'bg-blue-100 text-blue-800 border-blue-200',
      permissions: ['Create/Edit drivers', 'View all data', 'Team management']
    },
    { 
      value: 'employee', 
      label: 'Employee', 
      description: 'Standard user access',
      color: 'bg-green-100 text-green-800 border-green-200',
      permissions: ['View drivers', 'Basic operations', 'Personal data']
    },
    { 
      value: 'viewer', 
      label: 'Viewer', 
      description: 'Read-only access',
      color: 'bg-gray-100 text-gray-800 border-gray-200',
      permissions: ['View only', 'No modifications', 'Limited access']
    }
  ];

  const currentRole = roles.find(r => r.value === user?.role);

  const handleRoleUpdate = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('employees')
        .update({ role: selectedRole })
        .eq('id', user.id);

      if (error) throw error;

      success('Success', 'User role updated successfully!');
      setIsEditing(false);
      if (onRoleUpdate) {
        onRoleUpdate(selectedRole);
      }
    } catch (err) {
      showError('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setSelectedRole(user?.role || 'employee');
    setIsEditing(false);
  };

  if (!user) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow border border-gray-200 p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Shield className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Role Management</h3>
            <p className="text-sm text-gray-600">Manage user roles and permissions</p>
          </div>
        </div>
        
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <Edit className="w-4 h-4" />
            Change Role
          </button>
        )}
      </div>

      <div className="space-y-4">
        {/* Current Role Display */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">Current Role</h4>
              <p className="text-sm text-gray-600">{currentRole?.description}</p>
            </div>
            <span className={`px-3 py-1 text-sm font-semibold rounded-full border ${currentRole?.color}`}>
              {currentRole?.label}
            </span>
          </div>
          
          <div className="mt-3">
            <h5 className="text-sm font-medium text-gray-700 mb-2">Permissions:</h5>
            <ul className="space-y-1">
              {currentRole?.permissions.map((permission, index) => (
                <li key={index} className="flex items-center gap-2 text-sm text-gray-600">
                  <UserCheck className="w-4 h-4 text-green-500" />
                  {permission}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Role Selection (when editing) */}
        {isEditing && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-4"
          >
            <div className="border-t pt-4">
              <h4 className="font-medium text-gray-900 mb-3">Select New Role</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {roles.map((role) => (
                  <label
                    key={role.value}
                    className={`relative flex items-start p-3 border rounded-lg cursor-pointer transition-all ${
                      selectedRole === role.value
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="role"
                      value={role.value}
                      checked={selectedRole === role.value}
                      onChange={(e) => setSelectedRole(e.target.value)}
                      className="sr-only"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full border ${role.color}`}>
                          {role.label}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{role.description}</p>
                      <ul className="space-y-1">
                        {role.permissions.map((permission, index) => (
                          <li key={index} className="flex items-center gap-2 text-xs text-gray-500">
                            <UserCheck className="w-3 h-3 text-green-500" />
                            {permission}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t">
              <button
                onClick={handleRoleUpdate}
                disabled={loading || selectedRole === user?.role}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Save className="w-4 h-4" />
                {loading ? 'Updating...' : 'Update Role'}
              </button>
              <button
                onClick={handleCancel}
                className="px-4 py-2 text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        )}
      </div>

      {/* Warning for Admin Role */}
      {selectedRole === 'admin' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg"
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-yellow-600" />
            <span className="text-sm text-yellow-800">
              <strong>Warning:</strong> Admin role provides full system access. Use with caution.
            </span>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default RoleManager;
