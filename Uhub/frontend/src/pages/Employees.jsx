import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "../context/ToastContext";
import { useAuth } from "../context/AuthContext";
import {
  useEmployees,
  useEmployeeSummaryStats,
  useDeleteEmployee,
  useArchiveEmployee,
} from "../hooks/useApi";
import { apiService } from "../services/api";
import { exportToCSV } from "../services/enhancedEmployeeApi";
import {
  Plus,
  Search,
  Filter,
  Users,
  Building,
  Star,
  Activity,
  Eye,
  Edit,
  Trash,
  ChevronDown,
  ChevronUp,
  Download,
  UserCheck,
  Archive,
  RefreshCw,
  Network,
  X,
  LayoutGrid,
  BarChart3,
  Mail,
  MapPin,
  Hash,
  Building2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { isBlobUrlUnsafeForCurrentPage } from "../utils/imageUtils";
import { hasFeatureAccess } from "../components/RoleBasedRoute";
import { useDepartmentCatalog } from "../hooks/useDepartmentCatalog";

const PERFORMANCE_LABELS = {
  excellent: "Excellent (4.5+)",
  good: "Good (3.5–4.4)",
  average: "Average (2.5–3.4)",
  needs_improvement: "Needs Improvement (<2.5)",
};

const DEPT_PALETTE = [
  "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-700",
  "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-700",
  "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-700",
  "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-700",
  "bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-700",
  "bg-cyan-100 text-cyan-800 border-cyan-200 dark:bg-cyan-900/20 dark:text-cyan-400 dark:border-cyan-700",
  "bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-900/20 dark:text-indigo-400 dark:border-indigo-700",
  "bg-teal-100 text-teal-800 border-teal-200 dark:bg-teal-900/20 dark:text-teal-400 dark:border-teal-700",
];

const formatStatus = (status) => {
  const value = String(status || "active").replace(/_/g, " ");
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
};

const hashToIndex = (value, size) => {
  const text = String(value || "");
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) {
    hash = (hash * 31 + text.charCodeAt(i)) % 2147483647;
  }
  return Math.abs(hash) % size;
};

function PaginationBar({ currentPage, totalPages, pageSize, totalCount, onPageChange }) {
  if (totalPages <= 1) return null;

  const firstPage = Math.max(1, Math.min(currentPage - 2, totalPages - 4));
  const pageNumbers = Array.from(
    { length: Math.min(5, totalPages) },
    (_, index) => firstPage + index
  );

  return (
    <div className="px-6 md:px-8 py-6 border-t border-slate-200 dark:border-gray-700 bg-gradient-to-r from-slate-50 to-blue-50 dark:from-gray-800/80 dark:to-gray-900/80">
      <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
        <div className="text-sm text-slate-700 dark:text-gray-300 text-center lg:text-left">
          <span className="font-medium">Showing</span>{" "}
          <span className="font-bold text-slate-900 dark:text-white">
            {(currentPage - 1) * pageSize + 1}
          </span>{" "}
          <span className="font-medium">to</span>{" "}
          <span className="font-bold text-slate-900 dark:text-white">
            {Math.min(currentPage * pageSize, totalCount)}
          </span>{" "}
          <span className="font-medium">of</span>{" "}
          <span className="font-bold text-slate-900 dark:text-white">{totalCount}</span>{" "}
          <span className="font-medium">results</span>
        </div>
        <div className="flex items-center gap-3 w-full lg:w-auto justify-between lg:justify-end">
          <button
            type="button"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-5 py-2.5 border-2 border-slate-300 dark:border-gray-600 rounded-xl text-slate-700 dark:text-gray-200 hover:bg-slate-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium"
          >
            Previous
          </button>
          <div className="hidden sm:flex items-center gap-2">
            {pageNumbers.map((page) => {
              return (
                <button
                  key={page}
                  type="button"
                  onClick={() => onPageChange(page)}
                  className={`px-4 py-2.5 rounded-xl font-medium transition-all duration-200 ${
                    currentPage === page
                      ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg scale-105"
                      : "border-2 border-slate-300 dark:border-gray-600 text-slate-700 dark:text-gray-200 hover:bg-slate-50 dark:hover:bg-gray-700"
                  }`}
                >
                  {page}
                </button>
              );
            })}
          </div>
          <button
            type="button"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-5 py-2.5 border-2 border-slate-300 dark:border-gray-600 rounded-xl text-slate-700 dark:text-gray-200 hover:bg-slate-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}

function Employees() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sortKey, setSortKey] = useState("full_name");
  const [sortOrder, setSortOrder] = useState("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);
  const [viewMode, setViewMode] = useState(() => {
    try {
      return window.localStorage.getItem("uhub-employees-view") === "table" ? "table" : "grid";
    } catch {
      return "grid";
    }
  });
  const [showFilters, setShowFilters] = useState(false);
  const [showDepartmentOverview, setShowDepartmentOverview] = useState(false);
  const [activeStatFilter, setActiveStatFilter] = useState("");
  const [filters, setFilters] = useState({
    department: "",
    performance: "",
    location: "",
    employment: "",
  });
  const [departmentOptions, setDepartmentOptions] = useState([]);
  const [locationOptions, setLocationOptions] = useState([]);
  const [exporting, setExporting] = useState(false);

  const imageErrorsRef = useRef(new Set());
  const [, forceUpdate] = useState(0);

  const triggerRerender = useCallback(() => {
    forceUpdate((prev) => prev + 1);
  }, []);

  const navigate = useNavigate();
  const { success, error: showError } = useToast();
  const { userProfile } = useAuth();

  const queryFilters = useMemo(
    () => ({
      department: filters.department,
      location: filters.location,
      performance: filters.performance,
      employment: filters.employment,
      sortKey,
      sortOrder,
    }),
    [
      filters.department,
      filters.location,
      filters.performance,
      filters.employment,
      sortKey,
      sortOrder,
    ]
  );

  const { data: employeesData, isLoading, error, refetch, isFetching } = useEmployees(
    currentPage,
    pageSize,
    debouncedSearch,
    queryFilters
  );
  const { data: summaryStats, isLoading: statsLoading } = useEmployeeSummaryStats();
  const { data: catalog } = useDepartmentCatalog();
  const deleteEmployeeMutation = useDeleteEmployee();
  const archiveEmployeeMutation = useArchiveEmployee();

  const employees = useMemo(() => employeesData?.data || [], [employeesData?.data]);
  const totalCount = employeesData?.count || 0;

  const handleDelete = useCallback(
    async (id) => {
      const confirm = window.confirm("Are you sure you want to delete this employee?");
      if (!confirm) return;

      try {
        await deleteEmployeeMutation.mutateAsync(id);
        success("Success", "Employee deleted successfully.");
      } catch (err) {
        showError("Delete Failed", err.message);
      }
    },
    [deleteEmployeeMutation, success, showError]
  );

  const handleArchive = useCallback(
    async (id, employeeName) => {
      const confirm = window.confirm(
        `Are you sure you want to archive ${employeeName || "this employee"}? They will be moved to Employee History.`
      );
      if (!confirm) return;

      try {
        await archiveEmployeeMutation.mutateAsync(id);
        success("Success", "Employee archived successfully. They can be found in Employee History.");
        refetch();
      } catch (err) {
        showError("Archive Failed", err.message);
      }
    },
    [archiveEmployeeMutation, success, showError, refetch]
  );

  const filteredAndSortedEmployees = employees;

  useEffect(() => {
    setCurrentPage(1);
  }, [
    filters.department,
    filters.location,
    filters.performance,
    filters.employment,
    sortKey,
    sortOrder,
  ]);

  useEffect(() => {
    try {
      window.localStorage.setItem("uhub-employees-view", viewMode);
    } catch {
      // Ignore storage errors in private browsing.
    }
  }, [viewMode]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
      setCurrentPage(1);
    }, 300);

    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    const loadFilterOptions = async () => {
      try {
        const [departmentsFromDb, locationsFromDb] = await Promise.all([
          apiService.employees.getDistinctFieldValues("department"),
          apiService.employees.getDistinctFieldValues("location"),
        ]);
        const catalogNames = (catalog?.departments || []).map((dept) => dept.name);
        setDepartmentOptions(
          [...new Set([...departmentsFromDb, ...catalogNames].filter(Boolean))].sort((a, b) =>
            String(a).localeCompare(String(b))
          )
        );
        setLocationOptions(locationsFromDb);
      } catch (err) {
        console.error("Failed to load employee filter options:", err);
        setDepartmentOptions((catalog?.departments || []).map((dept) => dept.name));
        setLocationOptions([]);
      }
    };

    loadFilterOptions();
  }, [catalog?.departments]);

  const handleExport = useCallback(async () => {
    try {
      setExporting(true);
      const rows = await apiService.employees.exportData(search.trim(), queryFilters);
      if (!rows.length) {
        showError("Export Failed", "No employee records match the current filters.");
        return;
      }
      exportToCSV(rows, `employees_${new Date().toISOString().split("T")[0]}`);
      success("Exported", `${rows.length} employee record(s) exported to CSV.`);
    } catch (err) {
      showError("Export Failed", err.message || "Failed to export employee data.");
    } finally {
      setExporting(false);
    }
  }, [search, queryFilters, success, showError]);

  const totalPages = Math.ceil(totalCount / pageSize);

  const handlePageChange = useCallback((page) => {
    setCurrentPage(page);
    window.requestAnimationFrame(() => {
      document.getElementById("employee-results")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  }, []);

  const handleSearch = useCallback((value) => {
    setSearch(value);
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({
      department: "",
      performance: "",
      location: "",
      employment: "",
    });
    setActiveStatFilter("");
  }, []);

  const removeFilter = useCallback((key) => {
    setFilters((prev) => ({ ...prev, [key]: "" }));
    if (key === "performance" || key === "employment") {
      setActiveStatFilter("");
    }
  }, []);

  const handleStatClick = useCallback((statKey) => {
    if (statKey === "total") {
      clearFilters();
      setShowDepartmentOverview(false);
      return;
    }
    if (statKey === "highPerformers") {
      setFilters((prev) => ({
        ...prev,
        performance: prev.performance === "excellent" ? "" : "excellent",
        employment: "",
      }));
      setActiveStatFilter((prev) => (prev === "highPerformers" ? "" : "highPerformers"));
      setShowDepartmentOverview(false);
      return;
    }
    if (statKey === "active") {
      setFilters((prev) => ({
        ...prev,
        employment: prev.employment === "active" ? "" : "active",
        performance: "",
      }));
      setActiveStatFilter((prev) => (prev === "active" ? "" : "active"));
      setShowDepartmentOverview(false);
      return;
    }
    if (statKey === "departments") {
      setShowDepartmentOverview((prev) => !prev);
    }
  }, [clearFilters]);

  const canViewEmployee = useCallback(() => {
    const userRole = userProfile?.role;
    return userRole === "admin" || userRole === "hr_manager";
  }, [userProfile?.role]);

  const canEditEmployee = useCallback(() => {
    return userProfile?.role === "admin";
  }, [userProfile?.role]);

  const canDeleteEmployee = useCallback(() => {
    return userProfile?.role === "admin";
  }, [userProfile?.role]);

  const canAddEmployee = useCallback(() => {
    return userProfile?.role === "admin";
  }, [userProfile?.role]);

  const canViewOrgChart = hasFeatureAccess(userProfile?.role, "organizational_hierarchy");
  const canManageDepartments = ["admin", "hr_manager", "super_admin"].includes(userProfile?.role);

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "active":
        return "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-700";
      case "inactive":
        return "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-700";
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-700";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600";
    }
  };

  const getDepartmentColor = (department) => {
    const colors = {
      IT: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-700",
      HR: "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-700",
      FINANCE: "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-700",
      MARKETING: "bg-pink-100 text-pink-800 border-pink-200 dark:bg-pink-900/20 dark:text-pink-400 dark:border-pink-700",
      SALES: "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-700",
      OPERATIONS: "bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-900/20 dark:text-indigo-400 dark:border-indigo-700",
      Engineering: "bg-teal-100 text-teal-800 border-teal-200 dark:bg-teal-900/20 dark:text-teal-400 dark:border-teal-700",
      Design: "bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-700",
      Support: "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-700",
      "SUBSCRIBE NOW SALES": "bg-violet-100 text-violet-800 border-violet-200 dark:bg-violet-900/20 dark:text-violet-400 dark:border-violet-700",
      TECHNOLOGY: "bg-cyan-100 text-cyan-800 border-cyan-200 dark:bg-cyan-900/20 dark:text-cyan-400 dark:border-cyan-700",
      IOT: "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-700",
      COLLECTION: "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-700",
      "Customer Service": "bg-cyan-100 text-cyan-800 border-cyan-200 dark:bg-cyan-900/20 dark:text-cyan-400 dark:border-cyan-700",
      "Driver Management": "bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-900/20 dark:text-slate-400 dark:border-slate-700",
    };
    return (
      colors[department] ||
      DEPT_PALETTE[hashToIndex(department, DEPT_PALETTE.length)]
    );
  };

  const activeFilterChips = useMemo(() => {
    const chips = [];
    if (filters.department) chips.push({ key: "department", label: filters.department });
    if (filters.performance)
      chips.push({ key: "performance", label: PERFORMANCE_LABELS[filters.performance] || filters.performance });
    if (filters.location) chips.push({ key: "location", label: filters.location });
    if (filters.employment) {
      const employmentLabels = {
        active: "Active employees",
        inactive: "Inactive employees",
        pending: "Pending employees",
      };
      chips.push({
        key: "employment",
        label: employmentLabels[filters.employment] || filters.employment,
      });
    }
    return chips;
  }, [filters]);

  const departmentBreakdownEntries = useMemo(() => {
    const breakdown = summaryStats?.departmentBreakdown || {};
    return Object.entries(breakdown).sort((a, b) => b[1] - a[1]);
  }, [summaryStats?.departmentBreakdown]);

  const statCards = [
    {
      key: "total",
      label: "Total Employees",
      value: summaryStats?.total ?? totalCount,
      icon: Users,
      active: activeStatFilter === "" && !activeFilterChips.length,
    },
    {
      key: "highPerformers",
      label: "High Performers",
      value: summaryStats?.highPerformers ?? "—",
      icon: Star,
      active: activeStatFilter === "highPerformers",
    },
    {
      key: "departments",
      label: "Departments",
      value: summaryStats?.departments ?? "—",
      icon: Building,
      active: showDepartmentOverview,
    },
    {
      key: "active",
      label: "Active",
      value: summaryStats?.active ?? "—",
      icon: Activity,
      active: activeStatFilter === "active",
    },
  ];

  const renderEmployeeAvatar = (employee, size = "md") => {
    const imageUrl = employee.profile_picture || employee.photo_url;
    const imageKey = `${employee.id}-${imageUrl}`;
    const hasError = imageErrorsRef.current.has(imageKey);
    const unsafeBlob = isBlobUrlUnsafeForCurrentPage(imageUrl);
    const sizeClass = size === "lg" ? "h-16 w-16 text-xl ring-4" : "h-12 w-12 text-lg ring-2";

    if (!imageUrl || hasError || unsafeBlob) {
      return (
        <div
          className={`${sizeClass} rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-bold ring-white dark:ring-gray-800 shadow-lg`}
        >
          {(employee.full_name || employee.name || "U").charAt(0).toUpperCase()}
        </div>
      );
    }

    return (
      <img
        key={imageKey}
        className={`${sizeClass} rounded-full ring-white dark:ring-gray-800 shadow-lg object-cover`}
        src={imageUrl}
        alt={employee.full_name || employee.name}
        onError={() => {
          if (!imageErrorsRef.current.has(imageKey)) {
            imageErrorsRef.current.add(imageKey);
            triggerRerender();
          }
        }}
      />
    );
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="rounded-3xl border border-red-200/70 dark:border-red-900/40 bg-white/80 dark:bg-gray-800/70 backdrop-blur-sm shadow-xl p-8">
            <h3 className="text-red-800 dark:text-red-300 font-semibold text-lg">Error Loading Employees</h3>
            <p className="text-red-600 dark:text-red-400 mt-2">{error.message}</p>
            <div className="mt-6">
              <button
                type="button"
                onClick={() => refetch()}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 text-white hover:bg-red-700 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Try again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-2xl p-6 md:p-8 text-white shadow-xl mb-8"
        >
          <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/10 blur-3xl" />
          <div className="relative">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 mb-6">
              <div>
                <p className="text-blue-100 text-sm font-medium mb-1">HR Panel</p>
                <h1 className="text-3xl md:text-4xl font-bold mb-2">Employee Records</h1>
                <p className="text-blue-100 text-base md:text-lg max-w-xl">
                  Manage and monitor your UDrive workforce — profiles, departments, and performance at a glance.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => refetch()}
                  disabled={isFetching}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white/15 hover:bg-white/25 border border-white/20 text-white transition-all disabled:opacity-60"
                  title="Refresh"
                >
                  <RefreshCw className={`w-4 h-4 ${isFetching ? "animate-spin" : ""}`} />
                  <span className="hidden sm:inline">Refresh</span>
                </button>
                {canViewOrgChart && (
                  <button
                    type="button"
                    onClick={() => navigate("/organizational-hierarchy")}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white/15 hover:bg-white/25 border border-white/20 text-white transition-all"
                  >
                    <Network className="w-4 h-4" />
                    <span className="hidden sm:inline">Org Chart</span>
                  </button>
                )}
                {canManageDepartments && (
                  <button
                    type="button"
                    onClick={() => navigate("/departments")}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white/15 hover:bg-white/25 border border-white/20 text-white transition-all"
                  >
                    <Building2 className="w-4 h-4" />
                    <span className="hidden sm:inline">Departments</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => navigate("/employee-history")}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white/15 hover:bg-white/25 border border-white/20 text-white transition-all"
                >
                  <Archive className="w-4 h-4" />
                  <span className="hidden sm:inline">History</span>
                </button>
                {canAddEmployee() && (
                  <button
                    type="button"
                    onClick={() => navigate("/employee-form")}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-blue-700 hover:bg-blue-50 font-semibold shadow-lg transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    Add Employee
                  </button>
                )}
              </div>
            </div>

            {/* Clickable stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
              {statCards.map((stat, i) => {
                const Icon = stat.icon;
                return (
                  <motion.button
                    key={stat.key}
                    type="button"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06 }}
                    onClick={() => handleStatClick(stat.key)}
                    className={`text-left rounded-xl p-4 border transition-all duration-200 hover:bg-white/20 ${
                      stat.active
                        ? "bg-white/25 border-white/50 ring-2 ring-white/40"
                        : "bg-white/10 border-white/20"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white/20 rounded-lg">
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-blue-100 text-xs md:text-sm truncate">{stat.label}</p>
                        <p className="text-xl md:text-2xl font-bold tabular-nums">
                          {statsLoading ? "…" : stat.value}
                        </p>
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </div>
        </motion.div>

        {/* Department overview */}
        <AnimatePresence>
          {showDepartmentOverview && departmentBreakdownEntries.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden mb-8"
            >
              <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl border border-gray-200/60 dark:border-gray-700/60 shadow-sm p-6">
                <div className="flex items-center gap-3 mb-5">
                  <div className="p-2.5 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl">
                    <BarChart3 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Department Overview</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Headcount by department — click a bar to filter</p>
                  </div>
                </div>
                <div className="space-y-3">
                  {departmentBreakdownEntries.slice(0, 10).map(([dept, count]) => {
                    const max = departmentBreakdownEntries[0]?.[1] || 1;
                    const isSelected = filters.department === dept;
                    return (
                      <button
                        key={dept}
                        type="button"
                        onClick={() =>
                          setFilters((prev) => ({
                            ...prev,
                            department: prev.department === dept ? "" : dept,
                          }))
                        }
                        className={`w-full text-left group rounded-xl px-3 py-2 transition-colors ${
                          isSelected ? "bg-blue-50 dark:bg-blue-900/20" : "hover:bg-gray-50 dark:hover:bg-gray-700/40"
                        }`}
                      >
                        <div className="flex justify-between text-sm mb-1.5">
                          <span className={`font-medium truncate pr-4 ${isSelected ? "text-blue-700 dark:text-blue-300" : "text-gray-700 dark:text-gray-200"}`}>
                            {dept}
                          </span>
                          <span className="text-gray-900 dark:text-white font-semibold tabular-nums">{count}</span>
                        </div>
                        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-500"
                            style={{ width: `${(count / max) * 100}%` }}
                          />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Search, filters, sort */}
        <motion.div
          id="employee-results"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/90 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-200/60 dark:border-gray-700/60 mb-6"
        >
          <div className="p-5 md:p-6">
            <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between mb-4">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search by name, ID, department, phone, location…"
                  value={search}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full pl-12 pr-11 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    aria-label="Clear search"
                    title="Clear search"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex bg-gray-100 dark:bg-gray-700 rounded-xl p-1">
                  <button
                    type="button"
                    onClick={() => setViewMode("grid")}
                    className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-all ${
                      viewMode === "grid"
                        ? "bg-white dark:bg-gray-600 text-indigo-600 dark:text-indigo-300 shadow-sm"
                        : "text-gray-500 dark:text-gray-400"
                    }`}
                  >
                    <LayoutGrid className="w-4 h-4" />
                    Grid
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode("table")}
                    className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-all ${
                      viewMode === "table"
                        ? "bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-300 shadow-sm"
                        : "text-gray-500 dark:text-gray-400"
                    }`}
                  >
                    <Users className="w-4 h-4" />
                    Table
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setShowFilters(!showFilters)}
                  className={`px-4 py-2.5 border-2 rounded-xl font-medium flex items-center gap-2 transition-all ${
                    showFilters
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                      : "border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:border-blue-400"
                  }`}
                >
                  <Filter className="w-4 h-4" />
                  Filters
                  {activeFilterChips.length > 0 && (
                    <span className="inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full bg-blue-600 text-white text-xs">
                      {activeFilterChips.length}
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleExport}
                  disabled={exporting}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white rounded-xl font-medium flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  {exporting ? "Exporting…" : "Export"}
                </button>
              </div>
            </div>

            {activeFilterChips.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Active:</span>
                {activeFilterChips.map((chip) => (
                  <button
                    key={chip.key}
                    type="button"
                    onClick={() => removeFilter(chip.key)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 border border-blue-200 dark:border-blue-800 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                  >
                    {chip.label}
                    <X className="w-3.5 h-3.5" />
                  </button>
                ))}
                <button
                  type="button"
                  onClick={clearFilters}
                  className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 underline-offset-2 hover:underline"
                >
                  Clear all
                </button>
              </div>
            )}

            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="border-t border-gray-200 dark:border-gray-700 pt-5 overflow-hidden"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Department</label>
                      <select
                        value={filters.department}
                        onChange={(e) => setFilters((prev) => ({ ...prev, department: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                      >
                        <option value="">All Departments</option>
                        {departmentOptions.map((dept) => (
                          <option key={dept} value={dept}>
                            {dept}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Performance</label>
                      <select
                        value={filters.performance}
                        onChange={(e) => {
                          setFilters((prev) => ({ ...prev, performance: e.target.value }));
                          setActiveStatFilter(e.target.value === "excellent" ? "highPerformers" : "");
                        }}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                      >
                        <option value="">All Performance Levels</option>
                        <option value="excellent">Excellent (4.5+)</option>
                        <option value="good">Good (3.5–4.4)</option>
                        <option value="average">Average (2.5–3.4)</option>
                        <option value="needs_improvement">Needs Improvement (&lt;2.5)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Location</label>
                      <select
                        value={filters.location}
                        onChange={(e) => setFilters((prev) => ({ ...prev, location: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                      >
                        <option value="">All Locations</option>
                        {locationOptions.map((location) => (
                          <option key={location} value={location}>
                            {location}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Employment Status</label>
                      <select
                        value={filters.employment}
                        onChange={(e) => {
                          setFilters((prev) => ({ ...prev, employment: e.target.value }));
                          setActiveStatFilter(e.target.value === "active" ? "active" : "");
                        }}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                      >
                        <option value="">All Statuses</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="pending">Pending</option>
                      </select>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-gray-100 dark:border-gray-700/70">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-500 dark:text-gray-400">Showing</span>
                <span className="font-semibold text-gray-900 dark:text-white">{filteredAndSortedEmployees.length}</span>
                <span className="text-gray-500 dark:text-gray-400">on this page of</span>
                <span className="font-semibold text-gray-900 dark:text-white">{totalCount}</span>
                <span className="text-gray-500 dark:text-gray-400">
                  {activeFilterChips.length || debouncedSearch ? "matching employees" : "employees"}
                </span>
                {isFetching && !isLoading && (
                  <RefreshCw className="w-3.5 h-3.5 text-blue-500 animate-spin" />
                )}
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={sortKey}
                  onChange={(e) => setSortKey(e.target.value)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm"
                >
                  <option value="full_name">Sort by Name</option>
                  <option value="department">Sort by Department</option>
                  <option value="position">Sort by Position</option>
                  <option value="hire_date">Sort by Hire Date</option>
                  <option value="performance_rating">Sort by Performance</option>
                </select>
                <button
                  type="button"
                  onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                  className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                  title={`Sort ${sortOrder === "asc" ? "descending" : "ascending"}`}
                >
                  {sortOrder === "asc" ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Loading */}
        {isLoading && (
          <div className="py-6 space-y-4">
            <div className="h-6 w-56 bg-gray-200/70 dark:bg-gray-700/70 rounded-lg animate-pulse" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="h-56 rounded-2xl border border-gray-200/60 dark:border-gray-700/60 bg-white/80 dark:bg-gray-800/70 animate-pulse"
                />
              ))}
            </div>
          </div>
        )}

        {!isLoading && (
          <AnimatePresence mode="wait">
            {viewMode === "grid" ? (
              <motion.div
                key="grid"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className={isFetching && !isLoading ? "opacity-70 transition-opacity" : "transition-opacity"}
              >
                {filteredAndSortedEmployees.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 px-6 rounded-2xl bg-white/80 dark:bg-gray-800/80 border border-gray-200/60 dark:border-gray-700/60">
                    <div className="rounded-full bg-blue-50 dark:bg-blue-900/20 p-4 mb-4">
                      <Users className="w-10 h-10 text-blue-400" />
                    </div>
                    <p className="text-base font-medium text-gray-700 dark:text-gray-300">No employees match your filters</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Try adjusting search or filters to see more people.</p>
                    {(activeFilterChips.length > 0 || search) && (
                      <button
                        type="button"
                        onClick={() => {
                          setSearch("");
                          clearFilters();
                        }}
                        className="mt-4 px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
                      >
                        Clear search and filters
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                    {filteredAndSortedEmployees.map((employee, index) => (
                      <motion.div
                        key={employee.id}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: Math.min(index * 0.04, 0.28) }}
                        whileHover={{ y: -4 }}
                        role={canViewEmployee() ? "button" : undefined}
                        tabIndex={canViewEmployee() ? 0 : undefined}
                        onClick={() => canViewEmployee() && navigate(`/employee/${employee.id}`)}
                        onKeyDown={(e) => {
                          if (canViewEmployee() && (e.key === "Enter" || e.key === " ")) {
                            e.preventDefault();
                            navigate(`/employee/${employee.id}`);
                          }
                        }}
                        className={`w-full bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200/70 dark:border-gray-700/60 overflow-hidden transition-all duration-300 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-xl ${
                          canViewEmployee() ? "cursor-pointer" : ""
                        }`}
                      >
                        <div className="h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />
                        <div className="p-5">
                          <div className="flex items-start gap-3 mb-4">
                            <div className="shrink-0">{renderEmployeeAvatar(employee, "lg")}</div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-start justify-between gap-2">
                                <h3 className="text-base font-semibold text-gray-900 dark:text-white leading-snug line-clamp-2">
                                  {employee.full_name || employee.name || "Unknown"}
                                </h3>
                                <span className={`inline-flex px-2 py-0.5 text-[11px] font-medium rounded-full border flex-shrink-0 ${getStatusColor(employee.status)}`}>
                                  {formatStatus(employee.status)}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600 dark:text-gray-400 truncate mt-0.5">
                                {employee.designation || employee.position || "No Position"}
                              </p>
                              <span className={`inline-flex mt-2 px-2 py-0.5 text-xs font-medium rounded-lg border truncate max-w-full ${getDepartmentColor(employee.department)}`}>
                                {employee.department || "Unassigned"}
                              </span>
                            </div>
                          </div>

                          <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                            <div className="flex items-center gap-2 min-w-0">
                              <Hash className="w-3.5 h-3.5 shrink-0 text-gray-400" />
                              <span className="truncate font-medium text-gray-800 dark:text-gray-200">{employee.employee_id || "No ID"}</span>
                            </div>
                            {employee.location && (
                              <div className="flex items-center gap-2 min-w-0">
                                <MapPin className="w-3.5 h-3.5 shrink-0 text-gray-400" />
                                <span className="truncate">{employee.location}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-2 min-w-0">
                              <Mail className="w-3.5 h-3.5 shrink-0 text-gray-400" />
                              <span className="truncate">{employee.email || "No email"}</span>
                            </div>
                            {employee.reporting_manager?.full_name && (
                              <div className="flex items-center gap-2 min-w-0">
                                <UserCheck className="w-3.5 h-3.5 shrink-0 text-gray-400" />
                                <span className="truncate">Reports to {employee.reporting_manager.full_name}</span>
                              </div>
                            )}
                            {employee.performance_rating > 0 && (
                              <div className="flex items-center gap-1.5 pt-0.5">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star
                                    key={star}
                                    className={`w-3.5 h-3.5 ${
                                      star <= employee.performance_rating
                                        ? "text-amber-400 fill-current"
                                        : "text-gray-300 dark:text-gray-600"
                                    }`}
                                  />
                                ))}
                              </div>
                            )}
                          </div>

                          {(canViewEmployee() || canEditEmployee() || canDeleteEmployee()) && (
                            <div
                              className="flex items-center gap-1.5 pt-4 mt-4 border-t border-gray-100 dark:border-gray-700/70"
                              onClick={(e) => e.stopPropagation()}
                              onKeyDown={(e) => e.stopPropagation()}
                            >
                              {canViewEmployee() && (
                                <button
                                  type="button"
                                  onClick={() => navigate(`/employee/${employee.id}`)}
                                  className="flex-1 py-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg text-sm font-medium flex items-center justify-center gap-1"
                                >
                                  <Eye className="w-4 h-4" />
                                  View
                                </button>
                              )}
                              {canEditEmployee() && (
                                <button
                                  type="button"
                                  onClick={() => navigate(`/employee/${employee.id}/edit`)}
                                  className="flex-1 py-2 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg text-sm font-medium flex items-center justify-center gap-1"
                                >
                                  <Edit className="w-4 h-4" />
                                  Edit
                                </button>
                              )}
                              {canDeleteEmployee() && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => handleArchive(employee.id, employee.full_name || employee.name)}
                                    disabled={archiveEmployeeMutation.isLoading}
                                    className="p-2 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/30 rounded-lg disabled:opacity-50"
                                    title="Archive employee"
                                  >
                                    <Archive className="w-4 h-4" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDelete(employee.id)}
                                    disabled={deleteEmployeeMutation.isLoading}
                                    className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg disabled:opacity-50"
                                    title="Delete employee"
                                  >
                                    <Trash className="w-4 h-4" />
                                  </button>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
                {totalPages > 1 && (
                  <div className="mt-6 rounded-2xl overflow-hidden border border-gray-200/60 dark:border-gray-700/60 bg-white/90 dark:bg-gray-800/90">
                    <PaginationBar
                      currentPage={currentPage}
                      totalPages={totalPages}
                      pageSize={pageSize}
                      totalCount={totalCount}
                      onPageChange={handlePageChange}
                    />
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="table"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-200/60 dark:border-gray-700/60 overflow-hidden relative"
              >
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gradient-to-r from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-800 dark:via-gray-800 dark:to-gray-900">
                      <tr>
                        {["Employee", "Designation", "Department", "Status"].map((col) => (
                          <th
                            key={col}
                            className="px-6 py-4 text-left text-xs font-semibold text-slate-700 dark:text-gray-300 uppercase tracking-wider border-b border-slate-200 dark:border-gray-700"
                          >
                            {col}
                          </th>
                        ))}
                        {(canViewEmployee() || canEditEmployee() || canDeleteEmployee()) && (
                          <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 dark:text-gray-300 uppercase tracking-wider border-b border-slate-200 dark:border-gray-700">
                            Actions
                          </th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-gray-700">
                      {filteredAndSortedEmployees.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-6 py-12 text-center">
                            <p className="text-gray-600 dark:text-gray-300 font-medium">No employees match your filters.</p>
                            {(activeFilterChips.length > 0 || search) && (
                              <button
                                type="button"
                                onClick={() => {
                                  setSearch("");
                                  clearFilters();
                                }}
                                className="mt-3 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                              >
                                Clear search and filters
                              </button>
                            )}
                          </td>
                        </tr>
                      ) : (
                        filteredAndSortedEmployees.map((employee) => (
                          <tr
                            key={employee.id}
                            onClick={() => canViewEmployee() && navigate(`/employee/${employee.id}`)}
                            className={`hover:bg-slate-50 dark:hover:bg-gray-700/40 transition-colors group ${
                              canViewEmployee() ? "cursor-pointer" : ""
                            }`}
                          >
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center min-w-0">
                                <div className="flex-shrink-0">{renderEmployeeAvatar(employee)}</div>
                                <div className="ml-4 min-w-0">
                                  <div className="text-sm font-semibold text-slate-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400">
                                    {employee.full_name || employee.name || "Unknown"}
                                  </div>
                                  <div className="text-sm text-slate-500 dark:text-gray-400 truncate">{employee.email || "No Email"}</div>
                                  {employee.reporting_manager?.full_name && (
                                    <div className="text-xs text-slate-400 dark:text-gray-500 truncate">
                                      Reports to {employee.reporting_manager.full_name}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-full border bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800">
                                <UserCheck className="w-3.5 h-3.5" />
                                {employee.designation || employee.position || "Not Specified"}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-3 py-1.5 text-sm font-medium rounded-full border ${getDepartmentColor(employee.department)}`}>
                                {employee.department || "Unassigned"}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full border ${getStatusColor(employee.status)}`}>
                                {formatStatus(employee.status)}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                              {(canViewEmployee() || canEditEmployee() || canDeleteEmployee()) ? (
                                <div className="flex items-center gap-1">
                                  {canViewEmployee() && (
                                    <button type="button" onClick={() => navigate(`/employee/${employee.id}`)} className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg" title="View">
                                      <Eye className="w-4 h-4" />
                                    </button>
                                  )}
                                  {canEditEmployee() && (
                                    <button type="button" onClick={() => navigate(`/employee/${employee.id}/edit`)} className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg" title="Edit">
                                      <Edit className="w-4 h-4" />
                                    </button>
                                  )}
                                  {canDeleteEmployee() && (
                                    <>
                                      <button type="button" onClick={() => handleArchive(employee.id, employee.full_name || employee.name)} disabled={archiveEmployeeMutation.isLoading} className="p-2 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg disabled:opacity-50" title="Archive">
                                        <Archive className="w-4 h-4" />
                                      </button>
                                      <button type="button" onClick={() => handleDelete(employee.id)} disabled={deleteEmployeeMutation.isLoading} className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg disabled:opacity-50" title="Delete">
                                        <Trash className="w-4 h-4" />
                                      </button>
                                    </>
                                  )}
                                </div>
                              ) : (
                                <span className="text-sm text-gray-400">—</span>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                <PaginationBar
                  currentPage={currentPage}
                  totalPages={totalPages}
                  pageSize={pageSize}
                  totalCount={totalCount}
                  onPageChange={handlePageChange}
                />
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}

export default Employees;
