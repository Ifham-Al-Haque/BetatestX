import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { 
  Car, 
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
  Activity,
  BarChart3,
  RefreshCw,
  SlidersHorizontal,
  Loader,
  Settings,
  CheckCircle,
  XCircle,
  MapPin,
  Circle
} from 'lucide-react';
import fleetOnboardingService from '../services/fleetOnboardingService';
import FleetOnboardingModal from '../components/fleet/FleetOnboardingModal';
import FleetChecklistModal from '../components/fleet/FleetChecklistModal';

const FleetOnboarding = ({ embedded = false }) => {
  const { userProfile } = useAuth();
  const [onboardingRecords, setOnboardingRecords] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showOnboardingModal, setShowOnboardingModal] = useState(false);
  const [showChecklistModal, setShowChecklistModal] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      if (searchTerm || statusFilter || dateFilter) {
        loadOnboardingRecords();
      }
    }, 300);

    return () => clearTimeout(delayedSearch);
  }, [searchTerm, statusFilter, dateFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadOnboardingRecords(),
        loadStatistics()
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadOnboardingRecords = async () => {
    try {
      const filters = {
        status: statusFilter,
        search: searchTerm,
        date_from: dateFilter
      };

      const data = await fleetOnboardingService.getOnboardingVehicles(filters);
      setOnboardingRecords(data);
    } catch (error) {
      console.error('Error loading onboarding records:', error);
      setOnboardingRecords([]);
    }
  };

  const loadStatistics = async () => {
    try {
      const stats = await fleetOnboardingService.getOnboardingStatistics();
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

  const handleStartOnboarding = () => {
    setSelectedVehicle(null);
    setShowOnboardingModal(true);
  };

  const handleEditVehicle = (vehicle) => {
    setSelectedVehicle(vehicle);
    setShowOnboardingModal(true);
  };

  const handleViewChecklist = (vehicle) => {
    setSelectedVehicle(vehicle);
    setShowChecklistModal(true);
  };

  const handleDeleteVehicle = async (vehicleId) => {
    if (window.confirm('Are you sure you want to delete this vehicle? This action cannot be undone.')) {
      try {
        await fleetOnboardingService.deleteVehicle(vehicleId);
        await loadData();
      } catch (error) {
        console.error('Error deleting vehicle:', error);
        alert('Failed to delete vehicle: ' + error.message);
      }
    }
  };

  const handleModalSuccess = () => {
    setShowOnboardingModal(false);
    setShowChecklistModal(false);
    setSelectedVehicle(null);
    loadData();
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('');
    setDateFilter('');
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'in progress': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'on hold': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'not started': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed': return CheckCircle;
      case 'in progress': return Settings;
      case 'on hold': return AlertTriangle;
      case 'not started': return Clock;
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
            <Car className="w-6 h-6 text-blue-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
          </div>
          <p className="text-gray-700 font-medium">Loading Fleet Onboarding...</p>
          <p className="text-gray-500 text-sm mt-1">Please wait while we fetch your data</p>
        </div>
      </div>
    );
  }

  return (
    <div className={embedded ? 'bg-gray-50' : 'min-h-screen bg-gradient-to-br from-gray-50 to-blue-50'}>
      <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${embedded ? 'py-6' : 'py-8'}`}>
        {!embedded && (
        <>
        {/* Enhanced Header */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 flex items-center">
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-3 rounded-2xl mr-4">
                  <Car className="w-8 h-8 text-white" />
                </div>
                Fleet Onboarding System
              </h1>
              <p className="text-gray-600 mt-2 text-lg">
                Comprehensive vehicle onboarding with smart checklists and progress tracking
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
                onClick={handleStartOnboarding}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3 rounded-xl flex items-center transition-all shadow-lg hover:shadow-xl"
              >
                <Plus className="w-5 h-5 mr-2" />
                Start Onboarding
              </button>
            </div>
          </div>
        </div>
        </>
        )}

        {embedded && (
          <div className="flex flex-wrap items-center justify-end gap-2 mb-6">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="bg-white hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg border border-gray-300 flex items-center text-sm"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              onClick={handleStartOnboarding}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center text-sm"
            >
              <Plus className="w-4 h-4 mr-2" />
              Start Onboarding
            </button>
          </div>
        )}

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
                <p className="text-sm font-medium text-gray-600 mb-1">Total Vehicles</p>
                <p className="text-3xl font-bold text-gray-900">{statistics?.totalVehicles || onboardingRecords.length}</p>
                <p className="text-sm text-blue-600 mt-1">
                  <TrendingUp className="w-4 h-4 inline mr-1" />
                  All time
                </p>
              </div>
              <div className="p-3 rounded-2xl bg-blue-100">
                <Car className="w-8 h-8 text-blue-600" />
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
                  {statistics?.statusBreakdown?.Completed || onboardingRecords.filter(r => r.onboarding_status === 'Completed').length}
                </p>
                <p className="text-sm text-green-600 mt-1">
                  <CheckCircle className="w-4 h-4 inline mr-1" />
                  Ready for service
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
                  {statistics?.inProgressCount || onboardingRecords.filter(r => r.onboarding_status === 'In Progress').length}
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
                <p className="text-sm font-medium text-gray-600 mb-1">Avg. Progress</p>
                <p className="text-3xl font-bold text-gray-900">
                  {statistics?.averageProgress || 0}%
                </p>
                <p className="text-sm text-purple-600 mt-1">
                  <BarChart3 className="w-4 h-4 inline mr-1" />
                  Overall
                </p>
              </div>
              <div className="p-3 rounded-2xl bg-purple-100">
                <BarChart3 className="w-8 h-8 text-purple-600" />
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="text"
                        placeholder="Search vehicles..."
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
                      <option value="Not Started">Not Started</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                      <option value="On Hold">On Hold</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Date From</label>
                    <input
                      type="date"
                      value={dateFilter}
                      onChange={(e) => setDateFilter(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
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
                    Showing {onboardingRecords.length} vehicles
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Enhanced Vehicle Records List */}
        <div className="space-y-4">
          {onboardingRecords.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white rounded-2xl shadow-lg p-12 text-center"
            >
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Car className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No vehicles in onboarding</h3>
              <p className="text-gray-600 mb-6">Start by adding your first vehicle to the onboarding process.</p>
              <button
                onClick={handleStartOnboarding}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl flex items-center mx-auto transition-all"
              >
                <Plus className="w-5 h-5 mr-2" />
                Start First Onboarding
              </button>
            </motion.div>
          ) : (
            onboardingRecords.map((record, index) => {
              const StatusIcon = getStatusIcon(record.onboarding_status);
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
                          <Car className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold text-gray-900">
                            {record.vehicle_number}
                          </h3>
                          <p className="text-gray-600 mt-1">
                            {record.make} {record.model} ({record.model_year})
                          </p>
                          <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                            <span>License: {record.license_plate}</span>
                            {record.iot_device_imei && (
                              <span>IoT: {record.iot_device_imei}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(record.onboarding_status)}`}>
                          <StatusIcon className="w-4 h-4 inline mr-1" />
                          {record.onboarding_status}
                        </span>
                        
                        <div className="text-right">
                          <p className="text-sm text-gray-600">Progress</p>
                          <p className="text-xl font-bold text-gray-900">{record.onboarding_progress}%</p>
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-4">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${record.onboarding_progress}%` }}
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-600">Started</p>
                          <p className="font-medium text-gray-900">{formatDate(record.onboarding_started_at)}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Building className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-600">Department</p>
                          <p className="font-medium text-gray-900">{record.department_name || 'Not assigned'}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <UserCheck className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-600">Driver</p>
                          <p className="font-medium text-gray-900">{record.assigned_driver_name || 'Not assigned'}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-600">Location</p>
                          <p className="font-medium text-gray-900">{record.fleet_intended_location || 'Not specified'}</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Checklist Summary */}
                    <div className="mb-4 p-4 bg-gray-50 rounded-xl">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Checklist Status</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                        <div className={`flex items-center ${record.car_registration ? 'text-green-600' : 'text-gray-400'}`}>
                          {record.car_registration ? <CheckCircle className="w-3 h-3 mr-1" /> : <Circle className="w-3 h-3 mr-1" />}
                          Registration
                        </div>
                        <div className={`flex items-center ${record.passing_certificate ? 'text-green-600' : 'text-gray-400'}`}>
                          {record.passing_certificate ? <CheckCircle className="w-3 h-3 mr-1" /> : <Circle className="w-3 h-3 mr-1" />}
                          Passing
                        </div>
                        <div className={`flex items-center ${record.iot_device_installation ? 'text-green-600' : 'text-gray-400'}`}>
                          {record.iot_device_installation ? <CheckCircle className="w-3 h-3 mr-1" /> : <Circle className="w-3 h-3 mr-1" />}
                          IoT Device
                        </div>
                        <div className={`flex items-center ${record.branding_completed ? 'text-green-600' : 'text-gray-400'}`}>
                          {record.branding_completed ? <CheckCircle className="w-3 h-3 mr-1" /> : <Circle className="w-3 h-3 mr-1" />}
                          Branding
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                      <div className="flex items-center space-x-4">
                        <button 
                          onClick={() => handleViewChecklist(record)}
                          className="text-blue-600 hover:text-blue-800 flex items-center text-sm font-medium transition-colors"
                        >
                          <CheckSquare className="w-4 h-4 mr-1" />
                          View Checklist
                        </button>
                        <button 
                          onClick={() => handleEditVehicle(record)}
                          className="text-gray-600 hover:text-gray-800 flex items-center text-sm font-medium transition-colors"
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Edit Vehicle
                        </button>
                        {record.onboarding_status === 'Completed' && record.id && (
                          <Link
                            to={`/operation/fleet-records/${record.id}`}
                            className="text-indigo-600 hover:text-indigo-800 flex items-center text-sm font-medium transition-colors"
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            Fleet Record
                          </Link>
                        )}
                        {record.onboarding_status !== 'Completed' && (
                          <button 
                            onClick={() => handleDeleteVehicle(record.id)}
                            className="text-red-600 hover:text-red-800 flex items-center text-sm font-medium transition-colors"
                          >
                            <Trash className="w-4 h-4 mr-1" />
                            Delete
                          </button>
                        )}
                      </div>
                      
                      {record.all_items_completed && (
                        <div className="flex items-center text-green-600 text-sm font-medium">
                          <Award className="w-4 h-4 mr-1" />
                          Ready for Service
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>

        {/* Enhanced Modals */}
        <FleetOnboardingModal
          isOpen={showOnboardingModal}
          onClose={() => setShowOnboardingModal(false)}
          vehicle={selectedVehicle}
          onSuccess={handleModalSuccess}
        />

        <FleetChecklistModal
          isOpen={showChecklistModal}
          onClose={() => setShowChecklistModal(false)}
          vehicle={selectedVehicle}
          onSuccess={handleModalSuccess}
        />
      </div>
    </div>
  );
};

export default FleetOnboarding;
