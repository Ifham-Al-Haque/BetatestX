import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  MapPin, Clock, Truck, Package, CheckCircle, AlertTriangle,
  RefreshCw, Search, Filter, Eye, Phone, Navigation, XCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import deliveryService from '../services/deliveryService';

import { Card, CardContent, CardHeader } from '../components/ui/card';
import Button from '../components/ui/button';
import Input from '../components/ui/input';
import Label from '../components/ui/label';

const DeliveryTracking = () => {
  const { user, userProfile } = useAuth();
  const { success, error: showError } = useToast();
  
  const [trackingData, setTrackingData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    driver_id: '',
    date_from: '',
    date_to: ''
  });

  useEffect(() => {
    fetchTrackingData();
  }, [filters, searchTerm]);

  const fetchTrackingData = async () => {
    try {
      setLoading(true);
      let data;
      
      if (searchTerm) {
        data = await deliveryService.searchOrders(searchTerm);
      } else {
        data = await deliveryService.getDeliveryOverview(filters);
      }
      
      setTrackingData(data);
    } catch (error) {
      console.error('Error fetching tracking data:', error);
      showError('Failed to load tracking data');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (order) => {
    try {
      const [orderDetails, trackingHistory] = await Promise.all([
        deliveryService.getOrder(order.id),
        deliveryService.getOrderTracking(order.id)
      ]);
      
      setSelectedOrder({
        ...orderDetails,
        tracking_history: trackingHistory
      });
      setShowDetails(true);
    } catch (error) {
      console.error('Error fetching order details:', error);
      showError('Failed to load order details');
    }
  };

  const getStatusIcon = (status) => {
    const icons = {
      'Pending': <Clock className="w-5 h-5 text-yellow-500" />,
      'Assigned': <Package className="w-5 h-5 text-blue-500" />,
      'Picked Up': <Truck className="w-5 h-5 text-purple-500" />,
      'In Transit': <Navigation className="w-5 h-5 text-indigo-500" />,
      'Delivered': <CheckCircle className="w-5 h-5 text-green-500" />,
      'Failed': <AlertTriangle className="w-5 h-5 text-red-500" />,
      'Cancelled': <XCircle className="w-5 h-5 text-gray-500" />
    };
    return icons[status] || <Clock className="w-5 h-5 text-gray-500" />;
  };

  const getStatusColor = (status) => {
    const colors = {
      'Pending': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'Assigned': 'bg-blue-100 text-blue-800 border-blue-200',
      'Picked Up': 'bg-purple-100 text-purple-800 border-purple-200',
      'In Transit': 'bg-indigo-100 text-indigo-800 border-indigo-200',
      'Delivered': 'bg-green-100 text-green-800 border-green-200',
      'Failed': 'bg-red-100 text-red-800 border-red-200',
      'Cancelled': 'bg-gray-100 text-gray-800 border-gray-200'
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const formatDateTime = (dateTime) => {
    if (!dateTime) return 'N/A';
    return new Date(dateTime).toLocaleString();
  };

  const getTimeAgo = (dateTime) => {
    if (!dateTime) return 'N/A';
    const now = new Date();
    const time = new Date(dateTime);
    const diffInMinutes = Math.floor((now - time) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <MapPin className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Delivery Tracking</h1>
                <p className="text-gray-600">Track delivery orders in real-time</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Search and Filters */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
                <div className="flex-1">
                  <Input
                    placeholder="Search by order number, customer name, or phone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full"
                  />
                </div>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({...filters, status: e.target.value})}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Statuses</option>
                  <option value="Pending">Pending</option>
                  <option value="Assigned">Assigned</option>
                  <option value="Picked Up">Picked Up</option>
                  <option value="In Transit">In Transit</option>
                  <option value="Delivered">Delivered</option>
                  <option value="Failed">Failed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
                <input
                  type="date"
                  value={filters.date_from}
                  onChange={(e) => setFilters({...filters, date_from: e.target.value})}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="From Date"
                />
                <input
                  type="date"
                  value={filters.date_to}
                  onChange={(e) => setFilters({...filters, date_to: e.target.value})}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="To Date"
                />
              </div>
              <div className="flex space-x-3">
                <Button
                  onClick={fetchTrackingData}
                  variant="outline"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tracking Cards */}
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600">Loading tracking data...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trackingData.map((delivery) => (
              <motion.div
                key={delivery.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -2 }}
                transition={{ duration: 0.2 }}
              >
                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-gray-900">{delivery.order_number}</h3>
                        <p className="text-sm text-gray-600">{delivery.customer_name}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(delivery.status)}
                        <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(delivery.status)}`}>
                          {delivery.status}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center text-sm text-gray-600">
                        <MapPin className="w-4 h-4 mr-2" />
                        <span className="truncate">{delivery.pickup_address}</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <MapPin className="w-4 h-4 mr-2" />
                        <span className="truncate">{delivery.delivery_address}</span>
                      </div>
                    </div>

                    {delivery.driver_name && (
                      <div className="flex items-center text-sm text-gray-600 mb-2">
                        <Truck className="w-4 h-4 mr-2" />
                        <span>{delivery.driver_name}</span>
                        {delivery.vehicle_number && (
                          <span className="ml-2 text-xs bg-gray-100 px-2 py-1 rounded">
                            {delivery.vehicle_number}
                          </span>
                        )}
                      </div>
                    )}

                    <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                      <span>Created: {getTimeAgo(delivery.created_at)}</span>
                      {delivery.estimated_delivery_time && (
                        <span>ETA: {formatDateTime(delivery.estimated_delivery_time)}</span>
                      )}
                    </div>

                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        onClick={() => handleViewDetails(delivery)}
                        className="flex-1"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Track
                      </Button>
                      {delivery.customer_phone && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(`tel:${delivery.customer_phone}`)}
                        >
                          <Phone className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {!loading && trackingData.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No deliveries found</h3>
              <p className="text-gray-600">
                {searchTerm ? 'Try adjusting your search criteria' : 'No delivery orders match your current filters'}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Delivery Details Modal */}
      {showDetails && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Delivery Tracking Details</h2>
                <Button
                  variant="outline"
                  onClick={() => setShowDetails(false)}
                >
                  <XCircle className="w-4 h-4" />
                </Button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Order Information</h3>
                  <div className="space-y-3">
                    <div>
                      <Label>Order Number</Label>
                      <p className="font-medium">{selectedOrder.order_number}</p>
                    </div>
                    <div>
                      <Label>Customer</Label>
                      <p className="font-medium">{selectedOrder.customer_name}</p>
                      <p className="text-sm text-gray-600">{selectedOrder.customer_phone}</p>
                    </div>
                    <div>
                      <Label>Status</Label>
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(selectedOrder.status)}
                        <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(selectedOrder.status)}`}>
                          {selectedOrder.status}
                        </span>
                      </div>
                    </div>
                    <div>
                      <Label>Priority</Label>
                      <p>{selectedOrder.priority}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4">Addresses</h3>
                  <div className="space-y-3">
                    <div>
                      <Label>Pickup Address</Label>
                      <p className="text-sm bg-gray-50 p-2 rounded">{selectedOrder.pickup_address}</p>
                    </div>
                    <div>
                      <Label>Delivery Address</Label>
                      <p className="text-sm bg-gray-50 p-2 rounded">{selectedOrder.delivery_address}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tracking Timeline */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Tracking Timeline</h3>
                {selectedOrder.tracking_history && selectedOrder.tracking_history.length > 0 ? (
                  <div className="space-y-4">
                    {selectedOrder.tracking_history.map((tracking, index) => (
                      <motion.div
                        key={tracking.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-start space-x-4"
                      >
                        <div className="flex-shrink-0">
                          <div className={`w-3 h-3 rounded-full ${index === 0 ? 'bg-blue-500' : 'bg-gray-300'}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-gray-900">{tracking.status}</p>
                            <p className="text-xs text-gray-500">{formatDateTime(tracking.timestamp)}</p>
                          </div>
                          {tracking.location && (
                            <p className="text-sm text-gray-600 mt-1">
                              <MapPin className="w-3 h-3 inline mr-1" />
                              {tracking.location}
                            </p>
                          )}
                          {tracking.notes && (
                            <p className="text-sm text-gray-600 mt-1">{tracking.notes}</p>
                          )}
                          {tracking.created_by && (
                            <p className="text-xs text-gray-500 mt-1">
                              Updated by: {tracking.employees?.full_name || 'System'}
                            </p>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Clock className="w-8 h-8 mx-auto mb-2" />
                    <p>No tracking information available</p>
                  </div>
                )}
              </div>

              {selectedOrder.special_instructions && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-2">Special Instructions</h3>
                  <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-md">
                    {selectedOrder.special_instructions}
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

export default DeliveryTracking;
