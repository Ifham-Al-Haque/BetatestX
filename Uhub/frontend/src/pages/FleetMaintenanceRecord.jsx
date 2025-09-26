import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { 
  FileText, 
  Wrench, 
  Plus, 
  Search, 
  Filter, 
  Calendar,
  Car,
  DollarSign,
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
  User,
  MapPin,
  Star,
  CheckCircle,
  XCircle,
  Settings,
  BarChart3,
  PieChart,
  Activity,
  Loader,
  RefreshCw,
  SlidersHorizontal,
  ArrowUpDown
} from 'lucide-react';
import fleetService from '../services/fleetService';
import MaintenanceRecordModal from '../components/fleet/MaintenanceRecordModal';

const FleetMaintenanceRecord = () => {
  const { userProfile } = useAuth();
  const [maintenanceRecords, setMaintenanceRecords] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortBy, setSortBy] = useState('service_date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [showFilters, setShowFilters] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      if (searchTerm || statusFilter || typeFilter || dateFrom || dateTo) {
        loadMaintenanceRecords();
      }
    }, 300);

    return () => clearTimeout(delayedSearch);
  }, [searchTerm, statusFilter, typeFilter, dateFrom, dateTo]);

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadMaintenanceRecords(),
        loadStatistics()
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMaintenanceRecords = async () => {
    try {
      const filters = {
        status: statusFilter,
        maintenance_type: typeFilter,
        date_from: dateFrom,
        date_to: dateTo,
        search: searchTerm
      };

      const data = await fleetService.getMaintenanceRecords(null, filters);
      
      // Sort the data
      const sortedData = [...data].sort((a, b) => {
        let aValue = a[sortBy];
        let bValue = b[sortBy];
        
        if (sortBy === 'service_date' || sortBy === 'next_service_date') {
          aValue = new Date(aValue);
          bValue = new Date(bValue);
        }
        
        if (sortBy === 'cost' || sortBy === 'labor_hours') {
          aValue = parseFloat(aValue) || 0;
          bValue = parseFloat(bValue) || 0;
        }
        
        if (sortOrder === 'asc') {
          return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
        } else {
          return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
        }
      });

      setMaintenanceRecords(sortedData);
    } catch (error) {
      console.error('Error loading maintenance records:', error);
      // Fallback to empty array on error
      setMaintenanceRecords([]);
    }
  };

  const loadStatistics = async () => {
    try {
      const stats = await fleetService.getMaintenanceStatistics();
      setStatistics(stats);
    } catch (error) {
      console.error('Error loading statistics:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleCreateRecord = () => {
    setSelectedRecord(null);
    setShowCreateModal(true);
  };

  const handleEditRecord = (record) => {
    setSelectedRecord(record);
    setShowCreateModal(true);
  };

  const handleDeleteRecord = async (recordId) => {
    if (window.confirm('Are you sure you want to delete this maintenance record?')) {
      try {
        await fleetService.deleteMaintenanceRecord(recordId);
        await loadData();
      } catch (error) {
        console.error('Error deleting maintenance record:', error);
        alert('Failed to delete maintenance record');
      }
    }
  };

  const handleModalSuccess = () => {
    setShowCreateModal(false);
    setSelectedRecord(null);
    loadData();
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('');
    setTypeFilter('');
    setDateFrom('');
    setDateTo('');
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
    loadMaintenanceRecords();
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'in progress': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'scheduled': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeColor = (type) => {
    switch (type?.toLowerCase()) {
      case 'scheduled': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'repair': return 'bg-red-100 text-red-800 border-red-200';
      case 'inspection': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'emergency': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed': return CheckCircle;
      case 'in progress': return Settings;
      case 'scheduled': return Clock;
      case 'cancelled': return XCircle;
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
            <Wrench className="w-6 h-6 text-blue-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
          </div>
          <p className="text-gray-700 font-medium">Loading Fleet Maintenance Records...</p>
          <p className="text-gray-500 text-sm mt-1">Please wait while we fetch your data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Enhanced Header */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 flex items-center">
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-3 rounded-2xl mr-4">
                  <Wrench className="w-8 h-8 text-white" />
                </div>
                Fleet Maintenance Records
              </h1>
              <p className="text-gray-600 mt-2 text-lg">
                Track, manage, and optimize your fleet's maintenance operations
              </p>
            </div>
            <div className="flex items-center space-x-3">
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
                onClick={handleCreateRecord}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3 rounded-xl flex items-center transition-all shadow-lg hover:shadow-xl"
              >
                <Plus className="w-5 h-5 mr-2" />
                Add Record
              </button>
            </div>
          </div>
        </div>

        {/* Enhanced Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Total Records</p>
                <p className="text-3xl font-bold text-gray-900">{statistics?.totalRecords || maintenanceRecords.length}</p>
                <p className="text-sm text-green-600 mt-1">
                  <TrendingUp className="w-4 h-4 inline mr-1" />
                  All time
                </p>
              </div>
              <div className="p-3 rounded-2xl bg-blue-100">
                <FileText className="w-8 h-8 text-blue-600" />
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
                <p className="text-sm font-medium text-gray-600 mb-1">Completed</p>
                <p className="text-3xl font-bold text-gray-900">
                  {statistics?.statusBreakdown?.Completed || maintenanceRecords.filter(r => r.status?.toLowerCase() === 'completed').length}
                </p>
                <p className="text-sm text-green-600 mt-1">
                  <CheckCircle className="w-4 h-4 inline mr-1" />
                  Success rate
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
                  {statistics?.statusBreakdown?.['In Progress'] || maintenanceRecords.filter(r => r.status?.toLowerCase() === 'in progress').length}
                </p>
                <p className="text-sm text-yellow-600 mt-1">
                  <Activity className="w-4 h-4 inline mr-1" />
                  Active
                </p>
              </div>
              <div className="p-3 rounded-2xl bg-yellow-100">
                <Settings className="w-8 h-8 text-yellow-600" />
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
                <p className="text-sm font-medium text-gray-600 mb-1">Total Cost</p>
                <p className="text-3xl font-bold text-gray-900">
                  {formatCurrency(statistics?.totalCost || maintenanceRecords.reduce((sum, r) => sum + (r.cost || 0), 0))}
                </p>
                <p className="text-sm text-blue-600 mt-1">
                  <BarChart3 className="w-4 h-4 inline mr-1" />
                  Investment
                </p>
              </div>
              <div className="p-3 rounded-2xl bg-purple-100">
                <DollarSign className="w-8 h-8 text-purple-600" />
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="text"
                        placeholder="Search records..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    >
                      <option value="">All Status</option>
                      <option value="Completed">Completed</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Scheduled">Scheduled</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                    <select
                      value={typeFilter}
                      onChange={(e) => setTypeFilter(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    >
                      <option value="">All Types</option>
                      <option value="Scheduled">Scheduled</option>
                      <option value="Repair">Repair</option>
                      <option value="Inspection">Inspection</option>
                      <option value="Emergency">Emergency</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">From Date</label>
                    <input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">To Date</label>
                    <input
                      type="date"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  </div>
                </div>
                
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={clearFilters}
                      className="text-gray-600 hover:text-gray-800 text-sm font-medium"
                    >
                      Clear Filters
                    </button>
                    <span className="text-sm text-gray-500">
                      Showing {maintenanceRecords.length} records
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">Sort by:</span>
                    <button
                      onClick={() => handleSort('service_date')}
                      className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
                        sortBy === 'service_date' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      Date <ArrowUpDown className="w-3 h-3 inline ml-1" />
                    </button>
                    <button
                      onClick={() => handleSort('cost')}
                      className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
                        sortBy === 'cost' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      Cost <ArrowUpDown className="w-3 h-3 inline ml-1" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Enhanced Maintenance Records List */}
        <div className="space-y-4">
          {maintenanceRecords.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white rounded-2xl shadow-lg p-12 text-center"
            >
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No maintenance records found</h3>
              <p className="text-gray-600 mb-6">Get started by adding your first maintenance record.</p>
              <button
                onClick={handleCreateRecord}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl flex items-center mx-auto transition-all"
              >
                <Plus className="w-5 h-5 mr-2" />
                Add First Record
              </button>
            </motion.div>
          ) : (
            maintenanceRecords.map((record, index) => {
              const StatusIcon = getStatusIcon(record.status);
              return (
                <motion.div
                  key={record.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-4">
                        <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl">
                          <Wrench className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold text-gray-900">
                            {record.description}
                          </h3>
                          <p className="text-gray-600 flex items-center mt-1">
                            <Car className="w-4 h-4 mr-1" />
                            {record.fleet_vehicles?.vehicle_number} - {record.fleet_vehicles?.make} {record.fleet_vehicles?.model}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getTypeColor(record.maintenance_type)}`}>
                          {record.maintenance_type}
                        </span>
                        
                        <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(record.status)}`}>
                          <StatusIcon className="w-4 h-4 inline mr-1" />
                          {record.status}
                        </span>
                        
                        <div className="text-right">
                          <p className="text-sm text-gray-600">Cost</p>
                          <p className="text-xl font-bold text-gray-900">{formatCurrency(record.cost)}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-600">Service Date</p>
                          <p className="font-medium text-gray-900">{formatDate(record.service_date)}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Building className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-600">Service Provider</p>
                          <p className="font-medium text-gray-900">{record.service_provider || 'Not specified'}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-600">Mileage</p>
                          <p className="font-medium text-gray-900">
                            {record.mileage_at_service ? `${record.mileage_at_service.toLocaleString()} km` : 'Not recorded'}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-600">Labor Hours</p>
                          <p className="font-medium text-gray-900">{record.labor_hours || 0}h</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Parts Replaced */}
                    {record.parts_replaced && record.parts_replaced.length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-gray-900 mb-2">Parts Replaced:</h4>
                        <div className="flex flex-wrap gap-2">
                          {record.parts_replaced.map((part, partIndex) => (
                            <span
                              key={partIndex}
                              className="px-3 py-1 bg-blue-50 text-blue-700 text-sm rounded-full border border-blue-200"
                            >
                              {part}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {record.next_service_date && (
                      <div className="mb-4 p-4 bg-yellow-50 rounded-xl border border-yellow-200">
                        <p className="text-sm text-yellow-800 flex items-center">
                          <Calendar className="w-4 h-4 mr-2" />
                          Next service due: {formatDate(record.next_service_date)}
                        </p>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                      <div className="flex items-center space-x-4">
                        <button 
                          onClick={() => handleEditRecord(record)}
                          className="text-blue-600 hover:text-blue-800 flex items-center text-sm font-medium transition-colors"
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Edit
                        </button>
                        <button className="text-gray-600 hover:text-gray-800 flex items-center text-sm font-medium transition-colors">
                          <Eye className="w-4 h-4 mr-1" />
                          View Details
                        </button>
                        <button 
                          onClick={() => handleDeleteRecord(record.id)}
                          className="text-red-600 hover:text-red-800 flex items-center text-sm font-medium transition-colors"
                        >
                          <Trash className="w-4 h-4 mr-1" />
                          Delete
                        </button>
                      </div>
                      
                      {record.employees && (
                        <div className="text-sm text-gray-600 flex items-center">
                          <User className="w-4 h-4 mr-1" />
                          Created by {record.employees.full_name}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>

        {/* Enhanced Modal */}
        <MaintenanceRecordModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          record={selectedRecord}
          onSuccess={handleModalSuccess}
        />
      </div>
    </div>
  );
};

export default FleetMaintenanceRecord;
