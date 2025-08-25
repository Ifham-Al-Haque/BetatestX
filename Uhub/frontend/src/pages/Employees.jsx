import { useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "../context/ToastContext";
import { useEmployees, useDeleteEmployee } from "../hooks/useApi";
import { 
  ChevronRight, Trash2, Pencil, Plus, Search, Filter, 
  Users, Building, Star, Activity, Eye, Edit, Trash,
  Mail, Phone, MapPin, Calendar, Briefcase, Award,
  ChevronDown, ChevronUp, X, Download, Upload
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
  
  // Use React Query hooks
  const { data: employeesData, isLoading, error } = useEmployees(currentPage, pageSize, search);
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
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="ml-64 p-6 w-full">
        {/* Enhanced Header with Stats */}
        <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-3xl p-6 text-white shadow-2xl mb-6">
          <div className="flex justify-between items-start mb-6">
            <div className="flex-1">
              <h1 className="text-5xl font-bold mb-3">Employee Records</h1>
              <p className="text-blue-100 text-xl">
                Manage and monitor your workforce with comprehensive analytics
              </p>
            </div>
            <div className="flex items-center gap-4 flex-shrink-0">
              <button
                onClick={() => setViewMode(viewMode === "table" ? "grid" : "table")}
                className="bg-white/20 hover:bg-white/30 text-white px-6 py-3 rounded-xl transition-all duration-200 flex items-center gap-2 border-2 border-white/30 backdrop-blur-sm"
              >
                {viewMode === "table" ? (
                  <>
                    <Building className="w-5 h-5" />
                    Grid View
                  </>
                ) : (
                  <>
                    <Users className="w-5 h-5" />
                    Table View
                  </>
                )}
              </button>
              <button
                onClick={() => navigate("/employee/new")}
                className="bg-white hover:bg-gray-100 text-blue-600 px-8 py-3 rounded-xl font-semibold flex items-center gap-3 shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <Plus className="w-6 h-6" />
                Add Employee
              </button>
            </div>
          </div>

          {/* Quick Stats - Fixed Grid Layout */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white/15 backdrop-blur-sm rounded-xl p-4 border border-white/25 flex items-center justify-center hover:bg-white/20 transition-all duration-200">
              <div className="flex items-center gap-3 w-full">
                <div className="p-2.5 bg-white/25 rounded-lg flex-shrink-0">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 text-center sm:text-left">
                  <p className="text-blue-100 text-xs font-medium mb-1">Total Employees</p>
                  <p className="text-2xl font-bold">{totalCount}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white/15 backdrop-blur-sm rounded-xl p-4 border border-white/25 flex items-center justify-center hover:bg-white/20 transition-all duration-200">
              <div className="flex items-center gap-3 w-full">
                <div className="p-2.5 bg-white/25 rounded-lg flex-shrink-0">
                  <Star className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 text-center sm:text-left">
                  <p className="text-blue-100 text-xs font-medium mb-1">High Performers</p>
                  <p className="text-2xl font-bold">
                    {employees.filter(emp => (emp.performance_rating || 0) >= 4.5).length}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white/15 backdrop-blur-sm rounded-xl p-4 border border-white/25 flex items-center justify-center hover:bg-white/20 transition-all duration-200">
              <div className="flex items-center gap-3 w-full">
                <div className="p-2.5 bg-white/25 rounded-lg flex-shrink-0">
                  <Building className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 text-center sm:text-left">
                  <p className="text-blue-100 text-xs font-medium mb-1">Departments</p>
                  <p className="text-2xl font-bold">
                    {new Set(employees.map(emp => emp.department).filter(Boolean)).size}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white/15 backdrop-blur-sm rounded-xl p-4 border border-white/25 flex items-center justify-center hover:bg-white/20 transition-all duration-200">
              <div className="flex items-center gap-3 w-full">
                <div className="p-2.5 bg-white/25 rounded-lg flex-shrink-0">
                  <Activity className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 text-center sm:text-left">
                  <p className="text-blue-100 text-xs font-medium mb-1">Active</p>
                                    <p className="text-2xl font-bold">
                    {employees.filter(emp => emp.status === 'active').length}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Search and Filters - Centered Layout */}
        <div className="max-w-6xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden mb-6">
            <div className="p-5">
              <div className="flex flex-col lg:flex-row gap-4 items-center justify-center lg:justify-between mb-6">
                <div className="flex-1 w-full lg:max-w-2xl">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      placeholder="Search employees by name, ID, department, skills..."
                      value={search}
                      onChange={(e) => handleSearch(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-base"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={`px-5 py-3 border-2 rounded-xl font-medium flex items-center gap-2 transition-all duration-200 ${
                      showFilters 
                        ? 'border-blue-500 bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
                        : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-blue-400'
                    }`}
                  >
                    <Filter className="w-5 h-5" />
                    {showFilters ? 'Hide' : 'Show'} Filters
                  </button>
                  <button
                    onClick={() => {/* Export functionality */}}
                    className="px-5 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium flex items-center gap-2 shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    <Download className="w-5 h-5" />
                    Export
                  </button>
                </div>
              </div>

              {/* Enhanced Filters - Centered */}
              <AnimatePresence>
                {showFilters && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="border-t border-gray-200 dark:border-gray-700 pt-6"
                  >
                    <div className="max-w-4xl mx-auto">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Department</label>
                          <select
                            value={filters.department}
                            onChange={(e) => setFilters(prev => ({ ...prev, department: e.target.value }))}
                            className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                          >
                            <option value="">All Departments</option>
                            {Array.from(new Set(employees.map(emp => emp.department).filter(Boolean))).map(dept => (
                              <option key={dept} value={dept}>{dept}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Status</label>
                          <select
                            value={filters.status}
                            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                            className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                          >
                            <option value="">All Statuses</option>
                            {Array.from(new Set(employees.map(emp => emp.status).filter(Boolean))).map(status => (
                              <option key={status} value={status}>{status}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Location</label>
                          <select
                            value={filters.location}
                            onChange={(e) => setFilters(prev => ({ ...prev, location: e.target.value }))}
                            className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                          >
                            <option value="">All Locations</option>
                            {Array.from(new Set(employees.map(emp => emp.location).filter(Boolean))).map(location => (
                              <option key={location} value={location}>{location}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="flex justify-center mt-6">
                        <button
                          onClick={clearFilters}
                          className="px-5 py-2.5 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 font-medium transition-colors duration-200"
                        >
                          Clear All Filters
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="max-w-6xl mx-auto">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600 dark:text-gray-400 text-lg">Loading employees...</p>
              </div>
            </div>
          </div>
        )}

        {/* Employee List */}
        {!isLoading && (
          <div className="max-w-7xl mx-auto">
            {/* Results Summary - Centered */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
              <div className="text-gray-600 dark:text-gray-400 text-center lg:text-left">
                Showing <span className="font-semibold text-gray-900 dark:text-white">{filteredAndSortedEmployees.length}</span> of{' '}
                <span className="font-semibold text-gray-900 dark:text-white">{totalCount}</span> employees
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <span>Sort by:</span>
                <select
                  value={`${sortKey}-${sortOrder}`}
                  onChange={(e) => {
                    const [key, order] = e.target.value.split('-');
                    setSortKey(key);
                    setSortOrder(order);
                  }}
                  className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="full_name-asc">Name (A-Z)</option>
                  <option value="full_name-desc">Name (Z-A)</option>
                  <option value="employee_id-asc">ID (Low-High)</option>
                  <option value="employee_id-desc">ID (High-Low)</option>
                  <option value="department-asc">Department (A-Z)</option>
                  <option value="department-desc">Department (Z-A)</option>
                </select>
              </div>
            </div>

            {/* Grid View - Centered Grid */}
            {viewMode === "grid" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 justify-items-center">
                <AnimatePresence>
                  {filteredAndSortedEmployees.map((employee, index) => (
                    <motion.div
                      key={employee.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.2, delay: index * 0.05 }}
                      className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 w-full max-w-sm"
                    >
                      {/* Card Header */}
                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-6 border-b border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3 flex-1">
                            <div className="relative flex-shrink-0">
                              {employee.profile_picture ? (
                                <img
                                  src={employee.profile_picture}
                                  alt={employee.full_name}
                                  className="h-16 w-16 rounded-full object-cover ring-4 ring-white dark:ring-gray-700 shadow-lg"
                                  onError={(e) => {
                                    e.target.style.display = 'none';
                                    const container = e.target.parentElement;
                                    if (container) {
                                      container.innerHTML = `
                                        <div class="h-16 w-16 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center ring-4 ring-white dark:ring-gray-700 shadow-lg">
                                          <span class="text-xl font-bold text-white">
                                            ${employee.full_name?.charAt(0)?.toUpperCase() || "?"}
                                          </span>
                                        </div>
                                      `;
                                    }
                                  }}
                                />
                              ) : (
                                <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center ring-4 ring-white dark:ring-gray-700 shadow-lg">
                                  <span className="text-xl font-bold text-white">
                                    {employee.full_name?.charAt(0)?.toUpperCase() || "?"}
                                  </span>
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate">
                                {employee.full_name || "N/A"}
                              </h3>
                              <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                                {employee.position || "No position"}
                              </p>
                            </div>
                          </div>
                          <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full border-2 flex-shrink-0 ${getStatusColor(employee.status)}`}>
                            {employee.status || 'Unknown'}
                          </span>
                        </div>
                      </div>

                      {/* Card Content */}
                      <div className="p-6 space-y-4">
                        <div className="space-y-3">
                          <div className="flex items-center gap-3 text-sm">
                            <Briefcase className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            <span className="text-gray-600 dark:text-gray-400">ID:</span>
                            <span className="font-medium text-gray-900 dark:text-white truncate">{employee.employee_id || "N/A"}</span>
                          </div>
                          
                          <div className="flex items-center gap-3 text-sm">
                            <Building className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            <span className="text-gray-600 dark:text-gray-400">Dept:</span>
                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full border flex-shrink-0 ${getDepartmentColor(employee.department)}`}>
                              {employee.department || "Unassigned"}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-3 text-sm">
                            <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            <span className="text-gray-600 dark:text-gray-400">Email:</span>
                            <span className="font-medium text-gray-900 dark:text-white truncate flex-1">{employee.email || "No email"}</span>
                          </div>
                          
                          {employee.phone && (
                            <div className="flex items-center gap-3 text-sm">
                              <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                              <span className="text-gray-600 dark:text-gray-400">Phone:</span>
                              <span className="font-medium text-gray-900 dark:text-white truncate flex-1">{employee.phone}</span>
                            </div>
                          )}
                          
                          {employee.location && (
                            <div className="flex items-center gap-3 text-sm">
                              <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                              <span className="text-gray-600 dark:text-gray-400">Location:</span>
                              <span className="font-medium text-gray-900 dark:text-white truncate flex-1">{employee.location}</span>
                            </div>
                          )}
                          
                          {employee.hire_date && (
                            <div className="flex items-center gap-3 text-sm">
                              <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
                              <span className="text-gray-600 dark:text-gray-400">Joined:</span>
                              <span className="font-medium text-gray-900 dark:text-white flex-1">
                                {new Date(employee.hire_date).toLocaleDateString()}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Performance Rating */}
                        {employee.performance_rating && (
                          <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600 dark:text-gray-400">Performance</span>
                              <div className="flex items-center gap-1">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`w-4 h-4 ${
                                      i < Math.floor(employee.performance_rating)
                                        ? 'text-yellow-400 fill-current'
                                        : 'text-gray-300 dark:text-gray-600'
                                    }`}
                                  />
                                ))}
                                <span className="text-sm font-medium text-gray-900 dark:text-white ml-2">
                                  {employee.performance_rating}/5
                                </span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Card Actions */}
                      <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                          <button
                            onClick={() => navigate(`/employee/${employee.id}`)}
                            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium text-sm flex items-center gap-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 px-3 py-2 rounded-lg transition-all duration-200"
                          >
                            <Eye className="w-4 h-4" />
                            View
                          </button>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => navigate(`/employee/${employee.id}/edit`)}
                              className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 p-2 rounded-lg transition-all duration-200"
                              title="Edit Employee"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(employee.id)}
                              className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 p-2 rounded-lg transition-all duration-200"
                              title="Delete Employee"
                              disabled={deleteEmployeeMutation.isLoading}
                            >
                              <Trash className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}

            {/* Table View - Centered */}
            {viewMode === "table" && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800">
                      <tr>
                        <th 
                          className="px-8 py-4 text-left cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                          onClick={() => handleSort("full_name")}
                        >
                          <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                            Employee
                            {sortKey === "full_name" && (
                              <span className="text-blue-600">
                                {sortOrder === "asc" ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                              </span>
                            )}
                          </div>
                        </th>
                        <th 
                          className="px-8 py-4 text-left cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                          onClick={() => handleSort("employee_id")}
                        >
                          <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                            Employee ID
                            {sortKey === "employee_id" && (
                              <span className="text-blue-600">
                                {sortOrder === "asc" ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                              </span>
                            )}
                          </div>
                        </th>
                        <th 
                          className="px-8 py-4 text-left cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                          onClick={() => handleSort("department")}
                        >
                          <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                            Department
                            {sortKey === "department" && (
                              <span className="text-blue-600">
                                {sortOrder === "asc" ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                              </span>
                            )}
                          </div>
                        </th>
                        <th 
                          className="px-8 py-4 text-left cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                          onClick={() => handleSort("position")}
                        >
                          <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                            Position
                            {sortKey === "position" && (
                              <span className="text-blue-600">
                                {sortOrder === "asc" ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                              </span>
                            )}
                          </div>
                        </th>
                        <th 
                          className="px-8 py-4 text-left cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                          onClick={() => handleSort("status")}
                        >
                          <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                            Status
                            {sortKey === "status" && (
                              <span className="text-blue-600">
                                {sortOrder === "asc" ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                              </span>
                            )}
                          </div>
                        </th>
                        <th className="px-8 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      <AnimatePresence>
                        {filteredAndSortedEmployees.map((employee, index) => (
                          <motion.tr
                            key={employee.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.2, delay: index * 0.05 }}
                            className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200"
                          >
                            <td className="px-8 py-6">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-12 w-12">
                                  {employee.profile_picture ? (
                                    <img
                                      src={employee.profile_picture}
                                      alt={employee.full_name}
                                      className="h-12 w-12 rounded-full object-cover ring-2 ring-gray-200 dark:ring-gray-600"
                                      onError={(e) => {
                                        e.target.style.display = 'none';
                                        const container = e.target.parentElement;
                                        if (container) {
                                          container.innerHTML = `
                                            <div class="h-12 w-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center ring-2 ring-gray-200 dark:ring-gray-600">
                                              <span class="text-lg font-bold text-white">
                                                ${employee.full_name?.charAt(0)?.toUpperCase() || "?"}
                                              </span>
                                            </div>
                                          `;
                                        }
                                      }}
                                    />
                                  ) : (
                                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center ring-2 ring-gray-200 dark:ring-gray-600">
                                      <span className="text-lg font-bold text-white">
                                        {employee.full_name?.charAt(0)?.toUpperCase() || "?"}
                                      </span>
                                    </div>
                                  )}
                                </div>
                                <div className="ml-4 min-w-0 flex-1">
                                  <div className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                                    {employee.full_name || "N/A"}
                                  </div>
                                  <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                                    <span className="flex items-center gap-1">
                                      <Briefcase className="w-3 h-3" />
                                      {employee.employee_id}
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <Mail className="w-3 h-3" />
                                      {employee.email}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-8 py-6 whitespace-nowrap text-lg font-medium text-gray-900 dark:text-white">
                              {employee.employee_id || "N/A"}
                            </td>
                            <td className="px-8 py-6 whitespace-nowrap">
                              <span className={`inline-flex px-3 py-2 text-sm font-semibold rounded-full border ${getDepartmentColor(employee.department)}`}>
                                {employee.department || "Unassigned"}
                              </span>
                            </td>
                            <td className="px-8 py-6 whitespace-nowrap text-lg font-medium text-gray-900 dark:text-white">
                              {employee.position || "N/A"}
                            </td>
                            <td className="px-8 py-6 whitespace-nowrap">
                              <span className={`inline-flex px-4 py-2 text-sm font-semibold rounded-full border-2 ${getStatusColor(employee.status)}`}>
                                {employee.status || 'Unknown'}
                              </span>
                            </td>
                            <td className="px-8 py-6 whitespace-nowrap">
                              <div className="flex items-center gap-3">
                                <button
                                  onClick={() => navigate(`/employee/${employee.id}`)}
                                  className="p-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all duration-200"
                                  title="View Profile"
                                >
                                  <Eye className="w-5 h-5" />
                                </button>
                                <button
                                  onClick={() => navigate(`/employee/${employee.id}/edit`)}
                                  className="p-2 text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-all duration-200"
                                  title="Edit Employee"
                                >
                                  <Edit className="w-5 h-5" />
                                </button>
                                <button
                                  onClick={() => handleDelete(employee.id)}
                                  className="p-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all duration-200"
                                  title="Delete Employee"
                                  disabled={deleteEmployeeMutation.isLoading}
                                >
                                  <Trash className="w-5 h-5" />
                                </button>
                              </div>
                            </td>
                          </motion.tr>
                        ))}
                      </AnimatePresence>
                    </tbody>
                  </table>
                </div>

                {/* Enhanced Pagination - Centered */}
                {totalPages > 1 && (
                  <div className="px-8 py-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                    <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
                      <div className="text-sm text-gray-700 dark:text-gray-300 text-center lg:text-left">
                        Showing <span className="font-semibold">{((currentPage - 1) * pageSize) + 1}</span> to{' '}
                        <span className="font-semibold">{Math.min(currentPage * pageSize, totalCount)}</span> of{' '}
                        <span className="font-semibold">{totalCount}</span> results
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={currentPage === 1}
                          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium"
                        >
                          Previous
                        </button>
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          const page = i + 1;
                          return (
                            <button
                              key={page}
                              onClick={() => handlePageChange(page)}
                              className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                                currentPage === page
                                  ? 'bg-blue-600 text-white shadow-lg'
                                  : 'border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                              }`}
                            >
                              {page}
                            </button>
                          );
                        })}
                        <button
                          onClick={() => handlePageChange(currentPage + 1)}
                          disabled={currentPage === totalPages}
                          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
