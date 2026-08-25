import React, { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import {
  Users, User, ChevronDown, ChevronUp, GripVertical, Crown, Shield, Zap,
  UserCheck, TrendingUp, Search, X, ZoomIn, ZoomOut,
  RotateCcw, Plus, Minus, GitBranch, ListTree, AlertTriangle, Presentation, Building2,
  Focus, Download, ArrowLeft, HelpCircle
} from 'lucide-react';
import { useUpdateReportingManager } from '../hooks/useEmployees';
import { useToast } from '../context/ToastContext';
import {
  buildOrgTree, getAncestorIds, nodeMatchesQuery, getFocusRoot, computeOrgHealth,
  getSmartInitialCollapsed,
} from '../utils/buildOrgTree';
import { getDepartmentGradient } from '../utils/departmentColors';
import { resolveEmployeePlacement } from '../config/departmentHierarchy';
import DepartmentHierarchyView from './DepartmentHierarchyView';
import { exportOrgChartAsPng } from '../utils/exportOrgChart';
import './orgchart.css';

const ORG_LEGEND = [
  { label: 'Top level', className: 'oc-level-root' },
  { label: 'Direct reports', className: 'oc-level-1' },
  { label: 'Level 3', className: 'oc-level-2' },
  { label: 'Level 4+', className: 'oc-level-deep' },
  { label: 'Search match', className: 'oc-match', isMatch: true },
];

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
  embedded = true,
}) => {
  const [displayMode, setDisplayMode] = useState('chart');
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
  const [showGuide, setShowGuide] = useState(false);
  const viewportRef = useRef(null);
  const canvasRef = useRef(null);
  const collapseInitialized = useRef(false);

  const { success, error: showError } = useToast();
  const updateManager = useUpdateReportingManager();

  const searchTerm = (externalSearch || localSearch).trim();
  const treeData = useMemo(() => buildOrgTree(employees), [employees]);
  const { map, roots, managerIds, brokenLinks, flatByLevel, stats } = treeData;
  const orgHealth = useMemo(() => computeOrgHealth(employees, treeData), [employees, treeData]);
  const focusRoot = useMemo(() => getFocusRoot(map, focusNodeId), [map, focusNodeId]);
  const displayRoots = focusRoot ? [focusRoot] : roots;
  const focusNode = focusNodeId ? map.get(String(focusNodeId)) : null;
  const actualRootIds = useMemo(() => new Set(roots.map((r) => String(r.id))), [roots]);

  // Smart collapse on first load — keeps large orgs readable
  useEffect(() => {
    if (loading || collapseInitialized.current || !employees?.length) return;
    collapseInitialized.current = true;
    const initial = getSmartInitialCollapsed(treeData);
    if (initial.size) setCollapsed(initial);
  }, [loading, employees?.length, treeData]);

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

  // Auto-fit when chart context changes (not on every collapse toggle)
  useEffect(() => {
    if (loading || displayMode !== 'chart' || !displayRoots.length) return;
    const timer = setTimeout(fitToView, 150);
    return () => clearTimeout(timer);
  }, [loading, displayMode, displayRoots.length, presentationMode, focusNodeId, fitToView]);

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

  const NodeCard = ({ node, isActualRoot }) => {
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
    const levelClass = getLevelClass(node.level, isActualRoot);
    const placement = resolveEmployeePlacement(node);
    const deptGradient = getDepartmentGradient(node.department);

    return (
      <div
        draggable={canEditHierarchy}
        onDragStart={canEditHierarchy ? (e) => handleDragStart(e, id) : undefined}
        onDragEnd={canEditHierarchy ? clearDragState : undefined}
        onDragOver={canEditHierarchy ? (e) => allowDrop(e, id) : undefined}
        onDragLeave={canEditHierarchy ? () => setDragOverId((prev) => (prev === id ? null : prev)) : undefined}
        onDrop={canEditHierarchy ? (e) => handleDropOnNode(e, id) : undefined}
        className={`oc-card group/card relative select-none transition-all duration-150 ${canEditHierarchy ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'} ${levelClass}
          ${isDropTarget ? 'oc-drop-target -translate-y-0.5' : ''}
          ${isDragging ? 'opacity-40' : ''}
          ${isForbidden ? 'opacity-30' : ''}
          ${matched ? 'oc-match' : ''}
          ${onPath && !matched ? 'ring-2 ring-blue-300/60 dark:ring-blue-600/60' : ''}
          ${dimmedBySearch ? 'opacity-35' : ''}
          hover:shadow-xl hover:-translate-y-0.5`}
      >
        <div className={`oc-card-accent bg-gradient-to-r ${deptGradient}`} />

        {isActualRoot && (
          <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[10px] font-bold shadow-md border-2 border-white dark:border-gray-800">
            <Crown className="w-3 h-3" /> TOP
          </span>
        )}

        {hasReports && !focusNodeId && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); enterFocus(id); }}
            className="absolute top-2 right-2 p-1.5 rounded-lg bg-white/90 dark:bg-gray-800/90 border border-indigo-200 dark:border-indigo-700 text-indigo-600 dark:text-indigo-400 opacity-0 group-hover/card:opacity-100 transition-opacity shadow-sm hover:bg-indigo-50 dark:hover:bg-indigo-900/40 z-10"
            title="Focus on this team"
          >
            <Focus className="w-3.5 h-3.5" />
          </button>
        )}

        <div className="p-3.5">
          <div className="flex items-start gap-2.5">
            {canEditHierarchy && (
              <GripVertical className="w-3.5 h-3.5 text-gray-300 dark:text-gray-600 flex-shrink-0 mt-3 opacity-0 group-hover/card:opacity-100 transition-opacity" />
            )}
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-600 flex items-center justify-center overflow-hidden ring-2 ring-white dark:ring-gray-600 shadow-sm flex-shrink-0">
              {node.profile_picture || node.photo_url ? (
                <img src={node.profile_picture || node.photo_url} alt={node.full_name} className="w-full h-full object-cover" />
              ) : (
                <User className="w-6 h-6 text-slate-500 dark:text-slate-300" />
              )}
            </div>
            <button type="button" onClick={() => onEmployeeClick?.(node)} className="min-w-0 flex-1 text-left" title={node.full_name}>
              <div className="flex items-start gap-1">
                <PositionIcon className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 flex-shrink-0 mt-0.5" />
                <span className="oc-card-name text-gray-900 dark:text-white">{node.full_name}</span>
              </div>
              <p className="oc-card-role text-gray-500 dark:text-gray-400 mt-0.5">{roleLabel}</p>
            </button>
          </div>

          {!isActualRoot && (
            <p className="mt-2 text-[11px] text-gray-600 dark:text-gray-400 leading-snug truncate">
              <span className="text-gray-400">Reports to </span>
              <span className="font-semibold text-gray-800 dark:text-gray-200">{node.managerName || 'Unknown'}</span>
              {node.brokenManager && (
                <span className="text-amber-600 dark:text-amber-400"> · inactive mgr</span>
              )}
            </p>
          )}

          <div className="mt-2.5 flex items-center justify-between gap-1.5 flex-wrap">
            <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold text-white bg-gradient-to-r ${deptGradient} truncate max-w-[140px]`}>
              {node.department || 'Unassigned'}
            </span>
            {placement.branchLabel && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-md font-semibold bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 truncate max-w-[120px]">
                {placement.branchLabel}
              </span>
            )}
            {hasReports && (
              <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 ml-auto">
                <Users className="w-3 h-3" />
                {node.directReports.length}
                {node.totalReports > node.directReports.length && (
                  <span className="opacity-60">/{node.totalReports}</span>
                )}
              </span>
            )}
          </div>
        </div>

        {hasReports && (
          <button
            onClick={(e) => { e.stopPropagation(); toggleCollapse(id); }}
            className="oc-expand-btn absolute -bottom-3.5 left-1/2 -translate-x-1/2 flex items-center justify-center text-gray-600 hover:text-indigo-600 hover:border-indigo-400 transition-colors z-10"
            title={isCollapsed ? `Show ${node.directReports.length} direct reports` : 'Collapse team'}
          >
            {isCollapsed ? <Plus className="w-3.5 h-3.5" /> : <Minus className="w-3.5 h-3.5" />}
          </button>
        )}
      </div>
    );
  };

  const NodeLi = ({ node, isActualRoot = false }) => {
    const id = String(node.id);
    const hasReports = node.directReports.length > 0;
    const isCollapsed = collapsed.has(id);

    return (
      <li>
        <div className="oc-node-wrap">
          <NodeCard node={node} isActualRoot={isActualRoot} />
        </div>
        {hasReports && !isCollapsed && (
          <ul>
            {node.directReports.map((child) => (
              <NodeLi key={child.id} node={child} isActualRoot={false} />
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
              <span className={`text-[10px] px-2 py-0.5 rounded-full text-white bg-gradient-to-r ${getDepartmentGradient(node.department)}`}>
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
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="oc-toolbar sticky top-0 z-20 -mx-1 px-1 py-2 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-xl border border-gray-100 dark:border-gray-700/50">
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {!embedded && (
              <div className="mr-2">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Reporting structure</h2>
                <p className="text-xs text-gray-500">{stats.total} employees · {stats.maxDepth} levels</p>
              </div>
            )}
            <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 rounded-xl p-1">
              {[
                { id: 'chart', icon: GitBranch, label: 'Chart' },
                { id: 'structure', icon: ListTree, label: 'List' },
                { id: 'departments', icon: Building2, label: 'Departments' },
              ].map(({ id, icon: Icon, label }) => (
                <button
                  key={id}
                  onClick={() => setDisplayMode(id)}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    displayMode === id
                      ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                </button>
              ))}
            </div>

            {embedded && (
              <div className="hidden sm:flex flex-wrap gap-1.5">
                {[
                  { label: 'People', value: stats.total },
                  { label: 'Levels', value: stats.maxDepth },
                  { label: 'Managers', value: stats.managers },
                ].map(({ label, value }) => (
                  <span key={label} className="text-[11px] font-semibold px-2 py-1 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                    <span className="text-blue-600 dark:text-blue-400">{value}</span> {label}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {!externalSearch && (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  value={localSearch}
                  onChange={(e) => setLocalSearch(e.target.value)}
                  placeholder="Find in chart..."
                  className="w-36 pl-9 pr-8 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white text-xs focus:ring-2 focus:ring-blue-500"
                />
                {localSearch && (
                  <button onClick={() => setLocalSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}

            <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 rounded-xl p-1">
              <button onClick={expandAll} title="Expand all" className="p-1.5 rounded-lg text-gray-500 hover:text-blue-600 hover:bg-white dark:hover:bg-gray-600">
                <ChevronDown className="w-4 h-4" />
              </button>
              <button onClick={collapseAll} title="Collapse all" className="p-1.5 rounded-lg text-gray-500 hover:text-blue-600 hover:bg-white dark:hover:bg-gray-600">
                <ChevronUp className="w-4 h-4" />
              </button>
            </div>

            {displayMode === 'chart' && (
              <>
                <button
                  onClick={() => setPresentationMode((v) => !v)}
                  title="HR presentation mode"
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    presentationMode
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  <Presentation className="w-3.5 h-3.5" /> HR
                </button>
                <div className="flex items-center gap-0.5 bg-gray-100 dark:bg-gray-700 rounded-xl p-1">
                  <button onClick={zoomOut} className="p-1.5 rounded-lg text-gray-500 hover:text-blue-600 hover:bg-white dark:hover:bg-gray-600">
                    <ZoomOut className="w-4 h-4" />
                  </button>
                  <span className="text-[11px] font-semibold text-gray-600 dark:text-gray-300 w-9 text-center">{Math.round(zoom * 100)}%</span>
                  <button onClick={zoomIn} className="p-1.5 rounded-lg text-gray-500 hover:text-blue-600 hover:bg-white dark:hover:bg-gray-600">
                    <ZoomIn className="w-4 h-4" />
                  </button>
                  <button onClick={fitToView} title="Fit all" className="px-2 py-1.5 rounded-lg text-[11px] font-semibold text-gray-500 hover:text-blue-600 hover:bg-white dark:hover:bg-gray-600">
                    Fit
                  </button>
                  <button
                    onClick={handleExport}
                    disabled={exporting}
                    title="Export PNG"
                    className="p-1.5 rounded-lg text-gray-500 hover:text-blue-600 hover:bg-white dark:hover:bg-gray-600 disabled:opacity-50"
                  >
                    {exporting ? <RotateCcw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                  </button>
                </div>
              </>
            )}

            <button
              type="button"
              onClick={() => setShowGuide((v) => !v)}
              className={`p-1.5 rounded-lg transition-colors ${showGuide ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' : 'text-gray-500 hover:text-blue-600 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
              title="Show guide"
            >
              <HelpCircle className="w-4 h-4" />
            </button>

            {orgHealth.issues > 0 && (
              <button
                type="button"
                onClick={() => setShowHealth((v) => !v)}
                className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                  showHealth
                    ? 'bg-amber-600 text-white border-amber-600'
                    : 'bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200 border-amber-200 dark:border-amber-800'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                {orgHealth.issues}
              </button>
            )}
          </div>
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
          {orgHealth.multipleTopLevel > 0 && (
            <div className="text-sm text-amber-900 dark:text-amber-100">
              <span className="font-bold">{orgHealth.multipleTopLevel}</span> top-level root{orgHealth.multipleTopLevel !== 1 ? 's' : ''}
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
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 px-3 py-2">
              <div className="flex items-center gap-2 text-xs text-indigo-900 dark:text-indigo-100">
                <Focus className="w-3.5 h-3.5" />
                <span>Focused on <strong>{focusNode.full_name}</strong> · {focusNode.totalReports} in team</span>
              </div>
              <button type="button" onClick={exitFocus} className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-bold bg-white dark:bg-gray-800 text-indigo-700 border border-indigo-200 dark:border-indigo-700">
                <ArrowLeft className="w-3 h-3" /> Full org
              </button>
            </div>
          )}

          {!focusNode && stats.topLevel > 1 && (
            <div className="flex items-center gap-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 px-3 py-2 text-xs text-amber-800 dark:text-amber-200">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span><strong>{stats.topLevel} top-level employees</strong> — use Focus (hover a manager card) or assign a single reporting line for a cleaner chart.</span>
            </div>
          )}

          {showGuide && (
            <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40 p-3 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-semibold text-gray-500">Border colors:</span>
                {ORG_LEGEND.map(({ label, className, isMatch }) => (
                  <span key={label} className="inline-flex items-center gap-1 text-[11px] text-gray-600 dark:text-gray-300">
                    <span className={`oc-swatch ${isMatch ? 'oc-match' : className}`} />
                    {label}
                  </span>
                ))}
              </div>
              <p className="text-[11px] text-gray-600 dark:text-gray-400">
                {canEditHierarchy
                  ? 'Drag cards to reassign reporting lines. Hover a manager and click Focus to view their team only.'
                  : 'View-only. Contact HR or admin to update reporting lines.'}
              </p>
              {canEditHierarchy && (
                <div
                  onDragOver={(e) => { if (!draggedId) return; e.preventDefault(); setRootDragOver(true); }}
                  onDragLeave={() => setRootDragOver(false)}
                  onDrop={(e) => { e.preventDefault(); if (draggedId) reassign(draggedId, null); }}
                  className={`inline-flex items-center gap-1.5 rounded-lg border-2 border-dashed px-3 py-1.5 text-[11px] font-semibold ${
                    rootDragOver ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-gray-300 text-gray-500'
                  }`}
                >
                  <Crown className="w-3.5 h-3.5" /> Drop here to remove manager
                </div>
              )}
            </div>
          )}

          <div className="h-4">
            {updateManager.isPending && (
              <span className="inline-flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400">
                <RotateCcw className="w-3.5 h-3.5 animate-spin" /> Saving...
              </span>
            )}
          </div>

          <div
            ref={viewportRef}
            className={`oc-viewport rounded-2xl border border-gray-200 dark:border-gray-700 min-h-[520px] max-h-[78vh] ${presentationMode ? 'oc-presentation' : ''}`}
          >
            <div ref={canvasRef} className="oc-canvas" style={{ transform: `scale(${zoom})` }}>
              <div className="oc-tree">
                <ul>
                  {displayRoots.map((node) => (
                    <NodeLi
                      key={node.id}
                      node={node}
                      isActualRoot={focusNodeId ? false : actualRootIds.has(String(node.id))}
                    />
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
