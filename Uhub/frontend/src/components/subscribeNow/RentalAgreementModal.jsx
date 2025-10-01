import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Save, 
  Users, 
  Car,
  DollarSign,
  Calendar,
  FileText,
  AlertCircle,
  CheckCircle,
  Clock,
  User,
  Building,
  Phone,
  Mail,
  CreditCard,
  MapPin,
  Loader,
  ChevronRight,
  ChevronLeft,
  Upload,
  XCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import subscribeNowService from '../../services/subscribeNowService';

const RentalAgreementModal = ({ isOpen, onClose, rental = null, onSuccess }) => {
  const { userProfile } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Customer Information
    customer_id: '',
    customer_name: '',
    email: '',
    phone: '',
    address: '',
    emirates_id: '',
    driving_license: '',
    passport_number: '',
    company_name: '',
    designation: '',
    customer_type: 'Individual',
    
    // Rental Agreement
    rental_agreement_id: '',
    desired_fleet_type: '',
    specific_vehicle_id: '',
    original_rental_amount: '',
    confirmed_amount: '',
    security_deposit: '',
    rental_duration_months: 12,
    rental_start_date: '',
    rental_end_date: '',
    agreement_status: 'Draft',
    special_requirements: '',
    notes: ''
  });

  const [availableVehicles, setAvailableVehicles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [contractFile, setContractFile] = useState(null);
  const [customerIdChecking, setCustomerIdChecking] = useState(false);
  const [customerIdAvailable, setCustomerIdAvailable] = useState(null);

  const isEditMode = !!rental;
  const totalSteps = 3;

  const stepTitles = {
    1: 'Customer Information',
    2: 'Rental Details',
    3: 'Agreement & Contract'
  };

  useEffect(() => {
    if (isOpen) {
      loadFormData();
      if (rental) {
        populateFormData();
      } else {
        generateIds();
      }
    }
  }, [isOpen, rental]);

  const loadFormData = async () => {
    try {
      const vehicles = await subscribeNowService.getAvailableVehicles();
      setAvailableVehicles(vehicles);
    } catch (error) {
      console.error('Error loading form data:', error);
    }
  };

  const generateIds = async () => {
    try {
      // Only auto-generate rental ID, let user enter customer ID manually
      const rentalId = await subscribeNowService.generateRentalId();
      
      setFormData(prev => ({
        ...prev,
        rental_agreement_id: rentalId
        // customer_id left empty for manual entry
      }));
    } catch (error) {
      console.error('Error generating rental ID:', error);
    }
  };

  const populateFormData = () => {
    if (rental) {
      setFormData({
        customer_id: rental.customer_code || '',
        customer_name: rental.customer_name || '',
        email: rental.email || '',
        phone: rental.phone || '',
        address: rental.address || '',
        emirates_id: rental.emirates_id || '',
        driving_license: rental.driving_license || '',
        passport_number: rental.passport_number || '',
        company_name: rental.company_name || '',
        designation: rental.designation || '',
        customer_type: rental.customer_type || 'Individual',
        rental_agreement_id: rental.rental_agreement_id || '',
        desired_fleet_type: rental.desired_fleet_type || '',
        specific_vehicle_id: rental.specific_vehicle_id || '',
        original_rental_amount: rental.original_rental_amount || '',
        confirmed_amount: rental.confirmed_amount || '',
        security_deposit: rental.security_deposit || '',
        rental_duration_months: rental.rental_duration_months || 12,
        rental_start_date: rental.rental_start_date || '',
        rental_end_date: rental.rental_end_date || '',
        agreement_status: rental.agreement_status || 'Draft',
        special_requirements: rental.special_requirements || '',
        notes: rental.notes || ''
      });
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Auto-calculate end date when start date or duration changes
    if (name === 'rental_start_date' || name === 'rental_duration_months') {
      const startDate = name === 'rental_start_date' ? value : formData.rental_start_date;
      const duration = name === 'rental_duration_months' ? parseInt(value) : formData.rental_duration_months;
      
      if (startDate && duration) {
        const endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + duration);
        setFormData(prev => ({
          ...prev,
          rental_end_date: endDate.toISOString().split('T')[0]
        }));
      }
    }
    
    // Customer ID validation removed - user has their own customer ID data
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
      if (!allowedTypes.includes(file.type)) {
        setErrors(prev => ({ ...prev, contract: 'Please upload a PDF, JPEG, or PNG file' }));
        return;
      }
      
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, contract: 'File size must be less than 10MB' }));
        return;
      }
      
      setContractFile(file);
      setErrors(prev => ({ ...prev, contract: '' }));
    }
  };

  const validateStep = (step) => {
    const newErrors = {};
    
    switch (step) {
      case 1:
        if (!formData.customer_id.trim()) newErrors.customer_id = 'Customer ID is required';
        if (!formData.customer_name.trim()) newErrors.customer_name = 'Customer name is required';
        if (!formData.email.trim()) newErrors.email = 'Email is required';
        if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
        if (formData.customer_type === 'Corporate' && !formData.company_name.trim()) {
          newErrors.company_name = 'Company name is required for corporate customers';
        }
        break;
      
      case 2:
        if (!formData.desired_fleet_type.trim()) newErrors.desired_fleet_type = 'Desired fleet type is required';
        if (!formData.original_rental_amount || parseFloat(formData.original_rental_amount) <= 0) {
          newErrors.original_rental_amount = 'Valid original rental amount is required';
        }
        if (!formData.confirmed_amount || parseFloat(formData.confirmed_amount) <= 0) {
          newErrors.confirmed_amount = 'Valid confirmed amount is required';
        }
        if (!formData.rental_start_date) newErrors.rental_start_date = 'Rental start date is required';
        if (!formData.rental_duration_months || parseInt(formData.rental_duration_months) <= 0) {
          newErrors.rental_duration_months = 'Valid rental duration is required';
        }
        break;
      
      case 3:
        // Optional validation for final step
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps));
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateStep(currentStep)) return;

    try {
      setLoading(true);
      
      // Prepare customer data
      const customerData = {
        customer_id: formData.customer_id,
        customer_name: formData.customer_name,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        emirates_id: formData.emirates_id,
        driving_license: formData.driving_license,
        passport_number: formData.passport_number,
        company_name: formData.company_name,
        designation: formData.designation,
        customer_type: formData.customer_type,
        created_by: userProfile?.id,
        updated_by: userProfile?.id
      };

      // Prepare rental data
      const rentalData = {
        rental_agreement_id: formData.rental_agreement_id,
        desired_fleet_type: formData.desired_fleet_type,
        specific_vehicle_id: formData.specific_vehicle_id || null,
        original_rental_amount: parseFloat(formData.original_rental_amount),
        confirmed_amount: parseFloat(formData.confirmed_amount),
        security_deposit: formData.security_deposit ? parseFloat(formData.security_deposit) : null,
        rental_duration_months: parseInt(formData.rental_duration_months),
        rental_start_date: formData.rental_start_date,
        rental_end_date: formData.rental_end_date,
        agreement_status: formData.agreement_status,
        special_requirements: formData.special_requirements,
        notes: formData.notes,
        created_by: userProfile?.id,
        updated_by: userProfile?.id
      };

      let result;
      if (isEditMode) {
        // Update existing rental
        await subscribeNowService.updateCustomer(rental.customer_id, customerData);
        result = await subscribeNowService.updateRentalAgreement(rental.rental_id, rentalData);
      } else {
        // Create new customer and rental
        const customer = await subscribeNowService.createCustomer(customerData);
        rentalData.customer_id = customer.id;
        result = await subscribeNowService.createRentalAgreement(rentalData);
      }

      // Upload contract if provided
      if (contractFile && result.rental) {
        await subscribeNowService.uploadRentalContract(
          result.rental.id, 
          contractFile, 
          userProfile?.id
        );
      }

      onSuccess?.();
      handleClose();
    } catch (error) {
      console.error('Error saving rental agreement:', error);
      setErrors({ submit: error.message || 'Failed to save rental agreement' });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      customer_id: '',
      customer_name: '',
      email: '',
      phone: '',
      address: '',
      emirates_id: '',
      driving_license: '',
      passport_number: '',
      company_name: '',
      designation: '',
      customer_type: 'Individual',
      rental_agreement_id: '',
      desired_fleet_type: '',
      specific_vehicle_id: '',
      original_rental_amount: '',
      confirmed_amount: '',
      security_deposit: '',
      rental_duration_months: 12,
      rental_start_date: '',
      rental_end_date: '',
      agreement_status: 'Draft',
      special_requirements: '',
      notes: ''
    });
    setErrors({});
    setCurrentStep(1);
    setContractFile(null);
    setCustomerIdChecking(false);
    setCustomerIdAvailable(null);
    onClose();
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="bg-blue-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <User className="w-5 h-5 mr-2 text-blue-600" />
                Customer Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Customer ID Field - Simple manual entry */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Customer ID *
                  </label>
                  <input
                    type="text"
                    name="customer_id"
                    value={formData.customer_id}
                    onChange={handleInputChange}
                    placeholder="Enter Customer ID"
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all ${
                      errors.customer_id ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                  />
                  {errors.customer_id && (
                    <p className="text-red-600 text-sm mt-1 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {errors.customer_id}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Customer Type
                  </label>
                  <select
                    name="customer_type"
                    value={formData.customer_type}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  >
                    <option value="Individual">Individual</option>
                    <option value="Corporate">Corporate</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Customer Name *
                  </label>
                  <input
                    type="text"
                    name="customer_name"
                    value={formData.customer_name}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all ${
                      errors.customer_name ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder="Enter customer full name"
                  />
                  {errors.customer_name && (
                    <p className="text-red-600 text-sm mt-1">{errors.customer_name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <div className="flex items-center space-x-2">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className={`flex-1 px-4 py-3 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all ${
                        errors.email ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                      placeholder="customer@email.com"
                    />
                  </div>
                  {errors.email && (
                    <p className="text-red-600 text-sm mt-1">{errors.email}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number *
                  </label>
                  <div className="flex items-center space-x-2">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className={`flex-1 px-4 py-3 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all ${
                        errors.phone ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                      placeholder="+971501234567"
                    />
                  </div>
                  {errors.phone && (
                    <p className="text-red-600 text-sm mt-1">{errors.phone}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Emirates ID
                  </label>
                  <input
                    type="text"
                    name="emirates_id"
                    value={formData.emirates_id}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    placeholder="784-XXXX-XXXXXXX-X"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Driving License
                  </label>
                  <input
                    type="text"
                    name="driving_license"
                    value={formData.driving_license}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    placeholder="License number"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Passport Number
                  </label>
                  <input
                    type="text"
                    name="passport_number"
                    value={formData.passport_number}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    placeholder="Passport number"
                  />
                </div>
              </div>

              {formData.customer_type === 'Corporate' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Company Name *
                    </label>
                    <div className="flex items-center space-x-2">
                      <Building className="w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        name="company_name"
                        value={formData.company_name}
                        onChange={handleInputChange}
                        className={`flex-1 px-4 py-3 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all ${
                          errors.company_name ? 'border-red-300 bg-red-50' : 'border-gray-300'
                        }`}
                        placeholder="Company name"
                      />
                    </div>
                    {errors.company_name && (
                      <p className="text-red-600 text-sm mt-1">{errors.company_name}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Designation
                    </label>
                    <input
                      type="text"
                      name="designation"
                      value={formData.designation}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                      placeholder="Job title/position"
                    />
                  </div>
                </div>
              )}

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address
                </label>
                <div className="flex items-start space-x-2">
                  <MapPin className="w-4 h-4 text-gray-400 mt-3" />
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    rows={3}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    placeholder="Full address"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        );

      case 2:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="bg-green-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Car className="w-5 h-5 mr-2 text-green-600" />
                Rental Details
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rental Agreement ID
                  </label>
                  <input
                    type="text"
                    name="rental_agreement_id"
                    value={formData.rental_agreement_id}
                    onChange={handleInputChange}
                    disabled
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50 text-gray-600"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Desired Fleet Type *
                  </label>
                  <input
                    type="text"
                    name="desired_fleet_type"
                    value={formData.desired_fleet_type}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all ${
                      errors.desired_fleet_type ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder="e.g., Luxury Sedan, SUV, Economy"
                  />
                  {errors.desired_fleet_type && (
                    <p className="text-red-600 text-sm mt-1">{errors.desired_fleet_type}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Specific Vehicle (Optional)
                  </label>
                  <select
                    name="specific_vehicle_id"
                    value={formData.specific_vehicle_id}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  >
                    <option value="">Select Vehicle (Optional)</option>
                    {availableVehicles.map(vehicle => (
                      <option key={vehicle.id} value={vehicle.id}>
                        {vehicle.vehicle_number} - {vehicle.make} {vehicle.model} ({vehicle.model_year})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rental Duration (Months) *
                  </label>
                  <select
                    name="rental_duration_months"
                    value={formData.rental_duration_months}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all ${
                      errors.rental_duration_months ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                  >
                    <option value="1">1 Month</option>
                    <option value="3">3 Months</option>
                    <option value="6">6 Months</option>
                    <option value="12">12 Months</option>
                    <option value="24">24 Months</option>
                    <option value="36">36 Months</option>
                  </select>
                  {errors.rental_duration_months && (
                    <p className="text-red-600 text-sm mt-1">{errors.rental_duration_months}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-orange-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <DollarSign className="w-5 h-5 mr-2 text-orange-600" />
                Financial Details
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Original Rental Amount *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="original_rental_amount"
                    value={formData.original_rental_amount}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all ${
                      errors.original_rental_amount ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder="0.00"
                  />
                  {errors.original_rental_amount && (
                    <p className="text-red-600 text-sm mt-1">{errors.original_rental_amount}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirmed Amount *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="confirmed_amount"
                    value={formData.confirmed_amount}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all ${
                      errors.confirmed_amount ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder="0.00"
                  />
                  {errors.confirmed_amount && (
                    <p className="text-red-600 text-sm mt-1">{errors.confirmed_amount}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Security Deposit
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="security_deposit"
                    value={formData.security_deposit}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>

            <div className="bg-purple-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-purple-600" />
                Rental Period
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rental Start Date *
                  </label>
                  <input
                    type="date"
                    name="rental_start_date"
                    value={formData.rental_start_date}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all ${
                      errors.rental_start_date ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                  />
                  {errors.rental_start_date && (
                    <p className="text-red-600 text-sm mt-1">{errors.rental_start_date}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rental End Date
                  </label>
                  <input
                    type="date"
                    name="rental_end_date"
                    value={formData.rental_end_date}
                    onChange={handleInputChange}
                    disabled
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50 text-gray-600"
                  />
                  <p className="text-xs text-gray-500 mt-1">Auto-calculated based on start date and duration</p>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Special Requirements
              </label>
              <textarea
                name="special_requirements"
                value={formData.special_requirements}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                placeholder="Any special requirements or preferences..."
              />
            </div>
          </motion.div>
        );

      case 3:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="bg-indigo-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <FileText className="w-5 h-5 mr-2 text-indigo-600" />
                Agreement Status & Contract
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Agreement Status
                  </label>
                  <select
                    name="agreement_status"
                    value={formData.agreement_status}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  >
                    <option value="Draft">Draft</option>
                    <option value="Pending Approval">Pending Approval</option>
                    <option value="Approved">Approved</option>
                    <option value="Active">Active</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Upload Rental Contract
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={handleFileChange}
                      className="hidden"
                      id="contract-upload"
                    />
                    <label
                      htmlFor="contract-upload"
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-xl cursor-pointer hover:bg-gray-50 transition-all flex items-center"
                    >
                      <Upload className="w-4 h-4 mr-2 text-gray-400" />
                      {contractFile ? contractFile.name : 'Choose file...'}
                    </label>
                  </div>
                  {errors.contract && (
                    <p className="text-red-600 text-sm mt-1">{errors.contract}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">PDF, JPEG, or PNG files (max 10MB)</p>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional Notes
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                placeholder="Any additional notes or comments..."
              />
            </div>

            {/* Summary */}
            <div className="bg-gray-50 rounded-xl p-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Rental Agreement Summary</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-600">Customer:</span>
                  <span className="ml-2 text-gray-900">{formData.customer_name}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Fleet Type:</span>
                  <span className="ml-2 text-gray-900">{formData.desired_fleet_type}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Duration:</span>
                  <span className="ml-2 text-gray-900">{formData.rental_duration_months} months</span>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Amount:</span>
                  <span className="ml-2 text-gray-900">${parseFloat(formData.confirmed_amount || 0).toFixed(2)}</span>
                </div>
              </div>
            </div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col my-auto"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-white">
                    {isEditMode ? 'Edit Rental Agreement' : 'New Rental Agreement'}
                  </h2>
                  <p className="text-purple-100 text-sm">
                    {stepTitles[currentStep]} - Step {currentStep} of {totalSteps}
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="text-white/80 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="px-6 py-4 bg-gray-50 border-b">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Progress</span>
              <span className="text-sm text-gray-500">{Math.round((currentStep / totalSteps) * 100)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(currentStep / totalSteps) * 100}%` }}
              />
            </div>
            <div className="flex justify-between mt-2">
              {Array.from({ length: totalSteps }, (_, i) => (
                <div key={i} className={`text-xs ${i + 1 <= currentStep ? 'text-purple-600 font-medium' : 'text-gray-400'}`}>
                  Step {i + 1}
                </div>
              ))}
            </div>
          </div>

          {/* Form Content - Scrollable */}
          <div className="flex-1 overflow-y-auto">
            <form onSubmit={handleSubmit}>
              {errors.submit && (
                <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-xl">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                    <p className="text-red-800 text-sm">{errors.submit}</p>
                  </div>
                </div>
              )}

              <div className="p-6">
                {renderStepContent()}
              </div>
            </form>
          </div>

          {/* Footer - Fixed at bottom */}
          <div className="flex-shrink-0 px-6 py-4 bg-gray-50 border-t flex justify-between items-center">
            <div className="flex space-x-3">
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={handlePrevious}
                  className="px-6 py-2 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-all flex items-center"
                >
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Previous
                </button>
              )}
            </div>
            
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={handleClose}
                className="px-6 py-2 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-all"
              >
                Cancel
              </button>
              
              {currentStep < totalSteps ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition-all flex items-center"
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-2" />
                </button>
              ) : (
                <button
                  type="submit"
                  onClick={handleSubmit}
                  disabled={loading}
                  className="px-6 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white rounded-xl transition-all flex items-center"
                >
                  {loading ? (
                    <>
                      <Loader className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      {isEditMode ? 'Update Agreement' : 'Create Agreement'}
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
};

export default RentalAgreementModal;
