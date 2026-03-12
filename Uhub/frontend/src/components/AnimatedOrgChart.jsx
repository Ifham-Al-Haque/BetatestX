import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, Building2, User, ChevronDown, 
  Mail, Phone, MapPin, Crown, 
  TrendingUp, UserCheck, Shield, Zap
} from 'lucide-react';

const AnimatedOrgChart = ({ employees = [], loading = false, onEmployeeClick }) => {
  const [expandedNodes, setExpandedNodes] = useState(new Set());
  const [hoveredNode, setHoveredNode] = useState(null);

  // Build organizational hierarchy with enhanced structure
  const orgStructure = useMemo(() => {
    if (!employees || employees.length === 0) return { hierarchy: [], employeeMap: new Map(), reportingChains: [] };

    // Create employee map with enhanced data
    const employeeMap = new Map();
    const reportingChains = [];
    
    employees.forEach(emp => {
      const key = String(emp.id);
      employeeMap.set(key, { 
        ...emp, 
        directReports: [],
        level: 0,
        isTopLevel: !emp.reporting_manager_id,
        totalReports: 0,
        reportingChain: []
      });
    });

    // Build hierarchy and calculate levels
    const topLevel = [];

    // First pass: Build the hierarchy structure
    employees.forEach(emp => {
      const empKey = String(emp.id);
      const managerKey = emp.reporting_manager_id ? String(emp.reporting_manager_id) : null;
      const empNode = employeeMap.get(empKey);
      if (managerKey && managerKey !== empKey) {
        const manager = employeeMap.get(managerKey);
        if (manager) {
          manager.directReports.push(empNode);
          empNode.level = manager.level + 1;
          empNode.reportingChain = [...manager.reportingChain, manager.id];
        } else {
          // If manager not found, treat as top level
          topLevel.push(empNode);
        }
      } else {
        topLevel.push(empNode);
      }
    });

    // Second pass: Calculate levels for all employees
    const calculateLevels = (employee, level = 0) => {
      employee.level = level;
      if (employee.directReports) {
        employee.directReports.forEach(report => {
          calculateLevels(report, level + 1);
        });
      }
    };

    topLevel.forEach(emp => calculateLevels(emp));

    // Calculate total reports for each employee (including indirect reports)
    const calculateTotalReports = (employee) => {
      if (!employee || !employee.directReports) {
        return 0;
      }
      
      let total = employee.directReports.length;
      employee.directReports.forEach(report => {
        total += calculateTotalReports(report);
      });
      employee.totalReports = total;
      return total;
    };

    topLevel.forEach(emp => calculateTotalReports(emp));

    // Build reporting chains for visualization
    const buildReportingChains = (employee, chain = []) => {
      if (!employee) return;
      
      const currentChain = [...chain, employee];
      
      if (!employee.directReports || employee.directReports.length === 0) {
        reportingChains.push([...currentChain]);
      } else {
        employee.directReports.forEach(report => {
          buildReportingChains(report, currentChain);
        });
      }
    };

    topLevel.forEach(emp => buildReportingChains(emp));

    // If no top-level employees found, show all employees as individual nodes (mapped)
    const displayHierarchy = topLevel.length > 0 ? topLevel : Array.from(employeeMap.values());

    return { 
      hierarchy: displayHierarchy, 
      employeeMap,
      reportingChains,
      totalEmployees: employees.length,
      topLevelCount: topLevel.length,
      hasHierarchy: topLevel.length > 0
    };
  }, [employees]);

  // Auto-expand top 2 levels (side-effect must NOT run in useMemo/render)
  useEffect(() => {
    if (!orgStructure?.hierarchy?.length) {
      setExpandedNodes(new Set());
      return;
    }

    const next = new Set();
    const walk = (nodes, level = 0) => {
      if (!nodes || level >= 2) return;
      nodes.forEach((n) => {
        if (n?.directReports?.length) {
          next.add(n.id);
          walk(n.directReports, level + 1);
        }
      });
    };
    // Always base from computed hierarchy roots
    walk(orgStructure.hierarchy, 0);
    setExpandedNodes(next);
  }, [orgStructure?.hierarchy]);

  // Toggle node expansion
  const toggleNode = (nodeId) => {
    setExpandedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
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

  // Enhanced Employee Node Component
  const EmployeeNode = ({ employee, level = 0, isLast = false, isFirst = false }) => {
    if (!employee) return null;
    
    const isExpanded = expandedNodes.has(employee.id);
    const hasReports = employee.directReports && employee.directReports.length > 0;
    const isHovered = hoveredNode === employee.id;
    const PositionIcon = getPositionIcon(employee.position);

    return (
      <div className="flex flex-col items-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ 
            duration: 0.5, 
            delay: level * 0.1,
            type: "spring",
            stiffness: 100
          }}
          className="relative"
        >
          {/* Connection Line */}
          {level > 0 && (
            <motion.div
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.8, delay: level * 0.1 }}
              className="absolute -top-4 left-1/2 transform -translate-x-1/2 w-0.5 h-4 bg-gradient-to-b from-gray-300 to-transparent"
            />
          )}

        {/* Employee Card */}
        <motion.div
          whileHover={{ 
            scale: 1.05, 
            y: -5,
            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
          }}
          whileTap={{ scale: 0.95 }}
          onHoverStart={() => setHoveredNode(employee.id)}
          onHoverEnd={() => setHoveredNode(null)}
          onClick={() => onEmployeeClick?.(employee)}
          className={`
            relative bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border-2 border-gray-100 dark:border-gray-700 
            min-w-[280px] max-w-[320px] cursor-pointer group transition-all duration-300
            ${isHovered ? 'border-blue-300 dark:border-blue-600 shadow-xl' : ''}
            ${level === 0 ? 'ring-2 ring-blue-200 dark:ring-blue-800' : ''}
          `}
        >
          {/* Level Indicator */}
          {level === 0 && (
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
              <Crown className="w-3 h-3 text-white" />
            </div>
          )}

          {/* Profile Section */}
          <div className="flex items-center gap-4 mb-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900 dark:to-indigo-900 flex items-center justify-center overflow-hidden ring-4 ring-white dark:ring-gray-800 shadow-lg">
                {employee.profile_picture || employee.photo_url ? (
                  <img
                    src={employee.profile_picture || employee.photo_url}
                    alt={employee.full_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                )}
              </div>
              {/* Online Status */}
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white dark:border-gray-800 flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
              </div>
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <PositionIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <h4 className="font-bold text-gray-900 dark:text-white text-lg truncate">
                  {employee.full_name}
                </h4>
              </div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                {employee.position || 'Position'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                ID: {employee.employee_id}
              </p>
            </div>
          </div>

          {/* Department Badge */}
          <div className="flex items-center gap-2 mb-4">
            <Building2 className="w-4 h-4 text-gray-500" />
            <span className={`text-xs px-3 py-1 rounded-full font-medium bg-gradient-to-r ${getDepartmentColor(employee.department)} text-white`}>
              {employee.department || 'Unassigned'}
            </span>
          </div>

          {/* Contact Info */}
          <div className="space-y-2 mb-4">
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
            {employee.location && (
              <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                <MapPin className="w-3 h-3" />
                <span>{employee.location}</span>
              </div>
            )}
          </div>

          {/* Reporting Information */}
          <div className="space-y-3 pt-3 border-t border-gray-200 dark:border-gray-600">
            {/* Manager Information */}
            {employee.reporting_manager && (
              <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                <Shield className="w-3 h-3" />
                <span className="truncate">
                  Reports to: <span className="font-medium text-gray-800 dark:text-gray-200">{employee.reporting_manager.full_name}</span>
                </span>
              </div>
            )}

            {/* Direct Reports Count & Expand Button */}
            {hasReports && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Users className="w-4 h-4" />
                  <div className="flex flex-col">
                    <span className="font-medium">{employee.directReports.length} direct report{employee.directReports.length !== 1 ? 's' : ''}</span>
                    {employee.totalReports > employee.directReports.length && (
                      <span className="text-xs text-gray-500 dark:text-gray-500">
                        {employee.totalReports} total (including indirect)
                      </span>
                    )}
                  </div>
                </div>
                
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleNode(employee.id);
                  }}
                  className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20"
                >
                  <motion.div
                    animate={{ rotate: isExpanded ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <ChevronDown className="w-5 h-5" />
                  </motion.div>
                </motion.button>
              </div>
            )}

            {/* Level Indicator */}
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-1">
                {Array.from({ length: employee.level + 1 }).map((_, i) => (
                  <div key={i} className="w-1 h-1 bg-gray-400 rounded-full"></div>
                ))}
              </div>
              <span>Level {employee.level + 1}</span>
            </div>
          </div>

          {/* Hover Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: isHovered ? 1 : 0 }}
            className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 rounded-2xl pointer-events-none"
          />
        </motion.div>

        {/* Direct Reports */}
        <AnimatePresence>
          {hasReports && isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.4, ease: 'easeInOut' }}
              className="mt-8 relative"
            >
              {/* Connection Lines */}
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 w-0.5 h-4 bg-gradient-to-b from-gray-300 to-transparent"></div>
              
              <div className="flex flex-wrap justify-center gap-8 mt-4">
                {employee.directReports.map((report, index) => (
                  <div key={report.id} className="flex flex-col items-center">
                    {/* Horizontal Connection Line */}
                    {employee.directReports.length > 1 && (
                      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-full h-0.5 bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
                    )}
                    <EmployeeNode 
                      employee={report} 
                      level={level + 1} 
                      isLast={index === employee.directReports.length - 1}
                      isFirst={index === 0}
                    />
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        </motion.div>
      </div>
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
            Building the company hierarchy...
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
    <div className="relative">
      {/* Chart Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-blue-500 rounded-2xl flex items-center justify-center shadow-lg">
            <Users className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Organizational Tree
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              {orgStructure.hasHierarchy 
                ? `Complete reporting structure with ${orgStructure.totalEmployees} employees across ${orgStructure.topLevelCount} top-level positions`
                : `All ${orgStructure.totalEmployees} employees (no reporting hierarchy defined)`
              }
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>Live Updates</span>
          </div>
          <div className="text-right">
            <div className="text-sm font-semibold text-gray-900 dark:text-white">
              {orgStructure.reportingChains.length} Reporting Chains
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Complete hierarchy paths
            </div>
          </div>
        </div>
      </div>

      {/* Tree Structure */}
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-3xl p-8 border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col items-center space-y-8">
          {orgStructure.hierarchy.map((employee, index) => (
            <div key={employee.id} className="w-full flex justify-center">
              <EmployeeNode 
                employee={employee} 
                level={0} 
                isFirst={index === 0}
                isLast={index === orgStructure.hierarchy.length - 1}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Reporting Chains Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mt-8 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-lg flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-white" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Reporting Chains Overview</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {orgStructure.reportingChains && orgStructure.reportingChains.length > 0 ? (
            orgStructure.reportingChains.slice(0, 6).map((chain, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 + index * 0.1 }}
                className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 border border-gray-200 dark:border-gray-600"
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                    <span className="text-xs font-bold text-blue-600 dark:text-blue-400">{index + 1}</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    Chain {index + 1}
                  </span>
                </div>
                
                <div className="space-y-2">
                  {chain && chain.length > 0 ? chain.map((employee, empIndex) => (
                    <div key={employee?.id || empIndex} className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        {Array.from({ length: empIndex + 1 }).map((_, i) => (
                          <div key={i} className="w-1 h-1 bg-gray-400 rounded-full"></div>
                        ))}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {employee?.full_name || 'Unknown Employee'}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {employee?.position || 'Position not specified'}
                        </div>
                      </div>
                    </div>
                  )) : (
                    <div className="text-sm text-gray-500 dark:text-gray-400">No employees in chain</div>
                  )}
                </div>
              </motion.div>
            ))
          ) : (
            <div className="col-span-full text-center py-8">
              <div className="text-gray-500 dark:text-gray-400">
                No reporting chains found
              </div>
            </div>
          )}
        </div>
        
        {orgStructure.reportingChains && orgStructure.reportingChains.length > 6 && (
          <div className="mt-4 text-center">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              +{orgStructure.reportingChains.length - 6} more reporting chains
            </span>
          </div>
        )}
      </motion.div>

      {/* Legend */}
      <div className="mt-6 flex items-center justify-center gap-6 text-sm text-gray-600 dark:text-gray-400">
        <div className="flex items-center gap-2">
          <Crown className="w-4 h-4 text-yellow-500" />
          <span>Top Level</span>
        </div>
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-blue-500" />
          <span>Direct Reports</span>
        </div>
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-purple-500" />
          <span>Manager Info</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span>Online Status</span>
        </div>
      </div>
    </div>
  );
};

export default AnimatedOrgChart;
