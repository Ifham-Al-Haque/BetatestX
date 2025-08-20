import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  User, Mail, Phone, MapPin, Calendar, Building, 
  Shield, Monitor, Briefcase, Edit, ArrowLeft,
  CheckCircle, AlertCircle, Clock, Star, Save, X,
  Plus, Trash, Upload, Download, Target, Award,
  Users, FileText, GraduationCap, Heart, AlertTriangle
} from 'lucide-react';
import { enhancedEmployeeApi, validateEmployeeData } from '../services/enhancedEmployeeApi';
import { useToast } from '../context/ToastContext';

export default function EnhancedEmployeeForm({ employee, onSave, onCancel, mode = 'create' }) {
  const { success, error: showError } = useToast();
  const [formData, setFormData] = useState({
    // Basic Information
    full_name: '',
    name: '',
    email: '',
    phone: '',
    department: '',
    position: '',
    designation: '',
    employee_id: '',
    role: '',
    reporting_manager_id: '',
    reporting_manager: '',
    
    // Enhanced Information
    salary: '',
    hire_date: '',
    termination_date: '',
    performance_rating: '',
    experience_level: '',
    location: '',
    
    // Emergency Contacts
    emergency_contact_name: '',
    emergency_contact_phone: '',
    emergency_contact_relationship: '',
    next_of_kin_name: '',
    next_of_kin_phone: '',
    next_of_kin_relationship: '',
    
    // Additional Information
    scopes: '',
    responsibilities: '',
    duties: '',
    access_list: '',
    asset_list: '',
    profile_picture: '',
    photo_url: '',
    summary: '',
    key_roles: '',
    extra_responsibilities: '',
    key_roles_detailed: '',
    status: 'active',
    auth_user_id: '',
    
    // Skills and Goals (JSONB fields)
    skills: [],
    certifications: [],
    training_records: [],
    goals: []
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [managers, setManagers] = useState([]);
  const [departments] = useState([
    'IT', 'HR', 'Finance', 'Marketing', 'Sales', 'Operations', 'Engineering', 'Design', 'Support'
  ]);
  const [experienceLevels] = useState([
    'Entry Level', 'Junior', 'Mid-Level', 'Senior', 'Lead', 'Manager', 'Director', 'Executive'
  ]);
  const [relationshipTypes] = useState([
    'Spouse', 'Parent', 'Sibling', 'Child', 'Friend', 'Other'
  ]);

  // Load employee data for editing
  useEffect(() => {
    if (employee && mode === 'edit') {
      setFormData({
        ...employee,
        skills: Array.isArray(employee.skills) ? employee.skills : [],
        certifications: Array.isArray(employee.certifications) ? employee.certifications : [],
        training_records: Array.isArray(employee.training_records) ? employee.training_records : [],
        goals: Array.isArray(employee.goals) ? employee.goals : []
      });
    }
  }, [employee, mode]);

  // Load managers for dropdown
  useEffect(() => {
    const loadManagers = async () => {
      try {
        const { data } = await enhancedEmployeeApi.employees.getAll(1, 100);
        setManagers(data || []);
      } catch (err) {
        console.error('Failed to load managers:', err);
      }
    };
    loadManagers();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleArrayFieldChange = (field, index, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => i === index ? value : item)
    }));
  };

  const addArrayFieldItem = (field) => {
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], '']
    }));
  };

  const removeArrayFieldItem = (field, index) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form data
    const validationErrors = validateEmployeeData(formData);
    if (validationErrors.length > 0) {
      const errorObj = {};
      validationErrors.forEach(error => {
        // Map validation errors to form fields
        if (error.includes('name')) errorObj.full_name = error;
        if (error.includes('email')) errorObj.email = error;
        if (error.includes('phone')) errorObj.phone = error;
        if (error.includes('salary')) errorObj.salary = error;
        if (error.includes('performance')) errorObj.performance_rating = error;
      });
      setErrors(errorObj);
      return;
    }

    setLoading(true);
    try {
      const processedData = {
        ...formData,
        salary: formData.salary ? parseFloat(formData.salary) : null,
        performance_rating: formData.performance_rating ? parseFloat(formData.performance_rating) : null,
        skills: formData.skills.filter(skill => skill.trim() !== ''),
        certifications: formData.certifications.filter(cert => cert.trim() !== ''),
        training_records: formData.training_records.filter(record => record.trim() !== ''),
        goals: formData.goals.filter(goal => goal.trim() !== '')
      };

      if (mode === 'edit') {
        await enhancedEmployeeApi.employees.update(employee.id, processedData);
        success('Success', 'Employee updated successfully!');
      } else {
        await enhancedEmployeeApi.employees.create(processedData);
        success('Success', 'Employee created successfully!');
      }
      
      onSave();
    } catch (err) {
      showError('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const renderField = (name, label, type = 'text', placeholder = '', required = false, options = null) => (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {type === 'select' ? (
        <select
          name={name}
          value={formData[name] || ''}
          onChange={handleChange}
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white ${
            errors[name] ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
          }`}
        >
          <option value="">Select {label}</option>
          {options?.map(option => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
      ) : (
        <input
          type={type}
          name={name}
          value={formData[name] || ''}
          onChange={handleChange}
          placeholder={placeholder}
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white ${
            errors[name] ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
          }`}
        />
      )}
      {errors[name] && (
        <p className="text-sm text-red-600">{errors[name]}</p>
      )}
    </div>
  );

  const renderArrayField = (field, label, placeholder) => (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
      </label>
      {formData[field].map((item, index) => (
        <div key={index} className="flex gap-2">
          <input
            type="text"
            value={item}
            onChange={(e) => handleArrayFieldChange(field, index, e.target.value)}
            placeholder={placeholder}
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          />
          <button
            type="button"
            onClick={() => removeArrayFieldItem(field, index)}
            className="px-3 py-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
          >
            <Trash className="w-4 h-4" />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => addArrayFieldItem(field)}
        className="flex items-center gap-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
      >
        <Plus className="w-4 h-4" />
        Add {label}
      </button>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
    >
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {mode === 'edit' ? 'Edit Employee' : 'Add New Employee'}
          </h2>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-8">
        {/* Basic Information */}
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <User className="w-5 h-5" />
            Basic Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {renderField('full_name', 'Full Name', 'text', 'Enter full name', true)}
            {renderField('email', 'Email', 'email', 'Enter email address', true)}
            {renderField('phone', 'Phone', 'tel', 'Enter phone number')}
            {renderField('employee_id', 'Employee ID', 'text', 'Enter employee ID', true)}
            {renderField('department', 'Department', 'select', '', false, departments)}
            {renderField('position', 'Position', 'text', 'Enter job position', true)}
            {renderField('experience_level', 'Experience Level', 'select', '', false, experienceLevels)}
            {renderField('location', 'Location', 'text', 'Enter work location')}
          </div>
        </div>

        {/* Employment Details */}
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Building className="w-5 h-5" />
            Employment Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {renderField('hire_date', 'Hire Date', 'date')}
            {renderField('termination_date', 'Termination Date', 'date')}
            {renderField('salary', 'Salary', 'number', 'Enter annual salary')}
            {renderField('performance_rating', 'Performance Rating', 'number', '0-5 rating')}
            {renderField('status', 'Status', 'select', '', false, ['active', 'inactive', 'pending', 'terminated'])}
            {renderField('reporting_manager_id', 'Reporting Manager', 'select', '', false, managers.map(m => ({ value: m.id, label: `${m.full_name} (${m.employee_id})` })))}
          </div>
        </div>

        {/* Emergency Contacts */}
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Heart className="w-5 h-5" />
            Emergency Contacts
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {renderField('emergency_contact_name', 'Emergency Contact Name')}
            {renderField('emergency_contact_phone', 'Emergency Contact Phone', 'tel')}
            {renderField('emergency_contact_relationship', 'Relationship', 'select', '', false, relationshipTypes)}
            {renderField('next_of_kin_name', 'Next of Kin Name')}
            {renderField('next_of_kin_phone', 'Next of Kin Phone', 'tel')}
            {renderField('next_of_kin_relationship', 'Next of Kin Relationship', 'select', '', false, relationshipTypes)}
          </div>
        </div>

        {/* Skills and Certifications */}
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Award className="w-5 h-5" />
            Skills and Certifications
          </h3>
          <div className="space-y-6">
            {renderArrayField('skills', 'Skills', 'Enter skill name')}
            {renderArrayField('certifications', 'Certifications', 'Enter certification name')}
            {renderArrayField('training_records', 'Training Records', 'Enter training completed')}
          </div>
        </div>

        {/* Goals and Objectives */}
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Target className="w-5 h-5" />
            Goals and Objectives
          </h3>
          {renderArrayField('goals', 'Goals', 'Enter goal description')}
        </div>

        {/* Additional Information */}
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Additional Information
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Summary
              </label>
              <textarea
                name="summary"
                value={formData.summary || ''}
                onChange={handleChange}
                rows={3}
                placeholder="Enter employee summary"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>
            {renderArrayField('scopes', 'Scopes of Work', 'Enter scope description')}
            {renderArrayField('responsibilities', 'Responsibilities', 'Enter responsibility description')}
            {renderArrayField('duties', 'Duties', 'Enter duty description')}
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg flex items-center gap-2 transition-colors"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <Save className="w-4 h-4" />
            )}
            {mode === 'edit' ? 'Update Employee' : 'Create Employee'}
          </button>
        </div>
      </form>
    </motion.div>
  );
}
