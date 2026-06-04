import { useState, useCallback, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate, Link } from "react-router-dom";
import { useToast } from "../context/ToastContext";
import { useDrivers, useDeleteDriver } from "../hooks/useApi";
import { 
  ChevronRight, Trash2, Pencil, Plus, Search, Filter, Car, 
  User, MapPin, Phone, Mail, Calendar, Shield, Eye, 
  TrendingUp, AlertCircle, CheckCircle, Clock, Star, Building,
  Download, Upload, MoreHorizontal, BarChart3, Activity, 
  Users, Zap, Globe, Award, Target, RefreshCw, Grid3x3, List
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Helper functions for className generation (moved outside component to avoid recreation)
const getStatusBarClass = (status) => {
  if (status === 'active') return 'bg-gradient-to-r from-green-400 to-emerald-500';
  if (status === 'inactive') return 'bg-gradient-to-r from-gray-400 to-gray-500';
  return 'bg-gradient-to-r from-red-400 to-red-500';
};

const getStatusBadgeClass = (status) => {
  if (status === 'active') return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
  if (status === 'inactive') return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
  return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
};

const getShiftBadgeClass = (shiftType) => {
  if (shiftType === 'Day') return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
  return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
};

const getViewToggleClass = (isActive) => {
  return isActive
    ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg"
    : "text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600";
};

const getSortButtonClass = (isActive) => {
  return isActive
    ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg"
    : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600";
};

const getFilterButtonClass = (isActive) => {
  return isActive
    ? 'bg-blue-600 text-white'
    : 'bg-gray-100 text-gray-700 hover:bg-gray-200';
};

const getPaginationButtonClass = (isActive) => {
  return isActive
    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600';
};

export default function Driver() {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState("full_name");
  const [sortOrder, setSortOrder] = useState("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);
  const [statusFilter, setStatusFilter] = useState("");
  const [shiftFilter, setShiftFilter] = useState("");
  const [teamTypeFilter, setTeamTypeFilter] = useState("");
  const [designationFilter, setDesignationFilter] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState("table"); // "table" or "grid"
  
  const navigate = useNavigate();
  const { success, error: showError } = useToast();
  
  // Use React Query hooks
  const { data: driversData, isLoading, error, refetch } = useDrivers(currentPage, pageSize, search);
  const deleteDriverMutation = useDeleteDriver();
  const queryClient = useQueryClient();

  // Memoize drivers array to prevent unnecessary re-renders
  const drivers = useMemo(() => driversData?.data || [], [driversData?.data]);
  // Use the count from API, fallback to array length if count is not available
  const totalCount = driversData?.count ?? drivers.length;

  // Debug logging for driver data
  console.log('🔍 Driver component data:', {
    driversData,
    drivers,
    driversLength: drivers.length,
    totalCount,
    countFromAPI: driversData?.count,
    isLoading,
    error,
    currentPage,
    pageSize,
    search
  });

  const handleDelete = useCallback(async (id) => {
    const confirm = window.confirm("Are you sure you want to delete this driver?");
    if (!confirm) return;

    try {
      await deleteDriverMutation.mutateAsync(id);
      // Invalidate queries to refresh the list
      queryClient.invalidateQueries(['drivers']);
      success("Success", "Driver deleted successfully.");
    } catch (err) {
      showError("Delete Failed", err.message);
    }
  }, [deleteDriverMutation, success, showError, queryClient]);

  const filteredAndSortedDrivers = useMemo(() => {
    let filtered = drivers;
    
    // Apply status filter
    if (statusFilter) {
      filtered = filtered.filter(driver => driver.status === statusFilter);
    }
    
    // Apply shift filter
    if (shiftFilter) {
      filtered = filtered.filter(driver => driver.shift_type === shiftFilter);
    }
    
    // Apply team type filter
    if (teamTypeFilter) {
      filtered = filtered.filter(driver => driver.team_type === teamTypeFilter);
    }
    
    // Apply designation filter
    if (designationFilter) {
      filtered = filtered.filter(driver => 
        driver.designation && driver.designation.toLowerCase().includes(designationFilter.toLowerCase())
      );
    }
    
    // Apply location filter
    if (locationFilter) {
      filtered = filtered.filter(driver => driver.location === locationFilter);
    }
    
    // Apply sorting
    return filtered.sort((a, b) => {
      const valA = a[sortKey]?.toLowerCase?.() || "";
      const valB = b[sortKey]?.toLowerCase?.() || "";
      return sortOrder === "asc"
        ? valA.localeCompare(valB)
        : valB.localeCompare(valA);
    });
  }, [drivers, sortKey, sortOrder, statusFilter, shiftFilter, teamTypeFilter, designationFilter, locationFilter]);

  const totalPages = Math.ceil(totalCount / pageSize);

  const handlePageChange = useCallback((page) => {
    setCurrentPage(page);
  }, []);

  const handleSearch = useCallback((value) => {
    setSearch(value);
    setCurrentPage(1); // Reset to first page on search
  }, []);

  const handleSort = useCallback((key) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortOrder("asc");
    }
  }, [sortKey, sortOrder]);

  const clearFilters = useCallback(() => {
    setStatusFilter("");
    setShiftFilter("");
    setTeamTypeFilter("");
    setDesignationFilter("");
    setLocationFilter("");
    setSearch("");
    setCurrentPage(1);
  }, []);

  // Calculate statistics
  const stats = useMemo(() => {
    const total = totalCount; // Use totalCount instead of drivers.length for consistency
    const active = drivers.filter(d => d.status === 'active').length;
    const inactive = drivers.filter(d => d.status === 'inactive').length;
    const suspended = drivers.filter(d => d.status === 'suspended').length;
    const dayShift = drivers.filter(d => d.shift_type === 'Day').length;
    const nightShift = drivers.filter(d => d.shift_type === 'Night').length;

    return { total, active, inactive, suspended, dayShift, nightShift };
  }, [drivers, totalCount]);

  if (error) {
    return (
      <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900">
        <div className="ml-64 p-6 w-full">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 className="text-red-800 font-medium">Error Loading Drivers</h3>
            <p className="text-red-600 mt-1">{error.message}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
      {/* Header Section */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg">
                <Car className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Driver & Team Records</h1>
                <p className="text-sm text-gray-600">Manage drivers, teams, and operational assignments</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  console.log('🔍 Add New Driver button clicked, navigating to /driver/new');
                  navigate("/driver/new");
                }}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-2 rounded-lg font-medium flex items-center gap-2 shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <Plus className="w-4 h-4" />
                Add New Driver
              </motion.button>
              
              <Link
                to="/operation/teams"
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-all duration-200 flex items-center gap-2 text-sm font-medium"
              >
                <Users className="w-4 h-4" />
                Teams
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200"
          >
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Drivers</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200"
          >
            <div className="flex items-center">
              <div className="p-3 bg-emerald-100 rounded-lg">
                <Activity className="w-6 h-6 text-emerald-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Drivers</p>
                <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200"
          >
            <div className="flex items-center">
              <div className="p-3 bg-amber-100 rounded-lg">
                <Zap className="w-6 h-6 text-amber-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Day Shift</p>
                <p className="text-2xl font-bold text-gray-900">{stats.dayShift}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200"
          >
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Globe className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Night Shift</p>
                <p className="text-2xl font-bold text-gray-900">{stats.nightShift}</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <div className="flex-1 flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search drivers by name, email, or ID..."
                    value={search}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowFilters(!showFilters)}
                className={"flex items-center gap-2 px-4 py-3 rounded-lg transition-all duration-200 font-medium " + getFilterButtonClass(showFilters)}
              >
                <Filter className="w-4 h-4" />
                Advanced Filters
                {showFilters && (
                  <span className="bg-white/20 text-white text-xs px-2 py-1 rounded-full">
                    {[statusFilter, shiftFilter, teamTypeFilter, designationFilter, locationFilter].filter(Boolean).length}
                  </span>
                )}
              </motion.button>
            </div>

            <div className="flex items-center gap-3">
              {showFilters && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={clearFilters}
                  className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-all duration-200"
                >
                  Clear All Filters
                </motion.button>
              )}
              
              <motion.button
                whileHover={{ scale: 1.05, rotate: 180 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => refetch()}
                className="p-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg transition-all duration-200"
                title="Refresh Data"
              >
                <RefreshCw className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              </motion.button>
            </div>
          </div>

          {/* Advanced Filters */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Status
                    </label>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    >
                      <option value="">All Statuses</option>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="suspended">Suspended</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Shift Type
                    </label>
                    <select
                      value={shiftFilter}
                      onChange={(e) => setShiftFilter(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    >
                      <option value="">All Shifts</option>
                      <option value="Day">Day Shift</option>
                      <option value="Night">Night Shift</option>
                      <option value="Flexible">Flexible</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Team Type
                    </label>
                    <select
                      value={teamTypeFilter}
                      onChange={(e) => setTeamTypeFilter(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    >
                      <option value="">All Team Types</option>
                      <option value="Delivery">Delivery</option>
                      <option value="Fleet">Fleet</option>
                      <option value="Logistics">Logistics</option>
                      <option value="Transport">Transport</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Designation
                    </label>
                    <input
                      type="text"
                      value={designationFilter}
                      onChange={(e) => setDesignationFilter(e.target.value)}
                      placeholder="e.g., Delivery Driver"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Location
                    </label>
                    <select
                      value={locationFilter}
                      onChange={(e) => setLocationFilter(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    >
                      <option value="">All Locations</option>
                      <option value="Dubai">Dubai</option>
                      <option value="Abu Dhabi">Abu Dhabi</option>
                      <option value="Sharjah">Sharjah</option>
                      <option value="Ajman">Ajman</option>
                      <option value="Ras Al Khaimah">Ras Al Khaimah</option>
                      <option value="Fujairah">Fujairah</option>
                      <option value="Umm Al Quwain">Umm Al Quwain</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div className="flex items-end">
                    <button
                      onClick={clearFilters}
                      className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                      Reset Filters
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Enhanced Drivers Table */}
        <div className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/50 overflow-hidden">
          <div className="px-8 py-6 border-b border-gray-200/50 dark:border-gray-700/50 bg-gradient-to-r from-gray-50/50 to-blue-50/50 dark:from-gray-700/50 dark:to-blue-900/20">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    Driver List
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">
                    {filteredAndSortedDrivers.length} of {totalCount} drivers
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                {/* View Toggle */}
                <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 rounded-xl p-1">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setViewMode("grid")}
                    className={"p-2 rounded-lg transition-all duration-200 " + getViewToggleClass(viewMode === "grid")}
                    title="Grid View"
                  >
                    <Grid3x3 className="w-4 h-4" />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setViewMode("table")}
                    className={"p-2 rounded-lg transition-all duration-200 " + getViewToggleClass(viewMode === "table")}
                    title="Table View"
                  >
                    <List className="w-4 h-4" />
                  </motion.button>
                </div>
                
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Sort by:</span>
                <div className="flex gap-2">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleSort("full_name")}
                    className={"px-4 py-2 rounded-xl font-medium transition-all duration-200 " + getSortButtonClass(sortKey === "full_name")}
                  >
                    Name {sortKey === "full_name" && (sortOrder === "asc" ? "↑" : "↓")}
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleSort("status")}
                    className={"px-4 py-2 rounded-xl font-medium transition-all duration-200 " + getSortButtonClass(sortKey === "status")}
                  >
                    Status {sortKey === "status" && (sortOrder === "asc" ? "↑" : "↓")}
                  </motion.button>
                </div>
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="p-12 text-center">
              <div className="relative">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 dark:border-blue-800 mx-auto mb-6"></div>
                <div className="absolute inset-0 rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto animate-spin"></div>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Loading Drivers</h3>
              <p className="text-gray-500 dark:text-gray-400">Please wait while we fetch the latest driver information...</p>
            </div>
          ) : filteredAndSortedDrivers.length === 0 ? (
            <div className="p-12 text-center">
              <div className="relative mb-8">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-full mx-auto flex items-center justify-center shadow-lg">
                  <Car className="w-12 h-12 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center shadow-lg">
                  <Award className="w-4 h-4 text-white" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">No drivers found</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
                {search || statusFilter || shiftFilter 
                  ? "Try adjusting your search criteria or filters to find what you're looking for" 
                  : "Get started by adding your first driver to the system"
                }
              </p>
              {!search && !statusFilter && !shiftFilter && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate("/driver/new")}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-3 mx-auto"
                >
                  <Plus className="w-5 h-5" />
                  Add Your First Driver
                </motion.button>
              )}
            </div>
          ) : viewMode === "grid" ? (
            // Grid/Card View
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                <AnimatePresence>
                  {filteredAndSortedDrivers.map((driver, index) => (
                    <motion.div
                      key={driver.id}
                      initial={{ opacity: 0, scale: 0.9, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ delay: index * 0.05, type: "spring", stiffness: 100 }}
                      whileHover={{ y: -8, scale: 1.02 }}
                      className="group relative bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl shadow-lg hover:shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden transition-all duration-300"
                    >
                      {/* Status Indicator Bar */}
                      <div className={"absolute top-0 left-0 right-0 h-1 " + getStatusBarClass(driver.status)} />
                      
                      {/* Card Content */}
                      <div className="p-6">
                        {/* Profile Section */}
                        <div className="flex flex-col items-center mb-4">
                          <div className="relative mb-4">
                            {driver.profile_picture ? (
                              <div className="relative">
                                <img
                                  src={driver.profile_picture}
                                  alt={driver.full_name}
                                  className="w-24 h-24 rounded-full object-cover border-4 border-white dark:border-gray-700 shadow-xl"
                                />
                                <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full border-4 border-white dark:border-gray-800 flex items-center justify-center shadow-lg">
                                  {driver.status === 'active' ? (
                                    <CheckCircle className="w-4 h-4 text-white" />
                                  ) : driver.status === 'inactive' ? (
                                    <Clock className="w-4 h-4 text-white" />
                                  ) : (
                                    <AlertCircle className="w-4 h-4 text-white" />
                                  )}
                                </div>
                              </div>
                            ) : (
                              <div className="relative">
                                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center border-4 border-white dark:border-gray-700 shadow-xl">
                                  <User className="w-12 h-12 text-white" />
                                </div>
                                <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full border-4 border-white dark:border-gray-800 flex items-center justify-center shadow-lg">
                                  <Car className="w-4 h-4 text-white" />
                                </div>
                              </div>
                            )}
                          </div>
                          
                          <h3 className="text-lg font-bold text-gray-900 dark:text-white text-center mb-1">
                            {driver.full_name}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400 text-center mb-2">
                            {driver.designation || 'Driver'}
                          </p>
                          
                          {/* Status Badges */}
                          <div className="flex flex-wrap items-center justify-center gap-2 mb-4">
                            <span className={"inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold " + getStatusBadgeClass(driver.status)}>
                              {driver.status === 'active' && <CheckCircle className="w-3 h-3 mr-1" />}
                              {driver.status === 'inactive' && <Clock className="w-3 h-3 mr-1" />}
                              {driver.status === 'suspended' && <AlertCircle className="w-3 h-3 mr-1" />}
                              {driver.status}
                            </span>
                            <span className={"inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold " + getShiftBadgeClass(driver.shift_type)}>
                              <Clock className="w-3 h-3 mr-1" />
                              {driver.shift_type} Shift
                            </span>
                          </div>
                        </div>
                        
                        {/* Driver Info */}
                        <div className="space-y-3 mb-4 border-t border-gray-200 dark:border-gray-700 pt-4">
                          <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                            <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mr-3">
                              <Mail className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                            </div>
                            <span className="truncate">{driver.udrive_email || 'No email'}</span>
                          </div>
                          
                          <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                            <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mr-3">
                              <Phone className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <span>{driver.company_mobile || driver.personal_mobile || 'No phone'}</span>
                          </div>
                          
                          <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                            <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mr-3">
                              <Building className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                            </div>
                            <span className="truncate">{driver.team_type || 'N/A'}</span>
                          </div>
                          
                          {driver.employee_id && (
                            <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                              <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center mr-3">
                                <Shield className="w-3 h-3 text-gray-600 dark:text-gray-400" />
                              </div>
                              <span>ID: {driver.employee_id}</span>
                            </div>
                          )}
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="flex items-center gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => navigate(`/driver/${driver.id}`)}
                            className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-4 py-2 rounded-xl font-medium text-sm transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                          >
                            <Eye className="w-4 h-4" />
                            View
                          </motion.button>
                          
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => navigate(`/driver/${driver.id}/edit`)}
                            className="flex-1 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white px-4 py-2 rounded-xl font-medium text-sm transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                          >
                            <Pencil className="w-4 h-4" />
                            Edit
                          </motion.button>
                          
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleDelete(driver.id)}
                            className="p-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl transition-all duration-200 shadow-md hover:shadow-lg"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </motion.button>
                        </div>
                      </div>
                      
                      {/* Hover Effect Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-purple-500/0 group-hover:from-blue-500/5 group-hover:to-purple-500/5 transition-all duration-300 pointer-events-none rounded-2xl" />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          ) : (
            // Table View
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Driver
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Contact Info
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Status & Shift
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Team Info
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredAndSortedDrivers.map((driver, index) => (
                    <motion.tr
                      key={driver.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ scale: 1.01, transition: { duration: 0.2 } }}
                      className="group hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-purple-50/50 dark:hover:from-blue-900/20 dark:hover:to-purple-900/20 transition-all duration-300 border-b border-gray-100 dark:border-gray-700/50"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-12 w-12">
                            {driver.profile_picture ? (
                              <img
                                className="h-12 w-12 rounded-full object-cover"
                                src={driver.profile_picture}
                                alt={driver.full_name}
                              />
                            ) : (
                              <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                                <User className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {driver.full_name}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {driver.designation}
                            </div>
                            <div className="text-xs text-gray-400 dark:text-gray-500">
                              ID: {driver.employee_id || 'N/A'}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="space-y-1">
                          <div className="flex items-center text-sm text-gray-900 dark:text-gray-100">
                            <Mail className="w-4 h-4 mr-2 text-gray-400" />
                            {driver.udrive_email || 'No email'}
                          </div>
                          <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                            <Phone className="w-4 h-4 mr-2 text-gray-400" />
                            {driver.company_mobile || driver.personal_mobile || 'No phone'}
                          </div>
                          <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                            <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                            {driver.nationality || 'N/A'}
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="space-y-2">
                          <span className={"inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium " + getStatusBadgeClass(driver.status)}>
                            {driver.status === 'active' && <CheckCircle className="w-3 h-3 mr-1" />}
                            {driver.status === 'inactive' && <Clock className="w-3 h-3 mr-1" />}
                            {driver.status === 'suspended' && <AlertCircle className="w-3 h-3 mr-1" />}
                            {driver.status}
                          </span>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            <span className={"inline-flex items-center px-2 py-1 rounded text-xs font-medium " + getShiftBadgeClass(driver.shift_type)}>
                              <Clock className="w-3 h-3 mr-1" />
                              {driver.shift_type} Shift
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-gray-100">
                          <div className="flex items-center">
                            <Building className="w-4 h-4 mr-2 text-gray-400" />
                            {driver.team_type || 'N/A'}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            {driver.team_name || 'No team assigned'}
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-6 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-3">
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => navigate(`/driver/${driver.id}`)}
                            className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl group"
                            title="View Profile"
                          >
                            <Eye className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
                          </motion.button>
                          
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => navigate(`/driver/${driver.id}/edit`)}
                            className="p-3 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white rounded-xl hover:from-emerald-600 hover:to-emerald-700 transition-all duration-200 shadow-lg hover:shadow-xl group"
                            title="Edit Driver"
                          >
                            <Pencil className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
                          </motion.button>
                          
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleDelete(driver.id)}
                            className="p-3 bg-gradient-to-br from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-lg hover:shadow-xl group"
                            title="Delete Driver"
                          >
                            <Trash2 className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
                          </motion.button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Enhanced Pagination */}
        {totalPages > 1 && (
          <div className="mt-8 relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-white/20 dark:border-gray-700/50">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent font-bold">
                  Page {currentPage} of {totalPages}
                </span>
                <span className="ml-2">({totalCount} total drivers)</span>
              </div>
              
              <div className="flex items-center gap-2">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2"
                >
                  <ChevronRight className="w-4 h-4 rotate-180" />
                  Previous
                </motion.button>
                
                <div className="flex gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const page = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                    return (
                      <motion.button
                        key={page}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handlePageChange(page)}
                        className={"px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 " + getPaginationButtonClass(currentPage === page)}
                      >
                        {page}
                      </motion.button>
                    );
                  })}
                </div>
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </motion.button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
