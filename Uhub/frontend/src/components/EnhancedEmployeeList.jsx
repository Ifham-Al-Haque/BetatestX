import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Filter, Download, Upload, MoreVertical, 
  ChevronDown, ChevronRight, Edit, Trash, Eye,
  Plus, Save, X, CheckSquare, Square, Users,
  BarChart3, PieChart, TrendingUp, Activity,
  Calendar, MapPin, Star, Award, Clock, Briefcase,
  Mail, AlertTriangle
} from 'lucide-react';
import { enhancedEmployeeApi, exportToCSV } from '../services/enhancedEmployeeApi';
import { useToast } from '../context/ToastContext';

export default function EnhancedEmployeeList({ onEdit, onView, onDelete, onAdd }) {
  const { success, error: showError } = useToast();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);
  const [totalCount, setTotalCount] = useState(0);
  
  // Search and Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    department: '',
    status: '',
    experience_level: '',
    location: '',
    performance_rating_min: '',
    performance_rating_max: '',
    salary_min: '',
    salary_max: '',
    hire_date_from: '',
    hire_date_to: '',
    data_completeness_min: ''
  });
  
  // Advanced Features
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [savedSearches, setSavedSearches] = useState([]);
  const [showSavedSearches, setShowSavedSearches] = useState(false);
  const [bulkAction, setBulkAction] = useState('');
  const [showBulkActions, setShowBulkActions] = useState(false);

  // Load employees
  useEffect(() => {
    loadEmployees();
  }, [currentPage, searchTerm, filters]);

  const loadEmployees = async () => {
    try {
      setLoading(true);
      const result = await enhancedEmployeeApi.employees.getAll(
        currentPage, 
        pageSize, 
        searchTerm, 
        filters
      );
      setEmployees(result.data || []);
      setTotalCount(result.count || 0);
    } catch (err) {
      showError('Error', 'Failed to load employees');
    } finally {
      setLoading(false);
    }
  };

  // Search and Filter Handlers
  const handleSearch = useCallback((value) => {
    setSearchTerm(value);
    setCurrentPage(1);
  }, []);

  const handleFilterChange = useCallback((key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({
      department: '',
      status: '',
      experience_level: '',
      location: '',
      performance_rating_min: '',
      performance_rating_max: '',
      salary_min: '',
      salary_max: '',
      hire_date_from: '',
      hire_date_to: '',
      data_completeness_min: ''
    });
    setSearchTerm('');
    setCurrentPage(1);
  }, []);

  // Saved Searches
  const saveCurrentSearch = useCallback(async () => {
    const searchName = prompt('Enter a name for this search:');
    if (!searchName) return;

    try {
      const searchCriteria = { searchTerm, filters };
      await enhancedEmployeeApi.savedSearches.save({
        search_name: searchName,
        search_criteria: searchCriteria,
        user_id: 'current-user-id' // Replace with actual user ID
      });
      success('Success', 'Search saved successfully');
      loadSavedSearches();
    } catch (err) {
      showError('Error', 'Failed to save search');
    }
  }, [searchTerm, filters]);

  const loadSavedSearches = useCallback(async () => {
    try {
      const searches = await enhancedEmployeeApi.savedSearches.getByUser('current-user-id');
      setSavedSearches(searches || []);
    } catch (err) {
      console.error('Failed to load saved searches:', err);
    }
  }, []);

  const applySavedSearch = useCallback((searchCriteria) => {
    setSearchTerm(searchCriteria.searchTerm || '');
    setFilters(searchCriteria.filters || {});
    setCurrentPage(1);
    setShowSavedSearches(false);
  }, []);

  // Bulk Operations
  const handleSelectEmployee = useCallback((employeeId, checked) => {
    if (checked) {
      setSelectedEmployees(prev => [...prev, employeeId]);
    } else {
      setSelectedEmployees(prev => prev.filter(id => id !== employeeId));
    }
  }, []);

  const handleSelectAll = useCallback((checked) => {
    if (checked) {
      setSelectedEmployees(employees.map(emp => emp.id));
    } else {
      setSelectedEmployees([]);
    }
  }, [employees]);

  const executeBulkAction = useCallback(async () => {
    if (!bulkAction || selectedEmployees.length === 0) return;

    try {
      let updateData = {};
      
      switch (bulkAction) {
        case 'activate':
          updateData = { status: 'active' };
          break;
        case 'deactivate':
          updateData = { status: 'inactive' };
          break;
        case 'change_department':
          const newDepartment = prompt('Enter new department:');
          if (!newDepartment) return;
          updateData = { department: newDepartment };
          break;
        case 'change_status':
          const newStatus = prompt('Enter new status (active/inactive/pending):');
          if (!newStatus) return;
          updateData = { status: newStatus };
          break;
        default:
          return;
      }

      await enhancedEmployeeApi.employees.bulkUpdate(selectedEmployees, updateData);
      success('Success', `Bulk action completed for ${selectedEmployees.length} employees`);
      setSelectedEmployees([]);
      setBulkAction('');
      setShowBulkActions(false);
      loadEmployees();
    } catch (err) {
      showError('Error', 'Failed to execute bulk action');
    }
  }, [bulkAction, selectedEmployees]);

  // Export Functionality
  const handleExport = useCallback(async () => {
    try {
      const data = await enhancedEmployeeApi.employees.exportData(filters);
      exportToCSV(data, `employees_${new Date().toISOString().split('T')[0]}`);
      success('Success', 'Data exported successfully');
    } catch (err) {
      showError('Error', 'Failed to export data');
    }
  }, [filters]);

  // Pagination
  const totalPages = Math.ceil(totalCount / pageSize);
  const handlePageChange = useCallback((page) => {
    setCurrentPage(page);
  }, []);

  // Filter Options
  const departments = ['IT', 'HR', 'Finance', 'Marketing', 'Sales', 'Operations', 'Engineering', 'Design', 'Support'];
  const statuses = ['active', 'inactive', 'pending', 'terminated'];
  const experienceLevels = ['Entry Level', 'Junior', 'Mid-Level', 'Senior', 'Lead', 'Manager', 'Director', 'Executive'];

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading employees...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Enhanced Header with Stats */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-2xl p-8 text-white shadow-xl">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-4xl font-bold mb-2">Employee Records</h1>
            <p className="text-blue-100 text-lg">
              Manage and monitor your workforce with comprehensive analytics
            </p>
          </div>
          <div className="flex items-center gap-3">
            {selectedEmployees.length > 0 && (
              <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2">
                <span className="text-sm">
                  {selectedEmployees.length} selected
                </span>
                <button
                  onClick={() => setShowBulkActions(true)}
                  className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-all duration-200"
                >
                  <MoreVertical className="w-4 h-4" />
                  Bulk Actions
                </button>
              </div>
            )}
            <button
              onClick={onAdd}
              className="bg-white hover:bg-gray-100 text-blue-600 px-6 py-3 rounded-xl font-semibold flex items-center gap-2 shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <Plus className="w-5 h-5" />
              Add Employee
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-blue-100 text-sm">Total Employees</p>
                <p className="text-2xl font-bold">{totalCount}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <Star className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-blue-100 text-sm">High Performers</p>
                <p className="text-2xl font-bold">
                  {employees.filter(emp => (emp.performance_rating || 0) >= 4.5).length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <Briefcase className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-blue-100 text-sm">Departments</p>
                <p className="text-2xl font-bold">
                  {new Set(employees.map(emp => emp.department).filter(Boolean)).size}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-blue-100 text-sm">Active</p>
                <p className="text-2xl font-bold">
                  {employees.filter(emp => emp.status === 'active').length}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Search and Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-6">
          <div className="flex gap-4 items-center mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search employees by name, ID, department, skills..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-lg"
              />
            </div>
            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`px-6 py-3 border-2 rounded-xl font-medium flex items-center gap-2 transition-all duration-200 ${
                showAdvancedFilters 
                  ? 'border-blue-500 bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
                  : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-blue-400'
              }`}
            >
              <Filter className="w-5 h-5" />
              {showAdvancedFilters ? 'Hide' : 'Show'} Filters
            </button>
            <button
              onClick={saveCurrentSearch}
              className="px-6 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-300 hover:border-blue-400 hover:text-blue-600 transition-all duration-200 font-medium flex items-center gap-2"
            >
              <Save className="w-5 h-5" />
              Save Search
            </button>
            <button
              onClick={() => setShowSavedSearches(true)}
              className="px-6 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-300 hover:border-blue-400 hover:text-blue-600 transition-all duration-200 font-medium flex items-center gap-2"
            >
              <Users className="w-5 h-5" />
              Saved
            </button>
            <button
              onClick={handleExport}
              className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium flex items-center gap-2 shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <Download className="w-5 h-5" />
              Export
            </button>
          </div>

          {/* Enhanced Advanced Filters */}
          <AnimatePresence>
            {showAdvancedFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="border-t border-gray-200 dark:border-gray-700 pt-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Department</label>
                    <select
                      value={filters.department}
                      onChange={(e) => handleFilterChange('department', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    >
                      <option value="">All Departments</option>
                      {departments.map(dept => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Status</label>
                    <select
                      value={filters.status}
                      onChange={(e) => handleFilterChange('status', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    >
                      <option value="">All Statuses</option>
                      {statuses.map(status => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Experience Level</label>
                    <select
                      value={filters.experience_level}
                      onChange={(e) => handleFilterChange('experience_level', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    >
                      <option value="">All Experience Levels</option>
                      {experienceLevels.map(level => (
                        <option key={level} value={level}>{level}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Location</label>
                    <input
                      type="text"
                      placeholder="Enter location"
                      value={filters.location}
                      onChange={(e) => handleFilterChange('location', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Min Performance Rating</label>
                    <input
                      type="number"
                      placeholder="0.0"
                      min="0"
                      max="5"
                      step="0.1"
                      value={filters.performance_rating_min}
                      onChange={(e) => handleFilterChange('performance_rating_min', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Max Performance Rating</label>
                    <input
                      type="number"
                      placeholder="5.0"
                      min="0"
                      max="5"
                      step="0.1"
                      value={filters.performance_rating_max}
                      onChange={(e) => handleFilterChange('performance_rating_max', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Min Salary</label>
                    <input
                      type="number"
                      placeholder="Enter amount"
                      value={filters.salary_min}
                      onChange={(e) => handleFilterChange('salary_min', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Max Salary</label>
                    <input
                      type="number"
                      placeholder="Enter amount"
                      value={filters.salary_max}
                      onChange={(e) => handleFilterChange('salary_max', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Hire Date From</label>
                    <input
                      type="date"
                      value={filters.hire_date_from}
                      onChange={(e) => handleFilterChange('hire_date_from', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Hire Date To</label>
                    <input
                      type="date"
                      value={filters.hire_date_to}
                      onChange={(e) => handleFilterChange('hire_date_to', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Min Data Completeness %</label>
                    <input
                      type="number"
                      placeholder="0"
                      min="0"
                      max="100"
                      value={filters.data_completeness_min}
                      onChange={(e) => handleFilterChange('data_completeness_min', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>

                <div className="flex justify-end mt-6">
                  <button
                    onClick={clearFilters}
                    className="px-6 py-3 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 font-medium transition-colors duration-200"
                  >
                    Clear All Filters
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Enhanced Employee Table */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800">
              <tr>
                <th className="px-8 py-4 text-left">
                  <input
                    type="checkbox"
                    checked={selectedEmployees.length === employees.length && employees.length > 0}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-5 h-5"
                  />
                </th>
                <th className="px-8 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Employee
                </th>
                <th className="px-8 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Department
                </th>
                <th className="px-8 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Performance
                </th>
                <th className="px-8 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Data Quality
                </th>
                <th className="px-8 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-8 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              <AnimatePresence>
                {employees.map((employee, index) => (
                  <motion.tr
                    key={employee.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.2, delay: index * 0.05 }}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200"
                  >
                    <td className="px-8 py-6">
                      <input
                        type="checkbox"
                        checked={selectedEmployees.includes(employee.id)}
                        onChange={(e) => handleSelectEmployee(employee.id, e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-5 h-5"
                      />
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-12 w-12">
                          {employee.profile_picture ? (
                            <img
                              className="h-12 w-12 rounded-full object-cover ring-2 ring-gray-200 dark:ring-gray-600"
                              src={employee.profile_picture}
                              alt={employee.full_name}
                            />
                          ) : (
                            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center ring-2 ring-gray-200 dark:ring-gray-600">
                              <span className="text-lg font-bold text-white">
                                {employee.full_name?.charAt(0)?.toUpperCase() || '?'}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-lg font-semibold text-gray-900 dark:text-white">
                            {employee.full_name}
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
                    <td className="px-8 py-6 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                        <span className="text-lg font-medium text-gray-900 dark:text-white">
                          {employee.department || 'Unassigned'}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-6 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${
                                i < Math.floor(employee.performance_rating || 0)
                                  ? 'text-yellow-400 fill-current'
                                  : 'text-gray-300 dark:text-gray-600'
                              }`}
                            />
                          ))}
                        </div>
                        <span className={`text-lg font-semibold ${
                          (employee.performance_rating || 0) >= 4.5 ? 'text-green-600' :
                          (employee.performance_rating || 0) >= 3.5 ? 'text-blue-600' :
                          (employee.performance_rating || 0) >= 2.5 ? 'text-yellow-600' :
                          'text-red-600'
                        }`}>
                          {employee.performance_rating || 'N/A'}/5
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-6 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                          <div
                            className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-500 shadow-sm"
                            style={{ width: `${employee.data_completeness_score || 0}%` }}
                          ></div>
                        </div>
                        <span className="text-lg font-semibold text-gray-900 dark:text-white min-w-[3rem]">
                          {employee.data_completeness_score || 0}%
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-6 whitespace-nowrap">
                      <span className={`inline-flex px-4 py-2 text-sm font-semibold rounded-full border-2 ${
                        employee.status === 'active' 
                          ? 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-700'
                          : employee.status === 'inactive'
                          ? 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-700'
                          : employee.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-700'
                          : 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600'
                      }`}>
                        {employee.status || 'Unknown'}
                      </span>
                    </td>
                    <td className="px-8 py-6 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => onView(employee.id)}
                          className="p-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all duration-200"
                          title="View Profile"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => onEdit(employee.id)}
                          className="p-2 text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-all duration-200"
                          title="Edit Employee"
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => onDelete(employee.id)}
                          className="p-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all duration-200"
                          title="Delete Employee"
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

        {/* Enhanced Pagination */}
        {totalPages > 1 && (
          <div className="px-8 py-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700 dark:text-gray-300">
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
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
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
                ))}
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

      {/* Enhanced Bulk Actions Modal */}
      <AnimatePresence>
        {showBulkActions && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white dark:bg-gray-800 rounded-2xl p-8 w-full max-w-md shadow-2xl"
            >
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Bulk Actions</h3>
              <div className="space-y-6">
                <select
                  value={bulkAction}
                  onChange={(e) => setBulkAction(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-lg"
                >
                  <option value="">Select Action</option>
                  <option value="activate">Activate Employees</option>
                  <option value="deactivate">Deactivate Employees</option>
                  <option value="change_department">Change Department</option>
                  <option value="change_status">Change Status</option>
                </select>
                
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
                    <AlertTriangle className="w-5 h-5" />
                    <span className="font-medium">Warning</span>
                  </div>
                  <p className="text-sm text-blue-700 dark:text-blue-300 mt-2">
                    This action will affect <span className="font-bold">{selectedEmployees.length}</span> selected employees.
                  </p>
                </div>
              </div>
              
              <div className="flex gap-3 mt-8">
                <button
                  onClick={() => setShowBulkActions(false)}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-300 hover:border-blue-400 hover:text-blue-600 transition-all duration-200 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={executeBulkAction}
                  disabled={!bulkAction}
                  className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  Execute Action
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Enhanced Saved Searches Modal */}
      <AnimatePresence>
        {showSavedSearches && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white dark:bg-gray-800 rounded-2xl p-8 w-full max-w-md shadow-2xl"
            >
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Saved Searches</h3>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {savedSearches.map((search) => (
                  <div
                    key={search.id}
                    className="p-4 border border-gray-200 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-all duration-200"
                    onClick={() => applySavedSearch(search.search_criteria)}
                  >
                    <div className="font-semibold text-gray-900 dark:text-white">
                      {search.search_name}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {new Date(search.created_at).toLocaleDateString()}
                    </div>
                  </div>
                ))}
                {savedSearches.length === 0 && (
                  <div className="text-center py-8">
                    <Users className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                    <p className="text-gray-500 dark:text-gray-400 text-lg">No saved searches yet</p>
                    <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                      Save your search criteria for quick access
                    </p>
                  </div>
                )}
              </div>
              
              <button
                onClick={() => setShowSavedSearches(false)}
                className="w-full mt-6 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Close
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
