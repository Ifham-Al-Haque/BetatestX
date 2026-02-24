import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Car, User, Building, MapPin, Clock, DollarSign, FileText, Wrench, Tag, AlertCircle } from 'lucide-react';

const DetailsModal = ({ isOpen, onClose, data, type = 'record' }) => {
  if (!isOpen || !data) return null;

  const formatCurrency = (amount) => {
    if (!amount) return 'AED 0.00';
    return new Intl.NumberFormat('en-AE', {
      style: 'currency',
      currency: 'AED'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed': case 'closed': return 'bg-green-100 text-green-800 border-green-200';
      case 'in progress': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'scheduled': case 'assigned': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      case 'open': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'pending parts': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {type === 'record' ? (
                    <Wrench className="w-8 h-8" />
                  ) : (
                    <FileText className="w-8 h-8" />
                  )}
                  <div>
                    <h2 className="text-2xl font-bold">
                      {type === 'record' ? 'Maintenance Record Details' : 'Maintenance Ticket Details'}
                    </h2>
                    {type === 'ticket' && data.ticket_number && (
                      <p className="text-blue-100 text-sm font-mono mt-1">{data.ticket_number}</p>
                    )}
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-6">
                {/* Status and Type */}
                <div className="flex items-center space-x-3">
                  <span className={`px-4 py-2 rounded-full text-sm font-medium border ${getStatusColor(data.status)}`}>
                    {data.status}
                  </span>
                  {data.maintenance_type && (
                    <span className="px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium border border-blue-200">
                      {data.maintenance_type}
                    </span>
                  )}
                  {type === 'ticket' && data.priority && (
                    <span className={`px-4 py-2 rounded-full text-sm font-medium border ${
                      data.priority === 'Urgent' ? 'bg-red-100 text-red-800 border-red-200' :
                      data.priority === 'High' ? 'bg-orange-100 text-orange-800 border-orange-200' :
                      'bg-yellow-100 text-yellow-800 border-yellow-200'
                    }`}>
                      {data.priority} Priority
                    </span>
                  )}
                </div>

                {/* Title/Description */}
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {type === 'record' ? data.description : data.title}
                  </h3>
                  {data.description && type === 'ticket' && (
                    <p className="text-gray-600">{data.description}</p>
                  )}
                </div>

                {/* Vehicle Information */}
                {data.fleet_vehicles && (
                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <Car className="w-5 h-5 text-blue-600" />
                      <h4 className="font-semibold text-gray-900">Vehicle Information</h4>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Vehicle Number</p>
                        <p className="font-medium">{data.fleet_vehicles.vehicle_number}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Make & Model</p>
                        <p className="font-medium">{data.fleet_vehicles.make} {data.fleet_vehicles.model}</p>
                      </div>
                      {data.fleet_vehicles.license_plate && (
                        <div>
                          <p className="text-sm text-gray-600">License Plate</p>
                          <p className="font-medium">{data.fleet_vehicles.license_plate}</p>
                        </div>
                      )}
                      {data.fleet_vehicles.status && (
                        <div>
                          <p className="text-sm text-gray-600">Vehicle Status</p>
                          <p className="font-medium">{data.fleet_vehicles.status}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Additional Vehicle Details (for tickets) */}
                {type === 'ticket' && (data.vehicle_id_text || data.vehicle_plate_number || data.hardware_id || data.vehicle_model || data.vehicle_year || data.vehicle_color) && (
                  <div className="bg-blue-50 rounded-xl p-4 mb-6 border border-blue-200">
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                      <Car className="w-5 h-5 mr-2 text-blue-600" />
                      Additional Vehicle Details
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {data.vehicle_id_text && (
                        <div>
                          <p className="text-xs text-gray-600 uppercase tracking-wide">Vehicle ID</p>
                          <p className="font-medium text-gray-900">{data.vehicle_id_text}</p>
                        </div>
                      )}
                      {data.vehicle_plate_number && (
                        <div>
                          <p className="text-xs text-gray-600 uppercase tracking-wide">Plate Number</p>
                          <p className="font-medium text-gray-900">{data.vehicle_plate_number}</p>
                        </div>
                      )}
                      {data.hardware_id && (
                        <div>
                          <p className="text-xs text-gray-600 uppercase tracking-wide">Hardware ID</p>
                          <p className="font-medium text-gray-900">{data.hardware_id}</p>
                        </div>
                      )}
                      {data.vehicle_model && (
                        <div>
                          <p className="text-xs text-gray-600 uppercase tracking-wide">Model</p>
                          <p className="font-medium text-gray-900">{data.vehicle_model}</p>
                        </div>
                      )}
                      {data.vehicle_year && (
                        <div>
                          <p className="text-xs text-gray-600 uppercase tracking-wide">Year</p>
                          <p className="font-medium text-gray-900">{data.vehicle_year}</p>
                        </div>
                      )}
                      {data.vehicle_color && (
                        <div>
                          <p className="text-xs text-gray-600 uppercase tracking-wide">Color</p>
                          <p className="font-medium text-gray-900">{data.vehicle_color}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Garage Information (for tickets) */}
                {type === 'ticket' && (data.garage_name || data.garage_location) && (
                  <div className="bg-purple-50 rounded-xl p-4 mb-6 border border-purple-200">
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                      <Building className="w-5 h-5 mr-2 text-purple-600" />
                      Garage/Service Center
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {data.garage_name && (
                        <div>
                          <p className="text-xs text-gray-600 uppercase tracking-wide">Garage Name</p>
                          <p className="font-medium text-gray-900">{data.garage_name}</p>
                        </div>
                      )}
                      {data.garage_location && (
                        <div>
                          <p className="text-xs text-gray-600 uppercase tracking-wide">Location</p>
                          <p className="font-medium text-gray-900">{data.garage_location}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {type === 'record' ? (
                    <>
                      <div className="flex items-start space-x-3">
                        <Calendar className="w-5 h-5 text-gray-400 mt-1" />
                        <div>
                          <p className="text-sm text-gray-600">Service Date</p>
                          <p className="font-medium">{formatDate(data.service_date)}</p>
                        </div>
                      </div>
                      {data.next_service_date && (
                        <div className="flex items-start space-x-3">
                          <Calendar className="w-5 h-5 text-gray-400 mt-1" />
                          <div>
                            <p className="text-sm text-gray-600">Next Service Date</p>
                            <p className="font-medium">{formatDate(data.next_service_date)}</p>
                          </div>
                        </div>
                      )}
                      {data.service_provider && (
                        <div className="flex items-start space-x-3">
                          <Building className="w-5 h-5 text-gray-400 mt-1" />
                          <div>
                            <p className="text-sm text-gray-600">Service Provider</p>
                            <p className="font-medium">{data.service_provider}</p>
                          </div>
                        </div>
                      )}
                      {data.mileage_at_service && (
                        <div className="flex items-start space-x-3">
                          <MapPin className="w-5 h-5 text-gray-400 mt-1" />
                          <div>
                            <p className="text-sm text-gray-600">Mileage at Service</p>
                            <p className="font-medium">{data.mileage_at_service.toLocaleString()} km</p>
                          </div>
                        </div>
                      )}
                      {data.cost && (
                        <div className="flex items-start space-x-3">
                          <DollarSign className="w-5 h-5 text-gray-400 mt-1" />
                          <div>
                            <p className="text-sm text-gray-600">Cost</p>
                            <p className="font-medium text-lg">{formatCurrency(data.cost)}</p>
                          </div>
                        </div>
                      )}
                      {data.labor_hours && (
                        <div className="flex items-start space-x-3">
                          <Clock className="w-5 h-5 text-gray-400 mt-1" />
                          <div>
                            <p className="text-sm text-gray-600">Labor Hours</p>
                            <p className="font-medium">{data.labor_hours} hours</p>
                          </div>
                        </div>
                      )}
                      {data.invoice_number && (
                        <div className="flex items-start space-x-3">
                          <FileText className="w-5 h-5 text-gray-400 mt-1" />
                          <div>
                            <p className="text-sm text-gray-600">Invoice Number</p>
                            <p className="font-medium">{data.invoice_number}</p>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <div className="flex items-start space-x-3">
                        <Calendar className="w-5 h-5 text-gray-400 mt-1" />
                        <div>
                          <p className="text-sm text-gray-600">Created</p>
                          <p className="font-medium">{formatDate(data.created_at)}</p>
                        </div>
                      </div>
                      {data.estimated_completion_date && (
                        <div className="flex items-start space-x-3">
                          <Calendar className="w-5 h-5 text-gray-400 mt-1" />
                          <div>
                            <p className="text-sm text-gray-600">Estimated Completion</p>
                            <p className="font-medium">{formatDate(data.estimated_completion_date)}</p>
                          </div>
                        </div>
                      )}
                      {data.completed_at && (
                        <div className="flex items-start space-x-3">
                          <Calendar className="w-5 h-5 text-gray-400 mt-1" />
                          <div>
                            <p className="text-sm text-gray-600">Completed</p>
                            <p className="font-medium">{formatDate(data.completed_at)}</p>
                          </div>
                        </div>
                      )}
                      {data.estimated_cost && (
                        <div className="flex items-start space-x-3">
                          <DollarSign className="w-5 h-5 text-gray-400 mt-1" />
                          <div>
                            <p className="text-sm text-gray-600">Estimated Cost</p>
                            <p className="font-medium">{formatCurrency(data.estimated_cost)}</p>
                          </div>
                        </div>
                      )}
                      {data.actual_cost && (
                        <div className="flex items-start space-x-3">
                          <DollarSign className="w-5 h-5 text-gray-400 mt-1" />
                          <div>
                            <p className="text-sm text-gray-600">Actual Cost</p>
                            <p className="font-medium">{formatCurrency(data.actual_cost)}</p>
                          </div>
                        </div>
                      )}
                      {data.mileage_at_request && (
                        <div className="flex items-start space-x-3">
                          <MapPin className="w-5 h-5 text-gray-400 mt-1" />
                          <div>
                            <p className="text-sm text-gray-600">Mileage at Request</p>
                            <p className="font-medium">{data.mileage_at_request.toLocaleString()} km</p>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* People */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {data.employees && (
                    <div className="flex items-start space-x-3">
                      <User className="w-5 h-5 text-gray-400 mt-1" />
                      <div>
                        <p className="text-sm text-gray-600">
                          {type === 'record' ? 'Created By' : 'Requested By'}
                        </p>
                        <p className="font-medium">{data.employees.full_name}</p>
                        {data.employees.email && (
                          <p className="text-sm text-gray-500">{data.employees.email}</p>
                        )}
                      </div>
                    </div>
                  )}
                  {type === 'ticket' && data.assigned_employee && (
                    <div className="flex items-start space-x-3">
                      <User className="w-5 h-5 text-gray-400 mt-1" />
                      <div>
                        <p className="text-sm text-gray-600">Assigned To</p>
                        <p className="font-medium">{data.assigned_employee.full_name}</p>
                        {data.assigned_employee.email && (
                          <p className="text-sm text-gray-500">{data.assigned_employee.email}</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Notes */}
                {(data.technician_notes || data.notes) && (
                  <div className="bg-gray-50 rounded-xl p-4">
                    <h4 className="font-semibold text-gray-900 mb-2">Notes</h4>
                    <p className="text-gray-600 whitespace-pre-wrap">
                      {data.technician_notes || data.notes}
                    </p>
                  </div>
                )}

                {/* Parts Replaced */}
                {type === 'record' && data.parts_replaced && data.parts_replaced.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Parts Replaced</h4>
                    <div className="flex flex-wrap gap-2">
                      {data.parts_replaced.map((part, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-blue-50 text-blue-700 text-sm rounded-full border border-blue-200"
                        >
                          {part}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Conversion Info */}
                {type === 'ticket' && data.maintenance_record_id && (
                  <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                    <div className="flex items-center space-x-2">
                      <AlertCircle className="w-5 h-5 text-green-600" />
                      <p className="text-green-800 font-medium">
                        This ticket has been converted to a maintenance record
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 p-4 flex justify-end">
              <button
                onClick={onClose}
                className="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-colors"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default DetailsModal;

