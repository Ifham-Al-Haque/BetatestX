import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Save, 
  Car, 
  Smartphone,
  MapPin,
  Palette,
  Key,
  CreditCard,
  Wifi,
  Settings,
  CheckCircle,
  AlertCircle,
  Calendar,
  Building,
  User,
  Hash,
  Loader,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import fleetOnboardingService from '../../services/fleetOnboardingService';

const FleetOnboardingModal = ({ isOpen, onClose, vehicle = null, onSuccess }) => {
  const { userProfile } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Basic Vehicle Information
    vehicle_number: '',
    make: '',
    model: '',
    model_year: new Date().getFullYear(),
    color: '',
    
    // Vehicle Identification
    chassis_number: '',
    vin_number: '',
    license_plate: '',
    
    // IoT and Technology
    iot_device_imei: '',
    sim_card_imei: '',
    
    // Location and Assignment
    fleet_intended_location: '',
    department_id: '',
    assigned_driver_id: '',
    
    // Technical Specifications
    fuel_type: 'Petrol',
    transmission: 'Manual',
    engine_size: '',
    
    // Dates and Financial
    purchase_date: '',
    purchase_price: '',
    insurance_expiry: '',
    registration_expiry: '',

    // Ownership & contract
    owned_by: '',
    contract_number: '',
    contract_expiry: '',
    mulkiya_number: '',

    // Additional Information
    notes: ''
  });

  const [departments, setDepartments] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const isEditMode = !!vehicle;
  const totalSteps = 4;

  const stepTitles = {
    1: 'Basic Information',
    2: 'Vehicle Identification',
    3: 'Technology & Location',
    4: 'Additional Details'
  };

  useEffect(() => {
    if (isOpen) {
      loadFormData();
      if (vehicle) {
        populateFormData();
      }
    }
  }, [isOpen, vehicle]);

  const loadFormData = async () => {
    try {
      const [deptsData, driversData] = await Promise.all([
        fleetOnboardingService.getDepartments(),
        fleetOnboardingService.getAvailableDrivers()
      ]);
      
      setDepartments(deptsData);
      setDrivers(driversData);
    } catch (error) {
      console.error('Error loading form data:', error);
    }
  };

  const populateFormData = () => {
    if (vehicle) {
      setFormData({
        vehicle_number: vehicle.vehicle_number || '',
        make: vehicle.make || '',
        model: vehicle.model || '',
        model_year: vehicle.model_year || new Date().getFullYear(),
        color: vehicle.color || '',
        chassis_number: vehicle.chassis_number || '',
        vin_number: vehicle.vin_number || '',
        license_plate: vehicle.license_plate || '',
        iot_device_imei: vehicle.iot_device_imei || '',
        sim_card_imei: vehicle.sim_card_imei || '',
        fleet_intended_location: vehicle.fleet_intended_location || '',
        department_id: vehicle.department_id || '',
        assigned_driver_id: vehicle.assigned_driver_id || '',
        fuel_type: vehicle.fuel_type || 'Petrol',
        transmission: vehicle.transmission || 'Manual',
        engine_size: vehicle.engine_size || '',
        purchase_date: vehicle.purchase_date || '',
        purchase_price: vehicle.purchase_price || '',
        insurance_expiry: vehicle.insurance_expiry || '',
        registration_expiry: vehicle.registration_expiry || '',
        owned_by: vehicle.owned_by || '',
        contract_number: vehicle.contract_number || '',
        contract_expiry: vehicle.contract_expiry || '',
        mulkiya_number: vehicle.mulkiya_number || '',
        notes: vehicle.notes || ''
      });
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateStep = (step) => {
    const newErrors = {};
    
    switch (step) {
      case 1:
        if (!formData.vehicle_number.trim()) newErrors.vehicle_number = 'Vehicle number is required';
        if (!formData.make.trim()) newErrors.make = 'Make is required';
        if (!formData.model.trim()) newErrors.model = 'Model is required';
        if (!formData.model_year || formData.model_year < 1900) newErrors.model_year = 'Valid model year is required';
        break;
      
      case 2:
        if (!formData.license_plate.trim()) newErrors.license_plate = 'License plate is required';
        if (formData.vin_number && formData.vin_number.length !== 17) {
          newErrors.vin_number = 'VIN must be exactly 17 characters';
        }
        break;
      
      case 3:
        if (formData.iot_device_imei && formData.iot_device_imei.length !== 15) {
          newErrors.iot_device_imei = 'IoT Device IMEI must be exactly 15 digits';
        }
        if (formData.sim_card_imei && formData.sim_card_imei.length !== 15) {
          newErrors.sim_card_imei = 'SIM Card IMEI must be exactly 15 digits';
        }
        break;
      
      case 4:
        if (formData.purchase_price && isNaN(parseFloat(formData.purchase_price))) {
          newErrors.purchase_price = 'Purchase price must be a valid number';
        }
        break;
      
      default:
        // No validation for unknown steps
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
      
      const submitData = {
        ...formData,
        purchase_price: formData.purchase_price ? parseFloat(formData.purchase_price) : null,
        created_by: userProfile?.id,
        updated_by: userProfile?.id
      };

      if (isEditMode) {
        await fleetOnboardingService.updateVehicleInfo(vehicle.id, submitData);
      } else {
        await fleetOnboardingService.createVehicleForOnboarding(submitData);
      }

      onSuccess?.();
      handleClose();
    } catch (error) {
      console.error('Error saving vehicle:', error);
      setErrors({ submit: error.message || 'Failed to save vehicle information' });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      vehicle_number: '',
      make: '',
      model: '',
      model_year: new Date().getFullYear(),
      color: '',
      chassis_number: '',
      vin_number: '',
      license_plate: '',
      iot_device_imei: '',
      sim_card_imei: '',
      fleet_intended_location: '',
      department_id: '',
      assigned_driver_id: '',
      fuel_type: 'Petrol',
      transmission: 'Manual',
      engine_size: '',
      purchase_date: '',
      purchase_price: '',
      insurance_expiry: '',
      registration_expiry: '',
      owned_by: '',
      contract_number: '',
      contract_expiry: '',
      mulkiya_number: '',
      notes: ''
    });
    setErrors({});
    setCurrentStep(1);
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
                <Car className="w-5 h-5 mr-2 text-blue-600" />
                Basic Vehicle Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Vehicle Number *
                  </label>
                  <input
                    type="text"
                    name="vehicle_number"
                    value={formData.vehicle_number}
                    onChange={handleInputChange}
                    placeholder="e.g., FL-001"
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                      errors.vehicle_number ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                  />
                  {errors.vehicle_number && (
                    <p className="text-red-600 text-sm mt-1">{errors.vehicle_number}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Model Year *
                  </label>
                  <input
                    type="number"
                    name="model_year"
                    value={formData.model_year}
                    onChange={handleInputChange}
                    min="1900"
                    max={new Date().getFullYear() + 1}
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                      errors.model_year ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                  />
                  {errors.model_year && (
                    <p className="text-red-600 text-sm mt-1">{errors.model_year}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Make/Brand *
                  </label>
                  <input
                    type="text"
                    name="make"
                    value={formData.make}
                    onChange={handleInputChange}
                    placeholder="e.g., Toyota"
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                      errors.make ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                  />
                  {errors.make && (
                    <p className="text-red-600 text-sm mt-1">{errors.make}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Model *
                  </label>
                  <input
                    type="text"
                    name="model"
                    value={formData.model}
                    onChange={handleInputChange}
                    placeholder="e.g., Camry"
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                      errors.model ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                  />
                  {errors.model && (
                    <p className="text-red-600 text-sm mt-1">{errors.model}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Color
                  </label>
                  <div className="flex items-center space-x-2">
                    <Palette className="w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      name="color"
                      value={formData.color}
                      onChange={handleInputChange}
                      placeholder="e.g., White, Silver"
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fuel Type
                  </label>
                  <select
                    name="fuel_type"
                    value={formData.fuel_type}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  >
                    <option value="Petrol">Petrol</option>
                    <option value="Diesel">Diesel</option>
                    <option value="Hybrid">Hybrid</option>
                    <option value="Electric">Electric</option>
                    <option value="CNG">CNG</option>
                  </select>
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
                <Hash className="w-5 h-5 mr-2 text-green-600" />
                Vehicle Identification
              </h3>
              
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    License Plate Number *
                  </label>
                  <input
                    type="text"
                    name="license_plate"
                    value={formData.license_plate}
                    onChange={handleInputChange}
                    placeholder="e.g., ABC-123"
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                      errors.license_plate ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                  />
                  {errors.license_plate && (
                    <p className="text-red-600 text-sm mt-1">{errors.license_plate}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Chassis Number
                  </label>
                  <input
                    type="text"
                    name="chassis_number"
                    value={formData.chassis_number}
                    onChange={handleInputChange}
                    placeholder="e.g., JTDBE32K123456789"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                  <p className="text-xs text-gray-500 mt-1">Also known as frame number</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    VIN Number (Vehicle Identification Number)
                  </label>
                  <input
                    type="text"
                    name="vin_number"
                    value={formData.vin_number}
                    onChange={handleInputChange}
                    placeholder="17-character VIN"
                    maxLength="17"
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                      errors.vin_number ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                  />
                  {errors.vin_number && (
                    <p className="text-red-600 text-sm mt-1">{errors.vin_number}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">Must be exactly 17 characters</p>
                </div>
              </div>
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
            <div className="bg-purple-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Wifi className="w-5 h-5 mr-2 text-purple-600" />
                Technology & IoT Devices
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    IoT Device IMEI Number
                  </label>
                  <div className="flex items-center space-x-2">
                    <Smartphone className="w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      name="iot_device_imei"
                      value={formData.iot_device_imei}
                      onChange={handleInputChange}
                      placeholder="15-digit IMEI"
                      maxLength="15"
                      className={`flex-1 px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                        errors.iot_device_imei ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                    />
                  </div>
                  {errors.iot_device_imei && (
                    <p className="text-red-600 text-sm mt-1">{errors.iot_device_imei}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    SIM Card IMEI Number
                  </label>
                  <div className="flex items-center space-x-2">
                    <CreditCard className="w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      name="sim_card_imei"
                      value={formData.sim_card_imei}
                      onChange={handleInputChange}
                      placeholder="15-digit IMEI"
                      maxLength="15"
                      className={`flex-1 px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                        errors.sim_card_imei ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                    />
                  </div>
                  {errors.sim_card_imei && (
                    <p className="text-red-600 text-sm mt-1">{errors.sim_card_imei}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-orange-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <MapPin className="w-5 h-5 mr-2 text-orange-600" />
                Location & Assignment
              </h3>
              
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fleet Intended Location
                  </label>
                  <input
                    type="text"
                    name="fleet_intended_location"
                    value={formData.fleet_intended_location}
                    onChange={handleInputChange}
                    placeholder="e.g., Dubai Marina, Business Bay"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Department
                    </label>
                    <div className="flex items-center space-x-2">
                      <Building className="w-4 h-4 text-gray-400" />
                      <select
                        name="department_id"
                        value={formData.department_id}
                        onChange={handleInputChange}
                        className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      >
                        <option value="">Select Department</option>
                        {departments.map(dept => (
                          <option key={dept.id} value={dept.id}>{dept.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Assigned Driver
                    </label>
                    <div className="flex items-center space-x-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <select
                        name="assigned_driver_id"
                        value={formData.assigned_driver_id}
                        onChange={handleInputChange}
                        className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      >
                        <option value="">Select Driver</option>
                        {drivers.map(driver => (
                          <option key={driver.id} value={driver.id}>{driver.full_name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        );

      case 4:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="bg-indigo-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Settings className="w-5 h-5 mr-2 text-indigo-600" />
                Additional Details
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Transmission
                  </label>
                  <select
                    name="transmission"
                    value={formData.transmission}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  >
                    <option value="Manual">Manual</option>
                    <option value="Automatic">Automatic</option>
                    <option value="CVT">CVT</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Engine Size
                  </label>
                  <input
                    type="text"
                    name="engine_size"
                    value={formData.engine_size}
                    onChange={handleInputChange}
                    placeholder="e.g., 2.0L, 1.8L"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Purchase Date
                  </label>
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <input
                      type="date"
                      name="purchase_date"
                      value={formData.purchase_date}
                      onChange={handleInputChange}
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Purchase Price
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="purchase_price"
                    value={formData.purchase_price}
                    onChange={handleInputChange}
                    placeholder="0.00"
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                      errors.purchase_price ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                  />
                  {errors.purchase_price && (
                    <p className="text-red-600 text-sm mt-1">{errors.purchase_price}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Insurance Expiry
                  </label>
                  <input
                    type="date"
                    name="insurance_expiry"
                    value={formData.insurance_expiry}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Registration Expiry
                  </label>
                  <input
                    type="date"
                    name="registration_expiry"
                    value={formData.registration_expiry}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Notes
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows={4}
                  placeholder="Any additional information about the vehicle..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Ownership & contract (kept in sync with the Fleet Record form) */}
            <div className="bg-emerald-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <CreditCard className="w-5 h-5 mr-2 text-emerald-600" />
                Ownership & Contract
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Car owned by</label>
                  <input
                    type="text"
                    name="owned_by"
                    value={formData.owned_by}
                    onChange={handleInputChange}
                    placeholder="e.g., UDrive / Leasing company"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Contract number</label>
                  <input
                    type="text"
                    name="contract_number"
                    value={formData.contract_number}
                    onChange={handleInputChange}
                    placeholder="e.g., CN-2026-0142"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Contract expiry</label>
                  <input
                    type="date"
                    name="contract_expiry"
                    value={formData.contract_expiry}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Mulkiya number</label>
                  <input
                    type="text"
                    name="mulkiya_number"
                    value={formData.mulkiya_number}
                    onChange={handleInputChange}
                    placeholder="Registration card no."
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
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
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <Car className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-white">
                    {isEditMode ? 'Edit Vehicle Information' : 'Fleet Vehicle Onboarding'}
                  </h2>
                  <p className="text-blue-100 text-sm">
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
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(currentStep / totalSteps) * 100}%` }}
              />
            </div>
            <div className="flex justify-between mt-2">
              {Array.from({ length: totalSteps }, (_, i) => (
                <div key={i} className={`text-xs ${i + 1 <= currentStep ? 'text-blue-600 font-medium' : 'text-gray-400'}`}>
                  Step {i + 1}
                </div>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(90vh-200px)]">
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

          {/* Footer */}
          <div className="px-6 py-4 bg-gray-50 border-t flex justify-between">
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
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all flex items-center"
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-2" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl transition-all flex items-center"
                >
                  {loading ? (
                    <>
                      <Loader className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      {isEditMode ? 'Update Vehicle' : 'Start Onboarding'}
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

export default FleetOnboardingModal;
