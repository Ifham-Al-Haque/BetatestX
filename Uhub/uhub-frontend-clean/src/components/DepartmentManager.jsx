import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit, Trash, Save, X, Building } from 'lucide-react';
import { DEPARTMENTS } from '../config/departments';

const DepartmentManager = ({ onDepartmentsChange, isOpen, onClose }) => {
  const [departments, setDepartments] = useState([...DEPARTMENTS]);
  const [editingId, setEditingId] = useState(null);
  const [newDepartment, setNewDepartment] = useState({ value: '', label: '', color: 'gray' });

  const colors = [
    'blue', 'green', 'purple', 'emerald', 'pink', 'orange', 'indigo', 
    'cyan', 'amber', 'violet', 'red', 'teal', 'slate', 'zinc', 'gray'
  ];

  const handleAddDepartment = () => {
    if (newDepartment.value && newDepartment.label) {
      const department = {
        ...newDepartment,
        value: newDepartment.value.replace(/\s+/g, '_').toUpperCase()
      };
      
      setDepartments([...departments, department]);
      setNewDepartment({ value: '', label: '', color: 'gray' });
      
      if (onDepartmentsChange) {
        onDepartmentsChange([...departments, department]);
      }
    }
  };

  const handleEditDepartment = (id) => {
    setEditingId(id);
  };

  const handleSaveEdit = (id) => {
    const updatedDepartments = departments.map(dept => 
      dept.value === id ? { ...dept, ...editingId } : dept
    );
    setDepartments(updatedDepartments);
    setEditingId(null);
    
    if (onDepartmentsChange) {
      onDepartmentsChange(updatedDepartments);
    }
  };

  const handleDeleteDepartment = (value) => {
    if (window.confirm(`Are you sure you want to delete the department "${value}"?`)) {
      const updatedDepartments = departments.filter(dept => dept.value !== value);
      setDepartments(updatedDepartments);
      
      if (onDepartmentsChange) {
        onDepartmentsChange(updatedDepartments);
      }
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
                <Building className="w-6 h-6 mr-2 text-blue-600" />
                Department Management
              </h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Manage departments for SIM cards, employees, and other company resources
            </p>
          </div>

          <div className="p-6">
            {/* Add New Department */}
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Add New Department
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Department Value
                  </label>
                  <input
                    type="text"
                    value={newDepartment.value}
                    onChange={(e) => setNewDepartment({ ...newDepartment, value: e.target.value })}
                    placeholder="e.g., CUSTOMER_SERVICE"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-600 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Display Label
                  </label>
                  <input
                    type="text"
                    value={newDepartment.label}
                    onChange={(e) => setNewDepartment({ ...newDepartment, label: e.target.value })}
                    placeholder="e.g., Customer Service"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-600 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Color Theme
                  </label>
                  <select
                    value={newDepartment.color}
                    onChange={(e) => setNewDepartment({ ...newDepartment, color: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-600 dark:text-white"
                  >
                    {colors.map(color => (
                      <option key={color} value={color} className="capitalize">
                        {color}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <button
                onClick={handleAddDepartment}
                disabled={!newDepartment.value || !newDepartment.label}
                className="mt-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Department
              </button>
            </div>

            {/* Existing Departments */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Existing Departments ({departments.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {departments.map((dept) => (
                  <div
                    key={dept.value}
                    className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-4"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-${dept.color}-100 dark:bg-${dept.color}-900 text-${dept.color}-800 dark:text-${dept.color}-200`}>
                        {dept.label}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEditDepartment(dept.value)}
                          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteDepartment(dept.value)}
                          className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                        >
                          <Trash className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      <p><strong>Value:</strong> {dept.value}</p>
                      <p><strong>Color:</strong> <span className="capitalize">{dept.color}</span></p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
            <div className="flex justify-end gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default DepartmentManager;
