// src/pages/EmployeeProfile.jsx
import { useParams, Link } from "react-router-dom";
import { useEffect, useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  User, Mail, Phone, MapPin, Calendar, Building, 
  Shield, Monitor, Briefcase, Edit, ArrowLeft,
  CheckCircle, AlertCircle, Clock, Star, Plus, Trash,
  Upload, Download, Target, Award, Heart, FileText,
  TrendingUp, BarChart3, PieChart, Activity, Users,
  GraduationCap, BookOpen, Clock3, AlertTriangle,
  ChevronDown, ChevronRight, Eye, EyeOff, Globe, X,
  Zap, Crown, Trophy, CalendarDays, MapPinIcon,
  Car, Package, CreditCard, ExternalLink, Laptop,
  Smartphone, LogIn, KeyRound, LayoutGrid, Search
} from "lucide-react";
import { supabase } from "../supabaseClient";
import { useAssets } from "../hooks/useApi";
import { useSimCardsByEmployeeIdentifiers } from "../hooks/useSimCards";
import { useAuth } from "../context/AuthContext";
import { canEditEmployees } from "../utils/permissions";
import { normalizeAccessList, toDbAccessList, ensureAccessEntryIds, newAccessEntryId } from "../utils/accessList";
import { isBlobUrlUnsafeForCurrentPage } from "../utils/imageUtils";
import EmployeeAttendancePanel from "../components/attendance/EmployeeAttendancePanel";
import EmployeeLeavePanel from "../components/leave/EmployeeLeavePanel";

const accessCardClass =
  "rounded-xl border border-indigo-200/80 dark:border-indigo-800/50 bg-indigo-50/40 dark:bg-indigo-950/20 overflow-hidden";

const sortAccessEntriesByName = (entries = []) =>
  [...entries].sort((a, b) =>
    String(a?.name ?? "")
      .trim()
      .localeCompare(String(b?.name ?? "").trim(), undefined, { sensitivity: "base" })
  );

const sortScopesForDisplay = (scopes = []) =>
  [...scopes].sort((a, b) =>
    String(a ?? "").localeCompare(String(b ?? ""), undefined, { sensitivity: "base" })
  );

/** Show search/filter when at least this many systems (keeps UI calm for short lists). */
const ACCESS_SEARCH_MIN = 5;

function SystemAccessEntryRow({
  entry,
  entryId,
  expanded,
  canEditAccess,
  scopesEditing,
  toggleScopesEditing,
  toggleAccessExpand,
  removeAccessEntry,
  removeScopeFromEntry,
  updateAccessEntryName,
  updateScopeInEntry,
  sortAccessEntriesState,
  addScopeToEntry,
  scopeDraft,
  setScopeDraft,
}) {
  const scopesSorted = sortScopesForDisplay(entry.scopes);
  const collapsedScopePreview =
    !expanded && scopesSorted.length > 0
      ? scopesSorted
          .slice(0, 2)
          .map((s) => String(s).trim())
          .filter(Boolean)
          .join(", ") + (scopesSorted.length > 2 ? "…" : "")
      : null;

  const panelId = `system-access-panel-${entryId}`;

  const headerRow = (
    <div className="flex items-stretch gap-1">
      <button
        id={`system-access-trigger-${entryId}`}
        type="button"
        onClick={() => toggleAccessExpand(entryId)}
        aria-expanded={expanded}
        aria-controls={panelId}
        className="flex flex-1 items-center gap-3 min-w-0 text-left px-4 py-3 hover:bg-indigo-100/50 dark:hover:bg-indigo-900/30 transition-colors"
      >
        {expanded ? (
          <ChevronDown className="w-4 h-4 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
        ) : (
          <ChevronRight className="w-4 h-4 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
        )}
        <span className="flex flex-col min-w-0 flex-1 text-left gap-0.5">
          <span className="font-medium text-gray-900 dark:text-gray-100 truncate">{entry.name}</span>
          {collapsedScopePreview ? (
            <span className="text-xs text-gray-500 dark:text-gray-400 truncate" title={collapsedScopePreview}>
              {collapsedScopePreview}
            </span>
          ) : null}
        </span>
        {entry.scopes.length > 0 && (
          <span className="text-xs font-medium text-indigo-700 dark:text-indigo-300 bg-indigo-100/80 dark:bg-indigo-900/40 px-2 py-0.5 rounded-lg flex-shrink-0">
            {entry.scopes.length} scope{entry.scopes.length === 1 ? "" : "s"}
          </span>
        )}
      </button>
      {canEditAccess && (
        <button
          type="button"
          onClick={() => removeAccessEntry(entryId)}
          className="px-3 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
          title="Remove access"
        >
          <Trash className="w-4 h-4" />
        </button>
      )}
    </div>
  );

  const expandedPanel = (
    <AnimatePresence initial={false}>
      {expanded && (
        <motion.div
          id={panelId}
          role="region"
          aria-labelledby={`system-access-trigger-${entryId}`}
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="border-t border-indigo-200/60 dark:border-indigo-800/40"
        >
          <div className="px-4 py-3 bg-white/60 dark:bg-gray-900/40">
            {canEditAccess ? (
              <div className="mb-3">
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide block mb-2">
                  System name
                </label>
                <input
                  type="text"
                  value={entry.name}
                  onChange={(e) => updateAccessEntryName(entryId, e.target.value)}
                  onBlur={sortAccessEntriesState}
                  placeholder="System name"
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm"
                />
              </div>
            ) : null}
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Roles & scope
              </p>
              {canEditAccess && entry.scopes.length > 0 && (
                <button
                  type="button"
                  onClick={() => toggleScopesEditing(entryId)}
                  className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  {scopesEditing ? "Done" : "Edit scopes"}
                </button>
              )}
            </div>
            {canEditAccess && !scopesEditing && entry.scopes.length > 0 ? (
              <div className="flex flex-wrap gap-2 mb-3">
                {scopesSorted.map((scope, si) => (
                  <span
                    key={`${entryId}-chip-${si}`}
                    className="inline-flex items-center max-w-full px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-100/90 dark:bg-indigo-900/50 text-indigo-900 dark:text-indigo-100 border border-indigo-200/80 dark:border-indigo-700/50 truncate"
                    title={scope}
                  >
                    {scope}
                  </span>
                ))}
              </div>
            ) : null}
            {(!canEditAccess || scopesEditing || entry.scopes.length === 0) && (
              <>
                {entry.scopes.length > 0 ? (
                  <div className="flex flex-col gap-2 mb-3">
                    {canEditAccess && scopesEditing
                      ? entry.scopes.map((scope, si) => (
                          <div
                            key={`${entry.id ?? "entry"}-scope-${si}`}
                            className="inline-flex items-center gap-2 pl-3 pr-1 py-1 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 text-sm text-gray-800 dark:text-gray-200"
                          >
                            <input
                              type="text"
                              value={scope}
                              onChange={(e) => updateScopeInEntry(entryId, si, e.target.value)}
                              placeholder="Scope / role name"
                              className="flex-1 min-w-0 px-2 py-1 rounded-md border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm"
                            />
                            <button
                              type="button"
                              onClick={() => removeScopeFromEntry(entryId, si)}
                              className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500"
                              aria-label={`Remove ${scope}`}
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))
                      : scopesSorted.map((scope, si) => (
                          <div
                            key={`${entry.id ?? "entry"}-scope-${si}`}
                            className="inline-flex items-center gap-2 pl-3 pr-2 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 text-sm text-gray-800 dark:text-gray-200"
                          >
                            <span>{scope}</span>
                          </div>
                        ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                    {canEditAccess
                      ? scopesEditing
                        ? "No roles or scope recorded yet. Add items below."
                        : "No roles or scope yet."
                      : "No roles or scope recorded for this system."}
                  </p>
                )}
                {canEditAccess && scopesEditing && (
                  <div className="flex flex-wrap gap-2">
                    <input
                      type="text"
                      value={scopeDraft[entryId] ?? ""}
                      onChange={(e) =>
                        setScopeDraft((d) => ({ ...d, [entryId]: e.target.value }))
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addScopeToEntry(entryId);
                        }
                      }}
                      placeholder="e.g. Exchange Online, SharePoint site…"
                      className="flex-1 min-w-[12rem] px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => addScopeToEntry(entryId)}
                      className="inline-flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700"
                    >
                      <Plus className="w-4 h-4" />
                      Add
                    </button>
                  </div>
                )}
                {canEditAccess && !scopesEditing && entry.scopes.length === 0 && (
                  <button
                    type="button"
                    onClick={() => toggleScopesEditing(entryId)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border border-indigo-200 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/30"
                  >
                    <Plus className="w-4 h-4" />
                    Add scopes
                  </button>
                )}
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <div className={accessCardClass}>
      {headerRow}
      {expandedPanel}
    </div>
  );
}

export default function EmployeeProfile() {
  const { id } = useParams();
  const { userProfile } = useAuth();
  const canEditAccess = canEditEmployees(userProfile?.role);
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [avatarFailed, setAvatarFailed] = useState(false);
  const [accessEntries, setAccessEntries] = useState([]);
  const [expandedAccessIds, setExpandedAccessIds] = useState(() => new Set());
  const [scopesEditingIds, setScopesEditingIds] = useState(() => new Set());
  const [accessSearchQuery, setAccessSearchQuery] = useState("");
  const [scopeDraft, setScopeDraft] = useState({});
  const [newAccessName, setNewAccessName] = useState("");
  const [savingAccess, setSavingAccess] = useState(false);
  const [accessError, setAccessError] = useState(null);
  const [assetPreview, setAssetPreview] = useState(null);

  // Fetch assets assigned to this employee from Asset Management (linked data)
  const { data: assignedAssetsData, isLoading: assetsLoading } = useAssets(
    1,
    200,
    { assigned_to: id || '' },
    { enabled: !!id }
  );
  const assignedAssets = assignedAssetsData?.data ?? [];

  // Fetch SIM cards assigned to this employee using multiple identifiers because
  // SIM `current_user` can be free text: name, employee_id, email, or "Name (ID)".
  const { data: assignedSimCards = [], isLoading: simCardsLoading } = useSimCardsByEmployeeIdentifiers({
    full_name: employee?.full_name || employee?.name || '',
    employee_id: employee?.employee_id || '',
    email: employee?.email || '',
  });

  const fetchEmployee = useCallback(async () => {
    setLoading(true);

    const { data: empData, error: empError } = await supabase
      .from("employees")
      .select(`
        *,
        reporting_manager:reporting_manager_id ( id, full_name, name, employee_id )
      `)
      .eq("id", id)
      .single();

    if (empError) {
      console.error("Error fetching employee:", empError.message);
      setLoading(false);
      return;
    }

    // Fetch additional access data from employee_access table if needed
    const { data: accessList } = await supabase
      .from("employee_access")
      .select("*")
      .eq("employee_id", id);

    let authUserData = null;
    if (empData.auth_user_id) {
      const { data: userData } = await supabase
        .from("profiles")
        .select("email, role, is_verified")
        .eq("id", empData.auth_user_id)
        .single();

      authUserData = userData;
    }

    setEmployee({
      ...empData,
      auth_user: authUserData,
      // Use the JSONB fields from the employees table directly
      // The asset_list and access_list are already in empData as JSONB arrays
    });

    setLoading(false);
  }, [id]);

  useEffect(() => {
    fetchEmployee();
  }, [fetchEmployee]);

  useEffect(() => {
    if (!employee) return;
    setAccessEntries(sortAccessEntriesByName(ensureAccessEntryIds(normalizeAccessList(employee.access_list))));
    setAccessError(null);
  }, [employee?.id]);

  useEffect(() => {
    setExpandedAccessIds(new Set());
    setScopesEditingIds(new Set());
    setAccessSearchQuery("");
    setScopeDraft({});
  }, [employee?.id]);

  const visibleAccessEntries = useMemo(() => {
    const q = accessSearchQuery.trim().toLowerCase();
    if (!q) return accessEntries;
    return accessEntries.filter((e) => {
      if (String(e.name ?? "").toLowerCase().includes(q)) return true;
      return (e.scopes || []).some((s) => String(s).toLowerCase().includes(q));
    });
  }, [accessEntries, accessSearchQuery]);

  // Reset avatar error state when switching employees / photo changes
  useEffect(() => {
    setAvatarFailed(false);
  }, [employee?.id, employee?.profile_picture, employee?.photo_url]);

  const accessDirty = useMemo(() => {
    if (!employee) return false;
    return (
      JSON.stringify(toDbAccessList(accessEntries)) !==
      JSON.stringify(toDbAccessList(normalizeAccessList(employee.access_list)))
    );
  }, [accessEntries, employee]);

  const accessValidationError = useMemo(() => {
    const hasEmptySystemName = accessEntries.some((entry) => !entry?.name?.trim());
    if (hasEmptySystemName) return "Each system access entry must have a name.";
    const hasEmptyScope = accessEntries.some((entry) =>
      (entry?.scopes || []).some((scope) => !String(scope ?? "").trim())
    );
    if (hasEmptyScope) return "Scope values cannot be empty.";
    return null;
  }, [accessEntries]);

  const saveAccessList = useCallback(async () => {
    if (!id) return;
    setSavingAccess(true);
    setAccessError(null);
    const sortedEntries = sortAccessEntriesByName(accessEntries);
    setAccessEntries(sortedEntries);
    const payload = toDbAccessList(sortedEntries);
    const { error } = await supabase.from("employees").update({ access_list: payload }).eq("id", id);
    setSavingAccess(false);
    if (error) {
      setAccessError(error.message);
      return;
    }
    setEmployee((prev) => (prev ? { ...prev, access_list: payload } : null));
  }, [id, accessEntries]);

  const toggleAccessExpand = useCallback((entryId) => {
    setExpandedAccessIds((prev) => {
      const next = new Set(prev);
      if (next.has(entryId)) {
        next.delete(entryId);
        setScopesEditingIds((s) => {
          const n = new Set(s);
          n.delete(entryId);
          return n;
        });
      } else {
        next.add(entryId);
      }
      return next;
    });
  }, []);

  const toggleScopesEditing = useCallback((entryId) => {
    setScopesEditingIds((prev) => {
      const next = new Set(prev);
      if (next.has(entryId)) next.delete(entryId);
      else next.add(entryId);
      return next;
    });
  }, []);

  const expandAllVisibleAccess = useCallback(() => {
    setExpandedAccessIds((prev) => {
      const next = new Set(prev);
      visibleAccessEntries.forEach((e) => {
        if (e.id) next.add(e.id);
      });
      return next;
    });
  }, [visibleAccessEntries]);

  const collapseAllAccess = useCallback(() => {
    setExpandedAccessIds(new Set());
    setScopesEditingIds(new Set());
  }, []);

  const addScopeToEntry = useCallback((entryId) => {
    setScopeDraft((d) => {
      const raw = (d[entryId] ?? "").trim();
      if (!raw) return d;
      setAccessEntries((prev) => {
        const idx = prev.findIndex((e) => e.id === entryId);
        if (idx < 0) return prev;
        const next = [...prev];
        const cur = { ...next[idx], scopes: [...(next[idx]?.scopes || [])] };
        if (cur.scopes.includes(raw)) return prev;
        cur.scopes.push(raw);
        next[idx] = cur;
        return next;
      });
      return { ...d, [entryId]: "" };
    });
  }, []);

  const removeScopeFromEntry = useCallback((entryId, scopeIdx) => {
    setAccessEntries((prev) => {
      const idx = prev.findIndex((e) => e.id === entryId);
      if (idx < 0) return prev;
      const next = [...prev];
      const cur = { ...next[idx], scopes: [...(next[idx]?.scopes || [])] };
      cur.scopes.splice(scopeIdx, 1);
      next[idx] = cur;
      return next;
    });
  }, []);

  const updateAccessEntryName = useCallback((entryId, name) => {
    setAccessEntries((prev) => {
      const idx = prev.findIndex((e) => e.id === entryId);
      if (idx < 0) return prev;
      const next = [...prev];
      next[idx] = { ...next[idx], name };
      return next;
    });
  }, []);

  const updateScopeInEntry = useCallback((entryId, scopeIdx, scopeValue) => {
    setAccessEntries((prev) => {
      const idx = prev.findIndex((e) => e.id === entryId);
      if (idx < 0) return prev;
      const next = [...prev];
      const cur = next[idx];
      if (!cur) return prev;
      const scopes = [...(cur.scopes || [])];
      scopes[scopeIdx] = scopeValue;
      next[idx] = { ...cur, scopes };
      return next;
    });
  }, []);

  const removeAccessEntry = useCallback((entryId) => {
    setAccessEntries((prev) => prev.filter((e) => e.id !== entryId));
    setExpandedAccessIds((prev) => {
      const next = new Set(prev);
      next.delete(entryId);
      return next;
    });
    setScopesEditingIds((prev) => {
      const next = new Set(prev);
      next.delete(entryId);
      return next;
    });
    setScopeDraft((d) => {
      const { [entryId]: _, ...rest } = d;
      return rest;
    });
  }, []);

  const sortAccessEntriesState = useCallback(() => {
    setAccessEntries((prev) => sortAccessEntriesByName(prev));
  }, []);

  const addNewAccessEntry = useCallback(() => {
    setNewAccessName((prevName) => {
      const trimmed = prevName.trim();
      if (!trimmed) return prevName;
      const newId = newAccessEntryId();
      setAccessEntries((prevEntries) =>
        sortAccessEntriesByName([...prevEntries, { name: trimmed, scopes: [], id: newId }])
      );
      setExpandedAccessIds((e) => new Set(e).add(newId));
      setScopesEditingIds((s) => new Set(s).add(newId));
      return "";
    });
  }, []);

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'active': return 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-700';
      case 'inactive': return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-700';
      case 'pending': return 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-700';
      default: return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600';
    }
  };

  const getAccessLevelColor = (level) => {
    switch (level?.toLowerCase()) {
      case 'admin': return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-700';
      case 'semi-admin': return 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-700';
      case 'owner': return 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-700';
      case 'viewer': return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-700';
      default: return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600';
    }
  };

  const getHeaderStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'active': return 'bg-emerald-400/20 text-emerald-100 border-emerald-300/40';
      case 'inactive': return 'bg-red-400/20 text-red-100 border-red-300/40';
      case 'pending': return 'bg-amber-400/20 text-amber-100 border-amber-300/40';
      default: return 'bg-white/15 text-white border-white/25';
    }
  };

  const getTenureLabel = (hireDate) => {
    if (!hireDate) return null;
    const start = new Date(hireDate);
    if (Number.isNaN(start.getTime())) return null;
    const now = new Date();
    let years = now.getFullYear() - start.getFullYear();
    let months = now.getMonth() - start.getMonth();
    if (months < 0) {
      years -= 1;
      months += 12;
    }
    if (years > 0 && months > 0) return `${years}y ${months}m tenure`;
    if (years > 0) return `${years} year${years === 1 ? '' : 's'} tenure`;
    if (months > 0) return `${months} month${months === 1 ? '' : 's'} tenure`;
    return 'New joiner';
  };

  // Helper function to safely handle JSONB arrays
  const getArrayData = (data) => {
    if (Array.isArray(data)) {
      return data;
    }
    if (typeof data === 'string') {
      // If it's a string, try to split by newlines or commas
      return data.split(/[\n,]/).filter(item => item.trim() !== '');
    }
    return [];
  };

  if (loading) {
    return (
      <div className="min-h-screen font-sans bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="rounded-3xl border border-gray-200/60 dark:border-gray-700/60 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm shadow-xl overflow-hidden">
            <div className="p-6 sm:p-8">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="h-7 w-56 bg-gray-200/80 dark:bg-gray-700/80 rounded-lg animate-pulse" />
                  <div className="h-4 w-72 bg-gray-200/60 dark:bg-gray-700/60 rounded animate-pulse" />
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-gray-200/70 dark:bg-gray-700/70 animate-pulse" />
                  <div className="h-10 w-10 rounded-xl bg-gray-200/70 dark:bg-gray-700/70 animate-pulse" />
                </div>
              </div>
              <div className="mt-6 flex items-center gap-5">
                <div className="h-20 w-20 rounded-full bg-gray-200/80 dark:bg-gray-700/80 animate-pulse" />
                <div className="flex-1 space-y-3">
                  <div className="h-6 w-64 bg-gray-200/80 dark:bg-gray-700/80 rounded-lg animate-pulse" />
                  <div className="h-4 w-80 bg-gray-200/60 dark:bg-gray-700/60 rounded animate-pulse" />
                  <div className="h-4 w-44 bg-gray-200/60 dark:bg-gray-700/60 rounded animate-pulse" />
                </div>
              </div>
            </div>
            <div className="p-6 sm:p-8 pt-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((k) => (
                  <div key={k} className="h-20 rounded-2xl bg-gray-200/60 dark:bg-gray-700/60 animate-pulse" />
                ))}
              </div>
              <p className="mt-6 text-sm text-gray-600 dark:text-gray-400">Loading employee profile…</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="min-h-screen font-sans bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="rounded-3xl border border-gray-200/60 dark:border-gray-700/60 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm shadow-xl p-10 text-center">
            <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-700 dark:text-gray-200 mb-2">Employee Not Found</h2>
            <p className="text-gray-500 dark:text-gray-400">The employee you're looking for doesn't exist.</p>
            <div className="mt-6">
              <Link
                to="/employees"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Employees
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: User },
    { id: 'performance', label: 'Performance', icon: TrendingUp },
    { id: 'system_access', label: 'System Access', icon: Shield },
    { id: 'assets', label: 'Assets Assignments', icon: CreditCard },
    { id: 'documents', label: 'Documents', icon: FileText },
    { id: 'skills', label: 'Skills', icon: Award },
    { id: 'leave', label: 'Leave', icon: CalendarDays },
    { id: 'attendance', label: 'Attendance', icon: Clock },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 }
  ];

  // Shared UI helpers for consistent cards across tabs
  const SurfaceCard = ({ children, className = '', delay = 0 }) => (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      whileHover={{ y: -4, scale: 1.01 }}
      className={`group relative overflow-hidden rounded-2xl border shadow-sm hover:shadow-lg transition-all duration-300 ${
        'bg-white/90 dark:bg-gray-800/90 border-gray-200/60 dark:border-gray-700/60 backdrop-blur-sm'
      } ${className}`}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-400/50 to-transparent" />
      <div className="pointer-events-none absolute -right-8 -top-8 h-20 w-20 rounded-full bg-blue-500/10 dark:bg-blue-400/10 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="relative">{children}</div>
    </motion.div>
  );

  const CardHeaderRow = ({ icon: Icon, title, subtitle, iconBg = 'bg-blue-100 dark:bg-blue-900/30', iconColor = 'text-blue-600 dark:text-blue-400' }) => (
    <div className="flex items-start justify-between gap-4 mb-4">
      <div className="flex items-center gap-3 min-w-0">
        <div className={`p-2.5 rounded-xl ${iconBg} flex-shrink-0 shadow-sm ring-1 ring-black/5 dark:ring-white/10`}>
          <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>
        <div className="min-w-0">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white truncate">{title}</h3>
          {subtitle ? <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{subtitle}</p> : null}
        </div>
      </div>
    </div>
  );

  const DetailRow = ({ label, value, valueClassName = '', href = null }) => {
    const content = (
      <span
        className={`text-sm font-semibold text-gray-900 dark:text-white text-right truncate max-w-[58%] ${valueClassName} ${
          href ? 'hover:text-blue-600 dark:hover:text-blue-400 transition-colors' : ''
        }`}
        title={typeof value === 'string' ? value : undefined}
      >
        {value}
      </span>
    );

    return (
      <div className="group flex items-center justify-between gap-4 px-4 py-3 transition-colors hover:bg-white/70 dark:hover:bg-gray-800/50">
        <span className="text-sm text-gray-500 dark:text-gray-400">{label}</span>
        {href ? (
          <Link to={href} className="min-w-0 max-w-[58%]">
            {content}
          </Link>
        ) : (
          content
        )}
      </div>
    );
  };

  const DetailList = ({ rows }) => (
    <div className="rounded-xl border border-gray-100 dark:border-gray-700/80 bg-gray-50/60 dark:bg-gray-900/25 divide-y divide-gray-200/70 dark:divide-gray-700/70 overflow-hidden">
      {rows.map((row) => (
        <DetailRow key={row.label} {...row} />
      ))}
    </div>
  );

  const TabBanner = ({ icon: Icon, title, subtitle, gradient, borderClass = 'border-white/20', children }) => (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-r ${gradient} p-6 text-white shadow-lg border ${borderClass}`}
    >
      <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
      <div className="relative flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0">
          <div className="p-3 rounded-xl bg-white/15 backdrop-blur-sm flex-shrink-0">
            <Icon className="w-8 h-8 text-white" />
          </div>
          <div className="min-w-0">
            <h3 className="text-xl font-semibold">{title}</h3>
            {subtitle ? <p className="text-sm text-white/80 mt-0.5">{subtitle}</p> : null}
          </div>
        </div>
        {children}
      </div>
    </motion.div>
  );

  const EmptyState = ({ icon: Icon, title, description, iconWrap = 'bg-gray-100 dark:bg-gray-700/60', iconColor = 'text-gray-400 dark:text-gray-500' }) => (
    <div className="text-center py-12 px-6 rounded-2xl border border-dashed border-gray-200 dark:border-gray-600 bg-gray-50/50 dark:bg-gray-900/20">
      <div className={`inline-flex p-4 rounded-2xl ${iconWrap} mb-4`}>
        <Icon className={`w-10 h-10 ${iconColor}`} />
      </div>
      <p className="text-base font-semibold text-gray-700 dark:text-gray-300">{title}</p>
      {description ? <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-md mx-auto">{description}</p> : null}
    </div>
  );

  const MetricTile = ({ label, value, icon: Icon, iconCls, valueCls, delay = 0 }) => (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      whileHover={{ y: -3 }}
      className="text-center p-5 rounded-2xl border border-gray-200/70 dark:border-gray-600/70 bg-gradient-to-br from-white to-gray-50/80 dark:from-gray-800 dark:to-gray-800/60 hover:shadow-md transition-all duration-300"
    >
      <Icon className={`w-6 h-6 mx-auto mb-2 ${iconCls}`} />
      <div className={`text-2xl font-bold mb-1 ${valueCls}`}>{value}</div>
      <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">{label}</div>
    </motion.div>
  );

  const TagChip = ({ children, tone = 'amber' }) => {
    const tones = {
      amber: 'bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200 border-amber-200/80 dark:border-amber-700/50',
      blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 border-blue-200/80 dark:border-blue-700/50',
      emerald: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-200 border-emerald-200/80 dark:border-emerald-700/50',
      purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-800 dark:text-purple-200 border-purple-200/80 dark:border-purple-700/50',
    };
    return (
      <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium border ${tones[tone]}`}>
        {children}
      </span>
    );
  };

  const tenureLabel = getTenureLabel(employee.hire_date);
  const hasEmergencyContact =
    employee.emergency_contact_name || employee.emergency_contact_phone || employee.emergency_contact_relationship;
  const hasNextOfKin =
    employee.next_of_kin_name || employee.next_of_kin_phone || employee.next_of_kin_relationship;
  const skillPreview = getArrayData(employee.skills);
  const goalsPreview = getArrayData(employee.goals);
  const certificationsPreview = getArrayData(employee.certifications);
  const trainingPreview = getArrayData(employee.training_records);

  const renderOverview = () => (
    <div className="space-y-6">
      {employee.summary ? (
        <SurfaceCard delay={0} className="p-6">
          <CardHeaderRow
            icon={FileText}
            title="Employee Summary"
            subtitle="Professional overview"
            iconBg="bg-indigo-100 dark:bg-indigo-900/30"
            iconColor="text-indigo-600 dark:text-indigo-400"
          />
          <p className="text-sm sm:text-base leading-relaxed text-gray-700 dark:text-gray-300 whitespace-pre-line">
            {employee.summary}
          </p>
        </SurfaceCard>
      ) : null}

      {/* Contact Information Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            key: "email",
            label: "Email",
            value: employee.email || "Not provided",
            icon: Mail,
            iconWrap: "bg-blue-100 dark:bg-blue-900/20",
            iconColor: "text-blue-600 dark:text-blue-400",
            delay: 0,
          },
          {
            key: "phone",
            label: "Phone",
            value: employee.phone || "Not provided",
            icon: Phone,
            iconWrap: "bg-green-100 dark:bg-green-900/20",
            iconColor: "text-green-600 dark:text-green-400",
            delay: 0.05,
          },
          {
            key: "hire",
            label: "Join Date",
            value: employee.hire_date ? new Date(employee.hire_date).toLocaleDateString() : "Not provided",
            icon: Calendar,
            iconWrap: "bg-purple-100 dark:bg-purple-900/20",
            iconColor: "text-purple-600 dark:text-purple-400",
            delay: 0.1,
          },
          {
            key: "location",
            label: "Location",
            value: employee.location || "Not provided",
            icon: MapPin,
            iconWrap: "bg-orange-100 dark:bg-orange-900/20",
            iconColor: "text-orange-600 dark:text-orange-400",
            delay: 0.15,
          },
        ].map((item) => (
          <SurfaceCard key={item.key} delay={item.delay} className="p-4 sm:p-5">
            <div className="flex items-start gap-3">
              <div className={`p-2.5 rounded-xl ${item.iconWrap} shadow-sm ring-1 ring-black/5 dark:ring-white/10`}>
                <item.icon className={`w-4 h-4 ${item.iconColor}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wider">
                  {item.label}
                </p>
                {item.key === 'email' && employee.email ? (
                  <a
                    href={`mailto:${employee.email}`}
                    className="mt-1 block text-sm font-semibold text-gray-900 dark:text-gray-100 truncate hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    title={employee.email}
                  >
                    {employee.email}
                  </a>
                ) : item.key === 'phone' && employee.phone ? (
                  <a
                    href={`tel:${employee.phone}`}
                    className="mt-1 block text-sm font-semibold text-gray-900 dark:text-gray-100 truncate hover:text-green-600 dark:hover:text-green-400 transition-colors"
                    title={employee.phone}
                  >
                    {employee.phone}
                  </a>
                ) : (
                  <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-gray-100 truncate" title={item.value}>
                    {item.value}
                  </p>
                )}
              </div>
            </div>
          </SurfaceCard>
        ))}
      </div>

      {/* Additional Information */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Personal Details */}
        <SurfaceCard delay={0.2} className="p-6">
          <CardHeaderRow icon={User} title="Personal Details" subtitle="Core employee information" />
          <DetailList
            rows={[
              { label: 'Full Name', value: employee.full_name || employee.name || '—' },
              { label: 'Position', value: employee.position || employee.designation || 'Not specified' },
              { label: 'Employee ID', value: employee.employee_id || '—' },
              ...(employee.salary
                ? [{ label: 'Salary', value: `$${employee.salary.toLocaleString()}` }]
                : []),
            ]}
          />
        </SurfaceCard>

        {/* Work Information */}
        <SurfaceCard delay={0.25} className="p-6">
          <CardHeaderRow icon={Briefcase} title="Work Information" subtitle="Department, manager and role" iconBg="bg-emerald-100 dark:bg-emerald-900/30" iconColor="text-emerald-600 dark:text-emerald-400" />
          <DetailList
            rows={[
              { label: 'Department', value: employee.department || 'Not assigned' },
              ...(employee.reporting_manager
                ? [{
                    label: 'Manager',
                    value: employee.reporting_manager.full_name || employee.reporting_manager.name || '—',
                    href: employee.reporting_manager.id ? `/employee/${employee.reporting_manager.id}` : null,
                  }]
                : []),
              { label: 'Experience Level', value: employee.experience_level || 'Not specified' },
              ...(tenureLabel ? [{ label: 'Tenure', value: tenureLabel }] : []),
              ...(employee.termination_date
                ? [{
                    label: 'Termination Date',
                    value: new Date(employee.termination_date).toLocaleDateString(),
                    valueClassName: 'text-red-600 dark:text-red-400',
                  }]
                : []),
            ]}
          />
        </SurfaceCard>
      </div>

      {(hasEmergencyContact || hasNextOfKin) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {hasEmergencyContact ? (
            <SurfaceCard delay={0.28} className="p-6">
              <CardHeaderRow
                icon={Heart}
                title="Emergency Contact"
                subtitle="Primary contact in case of emergency"
                iconBg="bg-rose-100 dark:bg-rose-900/30"
                iconColor="text-rose-600 dark:text-rose-400"
              />
              <DetailList
                rows={[
                  ...(employee.emergency_contact_name
                    ? [{ label: 'Name', value: employee.emergency_contact_name }]
                    : []),
                  ...(employee.emergency_contact_relationship
                    ? [{ label: 'Relationship', value: employee.emergency_contact_relationship }]
                    : []),
                  ...(employee.emergency_contact_phone
                    ? [{ label: 'Phone', value: employee.emergency_contact_phone }]
                    : []),
                ]}
              />
            </SurfaceCard>
          ) : null}
          {hasNextOfKin ? (
            <SurfaceCard delay={0.3} className="p-6">
              <CardHeaderRow
                icon={Users}
                title="Next of Kin"
                subtitle="Family or kin contact details"
                iconBg="bg-sky-100 dark:bg-sky-900/30"
                iconColor="text-sky-600 dark:text-sky-400"
              />
              <DetailList
                rows={[
                  ...(employee.next_of_kin_name ? [{ label: 'Name', value: employee.next_of_kin_name }] : []),
                  ...(employee.next_of_kin_relationship
                    ? [{ label: 'Relationship', value: employee.next_of_kin_relationship }]
                    : []),
                  ...(employee.next_of_kin_phone ? [{ label: 'Phone', value: employee.next_of_kin_phone }] : []),
                ]}
              />
            </SurfaceCard>
          ) : null}
        </div>
      )}

      {skillPreview.length > 0 ? (
        <SurfaceCard delay={0.32} className="p-6">
          <CardHeaderRow
            icon={Award}
            title="Skills Snapshot"
            subtitle="Recorded competencies"
            iconBg="bg-amber-100 dark:bg-amber-900/30"
            iconColor="text-amber-600 dark:text-amber-400"
          />
          <div className="flex flex-wrap gap-2">
            {skillPreview.map((skill, i) => (
              <span
                key={`${skill}-${i}`}
                className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200 border border-amber-200/80 dark:border-amber-700/50"
              >
                {skill}
              </span>
            ))}
          </div>
        </SurfaceCard>
      ) : null}

      {/* Key Responsibilities */}
      {employee.key_roles && (
        <SurfaceCard delay={0.3} className="p-6">
          <CardHeaderRow icon={Target} title="Key Responsibilities" subtitle="Highlights and scope" iconBg="bg-purple-100 dark:bg-purple-900/30" iconColor="text-purple-600 dark:text-purple-400" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {getArrayData(employee.key_roles).map((role, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.04 * i }}
                whileHover={{ y: -2 }}
                className="flex items-center gap-3 p-3.5 rounded-xl border border-purple-200/70 dark:border-purple-700/50 bg-gradient-to-r from-purple-50/80 to-indigo-50/50 dark:from-purple-900/15 dark:to-indigo-900/10 hover:border-purple-300 dark:hover:border-purple-600/60 hover:shadow-sm transition-all duration-200"
              >
                <div className="w-2 h-2 bg-purple-500 rounded-full flex-shrink-0 ring-4 ring-purple-500/15"></div>
                <span className="text-sm text-gray-700 dark:text-gray-300">{role}</span>
              </motion.div>
            ))}
          </div>
        </SurfaceCard>
      )}
    </div>
  );

  const renderPerformance = () => {
    const hasPerformanceData =
      employee.performance_rating || goalsPreview.length > 0 || certificationsPreview.length > 0 || trainingPreview.length > 0;

    return (
      <div className="space-y-6">
        <TabBanner
          icon={TrendingUp}
          title="Performance & Growth"
          subtitle="Ratings, goals, and development progress"
          gradient="from-blue-700 via-indigo-700 to-violet-700 dark:from-blue-800 dark:via-indigo-800 dark:to-violet-800"
          borderClass="border-blue-600/30"
        >
          {employee.performance_rating ? (
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-white/15 border border-white/25">
              <Star className="w-4 h-4" />
              Rating: {employee.performance_rating}
            </span>
          ) : null}
        </TabBanner>

        <SurfaceCard delay={0.05} className="p-6">
          <CardHeaderRow
            icon={Activity}
            title="Performance Snapshot"
            subtitle="Key indicators from the employee record"
            iconBg="bg-blue-100 dark:bg-blue-900/30"
            iconColor="text-blue-600 dark:text-blue-400"
          />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricTile
              label="Performance Rating"
              value={employee.performance_rating || '—'}
              icon={Star}
              iconCls="text-amber-500 dark:text-amber-400"
              valueCls="text-amber-600 dark:text-amber-400"
              delay={0.05}
            />
            <MetricTile
              label="Active Goals"
              value={goalsPreview.length}
              icon={Target}
              iconCls="text-blue-600 dark:text-blue-400"
              valueCls="text-blue-600 dark:text-blue-400"
              delay={0.1}
            />
            <MetricTile
              label="Certifications"
              value={certificationsPreview.length}
              icon={Award}
              iconCls="text-emerald-600 dark:text-emerald-400"
              valueCls="text-emerald-600 dark:text-emerald-400"
              delay={0.15}
            />
            <MetricTile
              label="Training Records"
              value={trainingPreview.length}
              icon={GraduationCap}
              iconCls="text-purple-600 dark:text-purple-400"
              valueCls="text-purple-600 dark:text-purple-400"
              delay={0.2}
            />
          </div>
        </SurfaceCard>

        {goalsPreview.length > 0 ? (
          <SurfaceCard delay={0.1} className="p-6">
            <CardHeaderRow
              icon={Target}
              title="Career Goals"
              subtitle="Objectives tracked for this employee"
              iconBg="bg-indigo-100 dark:bg-indigo-900/30"
              iconColor="text-indigo-600 dark:text-indigo-400"
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {goalsPreview.map((goal, i) => (
                <motion.div
                  key={`${goal}-${i}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.04 * i }}
                  whileHover={{ y: -2 }}
                  className="flex items-start gap-3 p-4 rounded-xl border border-indigo-200/70 dark:border-indigo-700/50 bg-gradient-to-r from-indigo-50/80 to-blue-50/50 dark:from-indigo-900/15 dark:to-blue-900/10"
                >
                  <CheckCircle className="w-4 h-4 text-indigo-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{goal}</span>
                </motion.div>
              ))}
            </div>
          </SurfaceCard>
        ) : null}

        {!hasPerformanceData ? (
          <SurfaceCard delay={0.15} className="p-6">
            <EmptyState
              icon={TrendingUp}
              title="No performance data recorded"
              description="Add a performance rating, goals, or training details from Edit Profile to populate this section."
              iconWrap="bg-blue-100 dark:bg-blue-900/30"
              iconColor="text-blue-500 dark:text-blue-400"
            />
          </SurfaceCard>
        ) : null}
      </div>
    );
  };

  const renderSystemAccess = () => {
    const isVerified = employee.auth_user?.is_verified;
    const accountActive = employee.account_status !== 'inactive';
    const role = employee.auth_user?.role || 'employee';
    const showAccessCard = accessEntries.length > 0 || canEditAccess;

    return (
    <div className="space-y-6">
      {/* Status banner */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl overflow-hidden bg-gradient-to-r from-slate-800 to-slate-700 dark:from-slate-700 dark:to-slate-800 p-6 text-white shadow-lg border border-slate-600/50"
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-white/10 backdrop-blur-sm">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-semibold">System Access & Permissions</h3>
              <p className="text-slate-300 text-sm mt-0.5">Account and access overview</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium ${
              isVerified ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-400/30' : 'bg-amber-500/20 text-amber-200 border border-amber-400/30'
            }`}>
              <CheckCircle className="w-4 h-4" />
              {isVerified ? 'Verified' : 'Not verified'}
            </span>
            <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium ${
              accountActive ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-400/30' : 'bg-red-500/20 text-red-200 border border-red-400/30'
            }`}>
              <Zap className="w-4 h-4" />
              {accountActive ? 'Active' : 'Inactive'}
            </span>
            <span className={`px-4 py-2 rounded-xl text-sm font-medium capitalize ${getAccessLevelColor(role)} border border-current/20`}>
              {role}
            </span>
          </div>
        </div>
      </motion.div>

      {/* Account & permissions cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
        >
          <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-indigo-500" />
            Account Details
          </h4>
          <div className="space-y-3">
            {[
              { label: 'User ID', value: employee.auth_user_id || 'Not assigned' },
              { label: 'Email', value: employee.email || 'Not provided' },
            ].map((row, i) => (
              <div key={i} className="flex justify-between items-center p-3 rounded-xl bg-gray-50 dark:bg-gray-700/80 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                <span className="text-sm text-gray-500 dark:text-gray-400">{row.label}</span>
                <span className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate max-w-[60%]" title={row.value}>{row.value}</span>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
        >
          <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
            <LogIn className="w-4 h-4 text-indigo-500" />
            Access & Activity
          </h4>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 rounded-xl bg-gray-50 dark:bg-gray-700/80">
              <span className="text-sm text-gray-500 dark:text-gray-400">Access Level</span>
              <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${getAccessLevelColor(employee.access_level || 'viewer')}`}>
                {employee.access_level || 'viewer'}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-xl bg-gray-50 dark:bg-gray-700/80">
              <span className="text-sm text-gray-500 dark:text-gray-400">Last Login</span>
              <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                {employee.last_login ? new Date(employee.last_login).toLocaleDateString(undefined, { dateStyle: 'medium' }) : 'Never'}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-xl bg-gray-50 dark:bg-gray-700/80">
              <span className="text-sm text-gray-500 dark:text-gray-400">Account Status</span>
              <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                accountActive ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
              }`}>
                {employee.account_status || 'active'}
              </span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* System access: expandable rows with roles / scope per system */}
      {showAccessCard && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
        >
          <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
            <h4 className="font-semibold text-gray-800 dark:text-gray-200 flex flex-wrap items-center gap-2">
              <LayoutGrid className="w-4 h-4 text-indigo-500 shrink-0" />
              <span>System access</span>
              {accessEntries.length > 0 ? (
                <span className="text-sm font-normal text-gray-500 dark:text-gray-400 tabular-nums">
                  ({accessEntries.length})
                </span>
              ) : null}
            </h4>
            {canEditAccess && (
              <div className="flex flex-wrap items-center gap-2">
                {accessDirty && (
                  <button
                    type="button"
                    onClick={saveAccessList}
                    disabled={savingAccess || Boolean(accessValidationError)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {savingAccess ? "Saving…" : "Save changes"}
                  </button>
                )}
              </div>
            )}
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Expand each system to see roles and scope assigned for this employee (for example Office 365 → Exchange, Teams).
            <span className="block mt-1">System entries are automatically sorted alphabetically.</span>
            <span className="block mt-1 text-xs text-gray-400 dark:text-gray-500">
              Keyboard: when a system row is focused, Enter or Space expands or collapses it (same as click).
            </span>
          </p>
          {accessEntries.length >= ACCESS_SEARCH_MIN && accessEntries.length > 0 && (
            <div className="mb-4">
              <label htmlFor="employee-access-search" className="sr-only">
                Filter systems and scopes
              </label>
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" aria-hidden />
                <input
                  id="employee-access-search"
                  type="search"
                  value={accessSearchQuery}
                  onChange={(e) => setAccessSearchQuery(e.target.value)}
                  placeholder="Filter by system or scope…"
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400"
                  autoComplete="off"
                />
              </div>
              {accessSearchQuery.trim() ? (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">
                  Showing {visibleAccessEntries.length} of {accessEntries.length}
                </p>
              ) : null}
            </div>
          )}
          {accessEntries.length > 1 && (
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-3 text-sm">
              <span className="text-gray-500 dark:text-gray-400">View:</span>
              <button
                type="button"
                onClick={expandAllVisibleAccess}
                className="text-indigo-600 dark:text-indigo-400 font-medium hover:underline"
              >
                Expand all
              </button>
              <span className="text-gray-300 dark:text-gray-600" aria-hidden>
                ·
              </span>
              <button
                type="button"
                onClick={collapseAllAccess}
                className="text-gray-600 dark:text-gray-400 font-medium hover:underline"
              >
                Collapse all
              </button>
            </div>
          )}
          {accessError && (
            <p className="text-sm text-red-600 dark:text-red-400 mb-3">{accessError}</p>
          )}
          {!accessError && accessValidationError && (
            <p className="text-sm text-amber-700 dark:text-amber-400 mb-3">{accessValidationError}</p>
          )}
          <div className="space-y-2">
            {accessEntries.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-200 dark:border-gray-600 bg-gray-50/80 dark:bg-gray-900/30 px-4 py-8 text-center">
                <LayoutGrid className="w-10 h-10 mx-auto text-gray-300 dark:text-gray-600 mb-2" />
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">No systems recorded yet</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-sm mx-auto">
                  {canEditAccess
                    ? "Add a system below (for example Office 365, VPN), then expand it to add roles or scope."
                    : "This employee has no system access entries in their profile."}
                </p>
              </div>
            ) : visibleAccessEntries.length === 0 ? (
              <p className="text-sm text-center text-gray-500 dark:text-gray-400 py-6 rounded-xl border border-dashed border-gray-200 dark:border-gray-600">
                No systems match your filter. Clear the search to see all entries.
              </p>
            ) : (
              visibleAccessEntries.map((entry) => {
                const eid = entry.id || entry.name;
                const expanded = expandedAccessIds.has(eid);
                return (
                  <SystemAccessEntryRow
                    key={eid}
                    entry={entry}
                    entryId={eid}
                    expanded={expanded}
                    canEditAccess={canEditAccess}
                    scopesEditing={scopesEditingIds.has(eid)}
                    toggleScopesEditing={toggleScopesEditing}
                    toggleAccessExpand={toggleAccessExpand}
                    removeAccessEntry={removeAccessEntry}
                    removeScopeFromEntry={removeScopeFromEntry}
                    updateAccessEntryName={updateAccessEntryName}
                    updateScopeInEntry={updateScopeInEntry}
                    sortAccessEntriesState={sortAccessEntriesState}
                    addScopeToEntry={addScopeToEntry}
                    scopeDraft={scopeDraft}
                    setScopeDraft={setScopeDraft}
                  />
                );
              })
            )}
          </div>
          {canEditAccess && (
            <div className="mt-4 flex flex-wrap gap-2 items-center">
              <input
                type="text"
                value={newAccessName}
                onChange={(e) => setNewAccessName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addNewAccessEntry();
                  }
                }}
                placeholder="Add system access (e.g. Office 365, VPN)…"
                className="flex-1 min-w-[12rem] px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm"
              />
              <button
                type="button"
                onClick={addNewAccessEntry}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border border-indigo-200 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/30"
              >
                <Plus className="w-4 h-4" />
                Add access
              </button>
            </div>
          )}
        </motion.div>
      )}

      {/* Department & context */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-2 gap-6"
      >
        <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-50 to-gray-50 dark:from-gray-800 dark:to-gray-800 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/30">
              <Building className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <span className="font-medium text-gray-800 dark:text-gray-200">Primary Department</span>
          </div>
          <p className="text-gray-600 dark:text-gray-400 pl-11">{employee.department || 'Not assigned'}</p>
        </div>
        <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-50 to-gray-50 dark:from-gray-800 dark:to-gray-800 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/30">
              <Users className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <span className="font-medium text-gray-800 dark:text-gray-200">Reporting Manager</span>
          </div>
          <p className="text-gray-600 dark:text-gray-400 pl-11">
            {employee.reporting_manager?.full_name || employee.reporting_manager?.name || 'Not assigned'}
          </p>
        </div>
      </motion.div>

      {/* Security summary strip */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="flex flex-wrap gap-4 p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700"
      >
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50">
          <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          <span className="text-sm font-medium text-amber-800 dark:text-amber-200">Access Level</span>
          <span className="text-sm text-amber-700 dark:text-amber-300">{employee.access_level || 'Standard'}</span>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50">
          <Shield className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <span className="text-sm font-medium text-blue-800 dark:text-blue-200">Role</span>
          <span className="text-sm text-blue-700 dark:text-blue-300 capitalize">{role}</span>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/50">
          <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span className="text-sm font-medium text-emerald-800 dark:text-emerald-200">Status</span>
          <span className="text-sm text-emerald-700 dark:text-emerald-300 capitalize">{employee.status || 'active'}</span>
        </div>
      </motion.div>
    </div>
    );
  };

  const renderAssetsAssignments = () => {
    const assets = assignedAssets;
    const normalizedType = (t) => (t && String(t).trim().toLowerCase()) || '';
    const isLaptop = (a) => normalizedType(a?.type) === 'laptop';
    const isDesktop = (a) => normalizedType(a?.type) === 'desktop';
    const isMonitor = (a) => normalizedType(a?.type) === 'monitor';
    const isMobile = (a) => ['phone', 'mobile', 'smartphone', 'tablet'].includes(normalizedType(a?.type));
    const getAssetIcon = (asset) => {
      const t = normalizedType(asset?.type);
      if (t === 'laptop') return Laptop;
      if (t === 'desktop' || t === 'monitor') return Monitor;
      if (['phone', 'mobile', 'smartphone', 'tablet'].includes(t)) return Smartphone;
      return Monitor;
    };
    const getAssetIconColor = (asset) => {
      if (isLaptop(asset)) return 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/40';
      if (isMobile(asset)) return 'text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/40';
      if (isDesktop(asset) || isMonitor(asset)) return 'text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/40';
      return 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/40';
    };
    const renderAssetVisual = (asset, Icon, iconCls) => {
      if (asset?.asset_picture_url) {
        return (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setAssetPreview({
                id: asset.id,
                name: asset.name || 'Unnamed asset',
                type: asset.type || 'Asset',
                url: asset.asset_picture_url,
              });
            }}
            className="w-16 h-16 rounded-xl bg-gray-100 dark:bg-gray-700 overflow-hidden flex-shrink-0 border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
            title="Click to preview image"
          >
            <img
              src={asset.asset_picture_url}
              alt={asset.name || 'Asset image'}
              className="w-full h-full object-contain bg-white dark:bg-gray-800"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                const fallback = e.currentTarget.nextElementSibling;
                if (fallback) fallback.classList.remove('hidden');
              }}
            />
            <div className={`hidden w-full h-full items-center justify-center ${iconCls}`}>
              <Icon className="w-6 h-6" />
            </div>
          </button>
        );
      }
      return (
        <div className={`w-16 h-16 p-3 rounded-xl ${iconCls} flex-shrink-0 flex items-center justify-center`}>
          <Icon className="w-6 h-6" />
        </div>
      );
    };

    const statCards = [
      { label: 'Total Assets', value: assets?.length ?? 0, icon: Package, iconCls: 'text-green-600 dark:text-green-400', valueCls: 'text-green-600 dark:text-green-400' },
      { label: 'Laptops', value: assets?.filter(isLaptop).length ?? 0, icon: Laptop, iconCls: 'text-blue-600 dark:text-blue-400', valueCls: 'text-blue-600 dark:text-blue-400' },
      { label: 'Desktop / Monitor', value: assets?.filter((a) => isDesktop(a) || isMonitor(a)).length ?? 0, icon: Monitor, iconCls: 'text-amber-600 dark:text-amber-400', valueCls: 'text-amber-600 dark:text-amber-400' },
      { label: 'Mobile Devices', value: assets?.filter(isMobile).length ?? 0, icon: Smartphone, iconCls: 'text-purple-600 dark:text-purple-400', valueCls: 'text-purple-600 dark:text-purple-400' },
    ];

    return (
    <div className="space-y-6">
      {/* Header banner */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl overflow-hidden bg-gradient-to-r from-emerald-700 to-teal-700 dark:from-emerald-800 dark:to-teal-800 p-6 text-white shadow-lg border border-emerald-600/30"
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-white/15 backdrop-blur-sm">
              <CreditCard className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-xl font-semibold">Asset Assignments</h3>
              <p className="text-emerald-100 text-sm mt-0.5">Linked from Asset Management · assign or unassign there to update</p>
            </div>
          </div>
          <Link
            to="/assets"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 text-white font-medium text-sm transition-colors border border-white/30"
          >
            Manage in Asset Management
            <ExternalLink className="w-4 h-4" />
          </Link>
        </div>
      </motion.div>

      {/* IT Assets */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        {assetsLoading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-2 border-emerald-500 border-t-transparent mb-4"></div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Loading assets…</p>
          </div>
        ) : assets && assets.length > 0 ? (
          <div className="space-y-6">
            {/* Stat cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {statCards.map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 * i }}
                  whileHover={{ y: -2 }}
                  className="text-center p-4 rounded-2xl border bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 hover:shadow-md transition-shadow"
                >
                  <stat.icon className={`w-6 h-6 mx-auto mb-2 ${stat.iconCls}`} />
                  <div className={`text-2xl font-bold ${stat.valueCls}`}>{stat.value}</div>
                  <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">{stat.label}</div>
                </motion.div>
              ))}
            </div>

            {/* Asset cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {assets.map((asset, i) => {
                const Icon = getAssetIcon(asset);
                const iconCls = getAssetIconColor(asset);
                return (
                  <motion.div
                    key={asset.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.08 * i }}
                    whileHover={{ y: -4, boxShadow: '0 12px 24px -8px rgba(0,0,0,0.12)' }}
                    className="group relative p-5 rounded-2xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-emerald-300 dark:hover:border-emerald-600/50 transition-colors overflow-hidden"
                  >
                    <div className="flex items-start gap-4">
                      {renderAssetVisual(asset, Icon, iconCls)}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-900 dark:text-white truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                          {asset.name || 'Unnamed asset'}
                        </h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                          {asset.type || '—'}{asset.asset_code ? ` · ${asset.asset_code}` : ''}
                        </p>
                        <div className="flex items-center justify-between mt-3 flex-wrap gap-2">
                          <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 capitalize">
                            {asset.status || 'Assigned'}
                          </span>
                          <Link
                            to={`/assets/${asset.id}`}
                            className="inline-flex items-center gap-1 text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:underline"
                          >
                            View
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12 px-4"
          >
            <div className="inline-flex p-4 rounded-2xl bg-gray-100 dark:bg-gray-700 mb-4">
              <Monitor className="w-14 h-14 text-gray-400 dark:text-gray-500" />
            </div>
            <p className="text-lg font-medium text-gray-700 dark:text-gray-300">No IT assets assigned</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-sm mx-auto">
              Assign assets to this employee from the Asset Management section to see them here.
            </p>
            <Link
              to="/assets"
              className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 font-medium text-sm hover:bg-emerald-200 dark:hover:bg-emerald-900/50 transition-colors"
            >
              Go to Asset Management
              <ExternalLink className="w-4 h-4" />
            </Link>
          </motion.div>
        )}
      </div>

      <AnimatePresence>
        {assetPreview?.url ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setAssetPreview(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{ duration: 0.2 }}
              className="relative w-full max-w-4xl rounded-2xl overflow-hidden bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{assetPreview.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{assetPreview.type}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setAssetPreview(null)}
                  className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-gray-300"
                  aria-label="Close preview"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="max-h-[75vh] overflow-auto bg-gray-50 dark:bg-gray-950 p-3">
                <img
                  src={assetPreview.url}
                  alt={assetPreview.name}
                  className="w-full h-auto max-h-[70vh] object-contain rounded-xl bg-white dark:bg-gray-900"
                />
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* SIM Cards – linked from SIM Card management */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-100 dark:bg-cyan-900/30">
              <Phone className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">SIM Cards Assigned</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Linked from SIM Card management · assign or unassign there to update</p>
            </div>
          </div>
          <Link
            to="/simcards"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300 font-medium text-sm hover:bg-cyan-200 dark:hover:bg-cyan-900/50 transition-colors border border-cyan-200 dark:border-cyan-700/50"
          >
            Manage SIM Cards
            <ExternalLink className="w-4 h-4" />
          </Link>
        </div>
        {simCardsLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-cyan-500 border-t-transparent" />
          </div>
        ) : assignedSimCards.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {assignedSimCards.map((sim, i) => (
              <motion.div
                key={sim.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * i }}
                whileHover={{ y: -2 }}
                className="group p-5 rounded-2xl border border-gray-200 dark:border-gray-600 bg-gray-50/50 dark:bg-gray-700/30 hover:border-cyan-300 dark:hover:border-cyan-600/50 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-cyan-100 dark:bg-cyan-900/40 flex-shrink-0">
                    <Phone className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-900 dark:text-white truncate">
                      {sim.sim_number || '—'}
                    </h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                      {sim.package_name || '—'}{sim.package_type ? ` · ${sim.package_type}` : ''}
                    </p>
                    <div className="flex items-center justify-between mt-3 flex-wrap gap-2">
                      <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-cyan-100 text-cyan-800 dark:bg-cyan-900/40 dark:text-cyan-300 capitalize">
                        {sim.status || 'Active'}
                      </span>
                      <Link
                        to="/simcards"
                        className="inline-flex items-center gap-1 text-sm font-medium text-cyan-600 dark:text-cyan-400 hover:underline"
                      >
                        View
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 rounded-xl bg-gray-50 dark:bg-gray-700/30 border border-dashed border-gray-200 dark:border-gray-600">
            <Phone className="w-12 h-12 mx-auto text-gray-400 dark:text-gray-500 mb-2" />
            <p className="text-sm text-gray-500 dark:text-gray-400">No SIM cards assigned</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Assign in SIM Card management with this employee’s name as Current User</p>
          </div>
        )}
      </div>

      {/* Vehicle & Other – compact cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 rounded-xl bg-blue-100 dark:bg-blue-900/30">
              <Car className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Vehicle Assignments</h3>
          </div>
          <div className="text-center py-6 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-dashed border-gray-200 dark:border-gray-600">
            <Car className="w-10 h-10 mx-auto text-gray-400 dark:text-gray-500 mb-2" />
            <p className="text-sm text-gray-500 dark:text-gray-400">No vehicle assignments</p>
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 rounded-xl bg-purple-100 dark:bg-purple-900/30">
              <Package className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Other Equipment</h3>
          </div>
          <div className="text-center py-6 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-dashed border-gray-200 dark:border-gray-600">
            <Package className="w-10 h-10 mx-auto text-gray-400 dark:text-gray-500 mb-2" />
            <p className="text-sm text-gray-500 dark:text-gray-400">No other equipment assigned</p>
          </div>
        </motion.div>
      </div>
    </div>
    );
  };

  const renderDocuments = () => (
    <div className="space-y-6">
      <TabBanner
        icon={FileText}
        title="Documents"
        subtitle="Contracts, IDs, and employee files"
        gradient="from-slate-700 via-gray-700 to-zinc-700 dark:from-slate-800 dark:via-gray-800 dark:to-zinc-800"
        borderClass="border-slate-600/40"
      />
      <SurfaceCard delay={0.05} className="p-6">
        <CardHeaderRow
          icon={FileText}
          title="Employee Documents"
          subtitle="Uploaded files and records"
          iconBg="bg-slate-100 dark:bg-slate-900/30"
          iconColor="text-slate-600 dark:text-slate-400"
        />
        <EmptyState
          icon={Upload}
          title="No documents uploaded yet"
          description="Document management for employee files will appear here once uploads are added to this profile."
          iconWrap="bg-slate-100 dark:bg-slate-900/30"
          iconColor="text-slate-500 dark:text-slate-400"
        />
      </SurfaceCard>
    </div>
  );

  const renderSkills = () => {
    const hasSkillsData =
      skillPreview.length > 0 || certificationsPreview.length > 0 || trainingPreview.length > 0 || goalsPreview.length > 0;

    return (
      <div className="space-y-6">
        <TabBanner
          icon={Award}
          title="Skills & Competencies"
          subtitle="Capabilities, certifications, and development"
          gradient="from-amber-600 via-orange-600 to-rose-600 dark:from-amber-700 dark:via-orange-700 dark:to-rose-700"
          borderClass="border-amber-500/30"
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-white/15 border border-white/25">
            <Award className="w-4 h-4" />
            {skillPreview.length} skill{skillPreview.length === 1 ? '' : 's'}
          </span>
        </TabBanner>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SurfaceCard delay={0.05} className="p-6">
            <CardHeaderRow
              icon={Award}
              title="Skills"
              subtitle="Core competencies"
              iconBg="bg-amber-100 dark:bg-amber-900/30"
              iconColor="text-amber-600 dark:text-amber-400"
            />
            {skillPreview.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {skillPreview.map((skill, i) => (
                  <TagChip key={`${skill}-${i}`} tone="amber">{skill}</TagChip>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={Award}
                title="No skills recorded"
                description="Add skills from Edit Profile under Skills & Goals."
                iconWrap="bg-amber-100 dark:bg-amber-900/30"
                iconColor="text-amber-500 dark:text-amber-400"
              />
            )}
          </SurfaceCard>

          <SurfaceCard delay={0.1} className="p-6">
            <CardHeaderRow
              icon={GraduationCap}
              title="Certifications"
              subtitle="Professional credentials"
              iconBg="bg-emerald-100 dark:bg-emerald-900/30"
              iconColor="text-emerald-600 dark:text-emerald-400"
            />
            {certificationsPreview.length > 0 ? (
              <div className="space-y-2">
                {certificationsPreview.map((item, i) => (
                  <motion.div
                    key={`${item}-${i}`}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.04 * i }}
                    className="flex items-center gap-3 p-3 rounded-xl border border-emerald-200/70 dark:border-emerald-700/50 bg-emerald-50/50 dark:bg-emerald-900/10"
                  >
                    <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{item}</span>
                  </motion.div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={GraduationCap}
                title="No certifications listed"
                description="Certifications added in the employee form will show here."
                iconWrap="bg-emerald-100 dark:bg-emerald-900/30"
                iconColor="text-emerald-500 dark:text-emerald-400"
              />
            )}
          </SurfaceCard>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SurfaceCard delay={0.15} className="p-6">
            <CardHeaderRow
              icon={BookOpen}
              title="Training Records"
              subtitle="Completed training and courses"
              iconBg="bg-purple-100 dark:bg-purple-900/30"
              iconColor="text-purple-600 dark:text-purple-400"
            />
            {trainingPreview.length > 0 ? (
              <div className="space-y-2">
                {trainingPreview.map((item, i) => (
                  <motion.div
                    key={`${item}-${i}`}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.04 * i }}
                    className="flex items-center gap-3 p-3 rounded-xl border border-purple-200/70 dark:border-purple-700/50 bg-purple-50/50 dark:bg-purple-900/10"
                  >
                    <BookOpen className="w-4 h-4 text-purple-500 flex-shrink-0" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{item}</span>
                  </motion.div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={BookOpen}
                title="No training records"
                description="Training history will appear here once recorded."
                iconWrap="bg-purple-100 dark:bg-purple-900/30"
                iconColor="text-purple-500 dark:text-purple-400"
              />
            )}
          </SurfaceCard>

          <SurfaceCard delay={0.2} className="p-6">
            <CardHeaderRow
              icon={Target}
              title="Goals"
              subtitle="Development objectives"
              iconBg="bg-blue-100 dark:bg-blue-900/30"
              iconColor="text-blue-600 dark:text-blue-400"
            />
            {goalsPreview.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {goalsPreview.map((goal, i) => (
                  <TagChip key={`${goal}-${i}`} tone="blue">{goal}</TagChip>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={Target}
                title="No goals set"
                description="Career goals can be added from Edit Profile."
                iconWrap="bg-blue-100 dark:bg-blue-900/30"
                iconColor="text-blue-500 dark:text-blue-400"
              />
            )}
          </SurfaceCard>
        </div>

        {!hasSkillsData ? (
          <SurfaceCard delay={0.25} className="p-6">
            <EmptyState
              icon={Award}
              title="Build out this employee's profile"
              description="Use Edit Profile to add skills, certifications, training, and goals for a complete competency view."
              iconWrap="bg-amber-100 dark:bg-amber-900/30"
              iconColor="text-amber-500 dark:text-amber-400"
            />
          </SurfaceCard>
        ) : null}
      </div>
    );
  };

  const renderAttendance = () => (
    <div className="space-y-6">
      <TabBanner
        icon={Clock}
        title="Attendance"
        subtitle="Clock in / out from the linked UHub user account"
        gradient="from-blue-700 via-indigo-700 to-violet-700 dark:from-blue-800 dark:via-indigo-800 dark:to-violet-800"
        borderClass="border-indigo-600/30"
      />
      <EmployeeAttendancePanel employeeId={employee.id} />
    </div>
  );

  const renderLeave = () => (
    <div className="space-y-6">
      <TabBanner
        icon={CalendarDays}
        title="Leave Management"
        subtitle="Time off, balances, and leave history for this employee record"
        gradient="from-teal-700 via-cyan-700 to-blue-700 dark:from-teal-800 dark:via-cyan-800 dark:to-blue-800"
        borderClass="border-teal-600/30"
      />
      <EmployeeLeavePanel employeeId={employee.id} />
    </div>
  );

  const renderAnalytics = () => {
    const insightCards = [
      {
        label: 'Profile Completeness',
        value: employee.data_completeness_score ? `${employee.data_completeness_score}%` : '—',
        icon: PieChart,
        iconCls: 'text-indigo-600 dark:text-indigo-400',
        valueCls: 'text-indigo-600 dark:text-indigo-400',
      },
      {
        label: 'Assigned Assets',
        value: assetsLoading ? '…' : String(assignedAssets?.length ?? 0),
        icon: Package,
        iconCls: 'text-emerald-600 dark:text-emerald-400',
        valueCls: 'text-emerald-600 dark:text-emerald-400',
      },
      {
        label: 'System Access',
        value: String(accessEntries.length),
        icon: Shield,
        iconCls: 'text-slate-600 dark:text-slate-400',
        valueCls: 'text-slate-700 dark:text-slate-300',
      },
      {
        label: 'Skills Recorded',
        value: String(skillPreview.length),
        icon: Award,
        iconCls: 'text-amber-600 dark:text-amber-400',
        valueCls: 'text-amber-600 dark:text-amber-400',
      },
    ];

    return (
      <div className="space-y-6">
        <TabBanner
          icon={BarChart3}
          title="Profile Analytics"
          subtitle="Insights derived from this employee record"
          gradient="from-indigo-700 via-violet-700 to-fuchsia-700 dark:from-indigo-800 dark:via-violet-800 dark:to-fuchsia-800"
          borderClass="border-indigo-600/30"
        >
          {tenureLabel ? (
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-white/15 border border-white/25">
              <Clock className="w-4 h-4" />
              {tenureLabel}
            </span>
          ) : null}
        </TabBanner>

        <SurfaceCard delay={0.05} className="p-6">
          <CardHeaderRow
            icon={Activity}
            title="Record Insights"
            subtitle="Live metrics from profile data"
            iconBg="bg-indigo-100 dark:bg-indigo-900/30"
            iconColor="text-indigo-600 dark:text-indigo-400"
          />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {insightCards.map((card, i) => (
              <MetricTile key={card.label} {...card} delay={0.05 * i} />
            ))}
          </div>
        </SurfaceCard>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SurfaceCard delay={0.1} className="p-6">
            <CardHeaderRow
              icon={Users}
              title="Work Context"
              subtitle="Organizational placement"
              iconBg="bg-blue-100 dark:bg-blue-900/30"
              iconColor="text-blue-600 dark:text-blue-400"
            />
            <DetailList
              rows={[
                { label: 'Department', value: employee.department || 'Not assigned' },
                { label: 'Position', value: employee.position || employee.designation || '—' },
                {
                  label: 'Manager',
                  value: employee.reporting_manager?.full_name || employee.reporting_manager?.name || 'Not assigned',
                  href: employee.reporting_manager?.id ? `/employee/${employee.reporting_manager.id}` : null,
                },
                { label: 'Status', value: employee.status || 'active' },
              ]}
            />
          </SurfaceCard>

          <SurfaceCard delay={0.15} className="p-6">
            <CardHeaderRow
              icon={Monitor}
              title="Resource Summary"
              subtitle="Assets and access footprint"
              iconBg="bg-emerald-100 dark:bg-emerald-900/30"
              iconColor="text-emerald-600 dark:text-emerald-400"
            />
            <DetailList
              rows={[
                { label: 'IT Assets', value: assetsLoading ? 'Loading…' : String(assignedAssets?.length ?? 0) },
                { label: 'SIM Cards', value: simCardsLoading ? 'Loading…' : String(assignedSimCards?.length ?? 0) },
                { label: 'Access Systems', value: String(accessEntries.length) },
                { label: 'Account Role', value: employee.auth_user?.role || '—' },
              ]}
            />
          </SurfaceCard>
        </div>

        <SurfaceCard delay={0.2} className="p-6">
          <CardHeaderRow
            icon={BarChart3}
            title="Advanced Analytics"
            subtitle="Trends and historical charts"
            iconBg="bg-violet-100 dark:bg-violet-900/30"
            iconColor="text-violet-600 dark:text-violet-400"
          />
          <EmptyState
            icon={BarChart3}
            title="Analytics charts coming soon"
            description="Deeper performance trends and attendance analytics will be available in a future update."
            iconWrap="bg-violet-100 dark:bg-violet-900/30"
            iconColor="text-violet-500 dark:text-violet-400"
          />
        </SurfaceCard>
      </div>
    );
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview();
      case 'performance':
        return renderPerformance();
      case 'system_access':
        return renderSystemAccess();
      case 'assets':
        return renderAssetsAssignments();
      case 'documents':
        return renderDocuments();
      case 'skills':
        return renderSkills();
      case 'leave':
        return renderLeave();
      case 'attendance':
        return renderAttendance();
      case 'analytics':
        return renderAnalytics();
      default:
        return renderOverview();
    }
  };

  return (
    <div className="min-h-screen font-sans bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Enhanced Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-3xl p-6 sm:p-8 text-white shadow-2xl mb-6"
          >
            <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/10 blur-3xl" />
            <div className="pointer-events-none absolute -left-10 bottom-0 h-36 w-36 rounded-full bg-indigo-400/20 blur-2xl" />
            <div className="relative">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-6">
              <div className="flex items-center gap-4">
                <Link
                  to="/employees"
                  className="p-2 bg-white/20 hover:bg-white/30 rounded-xl transition-all duration-200 border border-white/30 backdrop-blur-sm"
                >
                  <ArrowLeft className="w-5 h-5 text-white" />
                </Link>
                <div>
                  <h1 className="text-3xl font-bold mb-2">Employee Profile</h1>
                  <p className="text-blue-100 text-lg">View and manage employee information</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Link
                  to={`/employee/${employee.id}/edit`}
                  className="bg-white/20 hover:bg-white/30 text-white px-5 py-2.5 rounded-xl transition-all duration-200 flex items-center gap-2 border border-white/30 backdrop-blur-sm"
                >
                  <Edit className="w-4 h-4" />
                  Edit Profile
                </Link>
              </div>
            </div>

            {/* Profile Header */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-6">
              <div className="relative flex-shrink-0 mx-auto sm:mx-0">
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/60 via-white/20 to-transparent blur-sm scale-110" />
                <div className="relative p-1 rounded-full bg-gradient-to-br from-white/80 to-white/30">
                {(employee.profile_picture || employee.photo_url) &&
                !avatarFailed &&
                !isBlobUrlUnsafeForCurrentPage(employee.profile_picture || employee.photo_url) ? (
                  <img
                    key={`${employee.id}-${employee.profile_picture || employee.photo_url || 'no-pic'}`}
                    src={employee.profile_picture || employee.photo_url}
                    alt={employee.full_name || employee.name}
                    className="w-24 h-24 rounded-full border-4 border-white/90 shadow-xl object-cover"
                    data-employee-id={employee.id}
                    onError={(e) => {
                      setAvatarFailed(true);
                    }}
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full border-4 border-white/90 shadow-xl bg-white/20 flex items-center justify-center">
                    <span className="text-white text-2xl font-bold">
                      {(employee.full_name || employee.name || 'U').charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center shadow-md">
                  <CheckCircle className="w-3.5 h-3.5 text-white" />
                </div>
              </div>
              <div className="flex-1 text-center sm:text-left min-w-0">
                <h2 className="text-2xl sm:text-3xl font-bold mb-2 truncate">{employee.full_name || employee.name}</h2>
                <p className="text-base sm:text-lg text-blue-100 mb-3">
                  {employee.position || employee.designation || '—'}
                  {employee.department ? ` · ${employee.department}` : ''}
                </p>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-sm">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 border border-white/25 text-blue-50">
                    <Building className="w-3.5 h-3.5" />
                    {employee.employee_id}
                  </span>
                  {employee.status ? (
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold border capitalize ${getHeaderStatusColor(employee.status)}`}>
                      {employee.status}
                    </span>
                  ) : null}
                  {tenureLabel ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 border border-white/25 text-blue-50 text-xs font-medium">
                      <Clock className="w-3.5 h-3.5" />
                      {tenureLabel}
                    </span>
                  ) : null}
                  {employee.location ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 border border-white/25 text-blue-50 text-xs font-medium max-w-full">
                      <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="truncate">{employee.location}</span>
                    </span>
                  ) : null}
                </div>
                {(employee.email || employee.phone) && (
                  <div className="mt-4 flex flex-wrap items-center justify-center sm:justify-start gap-2">
                    {employee.email ? (
                      <a
                        href={`mailto:${employee.email}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/25 text-sm transition-colors"
                      >
                        <Mail className="w-3.5 h-3.5" />
                        <span className="truncate max-w-[14rem]">{employee.email}</span>
                      </a>
                    ) : null}
                    {employee.phone ? (
                      <a
                        href={`tel:${employee.phone}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/25 text-sm transition-colors"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        {employee.phone}
                      </a>
                    ) : null}
                  </div>
                )}
              </div>
            </div>

            {/* Quick Stats Row */}
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                {
                  key: 'manager',
                  label: 'Reporting Manager',
                  value: employee.reporting_manager?.full_name || employee.reporting_manager?.name || 'Not assigned',
                  icon: Users
                },
                {
                  key: 'assets',
                  label: 'Assigned Assets',
                  value: assetsLoading ? 'Loading…' : String(assignedAssets?.length ?? 0),
                  icon: Package
                },
                {
                  key: 'sims',
                  label: 'SIM Cards',
                  value: simCardsLoading ? 'Loading…' : String(assignedSimCards?.length ?? 0),
                  icon: Smartphone
                },
                {
                  key: 'account',
                  label: 'Account Role',
                  value: employee.auth_user?.role ? String(employee.auth_user.role) : '—',
                  icon: Shield
                }
              ].map((stat, i) => (
                <motion.div
                  key={stat.key}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.08 * i, duration: 0.35 }}
                  whileHover={{ y: -3 }}
                  className="group rounded-2xl border border-white/20 bg-white/10 backdrop-blur-sm p-4 hover:bg-white/20 hover:border-white/30 transition-all duration-300"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-white/15 group-hover:bg-white/25 transition-colors">
                      <stat.icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs uppercase tracking-wide text-white/70 font-medium">{stat.label}</p>
                      <p className="mt-1 text-sm font-semibold text-white truncate" title={stat.value}>
                        {stat.value}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
            </div>
          </motion.div>

          {/* Tab Navigation */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 mb-6 overflow-hidden"
          >
            <div className="flex overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors duration-200 whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                  {activeTab === tab.id && (
                    <motion.div
                      layoutId="employee-profile-tab-underline"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Tab Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {renderTabContent()}
            </motion.div>
          </AnimatePresence>
      </main>
    </div>
  );
}

