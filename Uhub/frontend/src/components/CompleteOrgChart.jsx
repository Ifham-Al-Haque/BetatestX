import React, { useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, Building2, User, ChevronDown, ChevronRight, 
  Mail, Phone, MapPin, Calendar, Award, Crown, 
  TrendingUp, UserCheck, Shield, Star, Zap, Search,
  Filter, Eye, EyeOff, Grid, List, ArrowUpDown
} from 'lucide-react';

const CompleteOrgChart = ({ employees = [], loading = false, onEmployeeClick }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name'); // 'name', 'department', 'level', 'manager'
  const [viewMode, setViewMode] = useState('hierarchy'); // 'hierarchy', 'flat', 'byDepartment'
  const [expandedManagers, setExpandedManagers] = useState(new Set());
  const [selectedDepartment, setSelectedDepartment] = useState('all');

  // Build comprehensive organizational data
  const orgData = useMemo(() => {
    if (!employees || employees.length === 0) return { 
      allEmployees: [], 
      managers: [], 
      departments: {}, 
      hierarchy: [],
      flatList: []
    };

    // Create employee map with enhanced data
    const employeeMap = new Map();
    const managers = new Set();
    const departments = {};
    const hierarchy = [];
    const flatList = [];

    // First pass: Create employee objects and identify managers
    employees.forEach(emp => {
      const employeeData = {
        ...emp,
        directReports: [],
        level: 0,
        isManager: false,
        totalReports: 0,
        managerName: null
      };
      
      employeeMap.set(emp.id, employeeData);
      flatList.push(employeeData);
    });

    // Second pass: Build relationships and identify managers
    employees.forEach(emp => {
      if (emp.reporting_manager_id) {
        const manager = employeeMap.get(emp.reporting_manager_id);
        if (manager) {
          manager.directReports.push(emp);
          manager.isManager = true;
          managers.add(manager);
          employeeMap.get(emp.id).managerName = manager.full_name;
        }
      }
    });

    // Third pass: Calculate levels and build hierarchy
    const calculateLevels = (employee, level = 0) => {
      employee.level = level;
      if (employee.directReports) {
        employee.directReports.forEach(report => {
          calculateLevels(report, level + 1);
        });
      }
    };

    // Calculate levels for all employees
    employees.forEach(emp => {
      if (!emp.reporting_manager_id) {
        calculateLevels(employeeMap.get(emp.id));
        hierarchy.push(employeeMap.get(emp.id));
      }
    });

    // Group by departments
    employees.forEach(emp => {
      const dept = emp.department || 'Unassigned';
      if (!departments[dept]) {
        departments[dept] = [];
      }
      departments[dept].push(employeeMap.get(emp.id));
    });

    return {
      allEmployees: Array.from(employeeMap.values()),
      managers: Array.from(managers),
      departments,
      hierarchy,
      flatList,
      totalEmployees: employees.length,
      totalManagers: managers.size
    };
  }, [employees]);

  // Filter and sort employees
  const filteredEmployees = useMemo(() => {
    let filtered = orgData.allEmployees;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(emp => 
        emp.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.position?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.managerName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply department filter
    if (selectedDepartment !== 'all') {
      filtered = filtered.filter(emp => emp.department === selectedDepartment);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return (a.full_name || '').localeCompare(b.full_name || '');
        case 'department':
          return (a.department || '').localeCompare(b.department || '');
        case 'level':
          return a.level - b.level;
        case 'manager':
          return (a.managerName || '').localeCompare(b.managerName || '');
        default:
          return 0;
      }
    });

    return filtered;
  }, [orgData.allEmployees, searchTerm, selectedDepartment, sortBy]);

  // Toggle manager expansion
  const toggleManager = (managerId) => {
    setExpandedManagers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(managerId)) {
        newSet.delete(managerId);
      } else {
        newSet.add(managerId);
      }
      return newSet;
    });
  };

  // Get department color
  const getDepartmentColor = (department) => {
    const colors = {
      'IT': 'from-blue-500 to-blue-600',
      'HR': 'from-green-500 to-green-600', 
      'Finance': 'from-purple-500 to-purple-600',
      'Operations': 'from-orange-500 to-orange-600',
      'Sales': 'from-pink-500 to-pink-600',
      'Marketing': 'from-indigo-500 to-indigo-600',
      'Management': 'from-red-500 to-red-600',
      'Unassigned': 'from-gray-500 to-gray-600'
    };
    return colors[department] || 'from-gray-500 to-gray-600';
  };

  // Get position icon
  const getPositionIcon = (position) => {
    const pos = position?.toLowerCase() || '';
    if (pos.includes('ceo') || pos.includes('chief')) return Crown;
    if (pos.includes('manager') || pos.includes('director')) return Shield;
    if (pos.includes('developer') || pos.includes('engineer')) return Zap;
    if (pos.includes('hr') || pos.includes('human')) return UserCheck;
    if (pos.includes('finance') || pos.includes('account')) return TrendingUp;
    return User;
  };

  // Employee Card Component
  const EmployeeCard = ({ employee, showManager = true, isManager = false }) => {
    const PositionIcon = getPositionIcon(employee.position);
    const isExpanded = expandedManagers.has(employee.id);
    const hasReports = employee.directReports && employee.directReports.length > 0;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ scale: 1.02, y: -2 }}
        className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-200 cursor-pointer group"
        onClick={() => onEmployeeClick?.(employee)}
      >
        {/* Employee Header */}
        <div className="flex items-center gap-3 mb-3">
          <div className="relative">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900 dark:to-indigo-900 flex items-center justify-center overflow-hidden">
              {employee.profile_picture || employee.photo_url ? (
                <img
                  src={employee.profile_picture || employee.photo_url}
                  alt={employee.full_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              )}
            </div>
            {isManager && (
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-500 rounded-full flex items-center justify-center">
                <Crown className="w-2 h-2 text-white" />
              </div>
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <PositionIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <h4 className="font-bold text-gray-900 dark:text-white truncate">
                {employee.full_name}
              </h4>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
              {employee.position || 'Position'}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              ID: {employee.employee_id}
            </p>
          </div>
        </div>

        {/* Department Badge */}
        <div className="flex items-center gap-2 mb-3">
          <Building2 className="w-4 h-4 text-gray-500" />
          <span className={`text-xs px-2 py-1 rounded-full font-medium bg-gradient-to-r ${getDepartmentColor(employee.department)} text-white`}>
            {employee.department || 'Unassigned'}
          </span>
        </div>

        {/* Manager Information */}
        {showManager && employee.managerName && (
          <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 mb-3">
            <Shield className="w-3 h-3" />
            <span>Reports to: <span className="font-medium">{employee.managerName}</span></span>
          </div>
        )}

        {/* Contact Info */}
        <div className="space-y-1 mb-3">
          {employee.email && (
            <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
              <Mail className="w-3 h-3" />
              <span className="truncate">{employee.email}</span>
            </div>
          )}
          {employee.phone && (
            <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
              <Phone className="w-3 h-3" />
              <span>{employee.phone}</span>
            </div>
          )}
        </div>

        {/* Direct Reports */}
        {hasReports && (
          <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-600">
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <Users className="w-4 h-4" />
              <span className="font-medium">{employee.directReports.length} direct report{employee.directReports.length !== 1 ? 's' : ''}</span>
            </div>
            
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={(e) => {
                e.stopPropagation();
                toggleManager(employee.id);
              }}
              className="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors rounded"
            >
              <motion.div
                animate={{ rotate: isExpanded ? 180 : 0 }}
                transition={{ duration: 0.3 }}
              >
                <ChevronDown className="w-4 h-4" />
              </motion.div>
            </motion.button>
          </div>
        )}

        {/* Direct Reports List */}
        <AnimatePresence>
          {hasReports && isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="mt-3 space-y-2"
            >
              {employee.directReports.map((report) => (
                <div key={report.id} className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-600 dark:to-gray-500 flex items-center justify-center">
                    <User className="w-3 h-3 text-gray-600 dark:text-gray-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {report.full_name}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {report.position}
                    </div>
                  </div>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900 dark:to-indigo-900 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Users className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Loading Organizational Chart
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Building the complete employee structure...
          </p>
        </div>
      </div>
    );
  }

  if (!employees || employees.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <Users className="w-10 h-10 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          No Employees Found
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          No active employees found in the system.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-blue-500 rounded-2xl flex items-center justify-center shadow-lg">
            <Users className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Complete Organizational Chart
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              All {orgData.totalEmployees} employees with {orgData.totalManagers} managers
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span>Live Updates</span>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search employees by name, position, department, or manager..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          {/* Department Filter */}
          <select
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          >
            <option value="all">All Departments</option>
            {Object.keys(orgData.departments).map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          >
            <option value="name">Sort by Name</option>
            <option value="department">Sort by Department</option>
            <option value="level">Sort by Level</option>
            <option value="manager">Sort by Manager</option>
          </select>

          {/* View Mode */}
          <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => setViewMode('hierarchy')}
              className={`p-2 rounded-md transition-all ${
                viewMode === 'hierarchy' 
                  ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm' 
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
              title="Hierarchy View"
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('flat')}
              className={`p-2 rounded-md transition-all ${
                viewMode === 'flat' 
                  ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm' 
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
              title="Flat List View"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('byDepartment')}
              className={`p-2 rounded-md transition-all ${
                viewMode === 'byDepartment' 
                  ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm' 
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
              title="Department View"
            >
              <Building2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
        {viewMode === 'hierarchy' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Organizational Hierarchy
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {orgData.hierarchy.map((employee) => (
                <EmployeeCard key={employee.id} employee={employee} isManager={true} />
              ))}
            </div>
          </div>
        )}

        {viewMode === 'flat' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              All Employees ({filteredEmployees.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredEmployees.map((employee) => (
                <EmployeeCard key={employee.id} employee={employee} />
              ))}
            </div>
          </div>
        )}

        {viewMode === 'byDepartment' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Employees by Department
            </h3>
            {Object.entries(orgData.departments).map(([department, deptEmployees]) => (
              <div key={department} className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg bg-gradient-to-r ${getDepartmentColor(department)} flex items-center justify-center`}>
                    <Building2 className="w-4 h-4 text-white" />
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {department} ({deptEmployees.length} employees)
                  </h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {deptEmployees.map((employee) => (
                    <EmployeeCard key={employee.id} employee={employee} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CompleteOrgChart;
