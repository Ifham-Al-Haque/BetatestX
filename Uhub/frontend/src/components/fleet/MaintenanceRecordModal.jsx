import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Save, 
  Wrench, 
  Calendar, 
  DollarSign, 
  User, 
  FileText, 
  AlertCircle,
  CheckCircle,
  Clock,
  Car,
  Building,
  Loader
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import fleetService from '../../services/fleetService';

const MaintenanceRecordModal = ({ isOpen, onClose, record = null, onSuccess }) => {
  const { userProfile } = useAuth();
  const [formData, setFormData] = useState({
    vehicle_id: '',
    maintenance_type: 'Scheduled',
    description: '',
    service_provider: '',
    cost: '',
    mileage_at_service: '',
    service_date: new Date().toISOString().split('T')[0],
    next_service_date: '',
    status: 'Completed',
    technician_notes: '',
    parts_replaced: '',
    labor_hours: '',
    invoice_number: ''
  });

  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [step, setStep] = useState(1);

  const isEditMode = !!record;

  useEffect(() => {
    if (isOpen) {
      loadVehicles();
      if (record) {
        setFormData({
          vehicle_id: record.vehicle_id || '',
          maintenance_type: record.maintenance_type || 'Scheduled',
          description: record.description || '',
          service_provider: record.service_provider || '',
          cost: record.cost || '',
          mileage_at_service: record.mileage_at_service || '',
          service_date: record.service_date || new Date().toISOString().split('T')[0],
          next_service_date: record.next_service_date || '',
          status: record.status || 'Completed',
          technician_notes: record.technician_notes || '',
          parts_replaced: Array.isArray(record.parts_replaced) 
            ? record.parts_replaced.join(', ') 
            : record.parts_replaced || '',
          labor_hours: record.labor_hours || '',
          invoice_number: record.invoice_number || ''
        });
      }
    }
  }, [isOpen, record]);

  const loadVehicles = async () => {
    try {
      const data = await fleetService.getVehicles();
      setVehicles(data);
    } catch (error) {
      console.error('Error loading vehicles:', error);
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

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.vehicle_id) newErrors.vehicle_id = 'Vehicle is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (!formData.service_date) newErrors.service_date = 'Service date is required';
    if (formData.cost && isNaN(parseFloat(formData.cost))) {
      newErrors.cost = 'Cost must be a valid number';
    }
    if (formData.labor_hours && isNaN(parseFloat(formData.labor_hours))) {
      newErrors.labor_hours = 'Labor hours must be a valid number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      setLoading(true);
      
      const submitData = {
        ...formData,
        cost: formData.cost ? parseFloat(formData.cost) : null,
        labor_hours: formData.labor_hours ? parseFloat(formData.labor_hours) : null,
        mileage_at_service: formData.mileage_at_service ? parseInt(formData.mileage_at_service) : null,
        parts_replaced: formData.parts_replaced 
          ? formData.parts_replaced.split(',').map(part => part.trim()).filter(part => part)
          : [],
        created_by: userProfile?.id
      };

      if (isEditMode) {
        await fleetService.updateMaintenanceRecord(record.id, submitData);
      } else {
        await fleetService.createMaintenanceRecord(submitData);
      }

      onSuccess?.();
      handleClose();
    } catch (error) {
      console.error('Error saving maintenance record:', error);
      setErrors({ submit: error.message || 'Failed to save maintenance record' });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      vehicle_id: '',
      maintenance_type: 'Scheduled',
      description: '',
      service_provider: '',
      cost: '',
      mileage_at_service: '',
      service_date: new Date().toISOString().split('T')[0],
      next_service_date: '',
      status: 'Completed',
      technician_notes: '',
      parts_replaced: '',
      labor_hours: '',
      invoice_number: ''
    });
    setErrors({});
    setStep(1);
    onClose();
  };

  const nextStep = () => {
    if (step === 1) {
      // Validate basic info before moving to step 2
      const basicErrors = {};
      if (!formData.vehicle_id) basicErrors.vehicle_id = 'Vehicle is required';
      if (!formData.maintenance_type) basicErrors.maintenance_type = 'Maintenance type is required';
      if (!formData.description.trim()) basicErrors.description = 'Description is required';
      
      setErrors(basicErrors);
      if (Object.keys(basicErrors).length === 0) {
        setStep(2);
      }
    }
  };

  const prevStep = () => {
    setStep(1);
  };

  const getMaintenanceTypeColor = (type) => {
    switch (type) {
      case 'Scheduled': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Repair': return 'bg-red-100 text-red-800 border-red-200';
      case 'Emergency': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'Inspection': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'In Progress': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Scheduled': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
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
                  <Wrench className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-white">
                    {isEditMode ? 'Edit Maintenance Record' : 'New Maintenance Record'}
                  </h2>
                  <p className="text-blue-100 text-sm">
                    {isEditMode ? 'Update maintenance information' : 'Add new maintenance entry'}
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

          {/* Progress Indicator */}
          <div className="px-6 py-4 bg-gray-50 border-b">
            <div className="flex items-center justify-center space-x-4">
              <div className={`flex items-center space-x-2 ${step >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                }`}>
                  1
                </div>
                <span className="text-sm font-medium">Basic Info</span>
              </div>
              <div className={`w-16 h-0.5 ${step >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`} />
              <div className={`flex items-center space-x-2 ${step >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                }`}>
                  2
                </div>
                <span className="text-sm font-medium">Details</span>
              </div>
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
              {step === 1 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-6"
                >
                  {/* Vehicle Selection */}
                  <div className="bg-gray-50 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <Car className="w-5 h-5 mr-2 text-blue-600" />
                      Vehicle Information
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Vehicle *
                        </label>
                        <select
                          name="vehicle_id"
                          value={formData.vehicle_id}
                          onChange={handleInputChange}
                          className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                            errors.vehicle_id ? 'border-red-300 bg-red-50' : 'border-gray-300'
                          }`}
                        >
                          <option value="">Select Vehicle</option>
                          {vehicles.map(vehicle => (
                            <option key={vehicle.id} value={vehicle.id}>
                              {vehicle.vehicle_number} - {vehicle.make} {vehicle.model} ({vehicle.license_plate})
                            </option>
                          ))}
                        </select>
                        {errors.vehicle_id && (
                          <p className="text-red-600 text-sm mt-1">{errors.vehicle_id}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Current Mileage
                        </label>
                        <input
                          type="number"
                          name="mileage_at_service"
                          value={formData.mileage_at_service}
                          onChange={handleInputChange}
                          placeholder="e.g., 45000"
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Maintenance Type */}
                  <div className="bg-gray-50 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <Wrench className="w-5 h-5 mr-2 text-blue-600" />
                      Maintenance Type
                    </h3>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {['Scheduled', 'Repair', 'Emergency', 'Inspection'].map(type => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, maintenance_type: type }))}
                          className={`p-4 rounded-xl border-2 text-center transition-all hover:scale-105 ${
                            formData.maintenance_type === type
                              ? getMaintenanceTypeColor(type) + ' border-current'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="font-medium">{type}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description *
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows={4}
                      placeholder="Describe the maintenance work performed..."
                      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                        errors.description ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                    />
                    {errors.description && (
                      <p className="text-red-600 text-sm mt-1">{errors.description}</p>
                    )}
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-6"
                >
                  {/* Service Details */}
                  <div className="bg-gray-50 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <Calendar className="w-5 h-5 mr-2 text-blue-600" />
                      Service Details
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Service Date *
                        </label>
                        <input
                          type="date"
                          name="service_date"
                          value={formData.service_date}
                          onChange={handleInputChange}
                          className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                            errors.service_date ? 'border-red-300 bg-red-50' : 'border-gray-300'
                          }`}
                        />
                        {errors.service_date && (
                          <p className="text-red-600 text-sm mt-1">{errors.service_date}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Next Service Date
                        </label>
                        <input
                          type="date"
                          name="next_service_date"
                          value={formData.next_service_date}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Cost ($)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          name="cost"
                          value={formData.cost}
                          onChange={handleInputChange}
                          placeholder="0.00"
                          className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                            errors.cost ? 'border-red-300 bg-red-50' : 'border-gray-300'
                          }`}
                        />
                        {errors.cost && (
                          <p className="text-red-600 text-sm mt-1">{errors.cost}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Labor Hours
                        </label>
                        <input
                          type="number"
                          step="0.5"
                          name="labor_hours"
                          value={formData.labor_hours}
                          onChange={handleInputChange}
                          placeholder="0.0"
                          className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                            errors.labor_hours ? 'border-red-300 bg-red-50' : 'border-gray-300'
                          }`}
                        />
                        {errors.labor_hours && (
                          <p className="text-red-600 text-sm mt-1">{errors.labor_hours}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Provider Information */}
                  <div className="bg-gray-50 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <Building className="w-5 h-5 mr-2 text-blue-600" />
                      Service Provider
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Service Provider
                        </label>
                        <input
                          type="text"
                          name="service_provider"
                          value={formData.service_provider}
                          onChange={handleInputChange}
                          placeholder="e.g., AutoCare Center"
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Invoice Number
                        </label>
                        <input
                          type="text"
                          name="invoice_number"
                          value={formData.invoice_number}
                          onChange={handleInputChange}
                          placeholder="e.g., INV-2024-001"
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Status */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Status
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {['Scheduled', 'In Progress', 'Completed', 'Cancelled'].map(status => (
                        <button
                          key={status}
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, status }))}
                          className={`p-4 rounded-xl border-2 text-center transition-all hover:scale-105 ${
                            formData.status === status
                              ? getStatusColor(status) + ' border-current'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="font-medium">{status}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Additional Information */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Parts Replaced (comma-separated)
                      </label>
                      <input
                        type="text"
                        name="parts_replaced"
                        value={formData.parts_replaced}
                        onChange={handleInputChange}
                        placeholder="e.g., Oil Filter, Engine Oil, Air Filter"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Technician Notes
                      </label>
                      <textarea
                        name="technician_notes"
                        value={formData.technician_notes}
                        onChange={handleInputChange}
                        rows={3}
                        placeholder="Additional notes from the technician..."
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </form>

          {/* Footer */}
          <div className="px-6 py-4 bg-gray-50 border-t flex justify-between">
            <div className="flex space-x-3">
              {step > 1 && (
                <button
                  type="button"
                  onClick={prevStep}
                  className="px-6 py-2 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-all"
                >
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
              
              {step === 1 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all flex items-center"
                >
                  Next
                  <CheckCircle className="w-4 h-4 ml-2" />
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
                      {isEditMode ? 'Update Record' : 'Create Record'}
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

export default MaintenanceRecordModal;
