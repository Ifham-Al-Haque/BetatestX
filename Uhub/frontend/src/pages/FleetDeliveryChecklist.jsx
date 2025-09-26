import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import deliveryService from '../services/deliveryService';
import { 
  ClipboardList, 
  CheckSquare, 
  Plus, 
  Search, 
  Filter, 
  Calendar,
  Truck,
  Package,
  TrendingUp,
  Eye,
  Edit,
  Download,
  AlertTriangle,
  Clock,
  User,
  Star,
  Phone,
  DollarSign,
  XCircle
} from 'lucide-react';

import UserDropdown from '../components/UserDropdown';
import DarkModeToggle from '../components/DarkModeToggle';
import Button from '../components/ui/button';
import Input from '../components/ui/input';
import Label from '../components/ui/label';
import Textarea from '../components/ui/textarea';

const FleetDeliveryChecklist = () => {
  const { user } = useAuth();
  const { success, error: showError } = useToast();
  const [deliveryChecklists, setDeliveryChecklists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');

  const [formData, setFormData] = useState({
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    desired_fleet: '',
    rental_amount: '',
    confirm_amount: '',
    rental_duration: '',
    custom_duration: '',
    location: '',
    special_notes: '',
    priority: 'medium',
    delivery_date: '',
    driver_name: '',
    driver_phone: '',
    driver_license: '',
    vehicle_number: '',
    vehicle_make: '',
    vehicle_model: '',
    vehicle_plate: ''
  });

  const loadDeliveryChecklistData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await deliveryService.getDeliveryOverview();
      setDeliveryChecklists(data);
    } catch (error) {
      console.error('Error loading delivery checklist data:', error);
      showError('Failed to load delivery data');
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    loadDeliveryChecklistData();
  }, [loadDeliveryChecklistData]);

  const handleCreateChecklist = () => {
    setShowCreateModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const orderData = {
        customer_name: formData.customer_name,
        customer_phone: formData.customer_phone,
        customer_email: formData.customer_email,
        pickup_address: formData.location,
        delivery_address: formData.location, // Same as pickup for now
        order_type: 'Standard',
        priority: formData.priority,
        special_instructions: formData.special_notes,
        delivery_fee: parseFloat(formData.rental_amount) || 0,
        payment_status: 'Pending',
        created_by: user.id,
        // Rental duration information
        rental_duration: formData.rental_duration,
        custom_duration: formData.custom_duration,
        // Driver information (manually entered)
        driver_name: formData.driver_name,
        driver_phone: formData.driver_phone,
        driver_license: formData.driver_license,
        // Vehicle information (manually entered)
        vehicle_number: formData.vehicle_number,
        vehicle_make: formData.vehicle_make,
        vehicle_model: formData.vehicle_model,
        vehicle_plate: formData.vehicle_plate
      };

      await deliveryService.createOrder(orderData);
      success('Delivery order created successfully');
      setShowCreateModal(false);
      setFormData({
        customer_name: '',
        customer_phone: '',
        customer_email: '',
        desired_fleet: '',
        rental_amount: '',
        confirm_amount: '',
        rental_duration: '',
        custom_duration: '',
        location: '',
        special_notes: '',
        priority: 'medium',
        delivery_date: '',
        driver_name: '',
        driver_phone: '',
        driver_license: '',
        vehicle_number: '',
        vehicle_make: '',
        vehicle_model: '',
        vehicle_plate: ''
      });
      loadDeliveryChecklistData();
    } catch (error) {
      console.error('Error creating delivery order:', error);
      showError('Failed to create delivery order');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'on_hold': return 'bg-yellow-100 text-yellow-800';
      case 'not_started': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return CheckSquare;
      case 'in_progress': return TrendingUp;
      case 'on_hold': return AlertTriangle;
      case 'not_started': return Clock;
      default: return Clock;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Fleet Delivery Checklists...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <ClipboardList className="w-8 h-8 mr-3 text-blue-600" />
                Fleet Delivery Checklist
              </h1>
              <p className="text-gray-600 mt-2">
                Manage and track delivery checklists for fleet operations
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <DarkModeToggle />
              <UserDropdown />
              <button
                onClick={handleCreateChecklist}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center transition-colors"
              >
                <Plus className="w-5 h-5 mr-2" />
                Create Delivery Order
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100">
                <ClipboardList className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Checklists</p>
                <p className="text-2xl font-bold text-gray-900">{deliveryChecklists.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100">
                <CheckSquare className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-gray-900">
                  {deliveryChecklists.filter(c => c.status === 'completed').length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-yellow-100">
                <TrendingUp className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">In Progress</p>
                <p className="text-2xl font-bold text-gray-900">
                  {deliveryChecklists.filter(c => c.status === 'in_progress').length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-purple-100">
                <Star className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Avg Completion</p>
                <p className="text-2xl font-bold text-gray-900">
                  {Math.round(deliveryChecklists.reduce((sum, c) => sum + c.progress_percentage, 0) / deliveryChecklists.length)}%
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search checklists..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full sm:w-64"
                  />
                </div>
                
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Status</option>
                  <option value="not_started">Not Started</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="on_hold">On Hold</option>
                </select>
                
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Priorities</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
              
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-gray-400" />
                <span className="text-sm text-gray-600">Filters</span>
              </div>
            </div>
          </div>
        </div>

        {/* Delivery Checklists List */}
        <div className="space-y-6">
          {deliveryChecklists.map((delivery) => {
            const StatusIcon = getStatusIcon(delivery.status);
            return (
              <motion.div
                key={delivery.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow"
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      <div className="p-3 bg-blue-100 rounded-lg">
                        <Truck className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {delivery.order_number}
                        </h3>
                        <p className="text-gray-600">{delivery.customer_name}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(delivery.priority)}`}>
                        {delivery.priority} priority
                      </span>
                      
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(delivery.status)}`}>
                        <StatusIcon className="w-4 h-4 inline mr-1" />
                        {delivery.status.replace('_', ' ')}
                      </span>
                      
                      <div className="text-right">
                        <p className="text-sm text-gray-600">Amount</p>
                        <p className="text-lg font-semibold text-gray-900">${delivery.delivery_fee || 0}</p>
                        {delivery.rental_duration && (
                          <p className="text-xs text-blue-600 mt-1">
                            {delivery.rental_duration === 'custom' ? delivery.custom_duration : delivery.rental_duration.replace('_', ' ')}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                    <div className="flex items-center">
                      <Truck className="w-4 h-4 text-gray-400 mr-2" />
                      <div>
                        <p className="text-sm text-gray-600">Vehicle</p>
                        <p className="font-medium text-gray-900">{delivery.vehicle_number || 'Unassigned'}</p>
                        {delivery.vehicle_make && delivery.vehicle_model && (
                          <p className="text-xs text-gray-500">{delivery.vehicle_make} {delivery.vehicle_model}</p>
                        )}
                        {delivery.vehicle_plate && (
                          <p className="text-xs text-gray-500">Plate: {delivery.vehicle_plate}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center">
                      <User className="w-4 h-4 text-gray-400 mr-2" />
                      <div>
                        <p className="text-sm text-gray-600">Driver</p>
                        <p className="font-medium text-gray-900">{delivery.driver_name || 'Unassigned'}</p>
                        {delivery.driver_phone && (
                          <p className="text-xs text-gray-500">{delivery.driver_phone}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                      <div>
                        <p className="text-sm text-gray-600">Created</p>
                        <p className="font-medium text-gray-900">
                          {new Date(delivery.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <Phone className="w-4 h-4 text-gray-400 mr-2" />
                      <div>
                        <p className="text-sm text-gray-600">Phone</p>
                        <p className="font-medium text-gray-900">{delivery.customer_phone}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Addresses:</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-500">Pickup</p>
                        <p className="text-sm text-gray-900">{delivery.pickup_address}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Delivery</p>
                        <p className="text-sm text-gray-900">{delivery.delivery_address}</p>
                      </div>
                    </div>
                  </div>
                  
                  {delivery.special_instructions && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Special Instructions:</h4>
                      <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
                        {delivery.special_instructions}
                      </p>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <button className="text-blue-600 hover:text-blue-800 flex items-center">
                        <Eye className="w-4 h-4 mr-1" />
                        View Details
                      </button>
                      <button className="text-gray-600 hover:text-gray-800 flex items-center">
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </button>
                      <button className="text-gray-600 hover:text-gray-800 flex items-center">
                        <Download className="w-4 h-4 mr-1" />
                        Export
                      </button>
                    </div>
                    
                    <div className="text-sm text-gray-600">
                      {delivery.order_type} • {delivery.payment_status}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Create Delivery Order Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900">Create Delivery Order</h2>
                  <Button
                    variant="outline"
                    onClick={() => setShowCreateModal(false)}
                  >
                    <XCircle className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              <form onSubmit={handleSubmit} className="p-6">
                <div className="space-y-6">
                  {/* Customer Details Section */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                      <User className="w-5 h-5 mr-2 text-blue-600" />
                      Customer Details
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="customer_name">Customer Name *</Label>
                        <Input
                          id="customer_name"
                          value={formData.customer_name}
                          onChange={(e) => setFormData({...formData, customer_name: e.target.value})}
                          required
                          placeholder="Enter customer name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="customer_phone">Phone Number *</Label>
                        <Input
                          id="customer_phone"
                          value={formData.customer_phone}
                          onChange={(e) => setFormData({...formData, customer_phone: e.target.value})}
                          required
                          placeholder="Enter phone number"
                        />
                      </div>
                      <div>
                        <Label htmlFor="customer_email">Email Address</Label>
                        <Input
                          id="customer_email"
                          type="email"
                          value={formData.customer_email}
                          onChange={(e) => setFormData({...formData, customer_email: e.target.value})}
                          placeholder="Enter email address"
                        />
                      </div>
                      <div>
                        <Label htmlFor="location">Location *</Label>
                        <Input
                          id="location"
                          value={formData.location}
                          onChange={(e) => setFormData({...formData, location: e.target.value})}
                          required
                          placeholder="Enter delivery location"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Fleet and Rental Details Section */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                      <Truck className="w-5 h-5 mr-2 text-blue-600" />
                      Fleet & Rental Details
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="desired_fleet">Desired Fleet</Label>
                        <select
                          id="desired_fleet"
                          value={formData.desired_fleet}
                          onChange={(e) => setFormData({...formData, desired_fleet: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Select Fleet Type</option>
                          <option value="sedan">Sedan</option>
                          <option value="suv">SUV</option>
                          <option value="truck">Truck</option>
                          <option value="van">Van</option>
                          <option value="luxury">Luxury</option>
                        </select>
                      </div>
                      <div>
                        <Label htmlFor="vehicle_number">Vehicle Number *</Label>
                        <Input
                          id="vehicle_number"
                          value={formData.vehicle_number}
                          onChange={(e) => setFormData({...formData, vehicle_number: e.target.value})}
                          required
                          placeholder="Enter vehicle number"
                        />
                      </div>
                      <div>
                        <Label htmlFor="vehicle_make">Vehicle Make *</Label>
                        <Input
                          id="vehicle_make"
                          value={formData.vehicle_make}
                          onChange={(e) => setFormData({...formData, vehicle_make: e.target.value})}
                          required
                          placeholder="Enter vehicle make (e.g., Toyota, Ford)"
                        />
                      </div>
                      <div>
                        <Label htmlFor="vehicle_model">Vehicle Model *</Label>
                        <Input
                          id="vehicle_model"
                          value={formData.vehicle_model}
                          onChange={(e) => setFormData({...formData, vehicle_model: e.target.value})}
                          required
                          placeholder="Enter vehicle model"
                        />
                      </div>
                      <div>
                        <Label htmlFor="vehicle_plate">License Plate</Label>
                        <Input
                          id="vehicle_plate"
                          value={formData.vehicle_plate}
                          onChange={(e) => setFormData({...formData, vehicle_plate: e.target.value})}
                          placeholder="Enter license plate number"
                        />
                      </div>
                      <div>
                        <Label htmlFor="rental_amount">Rental Amount *</Label>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                          <Input
                            id="rental_amount"
                            type="number"
                            step="0.01"
                            value={formData.rental_amount}
                            onChange={(e) => setFormData({...formData, rental_amount: e.target.value})}
                            required
                            placeholder="0.00"
                            className="pl-10"
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="confirm_amount">Confirm Amount *</Label>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                          <Input
                            id="confirm_amount"
                            type="number"
                            step="0.01"
                            value={formData.confirm_amount}
                            onChange={(e) => setFormData({...formData, confirm_amount: e.target.value})}
                            required
                            placeholder="0.00"
                            className="pl-10"
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="rental_duration">Rental Duration *</Label>
                        <select
                          id="rental_duration"
                          value={formData.rental_duration}
                          onChange={(e) => setFormData({...formData, rental_duration: e.target.value})}
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Select Duration</option>
                          <option value="1_hour">1 Hour</option>
                          <option value="2_hours">2 Hours</option>
                          <option value="4_hours">4 Hours</option>
                          <option value="8_hours">8 Hours</option>
                          <option value="1_day">1 Day</option>
                          <option value="2_days">2 Days</option>
                          <option value="3_days">3 Days</option>
                          <option value="1_week">1 Week</option>
                          <option value="2_weeks">2 Weeks</option>
                          <option value="1_month">1 Month</option>
                          <option value="custom">Custom</option>
                        </select>
                      </div>
                      {formData.rental_duration === 'custom' && (
                        <div>
                          <Label htmlFor="custom_duration">Custom Duration</Label>
                          <Input
                            id="custom_duration"
                            value={formData.custom_duration}
                            onChange={(e) => setFormData({...formData, custom_duration: e.target.value})}
                            placeholder="e.g., 5 days, 2 weeks, 3 months"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Assignment Details Section */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                      <Calendar className="w-5 h-5 mr-2 text-blue-600" />
                      Assignment Details
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div>
                        <Label htmlFor="driver_name">Driver Name</Label>
                        <Input
                          id="driver_name"
                          value={formData.driver_name}
                          onChange={(e) => setFormData({...formData, driver_name: e.target.value})}
                          placeholder="Enter driver name (if known)"
                        />
                      </div>
                      <div>
                        <Label htmlFor="driver_phone">Driver Phone</Label>
                        <Input
                          id="driver_phone"
                          value={formData.driver_phone}
                          onChange={(e) => setFormData({...formData, driver_phone: e.target.value})}
                          placeholder="Enter driver phone number (if known)"
                        />
                      </div>
                      <div>
                        <Label htmlFor="driver_license">Driver License Number</Label>
                        <Input
                          id="driver_license"
                          value={formData.driver_license}
                          onChange={(e) => setFormData({...formData, driver_license: e.target.value})}
                          placeholder="Enter driver license number"
                        />
                      </div>
                      <div>
                        <Label htmlFor="priority">Priority</Label>
                        <select
                          id="priority"
                          value={formData.priority}
                          onChange={(e) => setFormData({...formData, priority: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                          <option value="urgent">Urgent</option>
                        </select>
                      </div>
                      <div>
                        <Label htmlFor="delivery_date">Delivery Date</Label>
                        <Input
                          id="delivery_date"
                          type="date"
                          value={formData.delivery_date}
                          onChange={(e) => setFormData({...formData, delivery_date: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Special Notes Section */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                      <Package className="w-5 h-5 mr-2 text-blue-600" />
                      Additional Information
                    </h3>
                    <div>
                      <Label htmlFor="special_notes">Special Notes</Label>
                      <Textarea
                        id="special_notes"
                        value={formData.special_notes}
                        onChange={(e) => setFormData({...formData, special_notes: e.target.value})}
                        rows={4}
                        placeholder="Enter any special instructions, requirements, or notes for this delivery..."
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 mt-8 pt-6 border-t border-gray-200">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowCreateModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                    Create Delivery Order
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FleetDeliveryChecklist;




