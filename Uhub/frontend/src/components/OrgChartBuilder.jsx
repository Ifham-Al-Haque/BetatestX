import React, { useMemo, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Building2, User, ChevronDown, ChevronRight, GripVertical,
  Crown, Shield, Zap, UserCheck, TrendingUp, Search, X, Info,
  CornerDownRight, RotateCcw, AlertTriangle
} from 'lucide-react';
import { useUpdateReportingManager } from '../hooks/useEmployees';
import { useToast } from '../context/ToastContext';

const DEPARTMENT_COLORS = {
  IT: 'from-blue-500 to-blue-600',
  HR: 'from-green-500 to-green-600',
  Finance: 'from-purple-500 to-purple-600',
  Operations: 'from-orange-500 to-orange-600',
  Sales: 'from-pink-500 to-pink-600',
  Marketing: 'from-indigo-500 to-indigo-600',
  Management: 'from-red-500 to-red-600',
  Unassigned: 'from-gray-500 to-gray-600',
};

const getDepartmentColor = (department) => DEPARTMENT_COLORS[department] || 'from-gray-500 to-gray-600';

const getPositionIcon = (position) => {
  const pos = position?.toLowerCase() || '';
  if (pos.includes('ceo') || pos.includes('chief')) return Crown;
  if (pos.includes('manager') || pos.includes('director') || pos.includes('head')) return Shield;
  if (pos.includes('developer') || pos.includes('engineer')) return Zap;
  if (pos.includes('hr') || pos.includes('human')) return UserCheck;
  if (pos.includes('finance') || pos.includes('account')) return TrendingUp;
  return User;
};

// Build a forest of nodes from a flat employee list using reporting_manager_id.
const buildForest = (employees) => {
  const map = new Map();
  employees.forEach((emp) => {
    map.set(String(emp.id), { ...emp, directReports: [] });
  });

  const roots = [];
  employees.forEach((emp) => {
    const node = map.get(String(emp.id));
    const managerKey = emp.reporting_manager_id ? String(emp.reporting_manager_id) : null;
    const manager = managerKey && managerKey !== String(emp.id) ? map.get(managerKey) : null;
    if (manager) {
      manager.directReports.push(node);
    } else {
      roots.push(node);
    }
  });

  const sortByName = (nodes) => {
    nodes.sort((a, b) => (a.full_name || '').localeCompare(b.full_name || ''));
    nodes.forEach((n) => sortByName(n.directReports));
  };
  sortByName(roots);

  return { map, roots };
};

const OrgChartBuilder = ({ employees = [], loading = false, onEmployeeClick }) => {
  const [draggedId, setDraggedId] = useState(null);
  const [dragOverId, setDragOverId] = useState(null);
  const [rootDragOver, setRootDragOver] = useState(false);
  const [collapsed, setCollapsed] = useState(() => new Set());
  const [searchTerm, setSearchTerm] = useState('');

  const { success, error: showError } = useToast();
  const updateManager = useUpdateReportingManager();

  const { map, roots } = useMemo(() => buildForest(employees), [employees]);

  // Pre-compute the set of descendant ids for the node currently being dragged,
  // so we can forbid drops that would create a cycle.
  const forbiddenTargets = useMemo(() => {
    if (!draggedId) return new Set();
    const blocked = new Set([draggedId]);
    const node = map.get(String(draggedId));
    const walk = (n) => {
      n.directReports.forEach((child) => {
        blocked.add(String(child.id));
        walk(child);
      });
    };
    if (node) walk(node);
    return blocked;
  }, [draggedId, map]);

  const matchesSearch = useCallback(
    (emp) => {
      if (!searchTerm) return false;
      const q = searchTerm.toLowerCase();
      return (
        emp.full_name?.toLowerCase().includes(q) ||
        emp.position?.toLowerCase().includes(q) ||
        emp.department?.toLowerCase().includes(q)
      );
    },
    [searchTerm]
  );

  const toggleCollapse = (id) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const clearDragState = () => {
    setDraggedId(null);
    setDragOverId(null);
    setRootDragOver(false);
  };

  const handleDragStart = (e, id) => {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = 'move';
    try {
      e.dataTransfer.setData('text/plain', String(id));
    } catch (_) {
      /* some browsers require this in a try/catch */
    }
  };

  const reassign = (employeeId, managerId) => {
    const emp = map.get(String(employeeId));
    const currentManagerId = emp?.reporting_manager_id ? String(emp.reporting_manager_id) : null;
    const nextManagerId = managerId ? String(managerId) : null;

    if (currentManagerId === nextManagerId) {
      clearDragState();
      return;
    }

    const managerName = managerId ? map.get(String(managerId))?.full_name : null;

    updateManager.mutate(
      { employeeId, managerId },
      {
        onSuccess: () => {
          success(
            'Hierarchy updated',
            managerId
              ? `${emp?.full_name || 'Employee'} now reports to ${managerName}`
              : `${emp?.full_name || 'Employee'} set as top level`
          );
        },
        onError: () => {
          showError('Update failed', 'Could not save the change. Please try again.');
        },
      }
    );
    clearDragState();
  };

  const handleDropOnNode = (e, targetId) => {
    e.preventDefault();
    e.stopPropagation();
    if (!draggedId) return;
    if (forbiddenTargets.has(String(targetId))) {
      showError('Not allowed', "You can't move a manager under one of their own reports.");
      clearDragState();
      return;
    }
    reassign(draggedId, targetId);
  };

  const handleDropOnRoot = (e) => {
    e.preventDefault();
    if (!draggedId) return;
    reassign(draggedId, null);
  };

  const allowDrop = (e, targetId) => {
    if (!draggedId) return;
    if (forbiddenTargets.has(String(targetId))) {
      e.dataTransfer.dropEffect = 'none';
      return;
    }
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverId !== targetId) setDragOverId(targetId);
  };

  // Recursive node renderer (vertical indented tree).
  const TreeNode = ({ node, level }) => {
    const hasReports = node.directReports.length > 0;
    const isCollapsed = collapsed.has(node.id);
    const isDragging = String(draggedId) === String(node.id);
    const isDropTarget = String(dragOverId) === String(node.id) && !forbiddenTargets.has(String(node.id));
    const isForbidden = draggedId && forbiddenTargets.has(String(node.id)) && !isDragging;
    const isMatch = matchesSearch(node);
    const PositionIcon = getPositionIcon(node.position);

    return (
      <div className="relative">
        {/* Connector from parent */}
        {level > 0 && (
          <span className="absolute -left-5 top-7 w-5 h-px bg-gray-300 dark:bg-gray-600" aria-hidden />
        )}

        <motion.div
          layout
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: isDragging ? 0.4 : 1, y: 0 }}
          transition={{ duration: 0.2 }}
          draggable
          onDragStart={(e) => handleDragStart(e, node.id)}
          onDragEnd={clearDragState}
          onDragOver={(e) => allowDrop(e, node.id)}
          onDragLeave={() => setDragOverId((prev) => (prev === node.id ? null : prev))}
          onDrop={(e) => handleDropOnNode(e, node.id)}
          className={`group flex items-center gap-3 rounded-2xl border-2 bg-white dark:bg-gray-800 p-3 pr-4 shadow-sm transition-all duration-150
            ${isDropTarget ? 'border-blue-500 ring-4 ring-blue-500/20 scale-[1.01] shadow-lg' : 'border-gray-100 dark:border-gray-700'}
            ${isForbidden ? 'opacity-40' : ''}
            ${isMatch ? 'ring-2 ring-amber-400 border-amber-300' : ''}
            cursor-grab active:cursor-grabbing`}
        >
          {/* Drag handle */}
          <div className="text-gray-300 group-hover:text-gray-500 dark:text-gray-600 dark:group-hover:text-gray-400 transition-colors">
            <GripVertical className="w-5 h-5" />
          </div>

          {/* Expand / collapse */}
          {hasReports ? (
            <button
              onClick={() => toggleCollapse(node.id)}
              className="p-1 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
              title={isCollapsed ? 'Expand' : 'Collapse'}
            >
              {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          ) : (
            <span className="w-6" />
          )}

          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900 dark:to-indigo-900 flex items-center justify-center overflow-hidden ring-2 ring-white dark:ring-gray-800">
              {node.profile_picture || node.photo_url ? (
                <img src={node.profile_picture || node.photo_url} alt={node.full_name} className="w-full h-full object-cover" />
              ) : (
                <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              )}
            </div>
            {level === 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow">
                <Crown className="w-2.5 h-2.5 text-white" />
              </span>
            )}
          </div>

          {/* Details */}
          <button
            type="button"
            onClick={() => onEmployeeClick?.(node)}
            className="flex-1 min-w-0 text-left"
          >
            <div className="flex items-center gap-2">
              <PositionIcon className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
              <span className="font-semibold text-gray-900 dark:text-white truncate">{node.full_name}</span>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-gray-500 dark:text-gray-400 truncate">{node.position || 'No position'}</span>
            </div>
          </button>

          {/* Department + reports */}
          <div className="hidden sm:flex items-center gap-2 flex-shrink-0">
            {hasReports && (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
                <Users className="w-3 h-3" />
                {node.directReports.length}
              </span>
            )}
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium text-white bg-gradient-to-r ${getDepartmentColor(node.department)}`}>
              {node.department || 'Unassigned'}
            </span>
          </div>
        </motion.div>

        {/* Children */}
        <AnimatePresence initial={false}>
          {hasReports && !isCollapsed && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="ml-9 pl-5 mt-2 space-y-2 border-l-2 border-gray-200 dark:border-gray-700"
            >
              {node.directReports.map((child) => (
                <TreeNode key={child.id} node={child} level={level + 1} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-16 bg-gray-100 dark:bg-gray-700 rounded-2xl animate-pulse" />
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
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Employees Found</h3>
        <p className="text-gray-600 dark:text-gray-400">No active employees found in the system.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header + instructions */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-2xl flex items-center justify-center shadow-lg">
            <CornerDownRight className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Hierarchy Builder</h2>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Drag any employee onto another to set their reporting manager.
            </p>
          </div>
        </div>

        <div className="relative w-full lg:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Highlight an employee..."
            className="w-full pl-10 pr-9 py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Helper banner */}
      <div className="flex items-start gap-3 rounded-2xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/40 px-4 py-3">
        <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-blue-800 dark:text-blue-200">
          Changes save automatically. Drop an employee onto the <span className="font-semibold">Top Level</span> zone below to remove their
          manager. You can't move a manager under one of their own reports.
        </p>
      </div>

      {/* Top-level drop zone */}
      <div
        onDragOver={(e) => {
          if (!draggedId) return;
          e.preventDefault();
          setRootDragOver(true);
        }}
        onDragLeave={() => setRootDragOver(false)}
        onDrop={handleDropOnRoot}
        className={`flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-4 py-4 text-sm font-medium transition-all duration-150
          ${rootDragOver
            ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 scale-[1.01]'
            : 'border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400'}`}
      >
        <Crown className="w-4 h-4" />
        Top Level — drop here to remove the reporting manager
      </div>

      {/* Saving indicator */}
      <div className="min-h-[20px]">
        {updateManager.isPending && (
          <div className="inline-flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
            <RotateCcw className="w-4 h-4 animate-spin" />
            Saving change...
          </div>
        )}
      </div>

      {/* Tree */}
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-3xl p-4 sm:p-6 border border-gray-200 dark:border-gray-700">
        <div className="space-y-2">
          {roots.map((node) => (
            <TreeNode key={node.id} node={node} level={0} />
          ))}
        </div>
      </div>

      {/* Cycle warning legend */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-gray-500 dark:text-gray-400">
        <span className="flex items-center gap-1.5"><GripVertical className="w-4 h-4" /> Drag to move</span>
        <span className="flex items-center gap-1.5"><Crown className="w-4 h-4 text-yellow-500" /> Top level</span>
        <span className="flex items-center gap-1.5"><AlertTriangle className="w-4 h-4 text-amber-500" /> Dimmed cards can't be a drop target (would create a loop)</span>
      </div>
    </div>
  );
};

export default OrgChartBuilder;
