import { useState, useCallback, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "../context/ToastContext";
import { useAuth } from "../context/AuthContext";
import { useArchivedEmployees, useUnarchiveEmployee } from "../hooks/useApi";
import { 
  Archive, Search, Filter, Users, Building, Star, Activity, 
  Eye, Edit, RotateCcw, ChevronDown, ChevronUp, X, Download,
  Mail, Phone, MapPin, Calendar, Briefcase, UserCheck
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function EmployeeHistory() {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState("archived_at");
  const [sortOrder, setSortOrder] = useState("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);
  const [viewMode, setViewMode] = useState("table");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    department: "",
    status: "",
    location: ""
  });
  
  const imageErrorsRef = useRef(new Set());
  const [, forceUpdate] = useState(0);
  
  const triggerRerender = useCallback(() => {
    forceUpdate(prev => prev + 1);
  }, []);
  
  const navigate = useNavigate();
  const { success, error: showError } = useToast();
  const { userProfile } = useAuth();
  
  const { data: employeesData, isLoading, error, refetch } = useArchivedEmployees(currentPage, pageSize, search);
  const unarchiveEmployeeMutation = useUnarchiveEmployee();

  const employees = employeesData?.data || [];
  const totalCount = employeesData?.count || 0;

  const handleUnarchive = useCallback(async (id, employeeName) => {
    const confirm = window.confirm(`Are you sure you want to unarchive ${employeeName || 'this employee'}? They will be restored to active employees.`);
    if (!confirm) return;

    try {
      await unarchiveEmployeeMutation.mutateAsync(id);
      success("Success", "Employee unarchived successfully. They are now in the active employees list.");
      refetch();
    } catch (err) {
      showError("Unarchive Failed", err.message);
    }
  }, [unarchiveEmployeeMutation, success, showError, refetch]);

  const filteredAndSortedEmployees = useMemo(() => {
    let filtered = employees;
    
    if (filters.department) {
      filtered = filtered.filter(emp => emp.department === filters.department);
    }
    if (filters.status) {
      filtered = filtered.filter(emp => emp.status === filters.status);
    }
    if (filters.location) {
      filtered = filtered.filter(emp => emp.location === filters.location);
    }
    
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
    setCurrentPage(1);
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

  const canViewEmployee = useCallback(() => {
    const userRole = userProfile?.role;
    return userRole === 'admin' || userRole === 'hr_manager';
  }, [userProfile?.role]);

  const canEditEmployee = useCallback(() => {
    const userRole = userProfile?.role;
    return userRole === 'admin';
  }, [userProfile?.role]);

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-700';
      case 'inactive': return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-700';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-red-700';
      case 'terminated': return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600';
      default: return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600';
    }
  };

  const getDepartmentColor = (department) => {
    const colors = {
      'IT': 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-700',
      'HR': 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-700',
      'FINANCE': 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-700',
      'MARKETING': 'bg-pink-100 text-pink-800 border-pink-200 dark:bg-pink-900/20 dark:text-pink-400 dark:border-pink-700',
      'SALES': 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-700',
      'OPERATIONS': 'bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-900/20 dark:text-indigo-400 dark:border-indigo-700',
    };
    return colors[department] || 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600';
  };

  if (error) {
    return (
      <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900">
        <div className="ml-64 p-6 w-full">
          <div className="bg-red-50 border border-red-200 rounded-xl p-6">
            <h3 className="text-red-800 font-medium text-lg">Error Loading Archived Employees</h3>
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
              <div className="p-2 bg-gradient-to-r from-gray-500 to-gray-600 rounded-lg">
                <Archive className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Employee History</h1>
                <p className="text-sm text-gray-600">View archived employees who are no longer working</p>
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
                onClick={() => navigate("/employees")}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-all duration-200 flex items-center gap-2"
              >
                <Users className="w-4 h-4" />
                Active Employees
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200"
          >
            <div className="flex items-center">
              <div className="p-3 bg-gray-100 rounded-lg">
                <Archive className="w-6 h-6 text-gray-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Archived Employees</p>
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
              <div className="p-3 bg-red-100 rounded-lg">
                <Building className="w-6 h-6 text-red-600" />
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
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200"
          >
            <div className="flex items-center">
              <div className="p-3 bg-orange-100 rounded-lg">
                <Calendar className="w-6 h-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">This Month</p>
                <p className="text-2xl font-bold text-gray-900">
                  {employees.filter(emp => {
                    if (!emp.archived_at) return false;
                    const archivedDate = new Date(emp.archived_at);
                    const now = new Date();
                    return archivedDate.getMonth() === now.getMonth() && archivedDate.getFullYear() === now.getFullYear();
                  }).length}
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
                    placeholder="Search archived employees by name, ID, department..."
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
              </div>
            </div>

            {/* Filters */}
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
                      <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                      <select
                        value={filters.status}
                        onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      >
                        <option value="">All Statuses</option>
                        <option value="terminated">Terminated</option>
                        <option value="inactive">Inactive</option>
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

        {/* Loading State */}
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-center py-12"
          >
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Loading archived employees...</p>
            </div>
          </motion.div>
        )}

        {/* Employee Table */}
        {!isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden relative"
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-gray-500 via-gray-600 to-gray-700"></div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-slate-50 via-gray-50 to-slate-50 shadow-sm">
                  <tr>
                    <th className="px-6 py-6 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider border-b-2 border-slate-200">
                      Employee
                    </th>
                    <th className="px-6 py-6 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider border-b-2 border-slate-200">
                      Designation
                    </th>
                    <th className="px-6 py-6 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider border-b-2 border-slate-200">
                      Department
                    </th>
                    <th className="px-6 py-6 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider border-b-2 border-slate-200">
                      Archived Date
                    </th>
                    <th className="px-6 py-6 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider border-b-2 border-slate-200">
                      Status
                    </th>
                    {(canViewEmployee() || canEditEmployee()) && (
                      <th className="px-6 py-6 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider border-b-2 border-slate-200">
                        Actions
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-100">
                  <AnimatePresence>
                    {filteredAndSortedEmployees.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center">
                          <Archive className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                          <p className="text-gray-500 text-lg">No archived employees found</p>
                          <p className="text-gray-400 text-sm mt-2">Archived employees will appear here</p>
                        </td>
                      </tr>
                    ) : (
                      filteredAndSortedEmployees.map((employee) => (
                        <motion.tr
                          key={employee.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{ duration: 0.3 }}
                          className="hover:bg-slate-50 transition-all duration-200 group"
                        >
                          <td className="px-6 py-6 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-12 w-12">
                                {(() => {
                                  const imageUrl = employee.profile_picture || employee.photo_url;
                                  const imageKey = `${employee.id}-${imageUrl}`;
                                  const hasError = imageErrorsRef.current.has(imageKey);
                                  
                                  if (!imageUrl || hasError) {
                                    return (
                                      <div className="h-12 w-12 rounded-full bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center text-white font-bold text-lg ring-2 ring-slate-200 shadow-sm group-hover:ring-2 group-hover:ring-gray-200 transition-all duration-300">
                                        {(employee.full_name || employee.name || 'U').charAt(0).toUpperCase()}
                                      </div>
                                    );
                                  }
                                  
                                  return (
                                    <img
                                      key={imageKey}
                                      className="h-12 w-12 rounded-full ring-2 ring-slate-200 shadow-sm object-cover group-hover:ring-2 group-hover:ring-gray-200 transition-all duration-300"
                                      src={imageUrl}
                                      alt={employee.full_name || employee.name}
                                      onError={() => {
                                        if (!imageErrorsRef.current.has(imageKey)) {
                                          imageErrorsRef.current.add(imageKey);
                                          triggerRerender();
                                        }
                                      }}
                                    />
                                  );
                                })()}
                              </div>
                              <div className="ml-4 min-w-0 flex-1">
                                <div className="text-sm font-semibold text-slate-900 truncate group-hover:text-gray-600 transition-colors duration-200">
                                  {employee.full_name || employee.name || "Unknown"}
                                </div>
                                <div className="text-sm text-slate-500 truncate">
                                  {employee.email || "No Email"}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-6 whitespace-nowrap">
                            <span className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-full border bg-gray-100 text-gray-800 border-gray-200">
                              <UserCheck className="w-4 h-4" />
                              {employee.designation || employee.position || "Not Specified"}
                            </span>
                          </td>
                          <td className="px-6 py-6 whitespace-nowrap">
                            <span className={`inline-flex px-3 py-2 text-sm font-medium rounded-full border ${getDepartmentColor(employee.department)}`}>
                              {employee.department || "Unassigned"}
                            </span>
                          </td>
                          <td className="px-6 py-6 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-gray-400" />
                              <span className="text-sm font-medium text-slate-900">
                                {employee.archived_at 
                                  ? new Date(employee.archived_at).toLocaleDateString() 
                                  : 'N/A'}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-6 whitespace-nowrap">
                            <span className={`inline-flex px-3 py-2 text-sm font-medium rounded-full border ${getStatusColor(employee.status)}`}>
                              {employee.status || 'terminated'}
                            </span>
                          </td>
                          <td className="px-6 py-6 whitespace-nowrap">
                            {(canViewEmployee() || canEditEmployee()) ? (
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
                                    onClick={() => handleUnarchive(employee.id, employee.full_name || employee.name)}
                                    className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-all duration-200"
                                    title="Unarchive Employee"
                                    disabled={unarchiveEmployeeMutation.isLoading}
                                  >
                                    <RotateCcw className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            ) : (
                              <span className="text-sm text-gray-400">No actions available</span>
                            )}
                          </td>
                        </motion.tr>
                      ))
                    )}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-8 py-8 border-t border-slate-200 bg-gradient-to-r from-slate-50 to-gray-50">
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
                                ? 'bg-gradient-to-r from-gray-600 to-gray-700 text-white shadow-lg transform scale-105'
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
      </div>
    </div>
  );
}
