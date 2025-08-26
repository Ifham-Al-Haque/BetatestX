import React, { useState, useEffect } from 'react';
import { Car, Plus, Search, Filter, Download, Eye, Edit, Trash2, AlertTriangle, Wrench, Fuel } from 'lucide-react';

import VehicleModal from '../components/fleet/VehicleModal';
import VehicleDetailsModal from '../components/fleet/VehicleDetailsModal';
import fleetService from '../services/fleetService';

const FleetManagement = () => {
  const [fleetData, setFleetData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    department_id: '',
    make: ''
  });
  const [departments, setDepartments] = useState([]);
  const [statistics, setStatistics] = useState({
    total_vehicles: 0,
    active_vehicles: 0,
    maintenance_vehicles: 0,
    out_of_service_vehicles: 0,
    total_mileage: 0,
    avg_fuel_efficiency: 0
  });
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [selectedVehicleId, setSelectedVehicleId] = useState(null);

  useEffect(() => {
    loadFleetData();
    loadDepartments();
    loadStatistics();
  }, []);

  useEffect(() => {
    if (searchTerm || Object.values(filters).some(f => f)) {
      loadFleetData();
    }
  }, [searchTerm, filters]);

  const loadFleetData = async () => {
    try {
      setLoading(true);
      const data = await fleetService.getVehicles({
        search: searchTerm,
        ...filters
      });
      setFleetData(data);
    } catch (error) {
      console.error('Error loading fleet data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadDepartments = async () => {
    try {
      const data = await fleetService.getDepartments();
      setDepartments(data);
    } catch (error) {
      console.error('Error loading departments:', error);
    }
  };

  const loadStatistics = async () => {
    try {
      const data = await fleetService.getFleetStatistics();
      setStatistics(data);
    } catch (error) {
      console.error('Error loading statistics:', error);
    }
  };

  const handleAddVehicle = () => {
    setSelectedVehicle(null);
    setShowAddModal(true);
  };

  const handleEditVehicle = (vehicle) => {
    setSelectedVehicle(vehicle);
    setShowEditModal(true);
  };

  const handleViewVehicle = (vehicleId) => {
    setSelectedVehicleId(vehicleId);
    setShowDetailsModal(true);
  };

  const handleDeleteVehicle = async (vehicleId) => {
    if (window.confirm('Are you sure you want to delete this vehicle? This action cannot be undone.')) {
      try {
        await fleetService.deleteVehicle(vehicleId);
        loadFleetData();
        loadStatistics();
      } catch (error) {
        console.error('Error deleting vehicle:', error);
        alert('Failed to delete vehicle. Please try again.');
      }
    }
  };

  const handleModalSuccess = () => {
    loadFleetData();
    loadStatistics();
  };

  const handleCloseModals = () => {
    setShowAddModal(false);
    setShowEditModal(false);
    setShowDetailsModal(false);
    setSelectedVehicle(null);
    setSelectedVehicleId(null);
  };

  const clearFilters = () => {
    setFilters({
      status: '',
      department_id: '',
      make: ''
    });
    setSearchTerm('');
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

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString();
  };

  const formatMileage = (mileage) => {
    if (!mileage) return '0';
    return mileage.toLocaleString();
  };

  if (loading && fleetData.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading fleet data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      
      <div className="flex-1 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold text-gray-900">Fleet Management</h1>
              <div className="flex space-x-3">
                <button 
                  onClick={handleAddVehicle}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Vehicle
                </button>
                <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center">
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </button>
              </div>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-4 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search vehicles by number, license plate, make, or model..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div className="flex flex-wrap gap-3">
                <select
                  value={filters.status}
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Statuses</option>
                  <option value="Active">Active</option>
                  <option value="Maintenance">Maintenance</option>
                  <option value="Out of Service">Out of Service</option>
                  <option value="Retired">Retired</option>
                </select>

                <select
                  value={filters.department_id}
                  onChange={(e) => setFilters(prev => ({ ...prev, department_id: e.target.value }))}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Departments</option>
                  {departments.map(dept => (
                    <option key={dept.id} value={dept.id}>{dept.name}</option>
                  ))}
                </select>

                <select
                  value={filters.make}
                  onChange={(e) => setFilters(prev => ({ ...prev, make: e.target.value }))}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Makes</option>
                  {Array.from(new Set(fleetData.map(v => v.make))).map(make => (
                    <option key={make} value={make}>{make}</option>
                  ))}
                </select>

                <button 
                  onClick={clearFilters}
                  className="px-3 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Clear Filters
                </button>
              </div>
            </div>

            {/* Fleet Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h3 className="text-lg font-semibold text-blue-900">Total Vehicles</h3>
                <p className="text-3xl font-bold text-blue-600">{statistics.total_vehicles}</p>
                <p className="text-sm text-blue-700">In fleet</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <h3 className="text-lg font-semibold text-green-900">Active</h3>
                <p className="text-3xl font-bold text-green-600">{statistics.active_vehicles}</p>
                <p className="text-sm text-green-700">On duty</p>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <h3 className="text-lg font-semibold text-yellow-900">Maintenance</h3>
                <p className="text-3xl font-bold text-yellow-600">{statistics.maintenance_vehicles}</p>
                <p className="text-sm text-yellow-700">In service</p>
              </div>
              <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                <h3 className="text-lg font-semibold text-red-900">Out of Service</h3>
                <p className="text-3xl font-bold text-red-600">{statistics.out_of_service_vehicles}</p>
                <p className="text-sm text-red-700">Repair needed</p>
              </div>
            </div>

            {/* Additional Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Total Mileage</h3>
                <p className="text-2xl font-bold text-gray-700">{statistics.total_mileage?.toLocaleString()} km</p>
                <p className="text-sm text-gray-600">Combined fleet distance</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Avg Fuel Efficiency</h3>
                <p className="text-2xl font-bold text-gray-700">{statistics.avg_fuel_efficiency?.toFixed(1) || '0'} km/l</p>
                <p className="text-sm text-gray-600">Average across fleet</p>
              </div>
            </div>

            {/* Fleet Table */}
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Vehicle Inventory</h3>
                <p className="text-sm text-gray-500">
                  {fleetData.length} vehicle(s) found
                  {searchTerm && ` matching "${searchTerm}"`}
                </p>
              </div>
              
              {fleetData.length === 0 ? (
                <div className="text-center py-12">
                  <Car className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-500 text-lg mb-2">No vehicles found</p>
                  <p className="text-gray-400 mb-4">
                    {searchTerm || Object.values(filters).some(f => f) 
                      ? 'Try adjusting your search or filters'
                      : 'Get started by adding your first vehicle'
                    }
                  </p>
                  {!searchTerm && !Object.values(filters).some(f => f) && (
                    <button
                      onClick={handleAddVehicle}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Add First Vehicle
                    </button>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Vehicle
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Driver
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Department
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Last Service
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {fleetData.map((vehicle) => (
                        <tr key={vehicle.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                <Car className="w-6 h-6 text-blue-600" />
                              </div>
                              <div className="ml-3">
                                <div className="text-sm font-medium text-gray-900">
                                  {vehicle.make} {vehicle.model}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {vehicle.vehicle_number} • {vehicle.license_plate}
                                </div>
                                <div className="text-xs text-gray-400">
                                  {vehicle.year} • {formatMileage(vehicle.mileage)} km
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {vehicle.employees?.full_name || 'Not assigned'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(vehicle.status)}`}>
                              {vehicle.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {vehicle.departments?.name || 'Not assigned'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatDate(vehicle.last_service_date)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleViewVehicle(vehicle.id)}
                                className="text-blue-600 hover:text-blue-900 transition-colors"
                                title="View Details"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleEditVehicle(vehicle)}
                                className="text-green-600 hover:text-green-900 transition-colors"
                                title="Edit Vehicle"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteVehicle(vehicle.id)}
                                className="text-red-600 hover:text-red-900 transition-colors"
                                title="Delete Vehicle"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add Vehicle Modal */}
      <VehicleModal
        isOpen={showAddModal}
        onClose={handleCloseModals}
        onSuccess={handleModalSuccess}
      />

      {/* Edit Vehicle Modal */}
      <VehicleModal
        isOpen={showEditModal}
        onClose={handleCloseModals}
        vehicle={selectedVehicle}
        onSuccess={handleModalSuccess}
      />

      {/* Vehicle Details Modal */}
      <VehicleDetailsModal
        isOpen={showDetailsModal}
        onClose={handleCloseModals}
        vehicleId={selectedVehicleId}
      />
    </div>
  );
};

export default FleetManagement;
