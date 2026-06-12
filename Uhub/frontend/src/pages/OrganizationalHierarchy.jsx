import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, Building, UserCheck, TrendingUp, Search, Filter, 
  Download, RefreshCw, Eye, EyeOff, Grid, List, 
  ChevronDown, ChevronRight, User, Mail, Phone, MapPin,
  Calendar, Award, Target, BarChart3, PieChart, Crown,
  Shield, Star, Zap, Globe, Briefcase, Clock, UserPlus,
  Settings, MoreVertical, ExternalLink, Copy, Share2, X, Network
} from 'lucide-react';
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line, Area, AreaChart } from 'recharts';
import OrgChartPro from '../components/OrgChartPro';
import { useEmployees } from '../hooks/useEmployees';
import LoadingSpinner from '../components/LoadingSpinner';

const OrganizationalHierarchy = () => {
  const navigate = useNavigate();
  const { data: employees, isLoading: employeesLoading, isFetching: employeesFetching, refetch } = useEmployees();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [viewMode, setViewMode] = useState('chart'); // 'chart' | 'list' | 'analytics'
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);

  // Professional color schemes
  const departmentColors = {
    'IT': { bg: 'from-blue-500 to-blue-600', text: 'text-blue-600', light: 'bg-blue-50 dark:bg-blue-900/20' },
    'HR': { bg: 'from-green-500 to-green-600', text: 'text-green-600', light: 'bg-green-50 dark:bg-green-900/20' },
    'Finance': { bg: 'from-purple-500 to-purple-600', text: 'text-purple-600', light: 'bg-purple-50 dark:bg-purple-900/20' },
    'Operations': { bg: 'from-orange-500 to-orange-600', text: 'text-orange-600', light: 'bg-orange-50 dark:bg-orange-900/20' },
    'Sales': { bg: 'from-pink-500 to-pink-600', text: 'text-pink-600', light: 'bg-pink-50 dark:bg-pink-900/20' },
    'Marketing': { bg: 'from-indigo-500 to-indigo-600', text: 'text-indigo-600', light: 'bg-indigo-50 dark:bg-indigo-900/20' },
    'Management': { bg: 'from-red-500 to-red-600', text: 'text-red-600', light: 'bg-red-50 dark:bg-red-900/20' },
    'Unassigned': { bg: 'from-gray-500 to-gray-600', text: 'text-gray-600', light: 'bg-gray-50 dark:bg-gray-900/20' }
  };

  // Enhanced analytics calculations
  const analytics = useMemo(() => {
    if (!employees) return null;

    const departments = {};
    const positions = {};
    const locations = {};
    const hireDates = {};

    employees.forEach(emp => {
      // Department analysis
      const dept = emp.department || 'Unassigned';
      departments[dept] = (departments[dept] || 0) + 1;

      // Position analysis
      const pos = emp.position || 'Unassigned';
      positions[pos] = (positions[pos] || 0) + 1;

      // Location analysis
      const loc = emp.location || 'Unassigned';
      locations[loc] = (locations[loc] || 0) + 1;

      // Hire date analysis (by year)
      if (emp.hire_date) {
        const year = new Date(emp.hire_date).getFullYear();
        hireDates[year] = (hireDates[year] || 0) + 1;
      }
    });

    // Calculate additional professional metrics
    const totalEmployees = employees.length;
    const avgEmployeesPerDept = totalEmployees / Object.keys(departments).length;
    const managerIds = new Set();
    employees.forEach((emp) => {
      if (emp.reporting_manager_id) managerIds.add(String(emp.reporting_manager_id));
    });

    return {
      departments: Object.entries(departments).map(([name, value]) => ({ 
        name, 
        value, 
        percentage: ((value / totalEmployees) * 100).toFixed(1),
        color: departmentColors[name]?.bg || 'from-gray-500 to-gray-600'
      })),
      positions: Object.entries(positions).map(([name, value]) => ({ name, value })),
      locations: Object.entries(locations).map(([name, value]) => ({ name, value })),
      hireDates: Object.entries(hireDates).map(([name, value]) => ({ name, value: parseInt(value) })),
      metrics: {
        totalEmployees,
        avgEmployeesPerDept: avgEmployeesPerDept.toFixed(1),
        managers: managerIds.size,
        departmentCount: Object.keys(departments).length,
        locationCount: Object.keys(locations).length
      }
    };
  }, [employees]);

  // Filter employees based on search and department
  const filteredEmployees = useMemo(() => {
    if (!employees) return [];
    
    return employees.filter(emp => {
      const matchesSearch = !searchTerm || 
        emp.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.position?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.department?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesDepartment = selectedDepartment === 'all' || 
        emp.department === selectedDepartment;
      
      return matchesSearch && matchesDepartment;
    });
  }, [employees, searchTerm, selectedDepartment]);

  // Get unique departments for filter
  const departments = useMemo(() => {
    if (!employees) return [];
    return [...new Set(employees.map(emp => emp.department).filter(Boolean))];
  }, [employees]);

  const openEmployee = (employee) => {
    setSelectedEmployee(employee);
    setShowEmployeeModal(true);
  };

  if (employeesLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <LoadingSpinner size="xl" text="Loading organizational structure..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Professional Header Section */}
        <div className="relative mb-8">
          {/* Background Pattern */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 via-purple-600/5 to-indigo-600/5 rounded-3xl"></div>
          <div className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl p-8 border border-gray-200/50 dark:border-gray-700/50 shadow-xl">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="flex items-start gap-6">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <Crown className="w-8 h-8 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                      Organizational Hierarchy
                    </h1>
                    <div className="px-3 py-1 bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-full">
                      <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">{employees?.length || 0} active</span>
                    </div>
                  </div>
                  <p className="text-lg text-gray-600 dark:text-gray-400 mb-4">
                    Comprehensive organizational structure and team relationship analysis for Udrive Company
                  </p>
                  <div className="flex items-center gap-6 text-sm">
                    <div className="flex items-center gap-2">
                      <Network className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-600 dark:text-gray-400">Drag &amp; drop editing</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-600 dark:text-gray-400">Secure Access</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-600 dark:text-gray-400">Company-wide view</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-1">
                    <Users className="w-4 h-4" />
                    <span className="font-semibold">{filteredEmployees.length}</span>
                    <span>of</span>
                    <span className="font-semibold">{employees?.length || 0}</span>
                    <span>Employees</span>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-500">
                    {analytics?.metrics.departmentCount} Departments • {analytics?.metrics.locationCount} Locations
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => refetch()}
                    disabled={employeesFetching}
                    title="Refresh data"
                    className="p-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-all duration-200 disabled:opacity-50"
                  >
                    <RefreshCw className={`w-5 h-5 ${employeesFetching ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Professional Search and Filter Bar */}
        <div className="relative mb-8">
          <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 p-6">
            <div className="flex flex-col lg:flex-row gap-6">
              <div className="flex-1 relative">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search employees by name, position, or department..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-12 py-4 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-all duration-200 text-lg"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <select
                    value={selectedDepartment}
                    onChange={(e) => setSelectedDepartment(e.target.value)}
                    className="pl-10 pr-8 py-4 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-all duration-200 min-w-[180px] appearance-none bg-white dark:bg-gray-700"
                  >
                    <option value="all">All Departments</option>
                    {departments.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                </div>
                
                {/* Professional View Mode Toggle */}
                <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 rounded-xl p-1 shadow-inner">
                  <button
                    onClick={() => setViewMode('chart')}
                    className={`p-3 rounded-lg transition-all duration-200 ${
                      viewMode === 'chart' 
                        ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-lg transform scale-105' 
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-white/50'
                    }`}
                    title="Organizational Chart"
                  >
                    <BarChart3 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setViewMode('analytics')}
                    className={`p-3 rounded-lg transition-all duration-200 ${
                      viewMode === 'analytics' 
                        ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-lg transform scale-105' 
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-white/50'
                    }`}
                    title="Analytics Dashboard"
                  >
                    <PieChart className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-3 rounded-lg transition-all duration-200 ${
                      viewMode === 'list' 
                        ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-lg transform scale-105' 
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-white/50'
                    }`}
                    title="Employee Directory"
                  >
                    <List className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Professional Stats Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="group relative bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 p-6 hover:shadow-2xl transition-all duration-300 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Users className="w-7 h-7 text-white" />
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 justify-end">
                    <UserCheck className="w-4 h-4 text-green-500" />
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">Active</span>
                </div>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">Total Employees</p>
                <p className="text-4xl font-bold text-gray-900 dark:text-white mb-2">{employees?.length || 0}</p>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-gray-500 dark:text-gray-400">{filteredEmployees.length} filtered</span>
                  <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                  <span className="text-gray-500 dark:text-gray-400">{analytics?.metrics.avgEmployeesPerDept} avg/dept</span>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="group relative bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 p-6 hover:shadow-2xl transition-all duration-300 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Building className="w-7 h-7 text-white" />
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 justify-end">
                    <Building className="w-4 h-4 text-green-500" />
                    <span className="text-xs text-green-600 dark:text-green-400 font-semibold">{analytics?.metrics.avgEmployeesPerDept}</span>
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">avg / dept</span>
                </div>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">Departments</p>
                <p className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                  {analytics?.metrics.departmentCount || 0}
                </p>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Active divisions</span>
                  <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                  <span className="text-gray-500 dark:text-gray-400">Global coverage</span>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="group relative bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 p-6 hover:shadow-2xl transition-all duration-300 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-violet-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Crown className="w-7 h-7 text-white" />
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 justify-end">
                    <Award className="w-4 h-4 text-purple-500" />
                    <span className="text-xs text-purple-600 dark:text-purple-400 font-semibold">
                      {new Set(employees?.map((emp) => emp.position).filter(Boolean)).size || 0}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">job titles</span>
                </div>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">Managers</p>
                <p className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                  {analytics?.metrics.managers || 0}
                </p>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Employees with direct reports</span>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="group relative bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 p-6 hover:shadow-2xl transition-all duration-300 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-amber-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <MapPin className="w-7 h-7 text-white" />
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1">
                    <Globe className="w-4 h-4 text-orange-500" />
                    <span className="text-xs text-orange-600 dark:text-orange-400 font-semibold">Global</span>
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">Presence</span>
                </div>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">Locations</p>
                <p className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                  {analytics?.metrics.locationCount || 0}
                </p>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Office locations</span>
                  <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                  <span className="text-gray-500 dark:text-gray-400">Remote friendly</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Dynamic Content Based on View Mode */}
        <AnimatePresence mode="wait">
          {viewMode === 'analytics' && analytics && (
            <motion.div
              key="analytics"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8"
            >
              {/* Department Distribution */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Department Distribution</h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={analytics.departments}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {analytics.departments.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={`hsl(${index * 45}, 70%, 50%)`} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Position Distribution */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Position Distribution</h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics.positions.slice(0, 8)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </motion.div>
          )}

          {viewMode === 'list' && (
            <motion.div
              key="list"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6 mb-8"
            >
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Employee Directory</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredEmployees.map((employee) => (
                  <motion.button
                    key={employee.id}
                    type="button"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    onClick={() => openEmployee(employee)}
                    className="w-full text-left bg-gray-50 dark:bg-gray-700 rounded-xl p-4 border-2 border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-md transition-all duration-200"
                  >
                    <div className="flex items-center gap-3 mb-3">
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
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-900 dark:text-white truncate">
                          {employee.full_name}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                          {employee.position || 'Position'}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Building className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-700 dark:text-gray-300">{employee.department || 'Unassigned'}</span>
                      </div>
                      {employee.email && (
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="w-4 h-4 text-gray-500" />
                          <span className="text-gray-700 dark:text-gray-300 truncate">{employee.email}</span>
                        </div>
                      )}
                      {employee.phone && (
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="w-4 h-4 text-gray-500" />
                          <span className="text-gray-700 dark:text-gray-300">{employee.phone}</span>
                        </div>
                      )}
                      {employee.reporting_manager?.full_name && (
                        <div className="flex items-center gap-2 text-sm">
                          <Shield className="w-4 h-4 text-gray-500" />
                          <span className="text-gray-700 dark:text-gray-300 truncate">
                            Reports to {employee.reporting_manager.full_name}
                          </span>
                        </div>
                      )}
                    </div>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {viewMode === 'chart' && (
            <motion.div
              key="chart"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6 sm:p-8"
            >
              <OrgChartPro
                employees={employees || []}
                loading={employeesLoading}
                externalSearch={searchTerm}
                onEmployeeClick={openEmployee}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Employee Detail Modal */}
      <AnimatePresence>
        {showEmployeeModal && selectedEmployee && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowEmployeeModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="relative w-full max-w-md bg-white dark:bg-gray-800 rounded-3xl shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="h-24 bg-gradient-to-r from-blue-600 to-indigo-600" />
              <button
                onClick={() => setShowEmployeeModal(false)}
                className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 rounded-xl text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="px-6 pb-6 -mt-12">
                <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900 dark:to-indigo-900 flex items-center justify-center overflow-hidden ring-4 ring-white dark:ring-gray-800 shadow-lg mb-4">
                  {selectedEmployee.profile_picture || selectedEmployee.photo_url ? (
                    <img
                      src={selectedEmployee.profile_picture || selectedEmployee.photo_url}
                      alt={selectedEmployee.full_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-12 h-12 text-blue-600 dark:text-blue-400" />
                  )}
                </div>

                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{selectedEmployee.full_name}</h3>
                <p className="text-gray-600 dark:text-gray-400">{selectedEmployee.position || 'No position'}</p>

                <div className="mt-5 space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <Building className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <span className="text-gray-700 dark:text-gray-300">{selectedEmployee.department || 'Unassigned'}</span>
                  </div>
                  {selectedEmployee.employee_id && (
                    <div className="flex items-center gap-3 text-sm">
                      <Award className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <span className="text-gray-700 dark:text-gray-300">ID: {selectedEmployee.employee_id}</span>
                    </div>
                  )}
                  {selectedEmployee.email && (
                    <div className="flex items-center gap-3 text-sm">
                      <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <a href={`mailto:${selectedEmployee.email}`} className="text-blue-600 dark:text-blue-400 hover:underline truncate">
                        {selectedEmployee.email}
                      </a>
                    </div>
                  )}
                  {selectedEmployee.phone && (
                    <div className="flex items-center gap-3 text-sm">
                      <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <span className="text-gray-700 dark:text-gray-300">{selectedEmployee.phone}</span>
                    </div>
                  )}
                  {selectedEmployee.location && (
                    <div className="flex items-center gap-3 text-sm">
                      <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <span className="text-gray-700 dark:text-gray-300">{selectedEmployee.location}</span>
                    </div>
                  )}
                  {selectedEmployee.reporting_manager?.full_name && (
                    <div className="flex items-center gap-3 text-sm pt-3 border-t border-gray-100 dark:border-gray-700">
                      <Shield className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <span className="text-gray-700 dark:text-gray-300">
                        Reports to <span className="font-semibold">{selectedEmployee.reporting_manager.full_name}</span>
                      </span>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setShowEmployeeModal(false);
                    navigate(`/employee/${selectedEmployee.id}`);
                  }}
                  className="mt-6 w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold text-sm hover:from-blue-700 hover:to-indigo-700 transition-colors"
                >
                  View full employee profile
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default OrganizationalHierarchy;
