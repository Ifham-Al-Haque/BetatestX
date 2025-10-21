import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Users, Building2, User, ChevronDown, ChevronRight } from 'lucide-react';

const OrgChart = ({ employees = [], loading = false }) => {
  // Build organizational hierarchy
  const orgStructure = useMemo(() => {
    if (!employees || employees.length === 0) return {};

    // Create a map for quick lookup
    const employeeMap = new Map();
    employees.forEach(emp => {
      employeeMap.set(emp.id, { ...emp, directReports: [] });
    });

    // Build hierarchy
    const hierarchy = {};
    const topLevel = [];

    employees.forEach(emp => {
      if (emp.reporting_manager_id) {
        const manager = employeeMap.get(emp.reporting_manager_id);
        if (manager) {
          manager.directReports.push(emp);
        }
      } else {
        topLevel.push(emp);
      }
    });

    // Group by department
    const departments = {};
    employees.forEach(emp => {
      const dept = emp.department || 'Unassigned';
      if (!departments[dept]) {
        departments[dept] = [];
      }
      departments[dept].push(emp);
    });

    return { departments, topLevel, employeeMap };
  }, [employees]);

  // Department colors
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

  // Employee card component
  const EmployeeCard = ({ employee, level = 0 }) => {
    const hasReports = employee.directReports && employee.directReports.length > 0;
    const [isExpanded, setIsExpanded] = React.useState(level < 2); // Auto-expand first 2 levels

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`relative ${level > 0 ? 'ml-6' : ''}`}
      >
        <div className="flex items-start gap-3">
          {/* Employee Card */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg border border-gray-200 dark:border-gray-700 min-w-[200px] group hover:shadow-xl transition-all duration-200"
          >
            {/* Profile Picture */}
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
                <p className="text-xs text-gray-500 dark:text-gray-500">
                  ID: {employee.employee_id}
                </p>
              </div>
            </div>

            {/* Department Badge */}
            <div className="flex items-center gap-2 mb-2">
              <Building2 className="w-4 h-4 text-gray-500" />
              <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full">
                {employee.department || 'Unassigned'}
              </span>
            </div>

            {/* Direct Reports Count */}
            {hasReports && (
              <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                <Users className="w-4 h-4" />
                <span>{employee.directReports.length} direct report{employee.directReports.length !== 1 ? 's' : ''}</span>
              </div>
            )}
          </motion.div>

          {/* Expand/Collapse Button */}
          {hasReports && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="mt-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              {isExpanded ? (
                <ChevronDown className="w-5 h-5" />
              ) : (
                <ChevronRight className="w-5 h-5" />
              )}
            </button>
          )}
        </div>

        {/* Direct Reports */}
        {hasReports && isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 space-y-4"
          >
            {employee.directReports.map((report) => (
              <EmployeeCard key={report.id} employee={report} level={level + 1} />
            ))}
          </motion.div>
        )}
      </motion.div>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
            <div className="space-y-3">
              <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
              <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
            </div>
          </div>
        ))}
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
    <div className="space-y-8">
      {/* Department Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {Object.entries(orgStructure.departments).map(([department, deptEmployees]) => (
          <motion.div
            key={department}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-xl p-4 border border-gray-200 dark:border-gray-600"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${getDepartmentColor(department)} flex items-center justify-center`}>
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">{department}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {deptEmployees.length} employee{deptEmployees.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            <div className="space-y-1">
              {deptEmployees.slice(0, 3).map((emp) => (
                <div key={emp.id} className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-gray-700 dark:text-gray-300 truncate">
                    {emp.full_name}
                  </span>
                </div>
              ))}
              {deptEmployees.length > 3 && (
                <p className="text-xs text-gray-500 dark:text-gray-400 ml-4">
                  +{deptEmployees.length - 3} more
                </p>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Organizational Hierarchy */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
            <Users className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Organizational Hierarchy
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Company structure and reporting relationships
            </p>
          </div>
        </div>

        <div className="space-y-6">
          {orgStructure.topLevel.map((employee) => (
            <EmployeeCard key={employee.id} employee={employee} level={0} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default OrgChart;
