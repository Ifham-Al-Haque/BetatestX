import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { 
  Bell, 
  CheckSquare, 
  Plus, 
  Search, 
  Filter, 
  Calendar,
  UserCheck,
  FileText,
  TrendingUp,
  ChevronRight,
  Eye,
  Edit,
  Trash,
  Download,
  Upload,
  Target,
  Award,
  Building,
  Shield,
  Monitor,
  Briefcase,
  Key,
  CreditCard,
  AlertTriangle,
  Clock,
  Star,
  Heart,
  Zap,
  BarChart3,
  Car,
  Users,
  Truck,
  Settings,
  Activity,
  RefreshCw,
  SlidersHorizontal,
  MapPin,
  Circle,
  DollarSign,
  Phone,
  Mail,
  User,
  CheckCircle,
  XCircle,
  Loader
} from 'lucide-react';
import subscribeNowService from '../services/subscribeNowService';
import RentalAgreementModal from '../components/subscribeNow/RentalAgreementModal';
import DeliveryChecklistModal from '../components/subscribeNow/DeliveryChecklistModal';

const SubscribeNow = () => {
  const { userProfile } = useAuth();
  const [activeTab, setActiveTab] = useState('fleet-delivery');
  const [rentalAgreements, setRentalAgreements] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [fleetServices, setFleetServices] = useState([]);
  const [serviceStatistics, setServiceStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showChecklistModal, setShowChecklistModal] = useState(false);
  const [selectedRental, setSelectedRental] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [agreementStatusFilter, setAgreementStatusFilter] = useState('');
  const [deliveryStatusFilter, setDeliveryStatusFilter] = useState('');
  const [customerTypeFilter, setCustomerTypeFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (activeTab === 'fleet-delivery') {
      loadFleetDeliveryData();
    } else if (activeTab === 'services') {
      loadFleetServiceData();
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'fleet-delivery') {
      const delayedSearch = setTimeout(() => {
        if (searchTerm || agreementStatusFilter || deliveryStatusFilter || customerTypeFilter || dateFrom || dateTo) {
          loadRentalAgreements();
        }
      }, 300);

      return () => clearTimeout(delayedSearch);
    }
  }, [searchTerm, agreementStatusFilter, deliveryStatusFilter, customerTypeFilter, dateFrom, dateTo, activeTab]);

  const loadFleetDeliveryData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadRentalAgreements(),
        loadStatistics()
      ]);
    } catch (error) {
      console.error('Error loading fleet delivery data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRentalAgreements = async () => {
    try {
      const filters = {
        agreement_status: agreementStatusFilter,
        delivery_status: deliveryStatusFilter,
        customer_type: customerTypeFilter,
        search: searchTerm,
        date_from: dateFrom,
        date_to: dateTo
      };

      const data = await subscribeNowService.getRentalAgreements(filters);
      setRentalAgreements(data);
    } catch (error) {
      console.error('Error loading rental agreements:', error);
      setRentalAgreements([]);
    }
  };

  const loadStatistics = async () => {
    try {
      const stats = await subscribeNowService.getDeliveryStatistics();
      setStatistics(stats);
    } catch (error) {
      console.error('Error loading statistics:', error);
    }
  };

  const loadFleetServiceData = async () => {
    try {
      setLoading(true);
      const serviceData = await subscribeNowService.getFleetServiceDetails();
      setFleetServices(serviceData.services);
      setServiceStatistics(serviceData.statistics);
    } catch (error) {
      console.error('Error loading fleet service data:', error);
      setFleetServices([]);
      setServiceStatistics(null);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    if (activeTab === 'fleet-delivery') {
      await loadFleetDeliveryData();
    } else if (activeTab === 'services') {
      await loadFleetServiceData();
    }
    setRefreshing(false);
  };

  const handleCreateRental = () => {
    setSelectedRental(null);
    setShowCreateModal(true);
  };

  const handleEditRental = (rental) => {
    setSelectedRental(rental);
    setShowCreateModal(true);
  };

  const handleViewChecklist = (rental) => {
    setSelectedRental(rental);
    setShowChecklistModal(true);
  };

  const handleModalSuccess = () => {
    setShowCreateModal(false);
    setShowChecklistModal(false);
    setSelectedRental(null);
    if (activeTab === 'fleet-delivery') {
      loadFleetDeliveryData();
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setAgreementStatusFilter('');
    setDeliveryStatusFilter('');
    setCustomerTypeFilter('');
    setDateFrom('');
    setDateTo('');
  };

  const getAgreementStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'approved': return 'bg-green-100 text-green-800 border-green-200';
      case 'active': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'pending approval': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'completed': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      case 'draft': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getDeliveryStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'in progress': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'failed': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed': return CheckCircle;
      case 'in progress': return Settings;
      case 'pending': return Clock;
      case 'failed': return XCircle;
      case 'approved': return CheckCircle;
      case 'active': return Activity;
      default: return Clock;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    if (!amount) return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (loading && activeTab === 'fleet-delivery') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-200 border-t-purple-600 mx-auto mb-4"></div>
            <Truck className="w-6 h-6 text-purple-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
          </div>
          <p className="text-gray-700 font-medium">Loading Subscribe Now...</p>
          <p className="text-gray-500 text-sm mt-1">Please wait while we fetch your data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Enhanced Header with Tabs */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 flex items-center">
                <div className="bg-gradient-to-r from-purple-600 to-purple-700 p-3 rounded-2xl mr-4">
                  <Bell className="w-8 h-8 text-white" />
                </div>
                Subscribe Now Department
              </h1>
              <p className="text-gray-600 mt-2 text-lg">
                Fleet delivery management and subscription services
              </p>
            </div>
            <div className="flex items-center space-x-3">
              {activeTab === 'fleet-delivery' && (
                <>
                  <button
                    onClick={handleRefresh}
                    disabled={refreshing}
                    className="bg-white hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-xl border border-gray-300 flex items-center transition-all shadow-sm"
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                    Refresh
                  </button>
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="bg-white hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-xl border border-gray-300 flex items-center transition-all shadow-sm"
                  >
                    <SlidersHorizontal className="w-4 h-4 mr-2" />
                    Filters
                  </button>
                  <button
                    onClick={handleCreateRental}
                    className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white px-6 py-3 rounded-xl flex items-center transition-all shadow-lg hover:shadow-xl"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    New Rental
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="mt-6">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setActiveTab('fleet-delivery')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'fleet-delivery'
                      ? 'border-purple-500 text-purple-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Truck className="w-4 h-4 inline mr-2" />
                  Fleet Delivery
                </button>
                <button
                  onClick={() => setActiveTab('services')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'services'
                      ? 'border-purple-500 text-purple-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Bell className="w-4 h-4 inline mr-2" />
                  Subscription Services
                </button>
              </nav>
            </div>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'fleet-delivery' && (
          <div>
            {/* Enhanced Stats Cards for Fleet Delivery */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">Total Rentals</p>
                    <p className="text-3xl font-bold text-gray-900">{statistics?.totalRentals || rentalAgreements.length}</p>
                    <p className="text-sm text-purple-600 mt-1">
                      <TrendingUp className="w-4 h-4 inline mr-1" />
                      All time
                    </p>
                  </div>
                  <div className="p-3 rounded-2xl bg-purple-100">
                    <FileText className="w-8 h-8 text-purple-600" />
                  </div>
                </div>
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">Delivered</p>
                    <p className="text-3xl font-bold text-gray-900">
                      {statistics?.deliveryStatusBreakdown?.Completed || rentalAgreements.filter(r => r.delivery_status === 'Completed').length}
                    </p>
                    <p className="text-sm text-green-600 mt-1">
                      <CheckCircle className="w-4 h-4 inline mr-1" />
                      Successfully delivered
                    </p>
                  </div>
                  <div className="p-3 rounded-2xl bg-green-100">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                </div>
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">In Progress</p>
                    <p className="text-3xl font-bold text-gray-900">
                      {statistics?.deliveryStatusBreakdown?.['In Progress'] || rentalAgreements.filter(r => r.delivery_status === 'In Progress').length}
                    </p>
                    <p className="text-sm text-blue-600 mt-1">
                      <Activity className="w-4 h-4 inline mr-1" />
                      Active deliveries
                    </p>
                  </div>
                  <div className="p-3 rounded-2xl bg-blue-100">
                    <Settings className="w-8 h-8 text-blue-600" />
                  </div>
                </div>
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">Total Revenue</p>
                    <p className="text-3xl font-bold text-gray-900">
                      {formatCurrency(statistics?.totalRevenue || rentalAgreements.reduce((sum, r) => sum + (r.confirmed_amount || 0), 0))}
                    </p>
                    <p className="text-sm text-orange-600 mt-1">
                      <BarChart3 className="w-4 h-4 inline mr-1" />
                      Confirmed amount
                    </p>
                  </div>
                  <div className="p-3 rounded-2xl bg-orange-100">
                    <DollarSign className="w-8 h-8 text-orange-600" />
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Enhanced Filters */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-white rounded-2xl shadow-lg mb-6 overflow-hidden"
                >
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                          <input
                            type="text"
                            placeholder="Search rentals..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Agreement Status</label>
                        <select
                          value={agreementStatusFilter}
                          onChange={(e) => setAgreementStatusFilter(e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                        >
                          <option value="">All Status</option>
                          <option value="Draft">Draft</option>
                          <option value="Pending Approval">Pending Approval</option>
                          <option value="Approved">Approved</option>
                          <option value="Active">Active</option>
                          <option value="Completed">Completed</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Delivery Status</label>
                        <select
                          value={deliveryStatusFilter}
                          onChange={(e) => setDeliveryStatusFilter(e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                        >
                          <option value="">All Status</option>
                          <option value="Pending">Pending</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Completed">Completed</option>
                          <option value="Failed">Failed</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Customer Type</label>
                        <select
                          value={customerTypeFilter}
                          onChange={(e) => setCustomerTypeFilter(e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                        >
                          <option value="">All Types</option>
                          <option value="Individual">Individual</option>
                          <option value="Corporate">Corporate</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">From Date</label>
                        <input
                          type="date"
                          value={dateFrom}
                          onChange={(e) => setDateFrom(e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">To Date</label>
                        <input
                          type="date"
                          value={dateTo}
                          onChange={(e) => setDateTo(e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                        />
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
                      <button
                        onClick={clearFilters}
                        className="text-gray-600 hover:text-gray-800 text-sm font-medium"
                      >
                        Clear Filters
                      </button>
                      <span className="text-sm text-gray-500">
                        Showing {rentalAgreements.length} rental agreements
                      </span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Enhanced Rental Agreements List */}
            <div className="space-y-4">
              {rentalAgreements.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-white rounded-2xl shadow-lg p-12 text-center"
                >
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Truck className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No rental agreements found</h3>
                  <p className="text-gray-600 mb-6">Start by creating your first rental agreement for a customer.</p>
                  <button
                    onClick={handleCreateRental}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl flex items-center mx-auto transition-all"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Create First Rental
                  </button>
                </motion.div>
              ) : (
                rentalAgreements.map((rental, index) => {
                  const AgreementStatusIcon = getStatusIcon(rental.agreement_status);
                  const DeliveryStatusIcon = getStatusIcon(rental.delivery_status);
                  
                  return (
                    <motion.div
                      key={rental.rental_id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden"
                    >
                      <div className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center space-x-4">
                            <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl">
                              <FileText className="w-6 h-6 text-white" />
                            </div>
                            <div>
                              <h3 className="text-xl font-semibold text-gray-900">
                                {rental.rental_agreement_id}
                              </h3>
                              <p className="text-gray-600 mt-1">
                                {rental.customer_name} ({rental.customer_code})
                              </p>
                              <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                                <span className="flex items-center">
                                  <Mail className="w-3 h-3 mr-1" />
                                  {rental.email}
                                </span>
                                <span className="flex items-center">
                                  <Phone className="w-3 h-3 mr-1" />
                                  {rental.phone}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-3">
                            <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getAgreementStatusColor(rental.agreement_status)}`}>
                              <AgreementStatusIcon className="w-4 h-4 inline mr-1" />
                              {rental.agreement_status}
                            </span>
                            
                            <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getDeliveryStatusColor(rental.delivery_status)}`}>
                              <DeliveryStatusIcon className="w-4 h-4 inline mr-1" />
                              {rental.delivery_status}
                            </span>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="mb-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-700">Delivery Progress</span>
                            <span className="text-sm text-gray-500">{rental.delivery_progress || 0}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-purple-600 h-2 rounded-full transition-all duration-500"
                              style={{ width: `${rental.delivery_progress || 0}%` }}
                            />
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                          <div className="flex items-center space-x-2">
                            <Car className="w-4 h-4 text-gray-400" />
                            <div>
                              <p className="text-sm text-gray-600">Desired Fleet</p>
                              <p className="font-medium text-gray-900">{rental.desired_fleet_type}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <DollarSign className="w-4 h-4 text-gray-400" />
                            <div>
                              <p className="text-sm text-gray-600">Rental Amount</p>
                              <div className="font-medium text-gray-900">
                                {rental.original_rental_amount !== rental.confirmed_amount ? (
                                  <>
                                    <span className="line-through text-gray-500 text-sm">{formatCurrency(rental.original_rental_amount)}</span>
                                    <span className="ml-2 text-green-600">{formatCurrency(rental.confirmed_amount)}</span>
                                  </>
                                ) : (
                                  <span>{formatCurrency(rental.confirmed_amount)}</span>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <div>
                              <p className="text-sm text-gray-600">Duration</p>
                              <p className="font-medium text-gray-900">{rental.rental_duration_months} months</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <User className="w-4 h-4 text-gray-400" />
                            <div>
                              <p className="text-sm text-gray-600">Customer Type</p>
                              <p className="font-medium text-gray-900">{rental.customer_type}</p>
                            </div>
                          </div>
                        </div>

                        {/* Vehicle Assignment */}
                        {rental.vehicle_number && (
                          <div className="mb-4 p-4 bg-blue-50 rounded-xl">
                            <h4 className="text-sm font-medium text-gray-900 mb-2">Assigned Vehicle</h4>
                            <p className="text-blue-800 font-medium">
                              {rental.vehicle_number} - {rental.vehicle_make} {rental.vehicle_model}
                            </p>
                          </div>
                        )}

                        {/* Rental Contract */}
                        {rental.rental_contract_url && (
                          <div className="mb-4 p-4 bg-green-50 rounded-xl">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center text-green-800">
                                <FileText className="w-4 h-4 mr-2" />
                                <span className="text-sm font-medium">
                                  Contract uploaded - Signed: {formatDate(rental.contract_signed_date)}
                                </span>
                              </div>
                              <a 
                                href={rental.rental_contract_url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-green-600 hover:text-green-800 text-sm font-medium"
                              >
                                View Contract
                              </a>
                            </div>
                          </div>
                        )}
                        
                        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                          <div className="flex items-center space-x-4">
                            <button 
                              onClick={() => handleViewChecklist(rental)}
                              className="text-purple-600 hover:text-purple-800 flex items-center text-sm font-medium transition-colors"
                            >
                              <CheckSquare className="w-4 h-4 mr-1" />
                              Delivery Checklist
                            </button>
                            <button 
                              onClick={() => handleEditRental(rental)}
                              className="text-gray-600 hover:text-gray-800 flex items-center text-sm font-medium transition-colors"
                            >
                              <Edit className="w-4 h-4 mr-1" />
                              Edit
                            </button>
                            <button className="text-gray-600 hover:text-gray-800 flex items-center text-sm font-medium transition-colors">
                              <Download className="w-4 h-4 mr-1" />
                              Export
                            </button>
                          </div>
                          
                          {rental.all_items_completed && (
                            <div className="flex items-center text-green-600 text-sm font-medium">
                              <Award className="w-4 h-4 mr-1" />
                              Ready for Delivery
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {activeTab === 'services' && (
          <div>
            {/* Real Fleet Rental Service Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">Available Services</p>
                    <p className="text-3xl font-bold text-gray-900">{serviceStatistics?.availableServices || 0}</p>
                    <p className="text-sm text-green-600 mt-1">
                      <Car className="w-4 h-4 inline mr-1" />
                      Cars available for rental
                    </p>
                  </div>
                  <div className="p-3 rounded-2xl bg-green-100">
                    <Car className="w-8 h-8 text-green-600" />
                  </div>
                </div>
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">Active Subscriptions</p>
                    <p className="text-3xl font-bold text-gray-900">{serviceStatistics?.activeSubscriptions || 0}</p>
                    <p className="text-sm text-blue-600 mt-1">
                      <CheckSquare className="w-4 h-4 inline mr-1" />
                      Cars currently rented
                    </p>
                  </div>
                  <div className="p-3 rounded-2xl bg-blue-100">
                    <CheckSquare className="w-8 h-8 text-blue-600" />
                  </div>
                </div>
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">Pending</p>
                    <p className="text-3xl font-bold text-gray-900">{serviceStatistics?.pendingConfirmations || 0}</p>
                    <p className="text-sm text-yellow-600 mt-1">
                      <Clock className="w-4 h-4 inline mr-1" />
                      Rental confirmations ongoing
                    </p>
                  </div>
                  <div className="p-3 rounded-2xl bg-yellow-100">
                    <Clock className="w-8 h-8 text-yellow-600" />
                  </div>
                </div>
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">Total Users</p>
                    <p className="text-3xl font-bold text-gray-900">{serviceStatistics?.totalUsers || 0}</p>
                    <p className="text-sm text-purple-600 mt-1">
                      <Users className="w-4 h-4 inline mr-1" />
                      Customers with ongoing rentals
                    </p>
                  </div>
                  <div className="p-3 rounded-2xl bg-purple-100">
                    <Users className="w-8 h-8 text-purple-600" />
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Fleet Service Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {fleetServices.map((service, index) => {
                const getServiceIcon = (iconName) => {
                  switch (iconName) {
                    case 'Car': return Car;
                    case 'Users': return Users;
                    case 'Clock': return Clock;
                    case 'UserCheck': return UserCheck;
                    default: return Car;
                  }
                };

                const ServiceIcon = getServiceIcon(service.icon);
                const getColorClasses = (color) => {
                  switch (color) {
                    case 'green': return 'bg-green-100 text-green-800 border-green-200';
                    case 'blue': return 'bg-blue-100 text-blue-800 border-blue-200';
                    case 'yellow': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
                    case 'purple': return 'bg-purple-100 text-purple-800 border-purple-200';
                    default: return 'bg-gray-100 text-gray-800 border-gray-200';
                  }
                };

                return (
                  <motion.div
                    key={service.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100"
                  >
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className={`p-3 rounded-2xl ${service.color === 'green' ? 'bg-green-100' : service.color === 'blue' ? 'bg-blue-100' : service.color === 'yellow' ? 'bg-yellow-100' : 'bg-purple-100'}`}>
                            <ServiceIcon className={`w-6 h-6 ${service.color === 'green' ? 'text-green-600' : service.color === 'blue' ? 'text-blue-600' : service.color === 'yellow' ? 'text-yellow-600' : 'text-purple-600'}`} />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                              {service.name}
                            </h3>
                            <p className="text-sm text-gray-600">{service.category}</p>
                          </div>
                        </div>
                        
                        <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getColorClasses(service.color)}`}>
                          {service.count} {service.count === 1 ? 'Item' : 'Items'}
                        </span>
                      </div>
                      
                      <p className="text-gray-600 mb-4">{service.description}</p>
                      
                      <div className="flex items-center justify-between mb-4">
                        <div className="text-right">
                          <p className="text-3xl font-bold text-gray-900">{service.count}</p>
                          <p className="text-sm text-gray-600">{service.details}</p>
                        </div>
                        {service.revenue && (
                          <div className="text-right">
                            <p className="text-lg font-bold text-green-600">{formatCurrency(service.revenue)}</p>
                            <p className="text-xs text-gray-500">Total Revenue</p>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                        <button className="text-purple-600 hover:text-purple-800 flex items-center text-sm font-medium transition-colors">
                          <Eye className="w-4 h-4 mr-1" />
                          View Details
                        </button>
                        
                        <div className="text-sm text-gray-500">
                          Live Data
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Fleet Analytics Summary */}
            {serviceStatistics && (
              <div className="bg-white rounded-2xl shadow-lg p-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                  <BarChart3 className="w-6 h-6 mr-3 text-purple-600" />
                  Fleet Rental Analytics
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6">
                    <h4 className="text-lg font-semibold text-green-900 mb-2">Fleet Availability</h4>
                    <p className="text-3xl font-bold text-green-700 mb-2">{serviceStatistics.availableServices}</p>
                    <p className="text-sm text-green-600">Vehicles ready for long-term rental</p>
                  </div>
                  
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6">
                    <h4 className="text-lg font-semibold text-blue-900 mb-2">Revenue Performance</h4>
                    <p className="text-3xl font-bold text-blue-700 mb-2">{formatCurrency(serviceStatistics.totalRevenue)}</p>
                    <p className="text-sm text-blue-600">
                      Avg: {formatCurrency(serviceStatistics.averageRentalAmount)} per rental
                    </p>
                  </div>
                  
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6">
                    <h4 className="text-lg font-semibold text-purple-900 mb-2">Customer Distribution</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-purple-700">Individual:</span>
                        <span className="font-semibold text-purple-800">{serviceStatistics.customerBreakdown?.individual || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-purple-700">Corporate:</span>
                        <span className="font-semibold text-purple-800">{serviceStatistics.customerBreakdown?.corporate || 0}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Enhanced Modals */}
        <RentalAgreementModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          rental={selectedRental}
          onSuccess={handleModalSuccess}
        />

        <DeliveryChecklistModal
          isOpen={showChecklistModal}
          onClose={() => setShowChecklistModal(false)}
          rental={selectedRental}
          onSuccess={handleModalSuccess}
        />
      </div>
    </div>
  );
};

export default SubscribeNow;
