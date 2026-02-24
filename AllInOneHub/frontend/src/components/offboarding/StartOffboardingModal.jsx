import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, User, Calendar, Users, FileText, CheckCircle, 
  AlertCircle, Building, Mail, Phone, ChevronDown
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import onboardingOffboardingApi from '../../services/onboardingOffboardingApi';

export default function StartOffboardingModal({ onClose, onStart }) {
  const { userProfile } = useAuth();
  const { error: showError } = useToast();
  
  const [employees, setEmployees] = useState([]);
  const [managers, setManagers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    employee_id: '',
    last_working_date: '',
    termination_date: '',
    reason_for_leaving: '',
    reason_details: '',
    hr_contact: userProfile?.id || '',
    department_manager: '',
    handover_to: '',
    notes: '',
    assigned_to: '',
    due_date: ''
  });
  const [errors, setErrors] = useState({});
  const [searchTerm, setSearchTerm] = useState('');

  const reasonOptions = [
    { value: 'resignation', label: 'Resignation' },
    { value: 'termination', label: 'Termination' },
    { value: 'retirement', label: 'Retirement' },
    { value: 'contract_end', label: 'Contract End' },
    { value: 'other', label: 'Other' }
  ];

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [employeesData, managersData] = await Promise.all([
        onboardingOffboardingApi.utils.getEmployeesForDropdown(),
        onboardingOffboardingApi.utils.getEmployeesForDropdown()
      ]);
      
      setEmployees(employeesData);
      setManagers(managersData);
    } catch (err) {
      showError('Error', 'Failed to load data');
      console.error('Error loading initial data:', err);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.employee_id) {
      newErrors.employee_id = 'Please select an employee';
    }

    if (!formData.last_working_date) {
      newErrors.last_working_date = 'Please set the last working date';
    }

    if (!formData.reason_for_leaving) {
      newErrors.reason_for_leaving = 'Please select a reason for leaving';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      
      // Prepare offboarding data
      const offboardingData = {
        ...formData,
        created_by: userProfile?.id,
        assigned_to: formData.assigned_to || formData.hr_contact
      };

      await onStart(offboardingData);
    } catch (err) {
      showError('Error', err.message || 'Failed to start offboarding process');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const filteredEmployees = employees.filter(emp => 
    emp.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.department?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedEmployee = employees.find(emp => emp.id === formData.employee_id);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Start Employee Offboarding
              </h2>
              <p className="text-gray-600 mt-1">
                Begin the offboarding process for an employee
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-200px)]">
            {/* Employee Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Employee *
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search employees..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
                <User className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              </div>
              
              {searchTerm && (
                <div className="mt-2 border border-gray-200 rounded-lg max-h-48 overflow-y-auto">
                  {filteredEmployees.map(employee => (
                    <button
                      key={employee.id}
                      type="button"
                      onClick={() => {
                        handleInputChange('employee_id', employee.id);
                        setSearchTerm('');
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                    >
                      <div className="font-medium text-gray-900">{employee.full_name}</div>
                      <div className="text-sm text-gray-600">{employee.email}</div>
                      <div className="text-sm text-gray-500">{employee.department} • {employee.position}</div>
                    </button>
                  ))}
                </div>
              )}

              {selectedEmployee && (
                <div className="mt-3 p-3 bg-red-50 rounded-lg border border-red-200">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                      <span className="text-red-600 font-semibold">
                        {selectedEmployee.full_name?.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <div className="font-medium text-red-900">{selectedEmployee.full_name}</div>
                      <div className="text-sm text-red-600">{selectedEmployee.email}</div>
                      <div className="text-sm text-red-500">{selectedEmployee.department} • {selectedEmployee.position}</div>
                    </div>
                  </div>
                </div>
              )}
              
              {errors.employee_id && (
                <p className="mt-1 text-sm text-red-600 flex items-center space-x-1">
                  <AlertCircle className="w-4 h-4" />
                  <span>{errors.employee_id}</span>
                </p>
              )}
            </div>

            {/* Dates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Last Working Date *
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={formData.last_working_date}
                    onChange={(e) => handleInputChange('last_working_date', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                  <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                </div>
                
                {errors.last_working_date && (
                  <p className="mt-1 text-sm text-red-600 flex items-center space-x-1">
                    <AlertCircle className="w-4 h-4" />
                    <span>{errors.last_working_date}</span>
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Termination Date
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={formData.termination_date}
                    onChange={(e) => handleInputChange('termination_date', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                  <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                </div>
              </div>
            </div>

            {/* Reason for Leaving */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for Leaving *
              </label>
              <div className="relative">
                <select
                  value={formData.reason_for_leaving}
                  onChange={(e) => handleInputChange('reason_for_leaving', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent appearance-none"
                >
                  <option value="">Select reason...</option>
                  {reasonOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
              </div>
              
              {errors.reason_for_leaving && (
                <p className="mt-1 text-sm text-red-600 flex items-center space-x-1">
                  <AlertCircle className="w-4 h-4" />
                  <span>{errors.reason_for_leaving}</span>
                </p>
              )}
            </div>

            {/* Reason Details */}
            {formData.reason_for_leaving && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Details
                </label>
                <textarea
                  value={formData.reason_details}
                  onChange={(e) => handleInputChange('reason_details', e.target.value)}
                  rows={3}
                  placeholder="Provide additional details about the reason for leaving..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                />
              </div>
            )}

            {/* Assignment Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  HR Contact
                </label>
                <select
                  value={formData.hr_contact}
                  onChange={(e) => handleInputChange('hr_contact', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                  <option value="">Select HR contact...</option>
                  {managers.map(manager => (
                    <option key={manager.id} value={manager.id}>
                      {manager.full_name} ({manager.department})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Department Manager
                </label>
                <select
                  value={formData.department_manager}
                  onChange={(e) => handleInputChange('department_manager', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                  <option value="">Select department manager...</option>
                  {managers.map(manager => (
                    <option key={manager.id} value={manager.id}>
                      {manager.full_name} ({manager.department})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Handover To */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Handover To
              </label>
              <select
                value={formData.handover_to}
                onChange={(e) => handleInputChange('handover_to', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              >
                <option value="">Select employee for handover...</option>
                {employees.map(employee => (
                  <option key={employee.id} value={employee.id}>
                    {employee.full_name} ({employee.department})
                  </option>
                ))}
              </select>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                rows={3}
                placeholder="Add any special instructions or notes for this offboarding process..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
              />
            </div>
          </form>

          {/* Footer */}
          <div className="flex items-center justify-end space-x-4 p-6 border-t border-gray-200 bg-gray-50">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Starting...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span>Start Offboarding</span>
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
