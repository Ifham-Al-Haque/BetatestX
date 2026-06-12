import React, { useMemo, useState, useCallback } from 'react';
import {
  Users, User, ChevronDown, ChevronUp, GripVertical, Crown, Shield, Zap,
  UserCheck, TrendingUp, Search, X, Info, ZoomIn, ZoomOut, Maximize2,
  RotateCcw, Plus, Minus
} from 'lucide-react';
import { useUpdateReportingManager } from '../hooks/useEmployees';
import { useToast } from '../context/ToastContext';
import './orgchart.css';

const DEPARTMENT_COLORS = {
  IT: 'from-blue-500 to-blue-600',
  HR: 'from-green-500 to-green-600',
  Finance: 'from-purple-500 to-purple-600',
  Operations: 'from-orange-500 to-orange-600',
  Sales: 'from-pink-500 to-pink-600',
  Marketing: 'from-indigo-500 to-indigo-600',
  Management: 'from-red-500 to-red-600',
  Unassigned: 'from-gray-400 to-gray-500',
};

const getDepartmentColor = (department) => DEPARTMENT_COLORS[department] || 'from-gray-400 to-gray-500';

const getPositionIcon = (position) => {
  const pos = position?.toLowerCase() || '';
  if (pos.includes('ceo') || pos.includes('chief') || pos.includes('founder')) return Crown;
  if (pos.includes('manager') || pos.includes('director') || pos.includes('head') || pos.includes('lead')) return Shield;
  if (pos.includes('developer') || pos.includes('engineer')) return Zap;
  if (pos.includes('hr') || pos.includes('human')) return UserCheck;
  if (pos.includes('finance') || pos.includes('account')) return TrendingUp;
  return User;
};

// Build a forest of nodes from the flat employee list using reporting_manager_id.
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
    if (manager) manager.directReports.push(node);
    else roots.push(node);
  });

  const sortNodes = (nodes) => {
    nodes.sort((a, b) => (b.directReports.length - a.directReports.length) || (a.full_name || '').localeCompare(b.full_name || ''));
    nodes.forEach((n) => sortNodes(n.directReports));
  };
  sortNodes(roots);

  // Count total (indirect) reports for the badge.
  const countReports = (node) => {
    let total = node.directReports.length;
    node.directReports.forEach((c) => { total += countReports(c); });
    node.totalReports = total;
    return total;
  };
  roots.forEach(countReports);

  const managerIds = [];
  map.forEach((n, id) => { if (n.directReports.length) managerIds.push(id); });

  return { map, roots, managerIds };
};

const OrgChartPro = ({ employees = [], loading = false, onEmployeeClick }) => {
  const [zoom, setZoom] = useState(1);
  const [collapsed, setCollapsed] = useState(() => new Set());
  const [draggedId, setDraggedId] = useState(null);
  const [dragOverId, setDragOverId] = useState(null);
  const [rootDragOver, setRootDragOver] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const { success, error: showError } = useToast();
  const updateManager = useUpdateReportingManager();

  const { map, roots, managerIds } = useMemo(() => buildForest(employees), [employees]);

  const forbiddenTargets = useMemo(() => {
    if (!draggedId) return new Set();
    const blocked = new Set([String(draggedId)]);
    const node = map.get(String(draggedId));
    const walk = (n) => n.directReports.forEach((c) => { blocked.add(String(c.id)); walk(c); });
    if (node) walk(node);
    return blocked;
  }, [draggedId, map]);

  const matchesSearch = useCallback((emp) => {
    if (!searchTerm) return false;
    const q = searchTerm.toLowerCase();
    return (
      emp.full_name?.toLowerCase().includes(q) ||
      emp.position?.toLowerCase().includes(q) ||
      emp.department?.toLowerCase().includes(q) ||
      emp.employee_id?.toLowerCase?.().includes(q)
    );
  }, [searchTerm]);

  const toggleCollapse = (id) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(String(id))) next.delete(String(id));
      else next.add(String(id));
      return next;
    });
  };

  const expandAll = () => setCollapsed(new Set());
  const collapseAll = () => setCollapsed(new Set(managerIds.map(String)));

  const clearDragState = () => {
    setDraggedId(null);
    setDragOverId(null);
    setRootDragOver(false);
  };

  const handleDragStart = (e, id) => {
    setDraggedId(String(id));
    e.dataTransfer.effectAllowed = 'move';
    try { e.dataTransfer.setData('text/plain', String(id)); } catch (_) { /* noop */ }
  };

  const reassign = (employeeId, managerId) => {
    const emp = map.get(String(employeeId));
    const currentManagerId = emp?.reporting_manager_id ? String(emp.reporting_manager_id) : null;
    const nextManagerId = managerId ? String(managerId) : null;
    if (currentManagerId === nextManagerId) { clearDragState(); return; }

    const managerName = managerId ? map.get(String(managerId))?.full_name : null;
    updateManager.mutate(
      { employeeId, managerId },
      {
        onSuccess: () => success(
          'Hierarchy updated',
          managerId
            ? `${emp?.full_name || 'Employee'} now reports to ${managerName}`
            : `${emp?.full_name || 'Employee'} set as top level`
        ),
        onError: () => showError('Update failed', 'Could not save the change. Please try again.'),
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

  const allowDrop = (e, targetId) => {
    if (!draggedId) return;
    if (forbiddenTargets.has(String(targetId))) { e.dataTransfer.dropEffect = 'none'; return; }
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverId !== String(targetId)) setDragOverId(String(targetId));
  };

  const zoomIn = () => setZoom((z) => Math.min(1.4, +(z + 0.1).toFixed(2)));
  const zoomOut = () => setZoom((z) => Math.max(0.5, +(z - 0.1).toFixed(2)));
  const resetZoom = () => setZoom(1);

  const NodeCard = ({ node, isRoot }) => {
    const id = String(node.id);
    const hasReports = node.directReports.length > 0;
    const isCollapsed = collapsed.has(id);
    const isDragging = draggedId === id;
    const isDropTarget = dragOverId === id && !forbiddenTargets.has(id);
    const isForbidden = draggedId && forbiddenTargets.has(id) && !isDragging;
    const isMatch = matchesSearch(node);
    const dimmedBySearch = searchTerm && !isMatch;
    const PositionIcon = getPositionIcon(node.position);

    return (
      <div
        draggable
        onDragStart={(e) => handleDragStart(e, id)}
        onDragEnd={clearDragState}
        onDragOver={(e) => allowDrop(e, id)}
        onDragLeave={() => setDragOverId((prev) => (prev === id ? null : prev))}
        onDrop={(e) => handleDropOnNode(e, id)}
        className={`relative w-60 select-none rounded-2xl bg-white dark:bg-gray-800 border-2 shadow-md transition-all duration-150 cursor-grab active:cursor-grabbing
          ${isDropTarget ? 'border-blue-500 ring-4 ring-blue-500/25 -translate-y-0.5 shadow-xl' : 'border-gray-200 dark:border-gray-700'}
          ${isDragging ? 'opacity-40' : ''}
          ${isForbidden ? 'opacity-30' : ''}
          ${isMatch ? 'ring-2 ring-amber-400 border-amber-300' : ''}
          ${dimmedBySearch ? 'opacity-45' : ''}
          hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-600`}
      >
        {/* Department accent bar */}
        <div className={`h-1.5 w-full rounded-t-2xl bg-gradient-to-r ${getDepartmentColor(node.department)}`} />

        {isRoot && (
          <span className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-[10px] font-bold shadow">
            <Crown className="w-3 h-3" /> TOP
          </span>
        )}

        <div className="p-3">
          <div className="flex items-center gap-3">
            <GripVertical className="w-4 h-4 text-gray-300 dark:text-gray-600 flex-shrink-0" />
            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900 dark:to-indigo-900 flex items-center justify-center overflow-hidden ring-2 ring-white dark:ring-gray-800 shadow-sm flex-shrink-0">
              {node.profile_picture || node.photo_url ? (
                <img src={node.profile_picture || node.photo_url} alt={node.full_name} className="w-full h-full object-cover" />
              ) : (
                <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              )}
            </div>
            <button
              type="button"
              onClick={() => onEmployeeClick?.(node)}
              className="min-w-0 flex-1 text-left"
              title="View details"
            >
              <div className="flex items-center gap-1.5">
                <PositionIcon className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                <span className="font-bold text-sm text-gray-900 dark:text-white truncate">{node.full_name}</span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{node.position || 'No position'}</p>
            </button>
          </div>

          <div className="mt-2.5 flex items-center justify-between gap-2">
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold text-white bg-gradient-to-r ${getDepartmentColor(node.department)}`}>
              {node.department || 'Unassigned'}
            </span>
            {hasReports && (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">
                <Users className="w-3 h-3" />
                {node.directReports.length}
                {node.totalReports > node.directReports.length && (
                  <span className="text-gray-400">/{node.totalReports}</span>
                )}
              </span>
            )}
          </div>
        </div>

        {/* Collapse / expand handle */}
        {hasReports && (
          <button
            onClick={(e) => { e.stopPropagation(); toggleCollapse(id); }}
            className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-7 h-7 rounded-full bg-white dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 shadow flex items-center justify-center text-gray-500 hover:text-blue-600 hover:border-blue-400 transition-colors z-10"
            title={isCollapsed ? `Show ${node.directReports.length} reports` : 'Hide reports'}
          >
            {isCollapsed
              ? <Plus className="w-4 h-4" />
              : <Minus className="w-4 h-4" />}
          </button>
        )}
      </div>
    );
  };

  const NodeLi = ({ node, isRoot = false }) => {
    const id = String(node.id);
    const hasReports = node.directReports.length > 0;
    const isCollapsed = collapsed.has(id);

    return (
      <li>
        <div className="oc-node-wrap">
          <NodeCard node={node} isRoot={isRoot} />
        </div>
        {hasReports && !isCollapsed && (
          <ul>
            {node.directReports.map((child) => (
              <NodeLi key={child.id} node={child} />
            ))}
          </ul>
        )}
      </li>
    );
  };

  if (loading) {
    return (
      <div className="flex flex-wrap justify-center gap-6 py-10">
        {[1, 2, 3].map((i) => (
          <div key={i} className="w-60 h-28 bg-gray-100 dark:bg-gray-700 rounded-2xl animate-pulse" />
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
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </span>
            Organizational Chart
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Drag any card onto another person to set who they report to.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Find a person..."
              className="w-44 pl-9 pr-8 py-2 rounded-xl border-2 border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Expand / collapse */}
          <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 rounded-xl p-1">
            <button onClick={expandAll} title="Expand all" className="p-2 rounded-lg text-gray-500 hover:text-blue-600 hover:bg-white dark:hover:bg-gray-600 transition-colors">
              <ChevronDown className="w-4 h-4" />
            </button>
            <button onClick={collapseAll} title="Collapse all" className="p-2 rounded-lg text-gray-500 hover:text-blue-600 hover:bg-white dark:hover:bg-gray-600 transition-colors">
              <ChevronUp className="w-4 h-4" />
            </button>
          </div>

          {/* Zoom */}
          <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 rounded-xl p-1">
            <button onClick={zoomOut} title="Zoom out" className="p-2 rounded-lg text-gray-500 hover:text-blue-600 hover:bg-white dark:hover:bg-gray-600 transition-colors">
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-xs font-semibold text-gray-600 dark:text-gray-300 w-10 text-center">{Math.round(zoom * 100)}%</span>
            <button onClick={zoomIn} title="Zoom in" className="p-2 rounded-lg text-gray-500 hover:text-blue-600 hover:bg-white dark:hover:bg-gray-600 transition-colors">
              <ZoomIn className="w-4 h-4" />
            </button>
            <button onClick={resetZoom} title="Reset zoom" className="p-2 rounded-lg text-gray-500 hover:text-blue-600 hover:bg-white dark:hover:bg-gray-600 transition-colors">
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Helper + top-level drop zone */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex items-start gap-2 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/40 px-3 py-2.5 flex-1">
          <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-blue-800 dark:text-blue-200">
            Changes save automatically. You can't drop a manager onto one of their own reports.
          </p>
        </div>
        <div
          onDragOver={(e) => { if (!draggedId) return; e.preventDefault(); setRootDragOver(true); }}
          onDragLeave={() => setRootDragOver(false)}
          onDrop={(e) => { e.preventDefault(); if (draggedId) reassign(draggedId, null); }}
          className={`flex items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-2.5 text-xs font-semibold transition-all sm:w-64
            ${rootDragOver
              ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300'
              : 'border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400'}`}
        >
          <Crown className="w-4 h-4" />
          Drop here = remove manager
        </div>
      </div>

      {/* Saving indicator */}
      <div className="h-5">
        {updateManager.isPending && (
          <span className="inline-flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
            <RotateCcw className="w-4 h-4 animate-spin" /> Saving...
          </span>
        )}
      </div>

      {/* Chart viewport */}
      <div className="oc-viewport rounded-3xl border border-gray-200 dark:border-gray-700 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900">
        <div className="oc-canvas" style={{ transform: `scale(${zoom})` }}>
          <div className="oc-tree">
            <ul>
              {roots.map((node) => (
                <NodeLi key={node.id} node={node} isRoot />
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-gray-500 dark:text-gray-400">
        <span className="flex items-center gap-1.5"><GripVertical className="w-4 h-4" /> Drag a card to reassign</span>
        <span className="flex items-center gap-1.5"><Crown className="w-4 h-4 text-yellow-500" /> Top level (no manager)</span>
        <span className="flex items-center gap-1.5"><Users className="w-4 h-4" /> Direct / total reports</span>
        <span className="flex items-center gap-1.5"><Plus className="w-4 h-4" /> Expand or collapse a branch</span>
      </div>
    </div>
  );
};

export default OrgChartPro;
