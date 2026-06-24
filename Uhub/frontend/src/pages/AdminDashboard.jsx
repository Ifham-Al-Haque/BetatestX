import { useState, useEffect, Fragment } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { motion } from "framer-motion";
import {
  Activity,
  Users,
  Shield,
  Database,
  Search,
  Filter,
  Download,
  RefreshCw,
  Clock,
  User,
  TrendingUp,
  CheckCircle,
  XCircle,
  Info,
  ChevronDown,
  ChevronUp,
  Wrench,
  UserCog,
  ArrowRight,
} from "lucide-react";
import activityService from "../services/activityService";
import AdminStatCard from "../components/AdminStatCard";
import AdminUserActivityCharts from "../components/AdminUserActivityCharts";

const QUICK_LINKS = [
  { label: "User Management", path: "/user-management", icon: UserCog, color: "#3b82f6", desc: "Accounts & roles" },
  { label: "Employees", path: "/employees", icon: Users, color: "#8b5cf6", desc: "HR records" },
  { label: "IT Requests", path: "/it-requests", icon: Wrench, color: "#14b8a6", desc: "Service tickets" },
];

export default function AdminDashboard() {
  const [activityLogs, setActivityLogs] = useState([]);
  const [users, setUsers] = useState([]);
  const [activityStats, setActivityStats] = useState({});
  const [filterOptions, setFilterOptions] = useState({ actions: [], roles: [], resourceTypes: [] });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [chartRefreshToken, setChartRefreshToken] = useState(0);
  const [expandedLogId, setExpandedLogId] = useState(null);

  const [filters, setFilters] = useState({
    search: "",
    action: "",
    userRole: "",
    dateFrom: "",
    dateTo: "",
    resourceType: "",
  });
  const [showFilters, setShowFilters] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(25);
  const [totalItems, setTotalItems] = useState(0);

  useEffect(() => {
    fetchInitialData();

    const subscription = activityService.subscribeToActivityLogs((payload) => {
      if (payload.eventType === "INSERT") {
        setActivityLogs((prev) => [payload.new, ...prev.slice(0, itemsPerPage - 1)]);
        fetchActivityStats();
        setChartRefreshToken((t) => t + 1);
      }
    });

    return () => subscription?.unsubscribe();
  }, []);

  useEffect(() => {
    fetchActivityLogs();
  }, [filters, currentPage]);

  async function fetchInitialData() {
    setLoading(true);
    await Promise.all([
      fetchActivityLogs(),
      fetchUsers(),
      fetchActivityStats(),
      fetchFilterOptions(),
    ]);
    setChartRefreshToken((t) => t + 1);
    setLoading(false);
  }

  async function fetchActivityLogs() {
    try {
      const options = {
        ...filters,
        limit: itemsPerPage,
        offset: (currentPage - 1) * itemsPerPage,
      };

      const { data, error } = await activityService.getActivityLogs(options);

      if (!error && data) {
        setActivityLogs(data);
        const { count } = await supabase
          .from("activity_logs")
          .select("*", { count: "exact", head: true });
        setTotalItems(count || 0);
      }
    } catch (error) {
      console.error("Error fetching activity logs:", error);
    }
  }

  async function fetchUsers() {
    const { data, error } = await supabase
      .from("users")
      .select("id, email, role, status, full_name, last_login, created_at")
      .order("created_at", { ascending: false });
    if (!error) setUsers(data || []);
  }

  async function fetchActivityStats() {
    try {
      const stats = await activityService.getActivityStats(30);
      setActivityStats(stats || {});
    } catch (error) {
      console.error("Error fetching activity stats:", error);
    }
  }

  async function fetchFilterOptions() {
    try {
      const { data } = await supabase
        .from("activity_logs")
        .select("action, user_role, resource_type")
        .order("created_at", { ascending: false })
        .limit(500);

      if (data) {
        setFilterOptions({
          actions: [...new Set(data.map((l) => l.action).filter(Boolean))].sort(),
          roles: [...new Set(data.map((l) => l.user_role).filter(Boolean))].sort(),
          resourceTypes: [...new Set(data.map((l) => l.resource_type).filter(Boolean))].sort(),
        });
      }
    } catch (error) {
      console.error("Error fetching filter options:", error);
    }
  }

  async function handleRefresh() {
    setRefreshing(true);
    await fetchInitialData();
    setRefreshing(false);
  }

  function handleFilterChange(key, value) {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  }

  function clearFilters() {
    setFilters({ search: "", action: "", userRole: "", dateFrom: "", dateTo: "", resourceType: "" });
    setCurrentPage(1);
  }

  async function exportActivityLogs() {
    try {
      const { data } = await activityService.getActivityLogs({ ...filters, limit: 10000 });
      const csv = convertToCSV(data);
      downloadCSV(csv, "activity_logs.csv");
      await activityService.logExport("activity_logs", "csv", data.length);
    } catch (error) {
      console.error("Error exporting activity logs:", error);
    }
  }

  function convertToCSV(data) {
    if (!data.length) return "";
    const headers = ["Date/Time", "User Email", "Role", "Action", "Description", "Resource Type", "Page URL", "IP Address", "Status Code"];
    const rows = data.map((log) => [
      new Date(log.created_at).toLocaleString(),
      log.user_email || "N/A",
      log.user_role || "N/A",
      log.action || "N/A",
      log.description || "N/A",
      log.resource_type || "N/A",
      log.page_url || "N/A",
      log.ip_address || "N/A",
      log.status_code || "N/A",
    ]);
    return [headers, ...rows]
      .map((row) => row.map((field) => `"${String(field).replace(/"/g, '""')}"`).join(","))
      .join("\n");
  }

  function downloadCSV(csv, filename) {
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  const totalPages = Math.ceil(totalItems / itemsPerPage);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p style={{ color: "var(--text-muted)" }}>Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-end gap-2">
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl transition-colors disabled:opacity-50"
          style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)", color: "var(--text-primary)" }}
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </button>
        <button
          onClick={exportActivityLogs}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors"
        >
          <Download className="w-4 h-4" />
          Export Logs
        </button>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {QUICK_LINKS.map((link, i) => (
          <Link key={link.path} to={link.path}>
            <motion.div
              className="rounded-2xl p-4 flex items-center gap-4 transition-all duration-200 hover:-translate-y-0.5 group"
              style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)", boxShadow: "var(--shadow-sm)" }}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <div className="p-2.5 rounded-xl" style={{ background: `${link.color}18` }}>
                <link.icon className="w-5 h-5" style={{ color: link.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>{link.label}</p>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>{link.desc}</p>
              </div>
              <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: link.color }} />
            </motion.div>
          </Link>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminStatCard icon={Activity} title="Total Activities" value={activityStats.total_activities || 0} subtitle="Last 30 days" accentColor="#3b82f6" iconBg="rgba(59,130,246,0.12)" delay={0.05} />
        <AdminStatCard icon={Users} title="Active Users" value={activityStats.unique_users || 0} subtitle="Last 30 days" accentColor="#22c55e" iconBg="rgba(34,197,94,0.12)" delay={0.1} />
        <AdminStatCard icon={TrendingUp} title="Today's Activity" value={activityStats.activities_today || 0} subtitle="Activities today" accentColor="#a855f7" iconBg="rgba(168,85,247,0.12)" delay={0.15} />
        <AdminStatCard icon={Clock} title="Login Sessions" value={activityStats.login_count || 0} subtitle="Last 30 days" accentColor="#f97316" iconBg="rgba(249,115,22,0.12)" delay={0.2} />
      </div>

      {/* User activity analytics */}
      <AdminUserActivityCharts refreshToken={chartRefreshToken} />

      {/* Filters */}
      <motion.div
        className="rounded-2xl p-5"
        style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)", boxShadow: "var(--shadow-sm)" }}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Activity Filters</h3>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg transition-colors"
            style={{ background: "var(--bg-tertiary)", color: "var(--text-primary)" }}
          >
            <Filter className="w-4 h-4" />
            {showFilters ? "Hide" : "Show"}
          </button>
        </div>

        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--text-muted)" }} />
          <input
            type="text"
            placeholder="Search activities, users, or descriptions..."
            value={filters.search}
            onChange={(e) => handleFilterChange("search", e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            style={{ background: "var(--bg-tertiary)", border: "1px solid var(--border-primary)", color: "var(--text-primary)" }}
          />
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
            {[
              { key: "action", label: "All Actions", options: filterOptions.actions },
              { key: "userRole", label: "All Roles", options: filterOptions.roles },
              { key: "resourceType", label: "All Resources", options: filterOptions.resourceTypes },
            ].map(({ key, label, options }) => (
              <select
                key={key}
                value={filters[key]}
                onChange={(e) => handleFilterChange(key, e.target.value)}
                className="px-3 py-2 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                style={{ background: "var(--bg-tertiary)", border: "1px solid var(--border-primary)", color: "var(--text-primary)" }}
              >
                <option value="">{label}</option>
                {options.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            ))}
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => handleFilterChange("dateFrom", e.target.value)}
              className="px-3 py-2 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              style={{ background: "var(--bg-tertiary)", border: "1px solid var(--border-primary)", color: "var(--text-primary)" }}
            />
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => handleFilterChange("dateTo", e.target.value)}
              className="px-3 py-2 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              style={{ background: "var(--bg-tertiary)", border: "1px solid var(--border-primary)", color: "var(--text-primary)" }}
            />
            <button
              onClick={clearFilters}
              className="px-4 py-2 text-sm rounded-xl transition-colors"
              style={{ background: "var(--bg-tertiary)", color: "var(--text-primary)" }}
            >
              Clear
            </button>
          </div>
        )}
      </motion.div>

      {/* Activity logs table */}
      <motion.div
        className="rounded-2xl overflow-hidden"
        style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)", boxShadow: "var(--shadow-sm)" }}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
      >
        <div className="p-5 border-b" style={{ borderColor: "var(--border-primary)" }}>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg" style={{ background: "rgba(59,130,246,0.12)" }}>
              <Database className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>User Activity Logs</h3>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                Showing {activityLogs.length} of {totalItems} activities
              </p>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead style={{ background: "var(--bg-tertiary)" }}>
              <tr>
                {["Time", "User", "Action", "Description", "Resource", "Status", ""].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {activityLogs.length > 0 ? (
                activityLogs.map((log) => (
                  <Fragment key={log.id}>
                    <tr
                      className="cursor-pointer transition-colors hover:opacity-80"
                      style={{ borderBottom: "1px solid var(--border-primary)" }}
                      onClick={() => setExpandedLogId(expandedLogId === log.id ? null : log.id)}
                    >
                      <td className="px-4 py-3 whitespace-nowrap text-sm" style={{ color: "var(--text-primary)" }}>
                        <div className="flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5" style={{ color: "var(--text-muted)" }} />
                          {new Date(log.created_at).toLocaleString()}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        <div className="flex items-center gap-2">
                          <User className="w-3.5 h-3.5" style={{ color: "var(--text-muted)" }} />
                          <div>
                            <div style={{ color: "var(--text-primary)" }}>{log.user_email || "Unknown"}</div>
                            <div className="text-xs capitalize" style={{ color: "var(--text-muted)" }}>{log.user_role || "N/A"}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <ActionBadge action={log.action} />
                      </td>
                      <td className="px-4 py-3 text-sm max-w-xs truncate" style={{ color: "var(--text-primary)" }}>
                        {log.description}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm" style={{ color: "var(--text-muted)" }}>
                        {log.resource_type || "N/A"}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        {log.status_code && <StatusBadge code={log.status_code} />}
                      </td>
                      <td className="px-4 py-3">
                        {expandedLogId === log.id ? (
                          <ChevronUp className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
                        ) : (
                          <ChevronDown className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
                        )}
                      </td>
                    </tr>
                    {expandedLogId === log.id && (
                      <tr style={{ background: "var(--bg-tertiary)" }}>
                        <td colSpan={7} className="px-4 py-3 text-xs space-y-1" style={{ color: "var(--text-muted)" }}>
                          {log.page_url && <p><strong>Page:</strong> {log.page_url}</p>}
                          {log.ip_address && <p><strong>IP:</strong> {log.ip_address}</p>}
                          {log.method && <p><strong>Method:</strong> {log.method}</p>}
                          {log.duration_ms != null && <p><strong>Duration:</strong> {log.duration_ms}ms</p>}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center" style={{ color: "var(--text-muted)" }}>
                    <Database className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p>No activity logs found</p>
                    {Object.values(filters).some(Boolean) && (
                      <button onClick={clearFilters} className="mt-2 text-blue-600 hover:text-blue-800 text-sm">
                        Clear filters
                      </button>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t" style={{ borderColor: "var(--border-primary)" }}>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              {((currentPage - 1) * itemsPerPage) + 1}–{Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems}
            </p>
            <div className="flex items-center gap-2">
              <PaginationBtn onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} disabled={currentPage === 1}>Previous</PaginationBtn>
              {[...Array(Math.min(5, totalPages))].map((_, i) => {
                const page = Math.max(1, Math.min(totalPages, currentPage - 2 + i));
                return (
                  <PaginationBtn key={page} onClick={() => setCurrentPage(page)} active={currentPage === page}>
                    {page}
                  </PaginationBtn>
                );
              })}
              <PaginationBtn onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages}>Next</PaginationBtn>
            </div>
          </div>
        )}
      </motion.div>

      {/* Recent UHub users */}
      <motion.div
        className="rounded-2xl p-5"
        style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)", boxShadow: "var(--shadow-sm)" }}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg" style={{ background: "rgba(34,197,94,0.12)" }}>
              <Shield className="w-5 h-5 text-green-600" />
            </div>
            <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Recent UHub Accounts</h3>
          </div>
          {users.length > 0 && (
            <Link to="/user-management" className="text-sm font-medium text-blue-600 hover:text-blue-800 flex items-center gap-1">
              View all {users.length} <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {users.length > 0 ? (
            users.slice(0, 6).map((u) => (
              <div
                key={u.id}
                className="p-3 rounded-xl"
                style={{ background: "var(--bg-tertiary)", border: "1px solid var(--border-primary)" }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold">
                    {(u.full_name || u.email)?.charAt(0)?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>{u.full_name || u.email}</p>
                    <p className="text-xs truncate" style={{ color: "var(--text-muted)" }}>{u.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs capitalize px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">{u.role || "employee"}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${u.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                    {u.status || "active"}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-3 text-center py-6" style={{ color: "var(--text-muted)" }}>
              <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p>No UHub accounts found</p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

function ActionBadge({ action }) {
  const cls =
    action === "login" ? "bg-green-100 text-green-800" :
    action === "logout" ? "bg-red-100 text-red-800" :
    action?.includes("create") ? "bg-blue-100 text-blue-800" :
    action?.includes("update") ? "bg-yellow-100 text-yellow-800" :
    action?.includes("delete") ? "bg-red-100 text-red-800" :
    "bg-gray-100 text-gray-800";
  return <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${cls}`}>{action}</span>;
}

function StatusBadge({ code }) {
  const color = code < 300 ? "text-green-600" : code < 400 ? "text-yellow-600" : "text-red-600";
  const Icon = code < 300 ? CheckCircle : code < 400 ? Info : XCircle;
  return (
    <span className={`inline-flex items-center gap-1 ${color}`}>
      <Icon className="w-4 h-4" />{code}
    </span>
  );
}

function PaginationBtn({ children, onClick, disabled, active }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="px-3 py-1.5 text-sm rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      style={{
        background: active ? "rgba(59,130,246,0.12)" : "var(--card-bg)",
        border: `1px solid ${active ? "#93c5fd" : "var(--border-primary)"}`,
        color: active ? "#2563eb" : "var(--text-primary)",
      }}
    >
      {children}
    </button>
  );
}

export function isAdmin(user) {
  return user?.role === "admin";
}

export function isViewer(user, pageScope) {
  return user?.role === "viewer" && user.page_scopes?.includes(pageScope);
}
