import React, { useMemo, useState } from 'react';
import {
  Building2, ChevronDown, ChevronRight, User, Search, X,
  Layers, Cpu, Box, Radio, Database
} from 'lucide-react';
import { buildDepartmentHierarchy } from '../utils/buildDepartmentHierarchy';
import { nodeMatchesQuery } from '../utils/buildOrgTree';

const DEPARTMENT_ALWAYS_SHOW = new Set(['TECHNOLOGY']);

const BRANCH_ICONS = {
  PRODUCT: Box,
  IT: Cpu,
  IOT: Radio,
  DATA_BI: Database,
  DEFAULT: Layers,
};

const BRANCH_STYLES = {
  PRODUCT: { gradient: 'from-violet-500 to-purple-600', border: 'border-violet-200 dark:border-violet-800' },
  IT: { gradient: 'from-blue-500 to-indigo-600', border: 'border-blue-200 dark:border-blue-800' },
  IOT: { gradient: 'from-teal-500 to-cyan-600', border: 'border-teal-200 dark:border-teal-800' },
  DATA_BI: { gradient: 'from-indigo-500 to-blue-600', border: 'border-indigo-200 dark:border-indigo-800' },
  DEFAULT: { gradient: 'from-gray-500 to-slate-600', border: 'border-gray-200 dark:border-gray-700' },
};

const DepartmentHierarchyView = ({ employees = [], loading = false, externalSearch = '', onEmployeeClick, hierarchy }) => {
  const [expandedParents, setExpandedParents] = useState(() => new Set(['TECHNOLOGY']));
  const [expandedBranches, setExpandedBranches] = useState(() => new Set());
  const [localSearch, setLocalSearch] = useState('');

  const searchTerm = (externalSearch || localSearch).trim().toLowerCase();
  const { parents, stats } = useMemo(() => buildDepartmentHierarchy(employees, hierarchy), [employees, hierarchy]);

  const toggleParent = (key) => {
    setExpandedParents((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const toggleBranch = (parentKey, branchKey) => {
    const id = `${parentKey}:${branchKey}`;
    setExpandedBranches((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const expandAll = () => {
    setExpandedParents(new Set(parents.map((p) => p.key)));
    const allBranches = parents.flatMap((p) => p.branches.map((b) => `${p.key}:${b.key}`));
    setExpandedBranches(new Set(allBranches));
  };

  const empMatches = (emp) => {
    if (!searchTerm) return true;
    return nodeMatchesQuery(emp, searchTerm);
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-40 rounded-2xl bg-gray-100 dark:bg-gray-700 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" />
            </span>
            Department & Branch Hierarchy
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Parent departments, sub-branches (e.g. Technology → Product, IT, IoT, Data & BI), and who works in each team.
          </p>
          <div className="flex flex-wrap gap-2 mt-3">
            {[
              { label: 'Departments', value: stats.parentCount },
              { label: 'Active branches', value: stats.branchCount },
              { label: 'Employees mapped', value: stats.totalEmployees },
            ].map(({ label, value }) => (
              <span key={label} className="text-xs font-bold px-3 py-1.5 rounded-full bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800">
                {value} {label}
              </span>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {!externalSearch && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                placeholder="Search department or person..."
                className="w-52 pl-9 pr-8 py-2 rounded-xl border-2 border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white text-sm"
              />
              {localSearch && (
                <button onClick={() => setLocalSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
          <button
            onClick={expandAll}
            className="px-3 py-2 rounded-xl text-xs font-bold bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-violet-100 dark:hover:bg-violet-900/30"
          >
            Expand all
          </button>
        </div>
      </div>

      {/* Technology highlight — user's example */}
      <div className="rounded-2xl border-2 border-indigo-200 dark:border-indigo-800 bg-gradient-to-r from-indigo-50 via-blue-50 to-violet-50 dark:from-indigo-950/40 dark:via-blue-950/30 dark:to-violet-950/40 p-4">
        <p className="text-sm font-bold text-indigo-900 dark:text-indigo-200 mb-2 flex items-center gap-2">
          <Cpu className="w-4 h-4" /> Technology department branches
        </p>
        <div className="flex flex-wrap gap-2">
          {['Product', 'IT', 'IoT', 'Data Analytics & Business Intelligence'].map((label) => (
            <span key={label} className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-white/80 dark:bg-gray-800/80 border border-indigo-200 dark:border-indigo-700 text-indigo-800 dark:text-indigo-200 shadow-sm">
              {label}
            </span>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {parents.map((parent) => {
          const isOpen = expandedParents.has(parent.key);
          const visibleBranches = parent.branches.filter(
            (b) => b.count > 0 || parent.key === 'TECHNOLOGY' || DEPARTMENT_ALWAYS_SHOW.has(parent.key)
          );
          const filteredCount = parent.branches.reduce(
            (n, b) => n + b.employees.filter(empMatches).length,
            0
          );
          if (searchTerm && filteredCount === 0) return null;

          return (
            <div
              key={parent.key}
              className="rounded-2xl border-2 border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm bg-white dark:bg-gray-800"
            >
              <button
                type="button"
                onClick={() => toggleParent(parent.key)}
                className={`w-full flex items-center justify-between gap-4 px-5 py-4 bg-gradient-to-r ${parent.gradient} text-white text-left`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-11 h-11 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-lg font-bold truncate">{parent.label}</h3>
                    <p className="text-sm text-white/80 truncate">{parent.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-white/20">
                    {parent.employeeCount} people · {parent.branches.filter((b) => b.count > 0).length} branches
                  </span>
                  {isOpen ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                </div>
              </button>

              {isOpen && (
                <div className="p-4 sm:p-5 bg-gray-50/80 dark:bg-gray-900/40">
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                    {visibleBranches.map((branch) => {
                      const branchId = `${parent.key}:${branch.key}`;
                      const branchOpen = expandedBranches.has(branchId) || branch.count <= 6;
                      const BranchIcon = BRANCH_ICONS[branch.key] || BRANCH_ICONS.DEFAULT;
                      const branchStyle = BRANCH_STYLES[branch.key] || BRANCH_STYLES.DEFAULT;
                      const visibleEmployees = branch.employees.filter(empMatches);

                      if (searchTerm && visibleEmployees.length === 0) return null;

                      return (
                        <div
                          key={branch.key}
                          className={`rounded-xl border-2 bg-white dark:bg-gray-800 overflow-hidden shadow-sm ${branchStyle.border}`}
                        >
                          <button
                            type="button"
                            onClick={() => toggleBranch(parent.key, branch.key)}
                            className={`w-full flex items-center justify-between gap-3 px-4 py-3 bg-gradient-to-r ${branchStyle.gradient} text-white`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <BranchIcon className="w-5 h-5 flex-shrink-0" />
                              <span className="font-bold text-sm truncate">{branch.label}</span>
                            </div>
                            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-white/25 flex-shrink-0">
                              {branch.count} {branch.count === 1 ? 'member' : 'members'}
                            </span>
                          </button>

                          {branchOpen && (
                            <div className="p-3 space-y-2 max-h-80 overflow-y-auto">
                              {visibleEmployees.length === 0 ? (
                                <p className="text-xs text-gray-400 italic px-2 py-4 text-center">No employees in this branch yet</p>
                              ) : (
                                visibleEmployees.map((emp) => (
                                  <button
                                    key={emp.id}
                                    type="button"
                                    onClick={() => onEmployeeClick?.(emp)}
                                    className="w-full flex items-center gap-3 p-3 rounded-xl border-2 border-gray-100 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-600 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/20 transition-all text-left group"
                                  >
                                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center overflow-hidden flex-shrink-0 ring-2 ring-white dark:ring-gray-800">
                                      {emp.profile_picture || emp.photo_url ? (
                                        <img src={emp.profile_picture || emp.photo_url} alt="" className="w-full h-full object-cover" />
                                      ) : (
                                        <User className="w-5 h-5 text-gray-500" />
                                      )}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <p className="font-semibold text-sm text-gray-900 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                                        {emp.full_name}
                                      </p>
                                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                        {emp.position || emp.designation || '—'}
                                      </p>
                                      {emp.reporting_manager?.full_name && (
                                        <p className="text-[11px] text-gray-400 mt-0.5 truncate">
                                          Reports to {emp.reporting_manager.full_name}
                                        </p>
                                      )}
                                    </div>
                                  </button>
                                ))
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DepartmentHierarchyView;
