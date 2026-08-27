import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Building, Search, Filter, RefreshCw, List,
  ChevronDown, User, Mail, MapPin, PieChart, Crown,
  Shield, Network, X, GitBranch, BarChart3, TrendingUp,
} from 'lucide-react';
import {
  PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts';
import OrgChartPro from '../components/OrgChartPro';
import { useEmployees } from '../hooks/useEmployees';
import { useAuth } from '../context/AuthContext';
import { resolveEmployeePlacement } from '../config/departmentHierarchy';
import LoadingSpinner from '../components/LoadingSpinner';
import { useDepartmentCatalog } from '../hooks/useDepartmentCatalog';

const ORG_EDIT_ROLES = new Set(['admin', 'hr_manager']);

const OrganizationalHierarchy = () => {
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const canEditHierarchy = ORG_EDIT_ROLES.has(userProfile?.role);

  const { data: employees, isLoading: employeesLoading, isFetching: employeesFetching, refetch } = useEmployees();
  const { data: catalog } = useDepartmentCatalog();
  const hierarchy = catalog?.hierarchy;
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [viewMode, setViewMode] = useState('chart');
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);

  const analytics = useMemo(() => {
    if (!employees) return null;

    const departments = {};
    const positions = {};
    const locations = {};
    const hireDates = {};
    const managerIds = new Set();

    employees.forEach((emp) => {
      const dept = emp.department || 'Unassigned';
      departments[dept] = (departments[dept] || 0) + 1;
      const pos = emp.position || 'Unassigned';
      positions[pos] = (positions[pos] || 0) + 1;
      const loc = emp.location || 'Unassigned';
      locations[loc] = (locations[loc] || 0) + 1;
      if (emp.hire_date) {
        const year = new Date(emp.hire_date).getFullYear();
        hireDates[year] = (hireDates[year] || 0) + 1;
      }
      if (emp.reporting_manager_id) managerIds.add(String(emp.reporting_manager_id));
    });

    const totalEmployees = employees.length;
    return {
      departments: Object.entries(departments).map(([name, value]) => ({ name, value })),
      positions: Object.entries(positions).map(([name, value]) => ({ name, value })),
      locations: Object.entries(locations).map(([name, value]) => ({ name, value })),
      hireDates: Object.entries(hireDates)
        .map(([name, value]) => ({ name, value: parseInt(value, 10) }))
        .sort((a, b) => Number(a.name) - Number(b.name)),
      metrics: {
        totalEmployees,
        managers: managerIds.size,
        departmentCount: Object.keys(departments).length,
        locationCount: Object.keys(locations).length,
        avgEmployeesPerDept: (totalEmployees / Object.keys(departments).length).toFixed(1),
      },
    };
  }, [employees]);

  const filteredEmployees = useMemo(() => {
    if (!employees) return [];
    return employees.filter((emp) => {
      const q = searchTerm.toLowerCase();
      const matchesSearch = !searchTerm ||
        emp.full_name?.toLowerCase().includes(q) ||
        emp.position?.toLowerCase().includes(q) ||
        emp.department?.toLowerCase().includes(q);
      const matchesDepartment = selectedDepartment === 'all' || emp.department === selectedDepartment;
      return matchesSearch && matchesDepartment;
    });
  }, [employees, searchTerm, selectedDepartment]);

  const departments = useMemo(() => {
    if (!employees) return [];
    return [...new Set(employees.map((emp) => emp.department).filter(Boolean))].sort();
  }, [employees]);

  const openEmployee = (employee) => {
    setSelectedEmployee(employee);
    setShowEmployeeModal(true);
  };

  const showFullStats = viewMode !== 'chart';

  if (employeesLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <LoadingSpinner size="xl" text="Loading organizational structure..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className={`mx-auto px-4 sm:px-6 lg:px-8 py-6 ${viewMode === 'chart' ? 'max-w-[96rem]' : 'max-w-7xl'}`}>
        {/* Header */}
        <div className="mb-6 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 dark:border-gray-700/50 shadow-lg">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0">
                <Network className="w-7 h-7 text-white" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Organizational Hierarchy</h1>
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
                    {employees?.length || 0} active
                  </span>
                  {canEditHierarchy ? (
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300">
                      Edit mode
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                      View only
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Reporting structure, department branches, and team directory for UDrive
                </p>
              </div>
            </div>
            <button
              onClick={() => refetch()}
              disabled={employeesFetching}
              title="Refresh data"
              className="self-start lg:self-center inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${employeesFetching ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Search + filters + view toggle */}
        <div className="mb-6 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 p-4 sm:p-5">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by name, position, or department..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-10 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <select
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                  className="pl-9 pr-8 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white min-w-[160px] appearance-none"
                >
                  <option value="all">All Departments</option>
                  {departments.map((dept) => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
              </div>

              <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 rounded-xl p-1">
                {[
                  { id: 'chart', icon: GitBranch, label: 'Org chart' },
                  { id: 'list', icon: List, label: 'Directory' },
                  { id: 'analytics', icon: PieChart, label: 'Insights' },
                ].map(({ id, icon: Icon, label }) => (
                  <button
                    key={id}
                    onClick={() => setViewMode(id)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                      viewMode === id
                        ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
                    }`}
                    title={label}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="hidden sm:inline">{label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {viewMode === 'chart' && selectedDepartment !== 'all' && (
            <p className="mt-3 text-xs text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-2">
              Department filter applies to Directory and Insights only. The org chart always shows the full company so reporting lines stay editable.
            </p>
          )}
        </div>

        {/* Stats for Directory / Insights views only */}
        {showFullStats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[
              { label: 'Total Employees', value: employees?.length || 0, sub: `${filteredEmployees.length} shown`, icon: Users, iconClass: 'text-blue-600 dark:text-blue-400', bgClass: 'bg-blue-100 dark:bg-blue-900/30' },
              { label: 'Departments', value: analytics?.metrics.departmentCount || 0, sub: `${analytics?.metrics.avgEmployeesPerDept} avg/dept`, icon: Building, iconClass: 'text-green-600 dark:text-green-400', bgClass: 'bg-green-100 dark:bg-green-900/30' },
              { label: 'Managers', value: analytics?.metrics.managers || 0, sub: 'With direct reports', icon: Crown, iconClass: 'text-purple-600 dark:text-purple-400', bgClass: 'bg-purple-100 dark:bg-purple-900/30' },
              { label: 'Locations', value: analytics?.metrics.locationCount || 0, sub: 'Office locations', icon: MapPin, iconClass: 'text-orange-600 dark:text-orange-400', bgClass: 'bg-orange-100 dark:bg-orange-900/30' },
            ].map(({ label, value, sub, icon: Icon, iconClass, bgClass }) => (
              <div key={label} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
                <div className={`w-10 h-10 rounded-xl ${bgClass} flex items-center justify-center mb-3`}>
                  <Icon className={`w-5 h-5 ${iconClass}`} />
                </div>
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">{label}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{sub}</p>
              </div>
            ))}
          </div>
        )}

        <AnimatePresence mode="wait">
          {viewMode === 'chart' && (
            <motion.div
              key="chart"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-4 sm:p-6"
            >
              <OrgChartPro
                employees={employees || []}
                loading={employeesLoading}
                externalSearch={searchTerm}
                onEmployeeClick={openEmployee}
                canEditHierarchy={canEditHierarchy}
                hierarchy={hierarchy}
              />
            </motion.div>
          )}

          {viewMode === 'list' && (
            <motion.div
              key="list"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6"
            >
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Employee Directory</h3>
              {filteredEmployees.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">No employees match your filters.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredEmployees.map((employee) => {
                    const placement = resolveEmployeePlacement(employee, hierarchy);
                    return (
                      <button
                        key={employee.id}
                        type="button"
                        onClick={() => openEmployee(employee)}
                        className="w-full text-left bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 border-2 border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-md transition-all"
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900 dark:to-indigo-900 flex items-center justify-center overflow-hidden">
                            {employee.profile_picture || employee.photo_url ? (
                              <img src={employee.profile_picture || employee.photo_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <User className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="font-semibold text-gray-900 dark:text-white truncate">{employee.full_name}</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400 truncate">{employee.position || '—'}</p>
                          </div>
                        </div>
                        <div className="space-y-1.5 text-sm text-gray-600 dark:text-gray-400">
                          <div className="flex items-center gap-2">
                            <Building className="w-4 h-4 flex-shrink-0" />
                            <span>{employee.department || 'Unassigned'}</span>
                            {placement.branchLabel && (
                              <span className="text-xs px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300">
                                {placement.branchLabel}
                              </span>
                            )}
                          </div>
                          {employee.reporting_manager?.full_name && (
                            <div className="flex items-center gap-2">
                              <Shield className="w-4 h-4 flex-shrink-0" />
                              <span className="truncate">Reports to {employee.reporting_manager.full_name}</span>
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}

          {viewMode === 'analytics' && analytics && (
            <motion.div
              key="analytics"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-6"
            >
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <PieChart className="w-5 h-5 text-blue-600" /> Department mix
                </h3>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={analytics.departments}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={90}
                        dataKey="value"
                      >
                        {analytics.departments.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={`hsl(${index * 45}, 65%, 52%)`} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-indigo-600" /> Top positions
                </h3>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics.positions.slice(0, 8)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-20} textAnchor="end" height={60} />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-emerald-600" /> Hires by year
                </h3>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics.hireDates}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-orange-600" /> By location
                </h3>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics.locations.slice(0, 10)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Bar dataKey="value" fill="#f97316" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Employee modal */}
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
              className="relative w-full max-w-md bg-white dark:bg-gray-800 rounded-3xl shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="h-20 bg-gradient-to-r from-blue-600 to-indigo-600" />
              <button
                onClick={() => setShowEmployeeModal(false)}
                className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 rounded-xl text-white"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="px-6 pb-6 -mt-10">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900 dark:to-indigo-900 flex items-center justify-center overflow-hidden ring-4 ring-white dark:ring-gray-800 shadow-lg mb-4">
                  {selectedEmployee.profile_picture || selectedEmployee.photo_url ? (
                    <img src={selectedEmployee.profile_picture || selectedEmployee.photo_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-10 h-10 text-blue-600 dark:text-blue-400" />
                  )}
                </div>

                <h3 className="text-xl font-bold text-gray-900 dark:text-white">{selectedEmployee.full_name}</h3>
                <p className="text-gray-600 dark:text-gray-400">{selectedEmployee.position || 'No position'}</p>

                <div className="mt-4 space-y-2.5 text-sm">
                  <div className="flex items-center gap-3">
                    <Building className="w-4 h-4 text-gray-400" />
                    <span>{selectedEmployee.department || 'Unassigned'}</span>
                    {resolveEmployeePlacement(selectedEmployee, hierarchy).branchLabel && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300">
                        {resolveEmployeePlacement(selectedEmployee, hierarchy).branchLabel}
                      </span>
                    )}
                  </div>
                  {selectedEmployee.email && (
                    <div className="flex items-center gap-3">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <a href={`mailto:${selectedEmployee.email}`} className="text-blue-600 dark:text-blue-400 hover:underline truncate">
                        {selectedEmployee.email}
                      </a>
                    </div>
                  )}
                  {selectedEmployee.reporting_manager?.full_name && (
                    <div className="flex items-center gap-3 pt-2 border-t border-gray-100 dark:border-gray-700">
                      <Shield className="w-4 h-4 text-gray-400" />
                      <span>Reports to <strong>{selectedEmployee.reporting_manager.full_name}</strong></span>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setShowEmployeeModal(false);
                    navigate(`/employee/${selectedEmployee.id}`);
                  }}
                  className="mt-5 w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold text-sm hover:from-blue-700 hover:to-indigo-700"
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
