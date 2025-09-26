import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, User, Calendar, Users, FileText, CheckCircle, 
  AlertCircle, Building, Mail, Phone, ChevronDown,
  MapPin, Briefcase, GraduationCap, UserPlus
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import onboardingOffboardingApi from '../../services/onboardingOffboardingApi';

export default function NewEmployeeOnboardingModal({ onClose, onStart, editingRecord = null, mode = 'create' }) {
  const { userProfile } = useAuth();
  const { error: showError } = useToast();
  
  const [templates, setTemplates] = useState([]);
  const [managers, setManagers] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // New employee form data
  const [employeeData, setEmployeeData] = useState({
    // Basic Information
    full_name: '',
    email: '',
    phone: '',
    personal_email: '',
    
    // Employment Details
    employee_id: '',
    position: '',
    department: '',
    start_date: '',
    employment_type: 'full_time',
    salary: '',
    
    // Location & Reporting
    work_location: '',
    reporting_manager_id: '',
    
    // Personal Details
    date_of_birth: '',
    nationality: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    
    // Education & Experience
    education_level: '',
    previous_experience: '',
    skills: ''
  });

  // Onboarding process data
  const [onboardingData, setOnboardingData] = useState({
    template_id: '',
    expected_completion_date: '',
    onboarding_buddy: '',
    hr_contact: userProfile?.id || '',
    department_manager: '',
    notes: '',
    assigned_to: ''
  });

  const [errors, setErrors] = useState({});
  const [currentStep, setCurrentStep] = useState(1); // 1: Employee Details, 2: Onboarding Setup

  const departments = [
    'IT', 'HR', 'FINANCE', 'MARKETING', 'SALES', 'OPERATIONS', 
    'Engineering', 'Design', 'Support', 'Legal', 'Admin',
    'SUBSCRIBE NOW SALES', 'TECHNOLOGY', 'IOT', 'COLLECTION', 'Customer Service', 'Driver Management'
  ];

  const employmentTypes = [
    { value: 'full_time', label: 'Full Time' },
    { value: 'part_time', label: 'Part Time' },
    { value: 'contract', label: 'Contract' },
    { value: 'intern', label: 'Intern' },
    { value: 'consultant', label: 'Consultant' }
  ];

  const educationLevels = [
    'High School', 'Associate Degree', 'Bachelor\'s Degree', 
    'Master\'s Degree', 'PhD', 'Professional Certification', 'Other'
  ];

  useEffect(() => {
    loadInitialData();
    if (mode === 'create') {
      generateEmployeeId();
    } else if (mode === 'edit' && editingRecord) {
      // Populate form with existing data for editing
      setEmployeeData({
        full_name: editingRecord.full_name || '',
        email: editingRecord.email || '',
        phone: editingRecord.phone || '',
        personal_email: editingRecord.personal_email || '',
        employee_id: editingRecord.employee_id || '',
        position: editingRecord.position || '',
        department: editingRecord.department || '',
        start_date: editingRecord.start_date || '',
        employment_type: editingRecord.employment_type || 'full_time',
        work_location: editingRecord.work_location || '',
        reporting_manager_id: editingRecord.reporting_manager_id || '',
        date_of_birth: editingRecord.date_of_birth || '',
        nationality: editingRecord.nationality || '',
        emergency_contact_name: editingRecord.emergency_contact_name || '',
        emergency_contact_phone: editingRecord.emergency_contact_phone || '',
        education_level: editingRecord.education_level || '',
        previous_experience: editingRecord.previous_experience || '',
        skills: editingRecord.skills || ''
      });
      
      setOnboardingData({
        template_id: editingRecord.template_id || '',
        expected_completion_date: editingRecord.expected_completion_date || '',
        onboarding_buddy: editingRecord.onboarding_buddy || '',
        hr_contact: editingRecord.hr_contact || userProfile?.id || '',
        department_manager: editingRecord.department_manager || '',
        notes: editingRecord.notes || '',
        assigned_to: editingRecord.assigned_to || ''
      });
    }
  }, [mode, editingRecord]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [templatesData, managersData] = await Promise.all([
        onboardingOffboardingApi.templates.getAll(),
        onboardingOffboardingApi.utils.getEmployeesForDropdown()
      ]);
      
      setTemplates(templatesData);
      setManagers(managersData);
    } catch (err) {
      showError('Error', 'Failed to load data');
      console.error('Error loading initial data:', err);
    } finally {
      setLoading(false);
    }
  };

  const generateEmployeeId = () => {
    // Generate a unique employee ID (you can customize this logic)
    const year = new Date().getFullYear().toString().slice(-2);
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const employeeId = `EMP${year}${month}${random}`;
    
    setEmployeeData(prev => ({ ...prev, employee_id: employeeId }));
  };

  const validateStep1 = () => {
    const newErrors = {};

    // Required fields for new employee
    if (!employeeData.full_name.trim()) {
      newErrors.full_name = 'Full name is required';
    }

    if (!employeeData.email.trim()) {
      newErrors.email = 'Work email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(employeeData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!employeeData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    }

    if (!employeeData.position.trim()) {
      newErrors.position = 'Position is required';
    }

    if (!employeeData.department) {
      newErrors.department = 'Department is required';
    }

    if (!employeeData.start_date) {
      newErrors.start_date = 'Start date is required';
    }

    if (!employeeData.employee_id.trim()) {
      newErrors.employee_id = 'Employee ID is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors = {};

    if (!onboardingData.template_id) {
      newErrors.template_id = 'Please select an onboarding template';
    }

    if (!onboardingData.expected_completion_date) {
      newErrors.expected_completion_date = 'Please set an expected completion date';
    } else {
      const selectedDate = new Date(onboardingData.expected_completion_date);
      const startDate = new Date(employeeData.start_date);
      if (selectedDate <= startDate) {
        newErrors.expected_completion_date = 'Completion date must be after start date';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep1()) {
      setCurrentStep(2);
    }
  };

  const handleBack = () => {
    setCurrentStep(1);
    setErrors({});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateStep2()) {
      return;
    }

    try {
      setLoading(true);
      
      // Combine employee data with onboarding data
      const completeData = {
        employeeData,
        onboardingData: {
          ...onboardingData,
          created_by: userProfile?.id,
          assigned_to: onboardingData.assigned_to || onboardingData.hr_contact
        }
      };

      await onStart(completeData);
    } catch (err) {
      showError('Error', err.message || 'Failed to start onboarding process');
    } finally {
      setLoading(false);
    }
  };

  const handleEmployeeDataChange = (field, value) => {
    setEmployeeData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleOnboardingDataChange = (field, value) => {
    setOnboardingData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const selectedTemplate = templates.find(template => template.id === onboardingData.template_id);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {mode === 'edit' ? 'Edit Employee Onboarding' : 'New Employee Onboarding'}
              </h2>
              <p className="text-gray-600 mt-1">
                {mode === 'edit' 
                  ? `Editing onboarding for ${editingRecord?.full_name || 'employee'}`
                  : `Step ${currentStep} of 2: ${currentStep === 1 ? 'Employee Details' : 'Onboarding Setup'}`
                }
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Progress Bar */}
          <div className="px-6 py-4 bg-gray-50">
            <div className="flex items-center space-x-4">
              <div className={`flex items-center space-x-2 ${currentStep >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
                  1
                </div>
                <span className="font-medium">Employee Details</span>
              </div>
              <div className="flex-1 h-0.5 bg-gray-200">
                <div className={`h-full bg-blue-600 transition-all duration-300 ${currentStep >= 2 ? 'w-full' : 'w-0'}`}></div>
              </div>
              <div className={`flex items-center space-x-2 ${currentStep >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
                  2
                </div>
                <span className="font-medium">Onboarding Setup</span>
              </div>
            </div>
          </div>

          {/* Form Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-250px)]">
            {currentStep === 1 ? (
              // Step 1: Employee Details
              <div className="space-y-6">
                <div className="flex items-center space-x-2 mb-4">
                  <UserPlus className="w-5 h-5 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-900">New Employee Information</h3>
                </div>

                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      value={employeeData.full_name}
                      onChange={(e) => handleEmployeeDataChange('full_name', e.target.value)}
                      placeholder="Enter full name"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    {errors.full_name && (
                      <p className="mt-1 text-sm text-red-600">{errors.full_name}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Employee ID *
                    </label>
                    <input
                      type="text"
                      value={employeeData.employee_id}
                      onChange={(e) => handleEmployeeDataChange('employee_id', e.target.value)}
                      placeholder="Auto-generated"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    {errors.employee_id && (
                      <p className="mt-1 text-sm text-red-600">{errors.employee_id}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Work Email *
                    </label>
                    <input
                      type="email"
                      value={employeeData.email}
                      onChange={(e) => handleEmployeeDataChange('email', e.target.value)}
                      placeholder="employee@company.com"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    {errors.email && (
                      <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      value={employeeData.phone}
                      onChange={(e) => handleEmployeeDataChange('phone', e.target.value)}
                      placeholder="+1 (555) 123-4567"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    {errors.phone && (
                      <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
                    )}
                  </div>
                </div>

                {/* Employment Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Position *
                    </label>
                    <input
                      type="text"
                      value={employeeData.position}
                      onChange={(e) => handleEmployeeDataChange('position', e.target.value)}
                      placeholder="e.g. Software Engineer"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    {errors.position && (
                      <p className="mt-1 text-sm text-red-600">{errors.position}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Department *
                    </label>
                    <select
                      value={employeeData.department}
                      onChange={(e) => handleEmployeeDataChange('department', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select Department</option>
                      {departments.map(dept => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>
                    {errors.department && (
                      <p className="mt-1 text-sm text-red-600">{errors.department}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Start Date *
                    </label>
                    <input
                      type="date"
                      value={employeeData.start_date}
                      onChange={(e) => handleEmployeeDataChange('start_date', e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    {errors.start_date && (
                      <p className="mt-1 text-sm text-red-600">{errors.start_date}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Employment Type
                    </label>
                    <select
                      value={employeeData.employment_type}
                      onChange={(e) => handleEmployeeDataChange('employment_type', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {employmentTypes.map(type => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Optional Fields - Can be filled later */}
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                    <Building className="w-4 h-4 mr-2" />
                    Additional Information (Optional - can be added later)
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-2">
                        Personal Email
                      </label>
                      <input
                        type="email"
                        value={employeeData.personal_email}
                        onChange={(e) => handleEmployeeDataChange('personal_email', e.target.value)}
                        placeholder="personal@email.com (optional)"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-2">
                        Work Location
                      </label>
                      <input
                        type="text"
                        value={employeeData.work_location}
                        onChange={(e) => handleEmployeeDataChange('work_location', e.target.value)}
                        placeholder="e.g. New York Office, Remote (optional)"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-2">
                        Reporting Manager
                      </label>
                      <select
                        value={employeeData.reporting_manager_id}
                        onChange={(e) => handleEmployeeDataChange('reporting_manager_id', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Select Manager (optional)</option>
                        {managers.map(manager => (
                          <option key={manager.id} value={manager.id}>
                            {manager.full_name} ({manager.department})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-2">
                        Education Level
                      </label>
                      <select
                        value={employeeData.education_level}
                        onChange={(e) => handleEmployeeDataChange('education_level', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Select Education Level (optional)</option>
                        {educationLevels.map(level => (
                          <option key={level} value={level}>{level}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-2">
                        Emergency Contact Name
                      </label>
                      <input
                        type="text"
                        value={employeeData.emergency_contact_name}
                        onChange={(e) => handleEmployeeDataChange('emergency_contact_name', e.target.value)}
                        placeholder="Emergency contact name (optional)"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-2">
                        Emergency Contact Phone
                      </label>
                      <input
                        type="tel"
                        value={employeeData.emergency_contact_phone}
                        onChange={(e) => handleEmployeeDataChange('emergency_contact_phone', e.target.value)}
                        placeholder="Emergency contact phone (optional)"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  
                  <p className="text-xs text-gray-500 mt-3">
                    💡 These fields are optional and can be updated later in the employee profile.
                  </p>
                </div>
              </div>
            ) : (
              // Step 2: Onboarding Setup
              <div className="space-y-6">
                <div className="flex items-center space-x-2 mb-4">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Onboarding Configuration</h3>
                </div>

                {/* Employee Summary */}
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <h4 className="font-medium text-blue-900 mb-2">New Employee Summary</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><span className="font-medium">Name:</span> {employeeData.full_name}</div>
                    <div><span className="font-medium">Position:</span> {employeeData.position}</div>
                    <div><span className="font-medium">Department:</span> {employeeData.department}</div>
                    <div><span className="font-medium">Start Date:</span> {employeeData.start_date}</div>
                  </div>
                </div>

                {/* Template Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Onboarding Template *
                  </label>
                  <select
                    value={onboardingData.template_id}
                    onChange={(e) => handleOnboardingDataChange('template_id', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select a template...</option>
                    {templates.map(template => (
                      <option key={template.id} value={template.id}>
                        {template.name} {template.department !== 'All' && `(${template.department})`}
                      </option>
                    ))}
                  </select>
                  
                  {selectedTemplate && (
                    <div className="mt-2 p-3 bg-green-50 rounded-lg border border-green-200">
                      <div className="font-medium text-green-900">{selectedTemplate.name}</div>
                      <div className="text-sm text-green-600">{selectedTemplate.description}</div>
                    </div>
                  )}
                  
                  {errors.template_id && (
                    <p className="mt-1 text-sm text-red-600">{errors.template_id}</p>
                  )}
                </div>

                {/* Expected Completion Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Expected Completion Date *
                  </label>
                  <input
                    type="date"
                    value={onboardingData.expected_completion_date}
                    onChange={(e) => handleOnboardingDataChange('expected_completion_date', e.target.value)}
                    min={employeeData.start_date || new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {errors.expected_completion_date && (
                    <p className="mt-1 text-sm text-red-600">{errors.expected_completion_date}</p>
                  )}
                </div>

                {/* Assignment Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      HR Contact
                    </label>
                    <select
                      value={onboardingData.hr_contact}
                      onChange={(e) => handleOnboardingDataChange('hr_contact', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                      Onboarding Buddy
                    </label>
                    <select
                      value={onboardingData.onboarding_buddy}
                      onChange={(e) => handleOnboardingDataChange('onboarding_buddy', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select onboarding buddy...</option>
                      {managers.map(manager => (
                        <option key={manager.id} value={manager.id}>
                          {manager.full_name} ({manager.department})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Special Instructions
                  </label>
                  <textarea
                    value={onboardingData.notes}
                    onChange={(e) => handleOnboardingDataChange('notes', e.target.value)}
                    rows={3}
                    placeholder="Add any special instructions for this onboarding process..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
            <div>
              {currentStep === 2 && (
                <button
                  type="button"
                  onClick={handleBack}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                >
                  Back
                </button>
              )}
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
              >
                Cancel
              </button>
              
              {currentStep === 1 ? (
                <button
                  onClick={handleNext}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 flex items-center space-x-2"
                >
                  <span>Next</span>
                  <ChevronDown className="w-4 h-4 rotate-[-90deg]" />
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Creating...</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      <span>{mode === 'edit' ? 'Update Onboarding Record' : 'Create Employee & Start Onboarding'}</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
