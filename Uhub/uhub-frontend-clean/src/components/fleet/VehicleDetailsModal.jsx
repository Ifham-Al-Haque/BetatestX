import React, { useState, useEffect } from 'react';
import { X, Car, User, Building, Wrench, Fuel, AlertTriangle, Calendar, MapPin, DollarSign } from 'lucide-react';
import fleetService from '../../services/fleetService';

const VehicleDetailsModal = ({ isOpen, onClose, vehicleId }) => {
  const [vehicle, setVehicle] = useState(null);
  const [maintenanceRecords, setMaintenanceRecords] = useState([]);
  const [fuelLogs, setFuelLogs] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('details');

  useEffect(() => {
    if (isOpen && vehicleId) {
      loadVehicleDetails();
    }
  }, [isOpen, vehicleId]);

  const loadVehicleDetails = async () => {
    try {
      setLoading(true);
      const [vehicleData, maintenanceData, fuelData, incidentsData] = await Promise.all([
        fleetService.getVehicle(vehicleId),
        fleetService.getMaintenanceRecords(vehicleId),
        fleetService.getFuelLogs(vehicleId),
        fleetService.getIncidents(vehicleId)
      ]);

      setVehicle(vehicleData);
      setMaintenanceRecords(maintenanceData);
      setFuelLogs(fuelData);
      setIncidents(incidentsData);
    } catch (error) {
      console.error('Error loading vehicle details:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString();
  };

  const formatCurrency = (amount) => {
    if (!amount) return 'Not set';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active':
        return 'bg-green-100 text-green-800';
      case 'Maintenance':
        return 'bg-yellow-100 text-yellow-800';
      case 'Out of Service':
        return 'bg-red-100 text-red-800';
      case 'Retired':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'Minor':
        return 'bg-blue-100 text-blue-800';
      case 'Moderate':
        return 'bg-yellow-100 text-yellow-800';
      case 'Major':
        return 'bg-orange-100 text-orange-800';
      case 'Critical':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (!isOpen || !vehicleId) return null;

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading vehicle details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl p-8">
          <div className="text-center">
            <p className="text-gray-600">Vehicle not found</p>
            <button
              onClick={onClose}
              className="mt-4 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Car className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {vehicle.make} {vehicle.model} - {vehicle.vehicle_number}
              </h2>
              <p className="text-sm text-gray-500">
                License: {vehicle.license_plate} • Status: {vehicle.status}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'details', label: 'Details', icon: Car },
              { id: 'maintenance', label: 'Maintenance', icon: Wrench },
              { id: 'fuel', label: 'Fuel Logs', icon: Fuel },
              { id: 'incidents', label: 'Incidents', icon: AlertTriangle }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* Details Tab */}
          {activeTab === 'details' && (
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Vehicle Number:</span>
                      <span className="font-medium">{vehicle.vehicle_number}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Make & Model:</span>
                      <span className="font-medium">{vehicle.make} {vehicle.model}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Year:</span>
                      <span className="font-medium">{vehicle.year}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">License Plate:</span>
                      <span className="font-medium">{vehicle.license_plate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">VIN:</span>
                      <span className="font-medium">{vehicle.vin || 'Not provided'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Color:</span>
                      <span className="font-medium">{vehicle.color || 'Not specified'}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Technical Specifications</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Fuel Type:</span>
                      <span className="font-medium">{vehicle.fuel_type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Transmission:</span>
                      <span className="font-medium">{vehicle.transmission}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Engine Size:</span>
                      <span className="font-medium">{vehicle.engine_size || 'Not specified'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Mileage:</span>
                      <span className="font-medium">{vehicle.mileage?.toLocaleString()} km</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Fuel Efficiency:</span>
                      <span className="font-medium">
                        {vehicle.fuel_efficiency ? `${vehicle.fuel_efficiency} km/l` : 'Not specified'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(vehicle.status)}`}>
                        {vehicle.status}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Assignment Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Building className="w-5 h-5 mr-2" />
                    Department Assignment
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Department:</span>
                      <span className="font-medium">
                        {vehicle.departments?.name || 'Not assigned'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <User className="w-5 h-5 mr-2" />
                    Driver Assignment
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Assigned Driver:</span>
                      <span className="font-medium">
                        {vehicle.employees?.full_name || 'Not assigned'}
                      </span>
                    </div>
                    {vehicle.employees?.email && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Driver Email:</span>
                        <span className="font-medium">{vehicle.employees.email}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Important Dates */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Calendar className="w-5 h-5 mr-2" />
                  Important Dates
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <div className="text-sm text-gray-600">Purchase Date</div>
                    <div className="font-medium">{formatDate(vehicle.purchase_date)}</div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm text-gray-600">Insurance Expiry</div>
                    <div className="font-medium">{formatDate(vehicle.insurance_expiry)}</div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm text-gray-600">Registration Expiry</div>
                    <div className="font-medium">{formatDate(vehicle.registration_expiry)}</div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm text-gray-600">Last Service</div>
                    <div className="font-medium">{formatDate(vehicle.last_service_date)}</div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm text-gray-600">Next Service</div>
                    <div className="font-medium">{formatDate(vehicle.next_service_date)}</div>
                  </div>
                </div>
              </div>

              {/* Financial Information */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <DollarSign className="w-5 h-5 mr-2" />
                  Financial Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="text-sm text-gray-600">Purchase Price</div>
                    <div className="font-medium">{formatCurrency(vehicle.purchase_price)}</div>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {vehicle.notes && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Notes</h3>
                  <p className="text-gray-700">{vehicle.notes}</p>
                </div>
              )}
            </div>
          )}

          {/* Maintenance Tab */}
          {activeTab === 'maintenance' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Maintenance Records</h3>
                <span className="text-sm text-gray-500">
                  {maintenanceRecords.length} record(s)
                </span>
              </div>
              
              {maintenanceRecords.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Wrench className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No maintenance records found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {maintenanceRecords.map((record) => (
                    <div key={record.id} className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-3">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            record.status === 'Completed' ? 'bg-green-100 text-green-800' :
                            record.status === 'In Progress' ? 'bg-yellow-100 text-yellow-800' :
                            record.status === 'Scheduled' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {record.status}
                          </span>
                          <span className="text-sm text-gray-500">
                            {record.maintenance_type}
                          </span>
                        </div>
                        <span className="text-sm text-gray-500">
                          {formatDate(record.service_date)}
                        </span>
                      </div>
                      <p className="text-gray-900 mb-2">{record.description}</p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Service Provider:</span>
                          <p className="font-medium">{record.service_provider || 'Not specified'}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Cost:</span>
                          <p className="font-medium">{formatCurrency(record.cost)}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Mileage:</span>
                          <p className="font-medium">{record.mileage_at_service?.toLocaleString()} km</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Next Service:</span>
                          <p className="font-medium">{formatDate(record.next_service_date)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Fuel Tab */}
          {activeTab === 'fuel' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Fuel Logs</h3>
                <span className="text-sm text-gray-500">
                  {fuelLogs.length} record(s)
                </span>
              </div>
              
              {fuelLogs.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Fuel className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No fuel logs found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {fuelLogs.map((log) => (
                    <div key={log.id} className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-3">
                          <span className="text-sm text-gray-500">
                            {log.fuel_type}
                          </span>
                        </div>
                        <span className="text-sm text-gray-500">
                          {formatDate(log.fuel_date)}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Quantity:</span>
                          <p className="font-medium">{log.quantity_liters}L</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Cost per Liter:</span>
                          <p className="font-medium">{formatCurrency(log.cost_per_liter)}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Total Cost:</span>
                          <p className="font-medium">{formatCurrency(log.total_cost)}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Mileage:</span>
                          <p className="font-medium">{log.mileage_at_fuel?.toLocaleString()} km</p>
                        </div>
                      </div>
                      {log.fuel_station && (
                        <div className="mt-2 text-sm">
                          <span className="text-gray-600">Station: </span>
                          <span className="font-medium">{log.fuel_station}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Incidents Tab */}
          {activeTab === 'incidents' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Incidents</h3>
                <span className="text-sm text-gray-500">
                  {incidents.length} incident(s)
                </span>
              </div>
              
              {incidents.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No incidents reported</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {incidents.map((incident) => (
                    <div key={incident.id} className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-3">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(incident.severity)}`}>
                            {incident.severity}
                          </span>
                          <span className="text-sm text-gray-500">
                            {incident.incident_type}
                          </span>
                        </div>
                        <span className="text-sm text-gray-500">
                          {formatDate(incident.incident_date)}
                        </span>
                      </div>
                      <p className="text-gray-900 mb-2">{incident.description}</p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Location:</span>
                          <p className="font-medium">{incident.location || 'Not specified'}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Status:</span>
                          <p className="font-medium">{incident.status}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Estimated Cost:</span>
                          <p className="font-medium">{formatCurrency(incident.estimated_cost)}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Actual Cost:</span>
                          <p className="font-medium">{formatCurrency(incident.actual_cost)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VehicleDetailsModal;
