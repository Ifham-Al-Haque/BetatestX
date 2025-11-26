import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Save, 
  Ticket, 
  Calendar, 
  DollarSign, 
  User, 
  AlertCircle,
  CheckCircle,
  Clock,
  Car,
  Building,
  Loader,
  AlertTriangle,
  FileText,
  MapPin
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import fleetService from '../../services/fleetService';

const MaintenanceTicketModal = ({ isOpen, onClose, ticket = null, onSuccess }) => {
  const { userProfile } = useAuth();
  const [formData, setFormData] = useState({
    vehicle_id: '',
    vehicle_id_text: '', // Manual vehicle ID entry
    vehicle_plate_number: '',
    hardware_id: '',
    vehicle_model: '',
    vehicle_year: '',
    vehicle_color: '',
    garage_name: '',
    garage_location: '',
    title: '',
    description: '',
    maintenance_type: 'Repair',
    priority: 'Medium',
    status: 'Open',
    assigned_to: '',
    estimated_cost: '',
    estimated_completion_date: '',
    mileage_at_request: '',
    location: '',
    urgency_reason: '',
    notes: ''
  });

  const [vehicles, setVehicles] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [step, setStep] = useState(1);

  const isEditMode = !!ticket;

  useEffect(() => {
    if (isOpen) {
      loadVehicles();
      loadEmployees();
      if (ticket) {
        setFormData({
          vehicle_id: ticket.vehicle_id || '',
          vehicle_id_text: ticket.vehicle_id_text || ticket.vehicle_id || '',
          vehicle_plate_number: ticket.vehicle_plate_number || '',
          hardware_id: ticket.hardware_id || '',
          vehicle_model: ticket.vehicle_model || '',
          vehicle_year: ticket.vehicle_year || '',
          vehicle_color: ticket.vehicle_color || '',
          garage_name: ticket.garage_name || '',
          garage_location: ticket.garage_location || '',
          title: ticket.title || '',
          description: ticket.description || '',
          maintenance_type: ticket.maintenance_type || 'Repair',
          priority: ticket.priority || 'Medium',
          status: ticket.status || 'Open',
          assigned_to: ticket.assigned_to || '',
          estimated_cost: ticket.estimated_cost || '',
          estimated_completion_date: ticket.estimated_completion_date || '',
          mileage_at_request: ticket.mileage_at_request || '',
          location: ticket.location || '',
          urgency_reason: ticket.urgency_reason || '',
          notes: ticket.notes || ''
        });
      }
    }
  }, [isOpen, ticket]);

  const loadVehicles = async () => {
    try {
      const data = await fleetService.getVehicles();
      setVehicles(data);
    } catch (error) {
      console.error('Error loading vehicles:', error);
    }
  };

  const loadEmployees = async () => {
    try {
      const data = await fleetService.getAvailableDrivers();
      setEmployees(data);
    } catch (error) {
      console.error('Error loading employees:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    // Vehicle ID can be either vehicle_id (UUID) or vehicle_id_text (manual)
    if (!formData.vehicle_id?.trim() && !formData.vehicle_id_text?.trim()) {
      newErrors.vehicle_id = 'Vehicle ID is required (enter manually or select from list)';
    }
    if (!formData.vehicle_plate_number?.trim()) newErrors.vehicle_plate_number = 'Vehicle plate number is required';
    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (!formData.garage_name?.trim()) newErrors.garage_name = 'Garage name is required';
    if (formData.estimated_cost && isNaN(parseFloat(formData.estimated_cost))) {
      newErrors.estimated_cost = 'Estimated cost must be a valid number';
    }
    if (formData.priority === 'Urgent' && !formData.urgency_reason.trim()) {
      newErrors.urgency_reason = 'Please provide a reason for urgent priority';
    }
    if (formData.vehicle_year && (isNaN(parseInt(formData.vehicle_year)) || parseInt(formData.vehicle_year) < 1900 || parseInt(formData.vehicle_year) > new Date().getFullYear() + 1)) {
      newErrors.vehicle_year = 'Please enter a valid year';
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
        // Use vehicle_id_text if vehicle_id is not a UUID, otherwise use vehicle_id
        vehicle_id: formData.vehicle_id || null, // Keep UUID if selected
        estimated_cost: formData.estimated_cost ? parseFloat(formData.estimated_cost) : null,
        mileage_at_request: formData.mileage_at_request ? parseInt(formData.mileage_at_request) : null,
        vehicle_year: formData.vehicle_year ? parseInt(formData.vehicle_year) : null,
        requested_by: userProfile?.id,
        assigned_to: formData.assigned_to || null
      };

      if (isEditMode) {
        await fleetService.updateMaintenanceTicket(ticket.id, submitData);
      } else {
        await fleetService.createMaintenanceTicket(submitData);
      }

      onSuccess?.();
      handleClose();
    } catch (error) {
      console.error('Error saving maintenance ticket:', error);
      setErrors({ submit: error.message || 'Failed to save maintenance ticket' });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      vehicle_id: '',
      vehicle_id_text: '',
      vehicle_plate_number: '',
      hardware_id: '',
      vehicle_model: '',
      vehicle_year: '',
      vehicle_color: '',
      garage_name: '',
      garage_location: '',
      title: '',
      description: '',
      maintenance_type: 'Repair',
      priority: 'Medium',
      status: 'Open',
      assigned_to: '',
      estimated_cost: '',
      estimated_completion_date: '',
      mileage_at_request: '',
      location: '',
      urgency_reason: '',
      notes: ''
    });
    setErrors({});
    setStep(1);
    onClose();
  };

  const nextStep = () => {
    if (step === 1) {
      const basicErrors = {};
      if (!formData.vehicle_id?.trim() && !formData.vehicle_id_text?.trim()) {
        basicErrors.vehicle_id = 'Vehicle ID is required (enter manually or select from list)';
      }
      if (!formData.vehicle_plate_number?.trim()) basicErrors.vehicle_plate_number = 'Vehicle plate number is required';
      if (!formData.title.trim()) basicErrors.title = 'Title is required';
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

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'Urgent': return 'bg-red-100 text-red-800 border-red-200';
      case 'High': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'Medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
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
          <div className="bg-gradient-to-r from-orange-600 to-red-600 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <Ticket className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-white">
                    {isEditMode ? 'Edit Maintenance Ticket' : 'Create Maintenance Ticket'}
                  </h2>
                  <p className="text-orange-100 text-sm">
                    {isEditMode ? 'Update ticket information' : 'Request maintenance for a vehicle'}
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
              <div className={`flex items-center space-x-2 ${step >= 1 ? 'text-orange-600' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step >= 1 ? 'bg-orange-600 text-white' : 'bg-gray-200 text-gray-600'
                }`}>
                  1
                </div>
                <span className="text-sm font-medium">Request Details</span>
              </div>
              <div className={`w-16 h-0.5 ${step >= 2 ? 'bg-orange-600' : 'bg-gray-200'}`} />
              <div className={`flex items-center space-x-2 ${step >= 2 ? 'text-orange-600' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step >= 2 ? 'bg-orange-600 text-white' : 'bg-gray-200 text-gray-600'
                }`}>
                  2
                </div>
                <span className="text-sm font-medium">Additional Info</span>
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
                      <Car className="w-5 h-5 mr-2 text-orange-600" />
                      Vehicle Information
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Vehicle ID (Manual Input) *
                        </label>
                        <input
                          type="text"
                          name="vehicle_id_text"
                          value={formData.vehicle_id_text}
                          onChange={handleInputChange}
                          placeholder="Enter Vehicle ID (e.g., FLEET-001)"
                          className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all ${
                            errors.vehicle_id ? 'border-red-300 bg-red-50' : 'border-gray-300'
                          }`}
                        />
                        {errors.vehicle_id && (
                          <p className="text-red-600 text-sm mt-1">{errors.vehicle_id}</p>
                        )}
                        <p className="text-xs text-gray-500 mt-1">Enter vehicle identifier manually</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Vehicle Plate Number *
                        </label>
                        <input
                          type="text"
                          name="vehicle_plate_number"
                          value={formData.vehicle_plate_number}
                          onChange={handleInputChange}
                          placeholder="e.g., ABC-1234"
                          className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all ${
                            errors.vehicle_plate_number ? 'border-red-300 bg-red-50' : 'border-gray-300'
                          }`}
                        />
                        {errors.vehicle_plate_number && (
                          <p className="text-red-600 text-sm mt-1">{errors.vehicle_plate_number}</p>
                        )}
                      </div>
                    </div>

                    {/* Additional Vehicle Details */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Hardware ID
                        </label>
                        <input
                          type="text"
                          name="hardware_id"
                          value={formData.hardware_id}
                          onChange={handleInputChange}
                          placeholder="e.g., HW-12345"
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Vehicle Model
                        </label>
                        <input
                          type="text"
                          name="vehicle_model"
                          value={formData.vehicle_model}
                          onChange={handleInputChange}
                          placeholder="e.g., Toyota Hiace"
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Year
                        </label>
                        <input
                          type="number"
                          name="vehicle_year"
                          value={formData.vehicle_year}
                          onChange={handleInputChange}
                          placeholder="e.g., 2020"
                          min="1900"
                          max={new Date().getFullYear() + 1}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Vehicle Color
                        </label>
                        <input
                          type="text"
                          name="vehicle_color"
                          value={formData.vehicle_color}
                          onChange={handleInputChange}
                          placeholder="e.g., White, Black, Silver"
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Current Mileage
                        </label>
                        <input
                          type="number"
                          name="mileage_at_request"
                          value={formData.mileage_at_request}
                          onChange={handleInputChange}
                          placeholder="e.g., 45000"
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                        />
                      </div>
                    </div>

                    {/* Quick Vehicle Selector (Optional) */}
                    <div className="mt-6 pt-6 border-t border-gray-300">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Quick Select from Existing Vehicles (Optional)
                      </label>
                      <select
                        onChange={(e) => {
                          if (e.target.value) {
                            const selectedVehicle = vehicles.find(v => v.id === e.target.value);
                            if (selectedVehicle) {
                              setFormData(prev => ({
                                ...prev,
                                vehicle_id: selectedVehicle.id,
                                vehicle_id_text: selectedVehicle.vehicle_number || prev.vehicle_id_text,
                                vehicle_plate_number: selectedVehicle.license_plate || prev.vehicle_plate_number,
                                vehicle_model: selectedVehicle.model || prev.vehicle_model,
                                vehicle_year: selectedVehicle.year || prev.vehicle_year,
                                vehicle_color: selectedVehicle.color || prev.vehicle_color
                              }));
                            }
                          }
                        }}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                      >
                        <option value="">Select to auto-fill vehicle details (Optional)</option>
                        {vehicles.map(vehicle => (
                          <option key={vehicle.id} value={vehicle.id}>
                            {vehicle.vehicle_number} - {vehicle.make} {vehicle.model} ({vehicle.license_plate})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Ticket Title & Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ticket Title *
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      placeholder="e.g., Engine Oil Leak"
                      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all ${
                        errors.title ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                    />
                    {errors.title && (
                      <p className="text-red-600 text-sm mt-1">{errors.title}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description *
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows={4}
                      placeholder="Describe the maintenance issue or request..."
                      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all ${
                        errors.description ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                    />
                    {errors.description && (
                      <p className="text-red-600 text-sm mt-1">{errors.description}</p>
                    )}
                  </div>

                  {/* Maintenance Type */}
                  <div className="bg-gray-50 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <FileText className="w-5 h-5 mr-2 text-orange-600" />
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

                  {/* Priority */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Priority Level
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {['Low', 'Medium', 'High', 'Urgent'].map(priority => (
                        <button
                          key={priority}
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, priority }))}
                          className={`p-4 rounded-xl border-2 text-center transition-all hover:scale-105 ${
                            formData.priority === priority
                              ? getPriorityColor(priority) + ' border-current'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="font-medium">{priority}</div>
                        </button>
                      ))}
                    </div>
                    {formData.priority === 'Urgent' && (
                      <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Urgency Reason *
                        </label>
                        <textarea
                          name="urgency_reason"
                          value={formData.urgency_reason}
                          onChange={handleInputChange}
                          rows={2}
                          placeholder="Explain why this is urgent..."
                          className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all ${
                            errors.urgency_reason ? 'border-red-300 bg-red-50' : 'border-gray-300'
                          }`}
                        />
                        {errors.urgency_reason && (
                          <p className="text-red-600 text-sm mt-1">{errors.urgency_reason}</p>
                        )}
                      </div>
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
                  {/* Assignment & Status */}
                  <div className="bg-gray-50 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <User className="w-5 h-5 mr-2 text-orange-600" />
                      Assignment & Status
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Assign To
                        </label>
                        <select
                          name="assigned_to"
                          value={formData.assigned_to}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                        >
                          <option value="">Unassigned</option>
                          {employees.map(emp => (
                            <option key={emp.id} value={emp.id}>
                              {emp.full_name} ({emp.email})
                            </option>
                          ))}
                        </select>
                      </div>

                      {isEditMode && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Status
                          </label>
                          <select
                            name="status"
                            value={formData.status}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                          >
                            <option value="Open">Open</option>
                            <option value="Assigned">Assigned</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Pending Parts">Pending Parts</option>
                            <option value="Completed">Completed</option>
                            <option value="Cancelled">Cancelled</option>
                            <option value="Closed">Closed</option>
                          </select>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Garage Information */}
                  <div className="bg-gray-50 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <Building className="w-5 h-5 mr-2 text-orange-600" />
                      Garage/Service Center Information
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Garage Name *
                        </label>
                        <input
                          type="text"
                          name="garage_name"
                          value={formData.garage_name}
                          onChange={handleInputChange}
                          placeholder="e.g., Al Futtaim Auto Service"
                          className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all ${
                            errors.garage_name ? 'border-red-300 bg-red-50' : 'border-gray-300'
                          }`}
                        />
                        {errors.garage_name && (
                          <p className="text-red-600 text-sm mt-1">{errors.garage_name}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Garage Location
                        </label>
                        <input
                          type="text"
                          name="garage_location"
                          value={formData.garage_location}
                          onChange={handleInputChange}
                          placeholder="e.g., Dubai, Sheikh Zayed Road"
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Cost & Dates */}
                  <div className="bg-gray-50 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <DollarSign className="w-5 h-5 mr-2 text-orange-600" />
                      Cost & Timeline
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Estimated Cost ($)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          name="estimated_cost"
                          value={formData.estimated_cost}
                          onChange={handleInputChange}
                          placeholder="0.00"
                          className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all ${
                            errors.estimated_cost ? 'border-red-300 bg-red-50' : 'border-gray-300'
                          }`}
                        />
                        {errors.estimated_cost && (
                          <p className="text-red-600 text-sm mt-1">{errors.estimated_cost}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Estimated Completion Date
                        </label>
                        <input
                          type="date"
                          name="estimated_completion_date"
                          value={formData.estimated_completion_date}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Location */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                      <MapPin className="w-4 h-4 mr-2" />
                      Vehicle Location
                    </label>
                    <input
                      type="text"
                      name="location"
                      value={formData.location}
                      onChange={handleInputChange}
                      placeholder="e.g., Main Garage, Parking Lot A, On Route"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                    />
                  </div>

                  {/* Additional Notes */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Additional Notes
                    </label>
                    <textarea
                      name="notes"
                      value={formData.notes}
                      onChange={handleInputChange}
                      rows={3}
                      placeholder="Any additional information or special instructions..."
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                    />
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
                  className="px-6 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl transition-all flex items-center"
                >
                  Next
                  <CheckCircle className="w-4 h-4 ml-2" />
                </button>
              ) : (
                <button
                  type="submit"
                  onClick={handleSubmit}
                  disabled={loading}
                  className="px-6 py-2 bg-orange-600 hover:bg-orange-700 disabled:bg-orange-400 text-white rounded-xl transition-all flex items-center"
                >
                  {loading ? (
                    <>
                      <Loader className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      {isEditMode ? 'Update Ticket' : 'Create Ticket'}
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

export default MaintenanceTicketModal;

