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
        reporting_manager:reporting_manager_id ( full_name, name, employee_id )
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
    { id: 'analytics', label: 'Analytics', icon: BarChart3 }
  ];

  // Shared UI helpers for consistent cards across tabs
  const SurfaceCard = ({ children, className = '', delay = 0 }) => (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      whileHover={{ y: -2 }}
      className={`rounded-2xl border shadow-sm hover:shadow-md transition-all duration-300 ${
        'bg-white/90 dark:bg-gray-800/90 border-gray-200/60 dark:border-gray-700/60 backdrop-blur-sm'
      } ${className}`}
    >
      {children}
    </motion.div>
  );

  const CardHeaderRow = ({ icon: Icon, title, subtitle, iconBg = 'bg-blue-100 dark:bg-blue-900/30', iconColor = 'text-blue-600 dark:text-blue-400' }) => (
    <div className="flex items-start justify-between gap-4 mb-4">
      <div className="flex items-center gap-3 min-w-0">
        <div className={`p-2.5 rounded-xl ${iconBg} flex-shrink-0`}>
          <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>
        <div className="min-w-0">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white truncate">{title}</h3>
          {subtitle ? <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{subtitle}</p> : null}
        </div>
      </div>
    </div>
  );

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Contact Information Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SurfaceCard delay={0} className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
              <Mail className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">Email</p>
              <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                {employee.email || 'Not provided'}
              </p>
            </div>
          </div>
        </SurfaceCard>
        
        <SurfaceCard delay={0.05} className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
              <Phone className="w-4 h-4 text-green-600 dark:text-green-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">Phone</p>
              <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                {employee.phone || 'Not provided'}
              </p>
            </div>
          </div>
        </SurfaceCard>
        
        <SurfaceCard delay={0.1} className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
              <Calendar className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">Join Date</p>
              <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                {employee.hire_date ? new Date(employee.hire_date).toLocaleDateString() : 'Not provided'}
              </p>
            </div>
          </div>
        </SurfaceCard>

        <SurfaceCard delay={0.15} className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
              <MapPin className="w-4 h-4 text-orange-600 dark:text-orange-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">Location</p>
              <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                {employee.location || 'Not provided'}
              </p>
            </div>
          </div>
        </SurfaceCard>
      </div>

      {/* Additional Information */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Personal Details */}
        <SurfaceCard delay={0.2} className="p-6">
          <CardHeaderRow icon={User} title="Personal Details" subtitle="Core employee information" />
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-600">
              <span className="text-sm text-gray-600 dark:text-gray-400">Full Name</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">{employee.full_name || employee.name}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-600">
              <span className="text-sm text-gray-600 dark:text-gray-400">Position</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">{employee.position || employee.designation || 'Not specified'}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-600">
              <span className="text-sm text-gray-600 dark:text-gray-400">Employee ID</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">{employee.employee_id}</span>
            </div>
            {employee.salary && (
              <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-600">
                <span className="text-sm text-gray-600 dark:text-gray-400">Salary</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">${employee.salary.toLocaleString()}</span>
              </div>
            )}
          </div>
        </SurfaceCard>

        {/* Work Information */}
        <SurfaceCard delay={0.25} className="p-6">
          <CardHeaderRow icon={Briefcase} title="Work Information" subtitle="Department, manager and role" iconBg="bg-emerald-100 dark:bg-emerald-900/30" iconColor="text-emerald-600 dark:text-emerald-400" />
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-600">
              <span className="text-sm text-gray-600 dark:text-gray-400">Department</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">{employee.department || 'Not assigned'}</span>
            </div>
            {employee.reporting_manager && (
              <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-600">
                <span className="text-sm text-gray-600 dark:text-gray-400">Manager</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {employee.reporting_manager.full_name || employee.reporting_manager.name}
                </span>
              </div>
            )}
            <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-600">
              <span className="text-sm text-gray-600 dark:text-gray-400">Experience Level</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">{employee.experience_level || 'Not specified'}</span>
            </div>
            {employee.termination_date && (
              <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-600">
                <span className="text-sm text-gray-600 dark:text-gray-400">Termination Date</span>
                <span className="text-sm font-medium text-red-600 dark:text-red-400">
                  {new Date(employee.termination_date).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>
        </SurfaceCard>
      </div>

      {/* Key Responsibilities */}
      {employee.key_roles && (
        <SurfaceCard delay={0.3} className="p-6">
          <CardHeaderRow icon={Target} title="Key Responsibilities" subtitle="Highlights and scope" iconBg="bg-purple-100 dark:bg-purple-900/30" iconColor="text-purple-600 dark:text-purple-400" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {getArrayData(employee.key_roles).map((role, i) => (
              <div key={i} className="flex items-center gap-2 p-3 rounded-xl border border-gray-200/70 dark:border-gray-700/70 bg-gray-50/70 dark:bg-gray-900/20">
                <div className="w-2 h-2 bg-purple-500 rounded-full flex-shrink-0"></div>
                <span className="text-sm text-gray-700 dark:text-gray-300">{role}</span>
              </div>
            ))}
          </div>
        </SurfaceCard>
      )}
    </div>
  );

  const renderPerformance = () => (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">Performance Metrics</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-1">4.8</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Performance Rating</div>
          </div>
          <div className="text-center p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400 mb-1">95%</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Task Completion</div>
          </div>
          <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 mb-1">12</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Projects Completed</div>
          </div>
        </div>
      </div>
    </div>
  );

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
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">Documents</h3>
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No documents uploaded yet</p>
        </div>
      </div>
    </div>
  );

  const renderSkills = () => (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">Skills & Competencies</h3>
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <Award className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No skills recorded yet</p>
        </div>
      </div>
    </div>
  );

  const renderLeave = () => (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">Leave Management</h3>
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <CalendarDays className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No leave records available</p>
        </div>
      </div>
    </div>
  );

  const renderAnalytics = () => (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">Analytics Dashboard</h3>
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Analytics data not available yet</p>
        </div>
      </div>
    </div>
  );

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
            className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-3xl p-6 text-white shadow-2xl mb-6"
          >
            <div className="flex justify-between items-start mb-6">
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
            <div className="flex items-center gap-6">
              <div className="relative">
                {(employee.profile_picture || employee.photo_url) &&
                !avatarFailed &&
                !isBlobUrlUnsafeForCurrentPage(employee.profile_picture || employee.photo_url) ? (
                  <img
                    key={`${employee.id}-${employee.profile_picture || employee.photo_url || 'no-pic'}`}
                    src={employee.profile_picture || employee.photo_url}
                    alt={employee.full_name || employee.name}
                    className="w-20 h-20 rounded-full border-4 border-white shadow-lg object-cover"
                    data-employee-id={employee.id}
                    onError={(e) => {
                      setAvatarFailed(true);
                    }}
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full border-4 border-white shadow-lg bg-white/20 flex items-center justify-center">
                    <span className="text-white text-xl font-bold">
                      {(employee.full_name || employee.name || 'U').charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center">
                  <CheckCircle className="w-3 h-3 text-white" />
                </div>
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold mb-2">{employee.full_name || employee.name}</h2>
                <p className="text-lg text-blue-100 mb-2">
                  {employee.position || employee.designation} — {employee.department}
                </p>
                <div className="flex items-center gap-4 text-blue-100 text-sm">
                  <span className="flex items-center gap-1">
                    <Building className="w-4 h-4" />
                    {employee.employee_id}
                  </span>
                  {employee.status && (
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(employee.status)}`}>
                      {employee.status}
                    </span>
                  )}
                </div>
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
                  className="rounded-2xl border border-white/20 bg-white/10 backdrop-blur-sm p-4 hover:bg-white/15 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-white/15">
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

