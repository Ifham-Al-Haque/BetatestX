import React, { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import {
  Users, User, ChevronDown, ChevronUp, GripVertical, Crown, Shield, Zap,
  UserCheck, TrendingUp, Search, X, Info, ZoomIn, ZoomOut, Maximize2,
  RotateCcw, Plus, Minus, GitBranch, ListTree, AlertTriangle, Presentation, Building2,
  Focus, Download, Lock, ArrowLeft
} from 'lucide-react';
import { useUpdateReportingManager } from '../hooks/useEmployees';
import { useToast } from '../context/ToastContext';
import {
  buildOrgTree, getAncestorIds, nodeMatchesQuery, getFocusRoot, computeOrgHealth,
} from '../utils/buildOrgTree';
import { resolveEmployeePlacement } from '../config/departmentHierarchy';
import DepartmentHierarchyView from './DepartmentHierarchyView';
import { exportOrgChartAsPng } from '../utils/exportOrgChart';
import './orgchart.css';

const ORG_LEGEND = [
  { label: 'Top level', className: 'oc-level-root' },
  { label: 'Level 2', className: 'oc-level-1' },
  { label: 'Level 3', className: 'oc-level-2' },
  { label: 'Level 4', className: 'oc-level-3' },
  { label: 'Deeper', className: 'oc-level-deep' },
  { label: 'Search match', className: 'oc-match', isMatch: true },
];

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

const getLevelClass = (level, isRoot) => {
  if (isRoot || level === 0) return 'oc-level-root';
  if (level === 1) return 'oc-level-1';
  if (level === 2) return 'oc-level-2';
  if (level === 3) return 'oc-level-3';
  return 'oc-level-deep';
};

const OrgChartPro = ({
  employees = [],
  loading = false,
  onEmployeeClick,
  externalSearch = '',
  canEditHierarchy = false,
}) => {
  const [displayMode, setDisplayMode] = useState('chart'); // 'chart' | 'structure' | 'departments'
  const [presentationMode, setPresentationMode] = useState(true);
  const [zoom, setZoom] = useState(0.85);
  const [collapsed, setCollapsed] = useState(() => new Set());
  const [draggedId, setDraggedId] = useState(null);
  const [dragOverId, setDragOverId] = useState(null);
  const [rootDragOver, setRootDragOver] = useState(false);
  const [localSearch, setLocalSearch] = useState('');
  const [focusNodeId, setFocusNodeId] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [showHealth, setShowHealth] = useState(false);
  const viewportRef = useRef(null);
  const canvasRef = useRef(null);

  const { success, error: showError } = useToast();
  const updateManager = useUpdateReportingManager();

  const searchTerm = (externalSearch || localSearch).trim();
  const treeData = useMemo(() => buildOrgTree(employees), [employees]);
  const { map, roots, managerIds, brokenLinks, flatByLevel, stats } = treeData;
  const orgHealth = useMemo(() => computeOrgHealth(employees, treeData), [employees, treeData]);
  const focusRoot = useMemo(() => getFocusRoot(map, focusNodeId), [map, focusNodeId]);
  const displayRoots = focusRoot ? [focusRoot] : roots;
  const focusNode = focusNodeId ? map.get(String(focusNodeId)) : null;

  // When searching, auto-expand every ancestor on the path to each match.
  useEffect(() => {
    if (!searchTerm) return;
    const toExpand = new Set();
    flatByLevel.forEach((node) => {
      if (nodeMatchesQuery(node, searchTerm)) {
        getAncestorIds(node).forEach((id) => toExpand.add(id));
      }
    });
    if (toExpand.size) {
      setCollapsed((prev) => {
        const next = new Set(prev);
        toExpand.forEach((id) => next.delete(id));
        return next;
      });
    }
  }, [searchTerm, flatByLevel]);

  const forbiddenTargets = useMemo(() => {
    if (!draggedId) return new Set();
    const blocked = new Set([String(draggedId)]);
    const node = map.get(String(draggedId));
    const walk = (n) => n.directReports.forEach((c) => { blocked.add(String(c.id)); walk(c); });
    if (node) walk(node);
    return blocked;
  }, [draggedId, map]);

  const isMatch = useCallback((node) => nodeMatchesQuery(node, searchTerm), [searchTerm]);

  const isOnMatchPath = useCallback(
    (node) => {
      if (!searchTerm) return false;
      if (isMatch(node)) return true;
      return node.directReports.some((c) => isOnMatchPath(c));
    },
    [searchTerm, isMatch]
  );

  const toggleCollapse = (id) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      const key = String(id);
      if (next.has(key)) next.delete(key);
      else next.add(key);
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

  const zoomIn = () => setZoom((z) => Math.min(1.25, +(z + 0.05).toFixed(2)));
  const zoomOut = () => setZoom((z) => Math.max(0.55, +(z - 0.05).toFixed(2)));
  const resetZoom = () => setZoom(presentationMode ? 0.85 : 1);

  const fitToView = useCallback(() => {
    const viewport = viewportRef.current;
    const canvas = canvasRef.current;
    if (!viewport || !canvas) return;
    const pad = 64;
    const scaleW = (viewport.clientWidth - pad) / canvas.scrollWidth;
    const scaleH = (viewport.clientHeight - pad) / canvas.scrollHeight;
    const scale = Math.min(scaleW, scaleH, 1);
    // Keep cards readable — never shrink below 55% (scroll horizontally instead)
    setZoom(Math.max(0.55, Math.min(1, +scale.toFixed(2))));
  }, []);

  // Auto-fit once the chart renders so HR sees a sensible first view
  useEffect(() => {
    if (loading || displayMode !== 'chart' || !displayRoots.length) return;
    const timer = setTimeout(fitToView, 120);
    return () => clearTimeout(timer);
  }, [loading, displayMode, displayRoots.length, collapsed, presentationMode, focusNodeId, fitToView]);

  const handleExport = async () => {
    if (!viewportRef.current || exporting) return;
    setExporting(true);
    try {
      await exportOrgChartAsPng(
        viewportRef.current,
        `udrive-org-chart-${new Date().toISOString().slice(0, 10)}.png`
      );
      success('Exported', 'Org chart saved as PNG');
    } catch {
      showError('Export failed', 'Could not generate image. Try zooming out and retry.');
    } finally {
      setExporting(false);
    }
  };

  const enterFocus = (nodeId) => {
    setFocusNodeId(String(nodeId));
    setCollapsed(new Set());
    setTimeout(fitToView, 150);
  };

  const exitFocus = () => {
    setFocusNodeId(null);
    setTimeout(fitToView, 150);
  };

  const NodeCard = ({ node, isRoot }) => {
    const id = String(node.id);
    const hasReports = node.directReports.length > 0;
    const isCollapsed = collapsed.has(id);
    const isDragging = draggedId === id;
    const isDropTarget = dragOverId === id && !forbiddenTargets.has(id);
    const isForbidden = draggedId && forbiddenTargets.has(id) && !isDragging;
    const matched = isMatch(node);
    const onPath = searchTerm && isOnMatchPath(node);
    const dimmedBySearch = searchTerm && !onPath;
    const PositionIcon = getPositionIcon(node.position || node.designation);
    const roleLabel = node.position || node.designation || 'No position';
    const levelClass = getLevelClass(node.level, isRoot);
    const placement = resolveEmployeePlacement(node);

    return (
      <div
        draggable={canEditHierarchy}
        onDragStart={canEditHierarchy ? (e) => handleDragStart(e, id) : undefined}
        onDragEnd={canEditHierarchy ? clearDragState : undefined}
        onDragOver={canEditHierarchy ? (e) => allowDrop(e, id) : undefined}
        onDragLeave={canEditHierarchy ? () => setDragOverId((prev) => (prev === id ? null : prev)) : undefined}
        onDrop={canEditHierarchy ? (e) => handleDropOnNode(e, id) : undefined}
        className={`oc-card relative select-none transition-all duration-150 ${canEditHierarchy ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'} ${levelClass}
          ${isDropTarget ? 'oc-drop-target -translate-y-0.5' : ''}
          ${isDragging ? 'opacity-40' : ''}
          ${isForbidden ? 'opacity-30' : ''}
          ${matched ? 'oc-match' : ''}
          ${onPath && !matched ? 'ring-2 ring-blue-300/60 dark:ring-blue-600/60' : ''}
          ${dimmedBySearch ? 'opacity-35' : ''}
          hover:shadow-xl`}
      >
        <div className={`oc-card-accent bg-gradient-to-r ${getDepartmentColor(node.department)}`} />

        {isRoot && (
          <span className="absolute -top-4 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[11px] font-bold shadow-md border-2 border-white dark:border-gray-800">
            <Crown className="w-3.5 h-3.5" /> TOP LEVEL
          </span>
        )}

        <div className="p-4">
          <div className="flex items-start gap-3">
            {canEditHierarchy && (
              <GripVertical className="w-4 h-4 text-gray-300 dark:text-gray-600 flex-shrink-0 mt-4" />
            )}
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900 dark:to-indigo-900 flex items-center justify-center overflow-hidden ring-[3px] ring-white dark:ring-gray-700 shadow-md flex-shrink-0">
              {node.profile_picture || node.photo_url ? (
                <img src={node.profile_picture || node.photo_url} alt={node.full_name} className="w-full h-full object-cover" />
              ) : (
                <User className="w-7 h-7 text-blue-600 dark:text-blue-400" />
              )}
            </div>
            <button type="button" onClick={() => onEmployeeClick?.(node)} className="min-w-0 flex-1 text-left" title={node.full_name}>
              <div className="flex items-start gap-1.5">
                <PositionIcon className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <span className="oc-card-name text-gray-900 dark:text-white">{node.full_name}</span>
              </div>
              <p className="oc-card-role text-gray-600 dark:text-gray-400 mt-1">{roleLabel}</p>
              <span className="inline-flex mt-2 text-[11px] font-bold px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                Level {node.level + 1}
              </span>
            </button>
          </div>

          <div className="mt-3 pt-3 border-t-2 border-gray-100 dark:border-gray-700">
            {isRoot && !node.brokenManager ? (
              <p className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1.5">
                <Crown className="w-3.5 h-3.5" /> Top of company hierarchy
              </p>
            ) : (
              <p className="text-xs text-gray-700 dark:text-gray-300 leading-snug">
                <span className="font-medium text-gray-500 dark:text-gray-400">Reports to </span>
                <span className="font-bold text-gray-900 dark:text-white">{node.managerName || 'Unknown'}</span>
                {node.brokenManager && (
                  <span className="text-amber-600 dark:text-amber-400 text-[11px]"> (inactive manager)</span>
                )}
              </p>
            )}
          </div>

          <div className="mt-3 flex items-center justify-between gap-2 flex-wrap">
            <div className="flex flex-wrap gap-1.5">
              <span className={`text-[11px] px-2.5 py-1 rounded-lg font-bold text-white bg-gradient-to-r ${getDepartmentColor(node.department)}`}>
                {node.department || 'Unassigned'}
              </span>
              {placement.branchLabel && (
                <span className="text-[10px] px-2 py-1 rounded-lg font-bold bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                  {placement.branchLabel}
                </span>
              )}
            </div>
            {hasReports && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-900/30 px-2.5 py-1 rounded-lg border border-indigo-200 dark:border-indigo-800">
                <Users className="w-3.5 h-3.5" />
                {node.directReports.length} direct
                {node.totalReports > node.directReports.length && (
                  <span className="opacity-70"> · {node.totalReports} total</span>
                )}
              </span>
            )}
          </div>

          {hasReports && !focusNodeId && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); enterFocus(id); }}
              className="mt-3 w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[11px] font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50/80 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors"
              title="Show only this manager's team"
            >
              <Focus className="w-3.5 h-3.5" /> Focus team
            </button>
          )}
        </div>

        {hasReports && (
          <button
            onClick={(e) => { e.stopPropagation(); toggleCollapse(id); }}
            className="oc-expand-btn absolute -bottom-4 left-1/2 -translate-x-1/2 flex items-center justify-center text-gray-600 hover:text-indigo-600 hover:border-indigo-400 transition-colors z-10"
            title={isCollapsed ? `Show ${node.directReports.length} direct reports` : 'Hide direct reports'}
          >
            {isCollapsed ? <Plus className="w-4 h-4" /> : <Minus className="w-4 h-4" />}
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

  const StructureRow = ({ node, depth = 0 }) => {
    const id = String(node.id);
    const hasReports = node.directReports.length > 0;
    const isCollapsed = collapsed.has(id);
    const matched = isMatch(node);
    const onPath = searchTerm && isOnMatchPath(node);
    const PositionIcon = getPositionIcon(node.position || node.designation);

    return (
      <div className="select-none">
        <div
          className={`flex items-center gap-3 py-2.5 px-3 rounded-xl border transition-colors
            ${matched ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800' : 'border-transparent hover:bg-gray-50 dark:hover:bg-gray-800/60'}
            ${onPath && !matched ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}
          style={{ marginLeft: depth * 28 }}
        >
          {hasReports ? (
            <button
              onClick={() => toggleCollapse(id)}
              className="w-6 h-6 rounded-md bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-500 hover:text-blue-600 flex-shrink-0"
            >
              {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </button>
          ) : (
            <span className="w-6 h-6 flex items-center justify-center text-gray-300 dark:text-gray-600 flex-shrink-0">•</span>
          )}

          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900 dark:to-indigo-900 flex items-center justify-center overflow-hidden flex-shrink-0">
            {node.profile_picture || node.photo_url ? (
              <img src={node.profile_picture || node.photo_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            )}
          </div>

          <button type="button" onClick={() => onEmployeeClick?.(node)} className="flex-1 min-w-0 text-left">
            <div className="flex items-center gap-2 flex-wrap">
              <PositionIcon className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span className="font-semibold text-sm text-gray-900 dark:text-white">{node.full_name}</span>
              <span className="text-xs text-gray-500 dark:text-gray-400">{node.position || node.designation || '—'}</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full text-white bg-gradient-to-r ${getDepartmentColor(node.department)}`}>
                {node.department || 'Unassigned'}
              </span>
              <span className="text-[10px] text-gray-400">L{node.level + 1}</span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {node.level === 0 && !node.brokenManager ? (
                <span className="text-emerald-600 dark:text-emerald-400 font-medium">Top level — no manager</span>
              ) : (
                <>
                  Reports to <span className="font-semibold text-gray-700 dark:text-gray-300">{node.managerName || 'Unknown'}</span>
                  {node.reportingChainNames.length > 0 && (
                    <span className="text-gray-400"> · via {node.reportingChainNames.join(' → ')}</span>
                  )}
                </>
              )}
              {hasReports && (
                <span className="ml-2 text-blue-600 dark:text-blue-400">
                  · {node.directReports.length} direct report{node.directReports.length !== 1 ? 's' : ''}
                </span>
              )}
            </p>
          </button>
        </div>

        {hasReports && !isCollapsed && (
          <>
            {node.directReports.map((child) => (
              <StructureRow key={child.id} node={child} depth={depth + 1} />
            ))}
          </>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex flex-wrap justify-center gap-6 py-10">
        {[1, 2, 3].map((i) => (
          <div key={i} className="w-64 h-32 bg-gray-100 dark:bg-gray-700 rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (!employees?.length) {
    return (
      <div className="text-center py-12">
        <Users className="w-10 h-10 text-gray-400 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Employees Found</h3>
        <p className="text-gray-600 dark:text-gray-400">No active employees found in the system.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header + stats */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
              <GitBranch className="w-5 h-5 text-white" />
            </span>
            Full Reporting Structure
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Complete hierarchy — who reports to whom, from top level down through every team.
          </p>
          <div className="flex flex-wrap gap-3 mt-3">
            {[
              { label: 'Employees', value: stats.total },
              { label: 'Levels', value: stats.maxDepth },
              { label: 'Top level', value: stats.topLevel },
              { label: 'Managers', value: stats.managers },
            ].map(({ label, value }) => (
              <span key={label} className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                <span className="text-blue-600 dark:text-blue-400">{value}</span> {label}
              </span>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* View toggle */}
          <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 rounded-xl p-1">
            <button
              onClick={() => setDisplayMode('chart')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                displayMode === 'chart'
                  ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <GitBranch className="w-4 h-4" /> Org chart
            </button>
            <button
              onClick={() => setDisplayMode('structure')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                displayMode === 'structure'
                  ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <ListTree className="w-4 h-4" /> Reporting list
            </button>
            <button
              onClick={() => setDisplayMode('departments')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                displayMode === 'departments'
                  ? 'bg-white dark:bg-gray-600 text-violet-600 dark:text-violet-400 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <Building2 className="w-4 h-4" /> Dept & branches
            </button>
          </div>

          {!externalSearch && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                placeholder="Find in hierarchy..."
                className="w-44 pl-9 pr-8 py-2 rounded-xl border-2 border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white text-sm focus:ring-2 focus:ring-blue-500"
              />
              {localSearch && (
                <button onClick={() => setLocalSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          )}

          <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 rounded-xl p-1">
            <button onClick={expandAll} title="Expand all branches" className="p-2 rounded-lg text-gray-500 hover:text-blue-600 hover:bg-white dark:hover:bg-gray-600">
              <ChevronDown className="w-4 h-4" />
            </button>
            <button onClick={collapseAll} title="Collapse all branches" className="p-2 rounded-lg text-gray-500 hover:text-blue-600 hover:bg-white dark:hover:bg-gray-600">
              <ChevronUp className="w-4 h-4" />
            </button>
          </div>

          {displayMode === 'chart' && (
            <>
              <button
                onClick={() => setPresentationMode((v) => !v)}
                title="HR presentation mode — larger cards and thicker borders"
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all border-2 ${
                  presentationMode
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:border-indigo-300'
                }`}
              >
                <Presentation className="w-4 h-4" /> HR view
              </button>
              <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 rounded-xl p-1">
              <button onClick={zoomOut} className="p-2 rounded-lg text-gray-500 hover:text-blue-600 hover:bg-white dark:hover:bg-gray-600">
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="text-xs font-semibold text-gray-600 dark:text-gray-300 w-10 text-center">{Math.round(zoom * 100)}%</span>
              <button onClick={zoomIn} className="p-2 rounded-lg text-gray-500 hover:text-blue-600 hover:bg-white dark:hover:bg-gray-600">
                <ZoomIn className="w-4 h-4" />
              </button>
              <button onClick={resetZoom} title="Reset zoom" className="p-2 rounded-lg text-gray-500 hover:text-blue-600 hover:bg-white dark:hover:bg-gray-600">
                <Maximize2 className="w-4 h-4" />
              </button>
              <button onClick={fitToView} title="Fit entire structure" className="px-2 py-2 rounded-lg text-xs font-semibold text-gray-500 hover:text-blue-600 hover:bg-white dark:hover:bg-gray-600">
                Fit all
              </button>
              <button
                onClick={handleExport}
                disabled={exporting}
                title="Download org chart as PNG"
                className="p-2 rounded-lg text-gray-500 hover:text-blue-600 hover:bg-white dark:hover:bg-gray-600 disabled:opacity-50"
              >
                {exporting ? <RotateCcw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              </button>
            </div>
            </>
          )}

          {orgHealth.issues > 0 && (
            <button
              type="button"
              onClick={() => setShowHealth((v) => !v)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border-2 transition-all ${
                showHealth
                  ? 'bg-amber-600 text-white border-amber-600'
                  : 'bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200 border-amber-200 dark:border-amber-800'
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
              {orgHealth.issues} data issue{orgHealth.issues !== 1 ? 's' : ''}
            </button>
          )}
        </div>
      </div>

      {showHealth && orgHealth.issues > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 rounded-2xl border-2 border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/10 p-4">
          {orgHealth.brokenLinks > 0 && (
            <div className="text-sm text-amber-900 dark:text-amber-100">
              <span className="font-bold">{orgHealth.brokenLinks}</span> broken manager link{orgHealth.brokenLinks !== 1 ? 's' : ''}
            </div>
          )}
          {orgHealth.noDepartment > 0 && (
            <div className="text-sm text-amber-900 dark:text-amber-100">
              <span className="font-bold">{orgHealth.noDepartment}</span> without department
            </div>
          )}
          {orgHealth.multipleTopLevel > 1 && (
            <div className="text-sm text-amber-900 dark:text-amber-100">
              <span className="font-bold">{orgHealth.multipleTopLevel}</span> top-level roots
            </div>
          )}
          {orgHealth.noManager > 0 && (
            <div className="text-sm text-amber-900 dark:text-amber-100">
              <span className="font-bold">{orgHealth.noManager}</span> with no manager set
            </div>
          )}
        </div>
      )}

      {brokenLinks.length > 0 && (
        <div className="flex items-start gap-2 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 px-4 py-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-amber-800 dark:text-amber-200">
            <span className="font-semibold">{brokenLinks.length} employee{brokenLinks.length !== 1 ? 's' : ''}</span>{' '}
            ha{brokenLinks.length !== 1 ? 've' : 's'} a manager who is not in the active employee list — shown at top level with a warning.
            {brokenLinks.slice(0, 3).map((e) => e.full_name).join(', ')}
            {brokenLinks.length > 3 && ` +${brokenLinks.length - 3} more`}
          </div>
        </div>
      )}

      {displayMode === 'chart' && (
        <>
          {focusNode && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 border-2 border-indigo-200 dark:border-indigo-800 px-4 py-3">
              <div className="flex items-center gap-2 text-sm text-indigo-900 dark:text-indigo-100">
                <Focus className="w-4 h-4 flex-shrink-0" />
                <span>
                  Focused on <strong>{focusNode.full_name}</strong>
                  {' '}({focusNode.directReports.length} direct · {focusNode.totalReports} total in subtree)
                </span>
              </div>
              <button
                type="button"
                onClick={exitFocus}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-white dark:bg-gray-800 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-700 hover:bg-indigo-100 dark:hover:bg-indigo-900/40"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Show full org
              </button>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3 px-1">
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Border colors:</span>
            {ORG_LEGEND.map(({ label, className, isMatch }) => (
              <span key={label} className="inline-flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-300">
                <span
                  className={`oc-swatch ${isMatch ? 'oc-match' : className}`}
                  aria-hidden
                />
                {label}
              </span>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex items-start gap-2 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/40 px-3 py-2.5 flex-1">
              <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-blue-800 dark:text-blue-200">
                {canEditHierarchy
                  ? 'Drag a card onto another to change reporting lines, or drop on the zone below to make someone top level. Use Focus team on managers with large teams.'
                  : 'View-only mode. Contact HR or admin to update reporting lines.'}
              </p>
              {!canEditHierarchy && <Lock className="w-4 h-4 text-blue-500 flex-shrink-0" />}
            </div>
            {canEditHierarchy && (
            <div
              onDragOver={(e) => { if (!draggedId) return; e.preventDefault(); setRootDragOver(true); }}
              onDragLeave={() => setRootDragOver(false)}
              onDrop={(e) => { e.preventDefault(); if (draggedId) reassign(draggedId, null); }}
              className={`flex items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-2.5 text-xs font-semibold transition-all sm:w-64
                ${rootDragOver
                  ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700'
                  : 'border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400'}`}
            >
              <Crown className="w-4 h-4" /> Drop here = remove manager
            </div>
            )}
          </div>

          <div className="h-5">
            {updateManager.isPending && (
              <span className="inline-flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
                <RotateCcw className="w-4 h-4 animate-spin" /> Saving...
              </span>
            )}
          </div>

          <div className="flex items-center justify-between gap-2 text-xs text-gray-500 dark:text-gray-400 px-1">
            <span>Scroll horizontally and vertically to explore the full org. Use <strong>HR view</strong> for onboarding presentations.</span>
            {zoom <= 0.6 && (
              <span className="text-amber-600 dark:text-amber-400 font-semibold shrink-0">Tip: zoom in for readable names</span>
            )}
          </div>

          <div
            ref={viewportRef}
            className={`oc-viewport rounded-3xl border-2 border-gray-300 dark:border-gray-600 min-h-[480px] max-h-[75vh] ${presentationMode ? 'oc-presentation' : ''}`}
          >
            <div ref={canvasRef} className="oc-canvas" style={{ transform: `scale(${zoom})` }}>
              <div className="oc-tree">
                <ul>
                  {displayRoots.map((node) => (
                    <NodeLi key={node.id} node={node} isRoot />
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </>
      )}

      {displayMode === 'structure' && (
        <div className="rounded-2xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 max-h-[75vh] overflow-y-auto">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 px-1">
            Complete reporting tree — every employee with their manager and full chain from the top.
          </p>
          {roots.map((root) => (
            <StructureRow key={root.id} node={root} depth={0} />
          ))}
        </div>
      )}

      {displayMode === 'departments' && (
        <DepartmentHierarchyView
          employees={employees}
          loading={loading}
          externalSearch={externalSearch}
          onEmployeeClick={onEmployeeClick}
        />
      )}
    </div>
  );
};

export default OrgChartPro;
