import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Car, Plus, Search, Filter, Download, Eye, Edit, Trash2, AlertTriangle, 
  Wrench, Fuel, Activity, TrendingUp, Users, MapPin, Calendar, Clock,
  BarChart3, PieChart, Zap, Shield, Star, ChevronDown, ChevronRight,
  RefreshCw, Settings, MoreVertical, CheckCircle, XCircle, Play, Pause
} from 'lucide-react';

import VehicleModal from '../components/fleet/VehicleModal';
import VehicleDetailsModal from '../components/fleet/VehicleDetailsModal';
import fleetService from '../services/fleetService';
import { useToast } from '../context/ToastContext';
import { getCarDisplayName, businessTypeBadgeClass } from '../utils/fleetRecordUtils';
import OperationBreadcrumb from '../components/operation/OperationBreadcrumb';
import OperationPageHeader from '../components/operation/OperationPageHeader';
import OperationStatCard from '../components/operation/OperationStatCard';
import ConfirmDialog from '../components/operation/ConfirmDialog';
import FilterChip from '../components/operation/FilterChip';

const FleetManagement = ({
  pageTitle = 'Fleet Management',
  profileBasePath = null,
  excludeSampleData = false,
  embedded = false,
}) => {
  const embeddedMode = embedded || !!profileBasePath;
  const navigate = useNavigate();
  const { success, error: showError } = useToast();
  const [fleetData, setFleetData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
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
  
  // UI States
  const [viewMode, setViewMode] = useState('grid'); // grid, list
  const [showFilters, setShowFilters] = useState(false);
  const [expandedCard, setExpandedCard] = useState(null);
  const [selectedItems, setSelectedItems] = useState([]);
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [selectedVehicleId, setSelectedVehicleId] = useState(null);
  const [quickFilter, setQuickFilter] = useState('all');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const loadFleetData = useCallback(async (forceRefresh = false) => {
    try {
      if (forceRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      
      console.log('Loading fleet data with filters:', { search: searchTerm, ...filters });
      const data = await fleetService.getVehicles({
        search: searchTerm,
        ...filters,
        excludeSampleData,
      });
      
      console.log('Loaded fleet data:', data?.length, 'vehicles');
      setFleetData(data || []);
      
      if (forceRefresh) {
        success('Fleet data refreshed successfully');
      }
    } catch (error) {
      console.error('Error loading fleet data:', error);
      showError('Failed to load fleet data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [searchTerm, filters, excludeSampleData, success, showError]);

  const loadDepartments = useCallback(async () => {
    try {
      console.log('Loading departments...');
      const data = await fleetService.getDepartments();
      console.log('Loaded departments:', data?.length, 'departments');
      setDepartments(data || []);
    } catch (error) {
      console.error('Error loading departments:', error);
      showError('Failed to load departments');
    }
  }, [showError]);

  const loadStatistics = useCallback(async () => {
    try {
      console.log('Loading fleet statistics...');
      const data = await fleetService.getFleetStatistics();
      console.log('Loaded statistics:', data);
      setStatistics(data || {
        total_vehicles: 0,
        active_vehicles: 0,
        maintenance_vehicles: 0,
        out_of_service_vehicles: 0,
        total_mileage: 0,
        avg_fuel_efficiency: 0
      });
    } catch (error) {
      console.error('Error loading statistics:', error);
      showError('Failed to load fleet statistics');
    }
  }, [showError]);

  useEffect(() => {
    loadFleetData();
    loadDepartments();
    loadStatistics();
  }, [loadFleetData, loadDepartments, loadStatistics]);

  useEffect(() => {
    if (searchTerm || Object.values(filters).some(f => f)) {
      loadFleetData();
    }
  }, [searchTerm, filters, loadFleetData]);

  const handleRefresh = () => {
    loadFleetData(true);
    loadStatistics();
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
    if (profileBasePath) {
      navigate(`${profileBasePath}/${vehicleId}`);
      return;
    }
    setSelectedVehicleId(vehicleId);
    setShowDetailsModal(true);
  };

  const displayedFleet = useMemo(() => {
    let list = fleetData;
    if (quickFilter === 'Active') list = list.filter((v) => v.status === 'Active');
    else if (quickFilter === 'Maintenance') list = list.filter((v) => v.status === 'Maintenance');
    else if (quickFilter === 'PPM') list = list.filter((v) => v.business_type === 'PPM');
    else if (quickFilter === 'Daily') list = list.filter((v) => v.business_type === 'Daily');
    else if (quickFilter === 'EV') list = list.filter((v) => v.powertrain_type === 'EV');
    return list;
  }, [fleetData, quickFilter]);

  const handleDeleteVehicle = (vehicleId) => {
    setDeleteTarget(vehicleId);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await fleetService.deleteVehicle(deleteTarget);
      setDeleteTarget(null);
      loadFleetData();
      loadStatistics();
      success('Vehicle deleted');
    } catch (error) {
      console.error('Error deleting vehicle:', error);
      showError(error.message || 'Failed to delete vehicle');
    } finally {
      setDeleting(false);
    }
  };

  const handleModalSuccess = () => {
    loadFleetData(true);
    loadStatistics();
    success('Vehicle operation completed successfully');
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

  const toggleItemSelection = (id) => {
    setSelectedItems(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  const selectAllItems = () => {
    setSelectedItems(fleetData.map(item => item.id));
  };

  const clearSelection = () => {
    setSelectedItems([]);
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto mb-6"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Car className="w-8 h-8 text-blue-600 animate-pulse" />
            </div>
          </div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">Loading Fleet Management</h3>
          <p className="text-gray-600">Preparing your vehicle management dashboard...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen relative overflow-hidden ${embeddedMode ? 'bg-gray-50' : 'bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100'}`}>
      {!embeddedMode && (
      <>
      {/* Background Pattern */}
      <div 
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23e0e7ff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      ></div>
      
      {/* Decorative corner shapes */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-200/30 to-indigo-200/30 rounded-full -translate-y-32 translate-x-32"></div>
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-purple-200/30 to-pink-200/30 rounded-full translate-y-24 -translate-x-24"></div>
      </>
      )}
      
      <div className={`max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 ${embeddedMode ? 'py-6' : 'py-12'} relative z-10`}>
        {embeddedMode && (
          <>
            <OperationBreadcrumb items={[{ label: 'Fleet Record' }]} />
            <OperationPageHeader
              icon={Car}
              title={pageTitle}
              description="Browse vehicles, open profiles, and manage fleet photos and documents."
              actions={
                <>
                  <button
                    type="button"
                    onClick={handleRefresh}
                    disabled={refreshing}
                    className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-white flex items-center gap-2"
                  >
                    <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                    Refresh
                  </button>
                  <button
                    type="button"
                    onClick={handleAddVehicle}
                    className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add vehicle
                  </button>
                </>
              }
            />
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
              <OperationStatCard label="Total" value={statistics.total_vehicles} tone="blue" />
              <OperationStatCard label="Active" value={statistics.active_vehicles} tone="green" />
              <OperationStatCard label="Maintenance" value={statistics.maintenance_vehicles} tone="yellow" />
              <OperationStatCard label="Out of service" value={statistics.out_of_service_vehicles} tone="red" />
            </div>
          </>
        )}
        {!embeddedMode && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          {/* Title Section */}
          <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl border border-white/40 p-6 relative overflow-hidden mb-6">
            {/* Decorative Elements */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-400/10 to-indigo-600/10 rounded-full -translate-y-12 translate-x-12"></div>
            <div className="absolute bottom-0 left-0 w-20 h-20 bg-gradient-to-tr from-purple-400/10 to-pink-600/10 rounded-full translate-y-10 -translate-x-10"></div>
            
            <div className="relative z-10">
              <div className="flex items-center justify-center mb-5">
                <div className="relative mr-4">
                  <div className="p-3 bg-gradient-to-r from-blue-500 via-indigo-600 to-purple-600 rounded-xl shadow-lg">
                    <Car className="w-6 h-6 text-white" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                </div>
                
                <div className="text-4xl mr-3">🚗</div>
              </div>
              
              <div className="text-center mb-4">
                <h1 className="text-4xl font-black leading-tight mb-2 text-indigo-700">
                  {pageTitle}
                </h1>
                <div className="flex items-center justify-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  <span className="text-slate-700 font-semibold text-sm">- LIVE DASHBOARD</span>
                </div>
              </div>
              
              <p className="text-slate-600 text-base font-medium text-center leading-relaxed">
                Comprehensive vehicle fleet management and tracking system
              </p>
            </div>
          </div>

          {/* Stats and Controls Section */}
          <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl border border-white/40 p-6 relative overflow-hidden">
            {/* Decorative Elements */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-400/10 to-indigo-600/10 rounded-full -translate-y-12 translate-x-12"></div>
            <div className="absolute bottom-0 left-0 w-20 h-20 bg-gradient-to-tr from-purple-400/10 to-pink-600/10 rounded-full translate-y-10 -translate-x-10"></div>
            
            <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between relative z-10 gap-6">
              <div className="flex-1">
                {/* Enhanced Quick Stats with Improved Alignment */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <motion.div 
                    whileHover={{ scale: 1.03, y: -1 }}
                    className="bg-gradient-to-br from-blue-500 to-cyan-600 p-4 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 h-24 flex flex-col justify-center text-center text-white"
                  >
                    <p className="text-blue-100 font-semibold text-xs mb-1">Total Fleet</p>
                    <motion.p 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="text-3xl font-bold text-white"
                    >
                      {statistics.total_vehicles}
                    </motion.p>
                  </motion.div>
                  
                  <motion.div 
                    whileHover={{ scale: 1.03, y: -1 }}
                    className="bg-gradient-to-br from-green-500 to-emerald-600 p-4 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 h-24 flex flex-col justify-center text-center text-white"
                  >
                    <p className="text-green-100 font-semibold text-xs mb-1">Active</p>
                    <motion.p 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="text-3xl font-bold text-white"
                    >
                      {statistics.active_vehicles}
                    </motion.p>
                  </motion.div>
                  
                  <motion.div 
                    whileHover={{ scale: 1.03, y: -1 }}
                    className="bg-gradient-to-br from-yellow-500 to-amber-600 p-4 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 h-24 flex flex-col justify-center text-center text-white"
                  >
                    <p className="text-yellow-100 font-semibold text-xs mb-1">Maintenance</p>
                    <motion.p 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="text-3xl font-bold text-white"
                    >
                      {statistics.maintenance_vehicles}
                    </motion.p>
                  </motion.div>
                  
                  <motion.div 
                    whileHover={{ scale: 1.03, y: -1 }}
                    className="bg-gradient-to-br from-red-500 to-rose-600 p-4 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 h-24 flex flex-col justify-center text-center text-white"
                  >
                    <p className="text-red-100 font-semibold text-xs mb-1">Out of Service</p>
                    <motion.p 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="text-3xl font-bold text-white"
                    >
                      {statistics.out_of_service_vehicles}
                    </motion.p>
                  </motion.div>
                </div>
              </div>
          
              <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-3">
                <motion.button
                  whileHover={{ scale: 1.03, y: -1 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="px-5 py-2.5 bg-white/95 backdrop-blur-sm hover:bg-white text-slate-700 rounded-lg flex items-center transition-all duration-300 shadow-md hover:shadow-lg border border-slate-200/60 font-semibold text-sm min-w-[120px] justify-center"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                  Refresh
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.03, y: -1 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleAddVehicle}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 text-white rounded-lg flex items-center transition-all duration-300 shadow-lg hover:shadow-xl font-semibold text-sm min-w-[150px] justify-center"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Vehicle
                </motion.button>
              </div>
          </div>
        </div>
        </motion.div>
        )}

        {/* Enhanced Filters and Controls with Glassmorphism */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-xl border border-white/30 mb-12 relative overflow-hidden"
        >
          {/* Decorative Background */}
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-400/10 to-indigo-600/10 rounded-full -translate-y-10 translate-x-10"></div>
          <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-tr from-purple-400/10 to-pink-600/10 rounded-full translate-y-8 -translate-x-8"></div>
          
          <div className="p-8 relative z-10">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              {/* Search and Basic Filters */}
              <div className="flex flex-col sm:flex-row gap-4 flex-1">
                <div className="relative flex-1">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <input
                      type="text"
                      placeholder="Search vehicles by number, license plate, make, or model..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-12 pr-4 py-4 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400 w-full bg-white/80 backdrop-blur-sm focus:bg-white transition-all duration-300 shadow-lg focus:shadow-xl"
                    />
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/5 to-indigo-500/5 opacity-0 focus-within:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <div className="relative">
                    <select
                      value={filters.status}
                      onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                      className="px-4 py-4 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400 bg-white/80 backdrop-blur-sm focus:bg-white transition-all duration-300 shadow-lg focus:shadow-xl appearance-none pr-10 min-w-[140px]"
                    >
                      <option value="">All Status</option>
                      <option value="Active">🟢 Active</option>
                      <option value="Maintenance">🟡 Maintenance</option>
                      <option value="Out of Service">🔴 Out of Service</option>
                      <option value="Retired">⚫ Retired</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                
                  <div className="relative">
                    <select
                      value={filters.department_id}
                      onChange={(e) => setFilters(prev => ({ ...prev, department_id: e.target.value }))}
                      className="px-4 py-4 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400 bg-white/80 backdrop-blur-sm focus:bg-white transition-all duration-300 shadow-lg focus:shadow-xl appearance-none pr-10 min-w-[140px]"
                    >
                      <option value="">All Departments</option>
                      {departments.map(dept => (
                        <option key={dept.id} value={dept.id}>{dept.name}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                
                  <div className="relative">
                    <select
                      value={filters.make}
                      onChange={(e) => setFilters(prev => ({ ...prev, make: e.target.value }))}
                      className="px-4 py-4 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400 bg-white/80 backdrop-blur-sm focus:bg-white transition-all duration-300 shadow-lg focus:shadow-xl appearance-none pr-10 min-w-[140px]"
                    >
                      <option value="">All Makes</option>
                      {Array.from(new Set(fleetData.map(v => v.make))).map(make => (
                        <option key={make} value={make}>{make}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              </div>
              
              {/* View Controls */}
              <div className="flex items-center gap-4">
                <div className="flex items-center bg-slate-100/80 backdrop-blur-sm rounded-2xl p-1 shadow-lg">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setViewMode('grid')}
                    className={`p-3 rounded-xl transition-all duration-200 ${
                      viewMode === 'grid' 
                        ? 'bg-white shadow-lg text-blue-600' 
                        : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
                    }`}
                  >
                    <BarChart3 className="w-4 h-4" />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setViewMode('list')}
                    className={`p-3 rounded-xl transition-all duration-200 ${
                      viewMode === 'list' 
                        ? 'bg-white shadow-lg text-blue-600' 
                        : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
                    }`}
                  >
                    <PieChart className="w-4 h-4" />
                  </motion.button>
                </div>
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowFilters(!showFilters)}
                  className={`px-6 py-4 rounded-2xl flex items-center transition-all duration-200 shadow-lg hover:shadow-xl ${
                    showFilters 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-white/80 backdrop-blur-sm text-slate-700 hover:bg-white border border-slate-200'
                  }`}
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Filters
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-6 py-4 bg-white/80 backdrop-blur-sm text-slate-700 hover:bg-white border border-slate-200 rounded-2xl flex items-center transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </motion.button>
              </div>
            </div>

            {/* Advanced Filters */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-8 pt-8 border-t border-slate-200/50"
                >
                  <div className="flex justify-end">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={clearFilters}
                      className="px-6 py-3 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all duration-200"
                    >
                      Clear All Filters
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-slate-200/50">
              {[
                { id: 'all', label: 'All' },
                { id: 'Active', label: 'Active' },
                { id: 'Maintenance', label: 'Maintenance' },
                { id: 'PPM', label: 'PPM' },
                { id: 'Daily', label: 'Daily' },
                { id: 'EV', label: 'EV' },
              ].map((chip) => (
                <FilterChip
                  key={chip.id}
                  label={chip.label}
                  active={quickFilter === chip.id}
                  onClick={() => setQuickFilter(chip.id)}
                />
              ))}
            </div>
          </div>
        </motion.div>

        {/* Enhanced Vehicle Display */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-xl border border-white/30 relative overflow-hidden"
        >
          {/* Decorative Background */}
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-400/10 to-indigo-600/10 rounded-full -translate-y-10 translate-x-10"></div>
          <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-tr from-purple-400/10 to-pink-600/10 rounded-full translate-y-8 -translate-x-8"></div>
          
          <div className="p-8 relative z-10">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-2xl font-bold text-gray-900">Vehicle Fleet</h3>
                <p className="text-gray-600 mt-1">
                  {displayedFleet.length} vehicle(s) found
                  {searchTerm && ` matching "${searchTerm}"`}
                </p>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="text-sm text-gray-500">
                  Total Mileage: <span className="font-semibold text-gray-700">{statistics.total_mileage?.toLocaleString() || '0'} km</span>
                </div>
                <div className="text-sm text-gray-500">
                  Avg Efficiency: <span className="font-semibold text-gray-700">{statistics.avg_fuel_efficiency?.toFixed(1) || '0'} km/l</span>
                </div>
              </div>
            </div>

            {/* Enhanced Vehicle Grid/Table */}
            {displayedFleet.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-20 relative"
              >
                {/* Background Pattern */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-indigo-100/50 rounded-3xl"></div>
                
                <div className="relative z-10">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring", stiffness: 100 }}
                    className="mx-auto w-32 h-32 bg-gradient-to-br from-blue-100 to-indigo-200 rounded-full flex items-center justify-center mb-8 shadow-2xl"
                  >
                    <Car className="w-16 h-16 text-blue-600" />
                  </motion.div>
                  
                  <motion.h3
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="text-3xl font-black text-slate-900 mb-4"
                  >
                    No vehicles found
                  </motion.h3>
                  
                  <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="text-slate-600 text-lg mb-8 max-w-md mx-auto"
                  >
                    {searchTerm || Object.values(filters).some(f => f) 
                      ? 'Try adjusting your search or filters to find vehicles'
                      : 'Get started by adding your first vehicle to the fleet'
                    }
                  </motion.p>
                  
                  {!searchTerm && !Object.values(filters).some(f => f) && (
                    <motion.button
                      whileHover={{ scale: 1.05, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleAddVehicle}
                      className="px-8 py-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white rounded-2xl hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 transition-all duration-300 shadow-2xl hover:shadow-3xl font-bold text-lg"
                    >
                      <Plus className="w-6 h-6 mr-3 inline" />
                      Add First Vehicle
                    </motion.button>
                  )}
                </div>
              </motion.div>
            ) : viewMode === 'list' ? (
              <div className="overflow-x-auto rounded-xl border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      {['Vehicle', 'Plate', 'Status', 'Business', 'Mileage', 'Actions'].map((h) => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {displayedFleet.map((vehicle) => (
                      <tr key={vehicle.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-900">{getCarDisplayName(vehicle)}</div>
                          <div className="text-xs text-gray-500">{vehicle.vehicle_number}</div>
                        </td>
                        <td className="px-4 py-3 text-gray-600">{vehicle.license_plate}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs ${getStatusColor(vehicle.status)}`}>{vehicle.status}</span>
                          {vehicle.status === 'Retired' && (
                            <span className="ml-1 px-2 py-0.5 rounded-full text-xs bg-gray-200 text-gray-700">Offboarded</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {vehicle.business_type ? (
                            <span className={`text-xs px-2 py-0.5 rounded-full ${businessTypeBadgeClass(vehicle.business_type)}`}>{vehicle.business_type}</span>
                          ) : '—'}
                        </td>
                        <td className="px-4 py-3 text-gray-600">{formatMileage(vehicle.mileage)} km</td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <button type="button" onClick={() => handleViewVehicle(vehicle.id)} className="text-blue-600 hover:underline text-xs">View</button>
                            <button type="button" onClick={() => handleEditVehicle(vehicle)} className="text-emerald-600 hover:underline text-xs">Edit</button>
                            <button type="button" onClick={() => handleDeleteVehicle(vehicle.id)} className="text-red-600 hover:underline text-xs">Delete</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                <AnimatePresence>
                  {displayedFleet.map((vehicle, index) => {
                    const isExpanded = expandedCard === vehicle.id;
                    const isSelected = selectedItems.includes(vehicle.id);
                    
                    return (
                      <motion.div
                        key={vehicle.id}
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -20, scale: 0.95 }}
                        transition={{ delay: index * 0.1, type: "spring", stiffness: 100 }}
                        whileHover={{ y: -8, scale: 1.02 }}
                        className={`bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/30 hover:shadow-3xl transition-all duration-500 relative overflow-hidden group ${
                          isSelected ? 'ring-4 ring-blue-400/50 shadow-blue-200/50' : ''
                        }`}
                      >
                        {/* Decorative Background Elements */}
                        <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-400/10 to-indigo-600/10 rounded-full -translate-y-10 translate-x-10 group-hover:scale-110 transition-transform duration-500"></div>
                        <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-tr from-purple-400/10 to-pink-600/10 rounded-full translate-y-8 -translate-x-8 group-hover:scale-110 transition-transform duration-500"></div>
                        
                        {/* Enhanced Card Header */}
                        <div className="p-6 border-b border-slate-200/50 relative z-10">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center space-x-4">
                              <div className="relative">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => toggleItemSelection(vehicle.id)}
                                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                />
                              <motion.div
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  className={`w-6 h-6 rounded-xl border-2 flex items-center justify-center transition-all duration-200 ${
                                    isSelected
                                      ? 'bg-gradient-to-r from-blue-500 to-indigo-600 border-blue-500 shadow-lg'
                                      : 'border-slate-300 hover:border-blue-400 hover:bg-blue-50'
                                  }`}
                                >
                                  {isSelected && <CheckCircle className="w-4 h-4 text-white" />}
                                </motion.div>
                              </div>
                              
                              <div className="relative w-20 h-20 shrink-0">
                                {vehicle.fleet_image_url ? (
                                  <img
                                    src={vehicle.fleet_image_url}
                                    alt={`${vehicle.make} ${vehicle.model}`}
                                    className="w-20 h-20 rounded-2xl object-cover border-2 border-white shadow-lg"
                                  />
                                ) : (
                                  <div className="w-20 h-20 flex items-center justify-center bg-gradient-to-r from-blue-500 via-indigo-600 to-purple-600 rounded-2xl shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                                    <Car className="w-7 h-7 text-white" />
                                  </div>
                                )}
                              </div>
                              
                              <div className="flex-1">
                                <h3 className="text-xl font-black text-slate-900 mb-2 group-hover:text-blue-600 transition-colors duration-300">
                                  {getCarDisplayName(vehicle)}
                                </h3>
                                <p className="text-slate-600 font-semibold text-lg mb-2">{vehicle.vehicle_number}</p>
                                {vehicle.business_type && (
                                  <span
                                    className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold mb-2 ${businessTypeBadgeClass(vehicle.business_type)}`}
                                  >
                                    {vehicle.business_type}
                                  </span>
                                )}
                                <div className="flex items-center">
                                  <MapPin className="w-4 h-4 text-slate-400 mr-2" />
                                  <span className="text-sm text-slate-500 font-medium">{vehicle.license_plate}</span>
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-3">
                              <motion.span 
                                whileHover={{ scale: 1.05 }}
                                className={`px-4 py-2 rounded-xl text-xs font-bold shadow-lg ${getStatusColor(vehicle.status)}`}
                              >
                                {vehicle.status.toUpperCase()}
                              </motion.span>
                              {vehicle.status === 'Retired' && (
                                <span className="px-3 py-2 rounded-xl text-xs font-bold bg-gray-200 text-gray-700">
                                  OFFBOARDED
                                </span>
                              )}
                              
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setExpandedCard(isExpanded ? null : vehicle.id)}
                                className={`px-4 py-2 rounded-lg transition-all duration-200 flex items-center space-x-2 ${
                                  isExpanded 
                                    ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' 
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                              >
                                {isExpanded ? (
                                  <>
                                    <ChevronDown className="w-4 h-4" />
                                    <span className="text-sm font-medium">Hide Details</span>
                                  </>
                                ) : (
                                  <>
                                    <ChevronRight className="w-4 h-4" />
                                    <span className="text-sm font-medium">View Details</span>
                                  </>
                                )}
                              </motion.button>
                            </div>
                          </div>
                          
                          {/* Quick Info */}
                          <div className="grid grid-cols-2 gap-3">
                            <motion.div 
                              whileHover={{ scale: 1.05, y: -2 }}
                              className="text-center p-3 bg-gradient-to-br from-blue-50 to-cyan-100 rounded-2xl border border-blue-200/50 shadow-lg hover:shadow-xl transition-all duration-300"
                            >
                              <Users className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                              <p className="text-xs text-blue-700 font-semibold mb-1">Driver</p>
                              <p className="text-sm font-bold text-blue-800">{vehicle.employees?.full_name || 'Unassigned'}</p>
                            </motion.div>
                            <motion.div 
                              whileHover={{ scale: 1.05, y: -2 }}
                              className="text-center p-3 bg-gradient-to-br from-green-50 to-emerald-100 rounded-2xl border border-green-200/50 shadow-lg hover:shadow-xl transition-all duration-300"
                            >
                              <Activity className="w-5 h-5 text-green-600 mx-auto mb-1" />
                              <p className="text-xs text-green-700 font-semibold mb-1">Mileage</p>
                              <p className="text-sm font-bold text-green-800">{formatMileage(vehicle.mileage)} km</p>
                            </motion.div>
                          </div>
                        </div>
                        
                        {/* Expanded Content */}
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="p-6 bg-gray-50"
                            >
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Vehicle Details */}
                                <div>
                                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                                    <Car className="w-4 h-4 mr-2 text-blue-600" />
                                    Vehicle Details
                                  </h4>
                                  <div className="space-y-2">
                                    <div className="flex justify-between">
                                      <span className="text-sm text-gray-600">Year:</span>
                                      <span className="text-sm font-medium">{vehicle.year || 'N/A'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-sm text-gray-600">Department:</span>
                                      <span className="text-sm font-medium">{vehicle.departments?.name || 'Not assigned'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-sm text-gray-600">Last Service:</span>
                                      <span className="text-sm font-medium">{formatDate(vehicle.last_service_date)}</span>
                                    </div>
                                  </div>
                                </div>
                                
                                {/* Driver Details */}
                                <div>
                                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                                    <Users className="w-4 h-4 mr-2 text-blue-600" />
                                    Driver Information
                                  </h4>
                                  <div className="space-y-2">
                                    <div className="flex justify-between">
                                      <span className="text-sm text-gray-600">Name:</span>
                                      <span className="text-sm font-medium">{vehicle.employees?.full_name || 'Not assigned'}</span>
                                    </div>
                                    {vehicle.employees?.email && (
                                      <div className="flex justify-between">
                                        <span className="text-sm text-gray-600">Email:</span>
                                        <span className="text-sm font-medium">{vehicle.employees.email}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                        
                        {/* Enhanced Action Buttons */}
                        <div className="p-6 border-t border-slate-200/50 relative z-10">
                          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                            <div className="flex flex-wrap items-center gap-3">
                              <motion.button
                                whileHover={{ scale: 1.05, y: -2 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleViewVehicle(vehicle.id)}
                                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-600 text-white rounded-lg hover:from-blue-600 hover:to-cyan-700 transition-all duration-200 text-sm font-bold shadow-lg hover:shadow-xl flex items-center"
                              >
                                <Eye className="w-4 h-4 mr-2" />
                                View
                              </motion.button>
                              <motion.button
                                whileHover={{ scale: 1.05, y: -2 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleEditVehicle(vehicle)}
                                className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-lg hover:from-emerald-600 hover:to-green-700 transition-all duration-200 text-sm font-bold shadow-lg hover:shadow-xl flex items-center"
                              >
                                <Edit className="w-4 h-4 mr-2" />
                                Edit
                              </motion.button>
                              <motion.button
                                whileHover={{ scale: 1.05, y: -2 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleDeleteVehicle(vehicle.id)}
                                className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-200 text-sm font-bold shadow-lg hover:shadow-xl flex items-center"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                              </motion.button>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              <motion.button
                                whileHover={{ scale: 1.1, rotate: 5 }}
                                whileTap={{ scale: 0.9 }}
                                className="p-3 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
                              >
                                <Settings className="w-5 h-5" />
                              </motion.button>
                              <motion.button
                                whileHover={{ scale: 1.1, rotate: -5 }}
                                whileTap={{ scale: 0.9 }}
                                className="p-3 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
                              >
                                <MoreVertical className="w-5 h-5" />
                              </motion.button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Delete confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete vehicle?"
        message="This action cannot be undone. All linked documents will be removed."
        confirmLabel="Delete"
        variant="danger"
        loading={deleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />

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
