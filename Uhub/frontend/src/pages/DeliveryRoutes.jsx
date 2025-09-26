import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Route, Plus, Search, Filter, MapPin, Clock, Truck, 
  Navigation, CheckCircle, AlertTriangle, Edit, Trash2,
  RefreshCw, Eye, Users, Calendar, XCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import deliveryService from '../services/deliveryService';
import fleetService from '../services/fleetService';

import UserDropdown from '../components/UserDropdown';
import DarkModeToggle from '../components/DarkModeToggle';
import { Card, CardContent, CardHeader } from '../components/ui/card';
import Button from '../components/ui/button';
import Input from '../components/ui/input';
import Label from '../components/ui/label';
import Textarea from '../components/ui/textarea';

const DeliveryRoutes = () => {
  const { user, userProfile } = useAuth();
  const { success, error: showError } = useToast();
  
  const [routes, setRoutes] = useState([]);
  const [routeStops, setRouteStops] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showStops, setShowStops] = useState(false);
  const [editingRoute, setEditingRoute] = useState(null);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [filters, setFilters] = useState({
    driver_id: '',
    status: '',
    search: ''
  });

  const [formData, setFormData] = useState({
    route_name: '',
    driver_id: '',
    vehicle_id: '',
    start_location: '',
    end_location: '',
    total_distance_km: '',
    estimated_duration_minutes: '',
    status: 'Active'
  });

  const statuses = ['Active', 'Completed', 'Cancelled'];

  useEffect(() => {
    fetchData();
    fetchDrivers();
    fetchVehicles();
  }, [filters]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await deliveryService.getRoutes(filters);
      setRoutes(data);
    } catch (error) {
      console.error('Error fetching routes:', error);
      showError('Failed to load routes');
    } finally {
      setLoading(false);
    }
  };

  const fetchDrivers = async () => {
    try {
      const data = await deliveryService.getAvailableDrivers();
      setDrivers(data);
    } catch (error) {
      console.error('Error fetching drivers:', error);
    }
  };

  const fetchVehicles = async () => {
    try {
      const data = await deliveryService.getAvailableVehicles();
      setVehicles(data);
    } catch (error) {
      console.error('Error fetching vehicles:', error);
    }
  };

  const fetchRouteStops = async (routeId) => {
    try {
      const data = await deliveryService.getRouteStops(routeId);
      setRouteStops(data);
    } catch (error) {
      console.error('Error fetching route stops:', error);
      showError('Failed to load route stops');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const routeData = {
        ...formData,
        total_distance_km: parseFloat(formData.total_distance_km) || 0,
        estimated_duration_minutes: parseInt(formData.estimated_duration_minutes) || 0,
        created_by: user.id
      };

      if (editingRoute) {
        await deliveryService.updateRoute(editingRoute.id, routeData);
        success('Route updated successfully');
      } else {
        await deliveryService.createRoute(routeData);
        success('Route created successfully');
      }

      setShowForm(false);
      setEditingRoute(null);
      setFormData({
        route_name: '',
        driver_id: '',
        vehicle_id: '',
        start_location: '',
        end_location: '',
        total_distance_km: '',
        estimated_duration_minutes: '',
        status: 'Active'
      });
      fetchData();
    } catch (error) {
      console.error('Error saving route:', error);
      showError('Failed to save route');
    }
  };

  const handleEdit = (route) => {
    setEditingRoute(route);
    setFormData({
      route_name: route.route_name || '',
      driver_id: route.driver_id || '',
      vehicle_id: route.vehicle_id || '',
      start_location: route.start_location || '',
      end_location: route.end_location || '',
      total_distance_km: route.total_distance_km || '',
      estimated_duration_minutes: route.estimated_duration_minutes || '',
      status: route.status || 'Active'
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this route?')) {
      try {
        await deliveryService.deleteRoute(id);
        success('Route deleted successfully');
        fetchData();
      } catch (error) {
        console.error('Error deleting route:', error);
        showError('Failed to delete route');
      }
    }
  };

  const handleViewStops = async (route) => {
    setSelectedRoute(route);
    await fetchRouteStops(route.id);
    setShowStops(true);
  };

  const getStatusColor = (status) => {
    const colors = {
      'Active': 'bg-green-100 text-green-800',
      'Completed': 'bg-blue-100 text-blue-800',
      'Cancelled': 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const formatDuration = (minutes) => {
    if (!minutes) return 'N/A';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const formatDistance = (km) => {
    if (!km) return 'N/A';
    return `${km.toFixed(1)} km`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Route className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Delivery Routes</h1>
                <p className="text-gray-600">Manage delivery routes and optimize logistics</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <DarkModeToggle />
              <UserDropdown />
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Filters and Actions */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
                <div className="flex-1">
                  <Input
                    placeholder="Search routes..."
                    value={filters.search}
                    onChange={(e) => setFilters({...filters, search: e.target.value})}
                    className="w-full"
                  />
                </div>
                <select
                  value={filters.driver_id}
                  onChange={(e) => setFilters({...filters, driver_id: e.target.value})}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Drivers</option>
                  {drivers.map(driver => (
                    <option key={driver.id} value={driver.id}>{driver.full_name}</option>
                  ))}
                </select>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({...filters, status: e.target.value})}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Statuses</option>
                  {statuses.map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>
              <div className="flex space-x-3">
                <Button
                  onClick={() => setShowForm(true)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  New Route
                </Button>
                <Button
                  onClick={fetchData}
                  variant="outline"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Routes Grid */}
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600">Loading routes...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {routes.map((route) => (
              <motion.div
                key={route.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -2 }}
                transition={{ duration: 0.2 }}
              >
                <Card className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-gray-900">{route.route_name}</h3>
                        <p className="text-sm text-gray-600">
                          {route.employees?.full_name || 'Unassigned Driver'}
                        </p>
                      </div>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(route.status)}`}>
                        {route.status}
                      </span>
                    </div>

                    <div className="space-y-3 mb-4">
                      <div className="flex items-center text-sm text-gray-600">
                        <MapPin className="w-4 h-4 mr-2" />
                        <span className="truncate">{route.start_location}</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <MapPin className="w-4 h-4 mr-2" />
                        <span className="truncate">{route.end_location}</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Truck className="w-4 h-4 mr-2" />
                        <span>{route.fleet_vehicles?.vehicle_number || 'No Vehicle'}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                      <div>
                        <p className="text-gray-500">Distance</p>
                        <p className="font-medium">{formatDistance(route.total_distance_km)}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Duration</p>
                        <p className="font-medium">{formatDuration(route.estimated_duration_minutes)}</p>
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        onClick={() => handleViewStops(route)}
                        className="flex-1"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View Stops
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(route)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(route.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {!loading && routes.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <Route className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No routes found</h3>
              <p className="text-gray-600">
                {filters.search ? 'Try adjusting your search criteria' : 'Create your first delivery route to get started'}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Add/Edit Route Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  {editingRoute ? 'Edit Route' : 'New Route'}
                </h2>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowForm(false);
                    setEditingRoute(null);
                  }}
                >
                  <XCircle className="w-4 h-4" />
                </Button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="route_name">Route Name *</Label>
                    <Input
                      id="route_name"
                      value={formData.route_name}
                      onChange={(e) => setFormData({...formData, route_name: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="driver_id">Driver</Label>
                    <select
                      id="driver_id"
                      value={formData.driver_id}
                      onChange={(e) => setFormData({...formData, driver_id: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Driver</option>
                      {drivers.map(driver => (
                        <option key={driver.id} value={driver.id}>{driver.full_name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="vehicle_id">Vehicle</Label>
                    <select
                      id="vehicle_id"
                      value={formData.vehicle_id}
                      onChange={(e) => setFormData({...formData, vehicle_id: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Vehicle</option>
                      {vehicles.map(vehicle => (
                        <option key={vehicle.id} value={vehicle.id}>
                          {vehicle.vehicle_number} - {vehicle.make} {vehicle.model}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="status">Status</Label>
                    <select
                      id="status"
                      value={formData.status}
                      onChange={(e) => setFormData({...formData, status: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {statuses.map(status => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="total_distance_km">Distance (km)</Label>
                    <Input
                      id="total_distance_km"
                      type="number"
                      step="0.1"
                      value={formData.total_distance_km}
                      onChange={(e) => setFormData({...formData, total_distance_km: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="estimated_duration_minutes">Duration (minutes)</Label>
                    <Input
                      id="estimated_duration_minutes"
                      type="number"
                      value={formData.estimated_duration_minutes}
                      onChange={(e) => setFormData({...formData, estimated_duration_minutes: e.target.value})}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="start_location">Start Location *</Label>
                  <Textarea
                    id="start_location"
                    value={formData.start_location}
                    onChange={(e) => setFormData({...formData, start_location: e.target.value})}
                    required
                    rows={2}
                  />
                </div>

                <div>
                  <Label htmlFor="end_location">End Location *</Label>
                  <Textarea
                    id="end_location"
                    value={formData.end_location}
                    onChange={(e) => setFormData({...formData, end_location: e.target.value})}
                    required
                    rows={2}
                  />
                </div>

                <div className="flex justify-end space-x-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowForm(false);
                      setEditingRoute(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                    {editingRoute ? 'Update Route' : 'Create Route'}
                  </Button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      )}

      {/* Route Stops Modal */}
      {showStops && selectedRoute && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Route Stops - {selectedRoute.route_name}</h2>
                <Button
                  variant="outline"
                  onClick={() => setShowStops(false)}
                >
                  <XCircle className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-4">
                {routeStops.map((stop, index) => (
                  <motion.div
                    key={stop.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg"
                  >
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
                        {stop.stop_sequence}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium text-gray-900">
                          {stop.delivery_orders?.order_number || `Stop ${stop.stop_sequence}`}
                        </h3>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          stop.status === 'Completed' ? 'bg-green-100 text-green-800' :
                          stop.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {stop.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{stop.address}</p>
                      {stop.delivery_orders && (
                        <div className="mt-2 text-sm text-gray-500">
                          <p>Customer: {stop.delivery_orders.customer_name}</p>
                          <p>Phone: {stop.delivery_orders.customer_phone}</p>
                          {stop.delivery_orders.special_instructions && (
                            <p>Instructions: {stop.delivery_orders.special_instructions}</p>
                          )}
                        </div>
                      )}
                      {stop.estimated_arrival && (
                        <p className="text-xs text-gray-500 mt-1">
                          ETA: {new Date(stop.estimated_arrival).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>

              {routeStops.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <MapPin className="w-8 h-8 mx-auto mb-2" />
                  <p>No stops added to this route yet</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default DeliveryRoutes;
