import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Truck, Plus, Search, Filter, Download, Eye, Edit, Trash2, 
  MapPin, Clock, User, Package, AlertTriangle, CheckCircle,
  XCircle, RefreshCw, BarChart3, Route, Calendar, Phone
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import deliveryService from '../services/deliveryService';

import { Card, CardContent, CardHeader } from '../components/ui/card';
import Button from '../components/ui/button';
import Input from '../components/ui/input';
import Label from '../components/ui/label';
import Textarea from '../components/ui/textarea';

const DeliveryManagement = () => {
  const { user, userProfile } = useAuth();
  const { success, error: showError } = useToast();
  
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingDelivery, setEditingDelivery] = useState(null);
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    order_type: '',
    payment_status: '',
    search: ''
  });
  const [statistics, setStatistics] = useState({
    total_orders: 0,
    pending_orders: 0,
    in_transit_orders: 0,
    delivered_orders: 0,
    failed_orders: 0,
    avg_delivery_time_hours: 0,
    total_revenue: 0
  });

  const [formData, setFormData] = useState({
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    pickup_address: '',
    delivery_address: '',
    order_type: 'Standard',
    priority: 'Medium',
    special_instructions: '',
    weight_kg: '',
    delivery_fee: '',
    payment_method: 'Cash',
    signature_required: false,
    photo_proof_required: false
  });

  const orderTypes = ['Standard', 'Express', 'Scheduled', 'Bulk'];
  const priorities = ['Low', 'Medium', 'High', 'Urgent'];
  const statuses = ['Pending', 'Assigned', 'Picked Up', 'In Transit', 'Delivered', 'Failed', 'Cancelled'];
  const paymentMethods = ['Cash', 'Card', 'Bank Transfer', 'Mobile Money'];

  useEffect(() => {
    fetchData();
    fetchStatistics();
  }, [filters]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await deliveryService.getDeliveryOverview(filters);
      setDeliveries(data);
    } catch (error) {
      console.error('Error fetching deliveries:', error);
      showError('Failed to load deliveries');
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const stats = await deliveryService.getDeliveryStatistics();
      setStatistics(stats);
    } catch (error) {
      console.error('Error fetching statistics:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const orderData = {
        ...formData,
        order_number: `DEL-${Date.now()}`,
        weight_kg: parseFloat(formData.weight_kg) || 0,
        delivery_fee: parseFloat(formData.delivery_fee) || 0,
        payment_status: 'Pending',
        created_by: user.id
      };

      if (editingDelivery) {
        await deliveryService.updateOrder(editingDelivery.id, orderData);
        success('Delivery order updated successfully');
      } else {
        await deliveryService.createOrder(orderData);
        success('Delivery order created successfully');
      }

      setShowForm(false);
      setEditingDelivery(null);
      setFormData({
        customer_name: '',
        customer_phone: '',
        customer_email: '',
        pickup_address: '',
        delivery_address: '',
        order_type: 'Standard',
        priority: 'Medium',
        special_instructions: '',
        weight_kg: '',
        delivery_fee: '',
        payment_method: 'Cash',
        signature_required: false,
        photo_proof_required: false
      });
      fetchData();
      fetchStatistics();
    } catch (error) {
      console.error('Error saving delivery:', error);
      showError('Failed to save delivery order');
    }
  };

  const handleEdit = (delivery) => {
    setEditingDelivery(delivery);
    setFormData({
      customer_name: delivery.customer_name || '',
      customer_phone: delivery.customer_phone || '',
      customer_email: delivery.customer_email || '',
      pickup_address: delivery.pickup_address || '',
      delivery_address: delivery.delivery_address || '',
      order_type: delivery.order_type || 'Standard',
      priority: delivery.priority || 'Medium',
      special_instructions: delivery.special_instructions || '',
      weight_kg: delivery.weight_kg || '',
      delivery_fee: delivery.delivery_fee || '',
      payment_method: delivery.payment_method || 'Cash',
      signature_required: delivery.signature_required || false,
      photo_proof_required: delivery.photo_proof_required || false
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this delivery order?')) {
      try {
        await deliveryService.deleteOrder(id);
        success('Delivery order deleted successfully');
        fetchData();
        fetchStatistics();
      } catch (error) {
        console.error('Error deleting delivery:', error);
        showError('Failed to delete delivery order');
      }
    }
  };

  const handleViewDetails = async (delivery) => {
    setSelectedDelivery(delivery);
    setShowDetails(true);
  };

  const getStatusColor = (status) => {
    const colors = {
      'Pending': 'bg-yellow-100 text-yellow-800',
      'Assigned': 'bg-blue-100 text-blue-800',
      'Picked Up': 'bg-purple-100 text-purple-800',
      'In Transit': 'bg-indigo-100 text-indigo-800',
      'Delivered': 'bg-green-100 text-green-800',
      'Failed': 'bg-red-100 text-red-800',
      'Cancelled': 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      'Low': 'bg-green-100 text-green-800',
      'Medium': 'bg-yellow-100 text-yellow-800',
      'High': 'bg-orange-100 text-orange-800',
      'Urgent': 'bg-red-100 text-red-800'
    };
    return colors[priority] || 'bg-gray-100 text-gray-800';
  };

  const formatDateTime = (dateTime) => {
    if (!dateTime) return 'N/A';
    return new Date(dateTime).toLocaleString();
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Truck className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Delivery Management</h1>
                <p className="text-gray-600">Manage delivery orders and track shipments</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Package className="w-8 h-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Orders</p>
                  <p className="text-2xl font-bold text-gray-900">{statistics.total_orders}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Clock className="w-8 h-8 text-yellow-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-gray-900">{statistics.pending_orders}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Truck className="w-8 h-8 text-indigo-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">In Transit</p>
                  <p className="text-2xl font-bold text-gray-900">{statistics.in_transit_orders}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <CheckCircle className="w-8 h-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Delivered</p>
                  <p className="text-2xl font-bold text-gray-900">{statistics.delivered_orders}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Actions */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
                <div className="flex-1">
                  <Input
                    placeholder="Search orders..."
                    value={filters.search}
                    onChange={(e) => setFilters({...filters, search: e.target.value})}
                    className="w-full"
                  />
                </div>
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
                <select
                  value={filters.priority}
                  onChange={(e) => setFilters({...filters, priority: e.target.value})}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Priorities</option>
                  {priorities.map(priority => (
                    <option key={priority} value={priority}>{priority}</option>
                  ))}
                </select>
              </div>
              <div className="flex space-x-3">
                <Button
                  onClick={() => setShowForm(true)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  New Order
                </Button>
                <Button
                  onClick={fetchData}
                  variant="outline"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
                <Button variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Deliveries Table */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Delivery Orders</h3>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center py-8">
                <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
                <span className="ml-2 text-gray-600">Loading deliveries...</span>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Order #</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Customer</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">From → To</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Priority</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Driver</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Amount</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deliveries.map((delivery) => (
                      <motion.tr
                        key={delivery.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="border-b border-gray-100 hover:bg-gray-50"
                      >
                        <td className="py-3 px-4">
                          <span className="font-medium text-blue-600">{delivery.order_number}</span>
                        </td>
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-medium text-gray-900">{delivery.customer_name}</p>
                            <p className="text-sm text-gray-600">{delivery.customer_phone}</p>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="max-w-xs">
                            <p className="text-sm text-gray-900 truncate">{delivery.pickup_address}</p>
                            <p className="text-sm text-gray-600 truncate">→ {delivery.delivery_address}</p>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(delivery.status)}`}>
                            {delivery.status}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(delivery.priority)}`}>
                            {delivery.priority}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {delivery.driver_name ? (
                            <div>
                              <p className="text-sm font-medium text-gray-900">{delivery.driver_name}</p>
                              <p className="text-xs text-gray-600">{delivery.vehicle_number}</p>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-500">Unassigned</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-medium text-gray-900">{formatCurrency(delivery.delivery_fee)}</span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewDetails(delivery)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEdit(delivery)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDelete(delivery.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
                {deliveries.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No delivery orders found
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add/Edit Form Modal */}
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
                  {editingDelivery ? 'Edit Delivery Order' : 'New Delivery Order'}
                </h2>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowForm(false);
                    setEditingDelivery(null);
                  }}
                >
                  <XCircle className="w-4 h-4" />
                </Button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="customer_name">Customer Name *</Label>
                    <Input
                      id="customer_name"
                      value={formData.customer_name}
                      onChange={(e) => setFormData({...formData, customer_name: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="customer_phone">Phone Number *</Label>
                    <Input
                      id="customer_phone"
                      value={formData.customer_phone}
                      onChange={(e) => setFormData({...formData, customer_phone: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="customer_email">Email</Label>
                    <Input
                      id="customer_email"
                      type="email"
                      value={formData.customer_email}
                      onChange={(e) => setFormData({...formData, customer_email: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="order_type">Order Type</Label>
                    <select
                      id="order_type"
                      value={formData.order_type}
                      onChange={(e) => setFormData({...formData, order_type: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {orderTypes.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="priority">Priority</Label>
                    <select
                      id="priority"
                      value={formData.priority}
                      onChange={(e) => setFormData({...formData, priority: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {priorities.map(priority => (
                        <option key={priority} value={priority}>{priority}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="weight_kg">Weight (kg)</Label>
                    <Input
                      id="weight_kg"
                      type="number"
                      step="0.1"
                      value={formData.weight_kg}
                      onChange={(e) => setFormData({...formData, weight_kg: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="delivery_fee">Delivery Fee</Label>
                    <Input
                      id="delivery_fee"
                      type="number"
                      step="0.01"
                      value={formData.delivery_fee}
                      onChange={(e) => setFormData({...formData, delivery_fee: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="payment_method">Payment Method</Label>
                    <select
                      id="payment_method"
                      value={formData.payment_method}
                      onChange={(e) => setFormData({...formData, payment_method: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {paymentMethods.map(method => (
                        <option key={method} value={method}>{method}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="pickup_address">Pickup Address *</Label>
                  <Textarea
                    id="pickup_address"
                    value={formData.pickup_address}
                    onChange={(e) => setFormData({...formData, pickup_address: e.target.value})}
                    required
                    rows={2}
                  />
                </div>

                <div>
                  <Label htmlFor="delivery_address">Delivery Address *</Label>
                  <Textarea
                    id="delivery_address"
                    value={formData.delivery_address}
                    onChange={(e) => setFormData({...formData, delivery_address: e.target.value})}
                    required
                    rows={2}
                  />
                </div>

                <div>
                  <Label htmlFor="special_instructions">Special Instructions</Label>
                  <Textarea
                    id="special_instructions"
                    value={formData.special_instructions}
                    onChange={(e) => setFormData({...formData, special_instructions: e.target.value})}
                    rows={3}
                  />
                </div>

                <div className="flex items-center space-x-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.signature_required}
                      onChange={(e) => setFormData({...formData, signature_required: e.target.checked})}
                      className="mr-2"
                    />
                    Signature Required
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.photo_proof_required}
                      onChange={(e) => setFormData({...formData, photo_proof_required: e.target.checked})}
                      className="mr-2"
                    />
                    Photo Proof Required
                  </label>
                </div>

                <div className="flex justify-end space-x-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowForm(false);
                      setEditingDelivery(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                    {editingDelivery ? 'Update Order' : 'Create Order'}
                  </Button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      )}

      {/* Delivery Details Modal */}
      {showDetails && selectedDelivery && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Delivery Details</h2>
                <Button
                  variant="outline"
                  onClick={() => setShowDetails(false)}
                >
                  <XCircle className="w-4 h-4" />
                </Button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Order Information</h3>
                  <div className="space-y-3">
                    <div>
                      <Label>Order Number</Label>
                      <p className="font-medium">{selectedDelivery.order_number}</p>
                    </div>
                    <div>
                      <Label>Status</Label>
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(selectedDelivery.status)}`}>
                        {selectedDelivery.status}
                      </span>
                    </div>
                    <div>
                      <Label>Priority</Label>
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(selectedDelivery.priority)}`}>
                        {selectedDelivery.priority}
                      </span>
                    </div>
                    <div>
                      <Label>Order Type</Label>
                      <p>{selectedDelivery.order_type}</p>
                    </div>
                    <div>
                      <Label>Created</Label>
                      <p>{formatDateTime(selectedDelivery.created_at)}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4">Customer Information</h3>
                  <div className="space-y-3">
                    <div>
                      <Label>Name</Label>
                      <p className="font-medium">{selectedDelivery.customer_name}</p>
                    </div>
                    <div>
                      <Label>Phone</Label>
                      <p>{selectedDelivery.customer_phone}</p>
                    </div>
                    <div>
                      <Label>Email</Label>
                      <p>{selectedDelivery.customer_email || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4">Addresses</h3>
                  <div className="space-y-3">
                    <div>
                      <Label>Pickup Address</Label>
                      <p className="text-sm">{selectedDelivery.pickup_address}</p>
                    </div>
                    <div>
                      <Label>Delivery Address</Label>
                      <p className="text-sm">{selectedDelivery.delivery_address}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4">Delivery Information</h3>
                  <div className="space-y-3">
                    <div>
                      <Label>Driver</Label>
                      <p>{selectedDelivery.driver_name || 'Unassigned'}</p>
                    </div>
                    <div>
                      <Label>Vehicle</Label>
                      <p>{selectedDelivery.vehicle_number || 'N/A'}</p>
                    </div>
                    <div>
                      <Label>Delivery Fee</Label>
                      <p className="font-medium">{formatCurrency(selectedDelivery.delivery_fee)}</p>
                    </div>
                    <div>
                      <Label>Estimated Delivery</Label>
                      <p>{formatDateTime(selectedDelivery.estimated_delivery_time)}</p>
                    </div>
                    <div>
                      <Label>Actual Delivery</Label>
                      <p>{formatDateTime(selectedDelivery.actual_delivery_time)}</p>
                    </div>
                  </div>
                </div>
              </div>

              {selectedDelivery.special_instructions && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-2">Special Instructions</h3>
                  <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-md">
                    {selectedDelivery.special_instructions}
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default DeliveryManagement;
