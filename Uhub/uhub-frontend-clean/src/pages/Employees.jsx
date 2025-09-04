import { useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "../context/ToastContext";
import { useAuth } from "../context/AuthContext";
import { useEmployees, useDeleteEmployee } from "../hooks/useApi";
import { 
  ChevronRight, Trash2, Pencil, Plus, Search, Filter, 
  Users, Building, Star, Activity, Eye, Edit, Trash,
  Mail, Phone, MapPin, Calendar, Briefcase, Award,
  ChevronDown, ChevronUp, X, Download, Upload, Shield, UserCheck
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Employees() {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState("full_name");
  const [sortOrder, setSortOrder] = useState("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);
  const [viewMode, setViewMode] = useState("table"); // "table" or "grid"
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    department: "",
    status: "",
    location: ""
  });
  
  const navigate = useNavigate();
  const { success, error: showError } = useToast();
  const { userProfile } = useAuth();
  
  // Use React Query hooks
  const { data: employeesData, isLoading, error, refetch } = useEmployees(currentPage, pageSize, search);
  const deleteEmployeeMutation = useDeleteEmployee();

  const employees = employeesData?.data || [];
  const totalCount = employeesData?.count || 0;

  const handleDelete = useCallback(async (id) => {
    const confirm = window.confirm("Are you sure you want to delete this employee?");
    if (!confirm) return;

    try {
      await deleteEmployeeMutation.mutateAsync(id);
      success("Success", "Employee deleted successfully.");
    } catch (err) {
      showError("Delete Failed", err.message);
    }
  }, [deleteEmployeeMutation, success, showError]);

  const filteredAndSortedEmployees = useMemo(() => {
    let filtered = employees;
    
    // Apply filters
    if (filters.department) {
      filtered = filtered.filter(emp => emp.department === filters.department);
    }
    if (filters.status) {
      filtered = filtered.filter(emp => emp.status === filters.status);
    }
    if (filters.location) {
      filtered = filtered.filter(emp => emp.location === filters.location);
    }
    
    // Apply sorting
    return filtered.sort((a, b) => {
      const valA = a[sortKey]?.toLowerCase?.() || "";
      const valB = b[sortKey]?.toLowerCase?.() || "";
      return sortOrder === "asc"
        ? valA.localeCompare(valB)
        : valB.localeCompare(valA);
    });
  }, [employees, filters, sortKey, sortOrder]);

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
    setFilters({
      department: "",
      status: "",
      location: ""
    });
  }, []);

  // Role-based permission functions
  const canViewEmployee = useCallback(() => {
    const userRole = userProfile?.role;
    return userRole === 'admin' || userRole === 'hr_manager';
  }, [userProfile?.role]);

  const canEditEmployee = useCallback(() => {
    const userRole = userProfile?.role;
    return userRole === 'admin';
  }, [userProfile?.role]);

  const canDeleteEmployee = useCallback(() => {
    const userRole = userProfile?.role;
    return userRole === 'admin';
  }, [userProfile?.role]);

  const canAddEmployee = useCallback(() => {
    const userRole = userProfile?.role;
    return userRole === 'admin';
  }, [userProfile?.role]);

  // Debug: Log current user role and permissions
  console.log('🔍 Employee Page - User Role Debug:', {
    userRole: userProfile?.role,
    canView: canViewEmployee(),
    canEdit: canEditEmployee(),
    canDelete: canDeleteEmployee(),
    canAdd: canAddEmployee()
  });

  // Debug: Log data loading state
  console.log('🔍 Employee Page - Data Debug:', {
    isLoading,
    error,
    employeesData,
    employees: employees.length,
    totalCount,
    hasData: !!employeesData
  });

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-700';
      case 'inactive': return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-700';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-red-700';
      default: return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600';
    }
  };

  const getDepartmentColor = (department) => {
    const colors = {
      'IT': 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-700',
      'HR': 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-700',
      'Finance': 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-700',
      'Marketing': 'bg-pink-100 text-pink-800 border-pink-200 dark:bg-pink-900/20 dark:text-pink-400 dark:border-pink-700',
      'Sales': 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-700',
      'Operations': 'bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-900/20 dark:text-indigo-400 dark:border-indigo-700',
      'Engineering': 'bg-teal-100 text-teal-800 border-teal-200 dark:bg-teal-900/20 dark:text-teal-400 dark:border-teal-700',
      'Design': 'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-700',
      'Support': 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-700'
    };
    return colors[department] || 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600';
  };

  const getRoleBadge = (role) => {
    const roleConfig = {
      'admin': {
        color: 'bg-red-100 text-red-800 border-red-200',
        icon: Shield,
        label: 'Administrator'
      },
      'hr_manager': {
        color: 'bg-purple-100 text-purple-800 border-purple-200',
        icon: Users,
        label: 'HR Manager'
      },
      'cs_manager': {
        color: 'bg-blue-100 text-blue-800 border-blue-200',
        icon: Phone,
        label: 'CS Manager'
      },
      'driver_management': {
        color: 'bg-green-100 text-green-800 border-green-200',
        icon: MapPin,
        label: 'Driver Management'
      },
      'manager': {
        color: 'bg-indigo-100 text-indigo-800 border-indigo-200',
        icon: Briefcase,
        label: 'Manager'
      },
      'employee': {
        color: 'bg-gray-100 text-gray-800 border-gray-200',
        icon: UserCheck,
        label: 'Employee'
      },
      'viewer': {
        color: 'bg-orange-100 text-orange-800 border-orange-200',
        icon: Eye,
        label: 'Viewer'
      }
    };

    const config = roleConfig[role] || roleConfig['employee'];
    const IconComponent = config.icon;

    return (
      <span className={`inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-full border ${config.color}`}>
        <IconComponent className="w-4 h-4" />
        {config.label}
      </span>
    );
  };

  if (error) {
    return (
      <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900">
        <div className="ml-64 p-6 w-full">
          <div className="bg-red-50 border border-red-200 rounded-xl p-6">
            <h3 className="text-red-800 font-medium text-lg">Error Loading Employees</h3>
            <p className="text-red-600 mt-2">{error.message}</p>
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
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Employee Records</h1>
                <p className="text-sm text-gray-600">Manage and monitor your workforce with comprehensive analytics</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => refetch()}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-all duration-200 flex items-center gap-2"
                title="Refresh Data"
              >
                <Activity className="w-4 h-4" />
                Refresh
              </button>
              <button
                onClick={() => setViewMode(viewMode === "table" ? "grid" : "table")}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-all duration-200 flex items-center gap-2"
              >
                {viewMode === "table" ? (
                  <>
                    <Building className="w-4 h-4" />
                    Grid View
                  </>
                ) : (
                  <>
                    <Users className="w-4 h-4" />
                    Table View
                  </>
                )}
              </button>
              {canAddEmployee() && (
                <button
                  onClick={() => navigate("/employee-form")}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-2 rounded-lg font-medium flex items-center gap-2 shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <Plus className="w-4 h-4" />
                  Add Employee
                </button>
              )}
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
                <p className="text-sm font-medium text-gray-600">Total Employees</p>
                <p className="text-2xl font-bold text-gray-900">{totalCount}</p>
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
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Star className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">High Performers</p>
                <p className="text-2xl font-bold text-gray-900">
                  {employees.filter(emp => (emp.performance_rating || 0) >= 4.5).length}
                </p>
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
              <div className="p-3 bg-green-100 rounded-lg">
                <Building className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Departments</p>
                <p className="text-2xl font-bold text-gray-900">
                  {new Set(employees.map(emp => emp.department).filter(Boolean)).size}
                </p>
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
              <div className="p-3 bg-emerald-100 rounded-lg">
                <Activity className="w-6 h-6 text-emerald-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active</p>
                <p className="text-2xl font-bold text-gray-900">
                  {employees.filter(emp => !emp.termination_date).length}
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8"
        >
          <div className="p-6">
            <div className="flex flex-col lg:flex-row gap-6 items-center justify-between mb-6">
              <div className="flex-1 w-full lg:max-w-2xl">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search employees by name, ID, department, skills..."
                    value={search}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base transition-all duration-200"
                  />
                </div>
              </div>
              <div className="flex items-center gap-4 flex-shrink-0">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`px-6 py-3 border-2 rounded-xl font-medium flex items-center gap-2 transition-all duration-200 ${
                    showFilters 
                      ? 'border-blue-500 bg-blue-50 text-blue-600'
                      : 'border-gray-300 text-gray-700 hover:border-blue-400 hover:bg-gray-50'
                  }`}
                >
                  <Filter className="w-5 h-5" />
                  {showFilters ? 'Hide' : 'Show'} Filters
                </button>
                <button
                  onClick={() => {/* Export functionality */}}
                  className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium flex items-center gap-2 shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <Download className="w-5 h-5" />
                  Export
                </button>
              </div>
            </div>

            {/* Enhanced Filters */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="border-t border-gray-200 pt-6"
                >
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
                      <select
                        value={filters.department}
                        onChange={(e) => setFilters(prev => ({ ...prev, department: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      >
                        <option value="">All Departments</option>
                        {Array.from(new Set(employees.map(emp => emp.department).filter(Boolean))).map(dept => (
                          <option key={dept} value={dept}>{dept}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Performance</label>
                      <select
                        value={filters.status}
                        onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      >
                        <option value="">All Performance Levels</option>
                        <option value="excellent">Excellent (4.5+)</option>
                        <option value="good">Good (3.5-4.4)</option>
                        <option value="average">Average (2.5-3.4)</option>
                        <option value="needs_improvement">Needs Improvement (&lt;2.5)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                      <select
                        value={filters.location}
                        onChange={(e) => setFilters(prev => ({ ...prev, location: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      >
                        <option value="">All Locations</option>
                        {Array.from(new Set(employees.map(emp => emp.location).filter(Boolean))).map(location => (
                          <option key={location} value={location}>{location}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  <div className="mt-6 flex justify-center">
                    <button
                      onClick={clearFilters}
                      className="px-8 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-all duration-200"
                    >
                      Clear All Filters
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Results Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-8"
        >
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-600">Results:</span>
                <span className="text-lg font-semibold text-gray-900">{filteredAndSortedEmployees.length}</span>
                <span className="text-sm text-gray-500">of {totalCount} employees</span>
              </div>
              {filters.department || filters.status || filters.location ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">•</span>
                  <span className="text-sm text-blue-600 font-medium">Filters applied</span>
                </div>
              ) : null}
            </div>
            <div className="flex items-center gap-3">
              <select
                value={sortKey}
                onChange={(e) => handleSort(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              >
                <option value="full_name">Sort by Name</option>
                <option value="department">Sort by Department</option>
                <option value="position">Sort by Position</option>
                <option value="hire_date">Sort by Hire Date</option>
                <option value="performance_rating">Sort by Performance</option>
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                title={`Sort ${sortOrder === "asc" ? "Descending" : "Ascending"}`}
              >
                {sortOrder === "asc" ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </motion.div>

        {/* Loading State */}
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-center py-12"
          >
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Loading employees...</p>
            </div>
          </motion.div>
        )}

        {/* Content based on view mode */}
        {!isLoading && (
          <AnimatePresence mode="wait">
            {/* View Mode Indicator */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 mb-6"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${viewMode === 'table' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'}`}>
                    {viewMode === 'table' ? <Users className="w-5 h-5" /> : <Building className="w-5 h-5" />}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {viewMode === 'table' ? 'Table View' : 'Grid View'}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {viewMode === 'table' 
                        ? 'Detailed employee information in a structured table format' 
                        : 'Employee cards with key information and quick actions'
                      }
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">View Mode:</span>
                  <div className="flex bg-gray-100 rounded-lg p-1">
                    <button
                      onClick={() => setViewMode('table')}
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                        viewMode === 'table' 
                          ? 'bg-white text-blue-600 shadow-sm' 
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      <Users className="w-4 h-4 inline mr-1" />
                      Table
                    </button>
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                        viewMode === 'grid' 
                          ? 'bg-white text-green-600 shadow-sm' 
                          : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                      <Building className="w-4 h-4 inline mr-1" />
                      Grid
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
            
            {viewMode === "grid" ? (
              <motion.div
                key="grid"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 justify-items-center"
              >
                {filteredAndSortedEmployees.map((employee) => (
                  <motion.div
                    key={employee.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                    className="w-full max-w-sm bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-200"
                  >
                    {/* Card Header with Profile Picture */}
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 border-b border-gray-200">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-semibold text-gray-900 truncate">
                            {employee.full_name || employee.name || "Unknown"}
                          </h3>
                          <p className="text-sm text-gray-600 truncate">
                            {employee.position || "No Position"}
                          </p>
                        </div>
                        <div className="flex-shrink-0 ml-3">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(employee.status)}`}>
                            {employee.status || 'Unknown'}
                          </span>
                        </div>
                      </div>
                      
                      {/* Profile Picture */}
                      <div className="flex justify-center">
                        <div className="flex-shrink-0 h-20 w-20">
                          {employee.profile_picture || employee.photo_url ? (
                            <img
                              className="h-20 w-20 rounded-full ring-4 ring-white shadow-lg object-cover"
                              src={employee.profile_picture || employee.photo_url}
                              alt={employee.full_name || employee.name}
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                              }}
                            />
                          ) : null}
                          {!employee.profile_picture && !employee.photo_url && (
                            <div className="h-20 w-20 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-bold text-2xl ring-4 ring-white shadow-lg">
                              {(employee.full_name || employee.name || 'U').charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Card Content */}
                    <div className="p-4 space-y-3">
                      <div className="flex items-center text-sm text-gray-600">
                        <span className="font-medium w-20 flex-shrink-0">ID:</span>
                        <span className="truncate">{employee.employee_id || "N/A"}</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <span className="font-medium w-20 flex-shrink-0">Dept:</span>
                        <span className="truncate">{employee.department || "Unassigned"}</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <span className="font-medium w-20 flex-shrink-0">Email:</span>
                        <span className="truncate">{employee.email || "N/A"}</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <span className="font-medium w-20 flex-shrink-0">Phone:</span>
                        <span className="truncate">{employee.phone || "N/A"}</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <span className="font-medium w-20 flex-shrink-0">Location:</span>
                        <span className="truncate">{employee.location || "N/A"}</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <span className="font-medium w-20 flex-shrink-0">Joined:</span>
                        <span className="truncate">
                          {employee.hire_date ? new Date(employee.hire_date).toLocaleDateString() : "N/A"}
                        </span>
                      </div>

                      {/* Role */}
                      {/* Role column removed - not available in database */}

                      {/* Performance Rating */}
                      {employee.performance_rating && (
                        <div className="flex items-center text-sm text-gray-600">
                          <span className="font-medium w-20 flex-shrink-0">Rating:</span>
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`w-4 h-4 ${
                                  star <= employee.performance_rating
                                    ? 'text-yellow-400 fill-current'
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Action Buttons */}
                      {(canViewEmployee() || canEditEmployee() || canDeleteEmployee()) && (
                        <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                          {canViewEmployee() && (
                            <button
                              onClick={() => navigate(`/employee/${employee.id}`)}
                              className="flex-1 p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
                              title="View Profile"
                            >
                              <Eye className="w-4 h-4" />
                              <span className="text-sm">View</span>
                            </button>
                          )}
                          {canEditEmployee() && (
                            <button
                              onClick={() => navigate(`/employee/${employee.id}/edit`)}
                              className="flex-1 p-2 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
                              title="Edit Employee"
                            >
                              <Edit className="w-4 h-4" />
                              <span className="text-sm">Edit</span>
                            </button>
                          )}
                          {canDeleteEmployee() && (
                            <button
                              onClick={() => handleDelete(employee.id)}
                              className="flex-1 p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
                              title="Delete Employee"
                              disabled={deleteEmployeeMutation.isLoading}
                            >
                              <Trash className="w-4 h-4" />
                              <span className="text-sm">Delete</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <motion.div
                key="table"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden relative"
              >
                {/* Table Header Decoration */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"></div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gradient-to-r from-slate-50 via-blue-50 to-indigo-50 shadow-sm">
                      <tr>
                        <th className="px-6 py-6 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider border-b-2 border-slate-200">
                          Employee
                        </th>
                        <th className="px-6 py-6 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider border-b-2 border-slate-200">
                          Role
                        </th>
                        <th className="px-6 py-6 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider border-b-2 border-slate-200">
                          Department
                        </th>
                        <th className="px-6 py-6 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider border-b-2 border-slate-200">
                          Status
                        </th>
                        {(canViewEmployee() || canEditEmployee() || canDeleteEmployee()) && (
                          <th className="px-6 py-6 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider border-b-2 border-slate-200">
                            Actions
                          </th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-100">
                      <AnimatePresence>
                        {filteredAndSortedEmployees.map((employee) => (
                          <motion.tr
                            key={employee.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3, delay: employee.id % 10 * 0.05 }}
                            className="hover:bg-slate-50 transition-all duration-200 group"
                          >
                            <td className="px-6 py-6 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-12 w-12">
                                  {employee.profile_picture || employee.photo_url ? (
                                    <img
                                      className="h-12 w-12 rounded-full ring-2 ring-slate-200 shadow-sm object-cover group-hover:ring-2 group-hover:ring-blue-200 transition-all duration-300"
                                      src={employee.profile_picture || employee.photo_url}
                                      alt={employee.full_name || employee.name}
                                      onError={(e) => {
                                        e.target.style.display = 'none';
                                        e.target.nextSibling.style.display = 'flex';
                                      }}
                                    />
                                  ) : null}
                                  {!employee.profile_picture && !employee.photo_url && (
                                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-bold text-lg ring-2 ring-slate-200 shadow-sm group-hover:ring-2 group-hover:ring-blue-200 transition-all duration-300">
                                      {(employee.full_name || employee.name || 'U').charAt(0).toUpperCase()}
                                    </div>
                                  )}
                                </div>
                                <div className="ml-4 min-w-0 flex-1">
                                  <div className="text-sm font-semibold text-slate-900 truncate group-hover:text-blue-600 transition-colors duration-200">
                                    {employee.full_name || employee.name || "Unknown"}
                                  </div>
                                  <div className="text-sm text-slate-500 truncate">
                                    {employee.email || "No Email"}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-6 whitespace-nowrap">
                              {getRoleBadge(employee.role)}
                            </td>
                            <td className="px-6 py-6 whitespace-nowrap">
                              <span className={`inline-flex px-3 py-2 text-sm font-medium rounded-full border ${getDepartmentColor(employee.department)}`}>
                                {employee.department || "Unassigned"}
                              </span>
                            </td>
                            <td className="px-6 py-6 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                <span className="text-sm font-medium text-slate-900">
                                  {employee.status || 'active'}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-6 whitespace-nowrap">
                              {(canViewEmployee() || canEditEmployee() || canDeleteEmployee()) ? (
                                <div className="flex items-center gap-2">
                                  {canViewEmployee() && (
                                    <button
                                      onClick={() => navigate(`/employee/${employee.id}`)}
                                      className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-lg transition-all duration-200"
                                      title="View Profile"
                                    >
                                      <Eye className="w-4 h-4" />
                                    </button>
                                  )}
                                  {canEditEmployee() && (
                                    <button
                                      onClick={() => navigate(`/employee/${employee.id}/edit`)}
                                      className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-all duration-200"
                                      title="Edit Employee"
                                    >
                                      <Edit className="w-4 h-4" />
                                    </button>
                                  )}
                                  {canDeleteEmployee() && (
                                    <button
                                      onClick={() => handleDelete(employee.id)}
                                      className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-all duration-200"
                                      title="Delete Employee"
                                      disabled={deleteEmployeeMutation.isLoading}
                                    >
                                      <Trash className="w-4 h-4" />
                                    </button>
                                  )}
                                </div>
                              ) : (
                                <span className="text-sm text-gray-400">No actions available</span>
                              )}
                            </td>
                          </motion.tr>
                        ))}
                      </AnimatePresence>
                    </tbody>
                  </table>
                </div>

                {/* Enhanced Pagination */}
                {totalPages > 1 && (
                  <div className="px-8 py-8 border-t border-slate-200 bg-gradient-to-r from-slate-50 to-blue-50">
                    <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
                      <div className="text-sm text-slate-700 text-center lg:text-left">
                        <span className="font-medium">Showing</span>{' '}
                        <span className="font-bold text-slate-900">{((currentPage - 1) * pageSize) + 1}</span>{' '}
                        <span className="font-medium">to</span>{' '}
                        <span className="font-bold text-slate-900">{Math.min(currentPage * pageSize, totalCount)}</span>{' '}
                        <span className="font-medium">of</span>{' '}
                        <span className="font-bold text-slate-900">{totalCount}</span>{' '}
                        <span className="font-medium">results</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={currentPage === 1}
                          className="px-6 py-3 border-2 border-slate-300 rounded-xl text-slate-700 hover:bg-slate-50 hover:border-slate-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium shadow-sm hover:shadow-md"
                        >
                          Previous
                        </button>
                        <div className="flex items-center gap-2">
                          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            const page = i + 1;
                            return (
                              <button
                                key={page}
                                onClick={() => handlePageChange(page)}
                                className={`px-4 py-3 rounded-xl font-medium transition-all duration-200 shadow-sm hover:shadow-md ${
                                  currentPage === page
                                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg transform scale-105'
                                    : 'border-2 border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400'
                                }`}
                              >
                                {page}
                              </button>
                            );
                          })}
                        </div>
                        <button
                          onClick={() => handlePageChange(currentPage + 1)}
                          disabled={currentPage === totalPages}
                          className="px-6 py-3 border-2 border-slate-300 rounded-xl text-slate-700 hover:bg-slate-50 hover:border-slate-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium shadow-sm hover:shadow-md"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
