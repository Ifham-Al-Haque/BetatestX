import { useState, useCallback, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../context/AuthContext";
import {
  Monitor, Laptop, Server, Printer, Network,
  Search, Plus, Edit, Trash, User, Calendar,
  CheckCircle, AlertTriangle, Clock, DollarSign,
  Database, Smartphone as PhoneIcon,
  Grid, List, Download, Eye, Package, RefreshCw,
  BarChart3, X, ArrowUpDown,
} from "lucide-react";
import {
  useAssets,
  useAssetStats,
  useDeleteAsset,
  useCreateAsset,
  useUpdateAsset,
} from "../hooks/useApi";
import { useToast } from "../context/ToastContext";
import { apiService } from "../services/api";
import { exportToCSV } from "../services/enhancedEmployeeApi";
import AssetForm from "../components/AssetForm";
import PaginationControls from "../components/ui/PaginationControls";
import ConfirmDialog from "../components/operation/ConfirmDialog";

const ASSET_TYPES = [
  "Laptop", "Desktop", "All in One", "Mobile", "Server", "Printer", "Network",
  "Monitor", "Keyboard", "Mouse", "Keyboard and Mouse", "Headset", "Speaker",
  "Camera", "Laptop Stand",
];

const SORT_OPTIONS = [
  { value: "created_at:desc", label: "Newest first" },
  { value: "created_at:asc", label: "Oldest first" },
  { value: "name:asc", label: "Name (A–Z)" },
  { value: "name:desc", label: "Name (Z–A)" },
  { value: "purchase_price:desc", label: "Price (high to low)" },
  { value: "purchase_price:asc", label: "Price (low to high)" },
  { value: "status:asc", label: "Status" },
  { value: "type:asc", label: "Type" },
];

function getAssetIcon(type) {
  switch (type?.toLowerCase()) {
    case "laptop": return Laptop;
    case "desktop": return Monitor;
    case "mobile": return PhoneIcon;
    case "server": return Server;
    case "printer": return Printer;
    case "network": return Network;
    default: return Monitor;
  }
}

function getStatusColor(status) {
  switch (status) {
    case "In Stock":
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
    case "Assigned":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
    case "Maintenance":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
    case "Retired":
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
  }
}

function StatCard({ icon: Icon, title, value, subtitle, color, gradient, active, onClick }) {
  const clickable = Boolean(onClick);
  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={!clickable}
      className={`w-full text-left bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-lg border overflow-hidden relative group transition-all duration-300 ${
        active
          ? "border-blue-500 ring-2 ring-blue-500/30 shadow-blue-100 dark:shadow-none"
          : "border-gray-100 dark:border-gray-700 hover:shadow-xl hover:-translate-y-0.5"
      } ${clickable ? "cursor-pointer" : "cursor-default"}`}
      whileHover={clickable ? { scale: 1.01 } : undefined}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className={`absolute inset-0 ${gradient} opacity-5 group-hover:opacity-10 transition-opacity duration-300`} />
      <div className="relative z-10 flex items-center justify-between gap-3">
        <div className={`p-3 ${color} rounded-xl shrink-0`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div className="text-right min-w-0">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 truncate">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
          {subtitle && (
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{subtitle}</p>
          )}
        </div>
      </div>
    </motion.button>
  );
}

function AssetCard({
  asset,
  viewMode,
  index,
  onNavigate,
  onEdit,
  onDelete,
  canEdit,
  canDelete,
  deleteLoading,
}) {
  const Icon = getAssetIcon(asset.type);
  const assigneeName = asset.assigned_employee?.full_name || asset.assigned_to || null;

  const actions = (
    <div
      className={`flex items-center gap-1 shrink-0 ${
        viewMode === "list" ? "opacity-100" : "opacity-0 group-hover:opacity-100"
      } transition-opacity duration-200`}
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onNavigate(asset.id);
        }}
        className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"
        title="View details"
      >
        <Eye className="w-4 h-4" />
      </button>
      {canEdit && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onEdit(asset);
          }}
          className="p-2 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg"
          title="Edit asset"
        >
          <Edit className="w-4 h-4" />
        </button>
      )}
      {canDelete && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(asset.id);
          }}
          disabled={deleteLoading}
          className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg disabled:opacity-50"
          title="Delete asset"
        >
          <Trash className="w-4 h-4" />
        </button>
      )}
    </div>
  );

  if (viewMode === "list") {
    return (
      <motion.div
        key={asset.id}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -12 }}
        transition={{ duration: 0.2, delay: index * 0.02 }}
        onClick={() => onNavigate(asset.id)}
        className="group bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-100 dark:border-gray-700 hover:shadow-lg hover:border-blue-200 dark:hover:border-blue-800 transition-all cursor-pointer p-4"
      >
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 overflow-hidden shrink-0 flex items-center justify-center">
            {asset.asset_picture_url ? (
              <img src={asset.asset_picture_url} alt={asset.name} className="w-full h-full object-contain bg-white dark:bg-gray-800" />
            ) : (
              <Icon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            )}
          </div>
          <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-5 gap-2 md:gap-4 items-center">
            <div className="md:col-span-2 min-w-0">
              <h3 className="font-semibold text-gray-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400">
                {asset.name}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">{asset.type}</p>
            </div>
            <div>
              <span className={`inline-flex px-2.5 py-1 text-xs font-bold rounded-full ${getStatusColor(asset.status)}`}>
                {asset.status}
              </span>
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-300 truncate">
              {asset.asset_code && (
                <span className="font-mono bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">{asset.asset_code}</span>
              )}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-300 truncate">
              {assigneeName ? (
                <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" />{assigneeName}</span>
              ) : (
                <span className="text-gray-400">Unassigned</span>
              )}
            </div>
          </div>
          <div className="hidden lg:block text-sm font-semibold text-green-600 dark:text-green-400 shrink-0 w-24 text-right">
            {asset.purchase_price ? `AED ${parseFloat(asset.purchase_price).toLocaleString()}` : "—"}
          </div>
          {actions}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      key={asset.id}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.25, delay: index * 0.03 }}
      onClick={() => onNavigate(asset.id)}
      className="group bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 hover:shadow-2xl hover:border-blue-200 dark:hover:border-blue-800 transition-all duration-300 cursor-pointer overflow-hidden"
    >
      <div className="h-40 bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center overflow-hidden">
        {asset.asset_picture_url ? (
          <img
            src={asset.asset_picture_url}
            alt={asset.name}
            className="w-full h-full object-contain bg-white dark:bg-gray-800 group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="text-center">
            <div className="p-4 bg-white/80 dark:bg-gray-800/80 rounded-2xl shadow-inner mx-auto mb-2 w-fit">
              <Icon className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">{asset.type}</p>
          </div>
        )}
      </div>
      <div className="p-5">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="min-w-0">
            <h3 className="font-bold text-gray-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400">
              {asset.name}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">{asset.type}</p>
          </div>
          <span className={`shrink-0 px-2.5 py-1 text-xs font-bold rounded-full ${getStatusColor(asset.status)}`}>
            {asset.status}
          </span>
        </div>
        <div className="space-y-2 text-sm">
          {asset.asset_code && (
            <div className="flex justify-between gap-2">
              <span className="text-gray-500 dark:text-gray-400">Code</span>
              <span className="font-mono font-semibold text-gray-900 dark:text-white">{asset.asset_code}</span>
            </div>
          )}
          {asset.purchase_price && (
            <div className="flex justify-between gap-2">
              <span className="text-gray-500 dark:text-gray-400">Price</span>
              <span className="font-semibold text-green-600 dark:text-green-400">
                AED {parseFloat(asset.purchase_price).toLocaleString()}
              </span>
            </div>
          )}
          <div className="flex justify-between gap-2">
            <span className="text-gray-500 dark:text-gray-400">Assigned</span>
            <span className="font-medium text-gray-900 dark:text-white truncate ml-2">
              {assigneeName || "—"}
            </span>
          </div>
        </div>
        <div className="flex justify-end mt-4 pt-3 border-t border-gray-100 dark:border-gray-700">
          {actions}
        </div>
      </div>
    </motion.div>
  );
}

export default function Assets() {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [sortValue, setSortValue] = useState("created_at:desc");
  const [activeStatFilter, setActiveStatFilter] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingAsset, setEditingAsset] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);
  const [viewMode, setViewMode] = useState("grid");
  const [exporting, setExporting] = useState(false);
  const [showTypeBreakdown, setShowTypeBreakdown] = useState(true);

  const { success, error: showError } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { userProfile } = useAuth();

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const [sortBy, sortOrder] = sortValue.split(":");

  const filters = useMemo(
    () => ({ search, status: statusFilter, type: typeFilter, sortBy, sortOrder }),
    [search, statusFilter, typeFilter, sortBy, sortOrder]
  );

  const { data: assetsData, isLoading, error, isFetching } = useAssets(currentPage, pageSize, filters);
  const { data: assetStats, isLoading: statsLoading } = useAssetStats();
  const deleteAssetMutation = useDeleteAsset();
  const createAssetMutation = useCreateAsset();
  const updateAssetMutation = useUpdateAsset();

  const assets = assetsData?.data || [];
  const totalCount = assetsData?.count || 0;
  const totalPages = Math.ceil(totalCount / pageSize);

  const isAdmin = userProfile?.role === "admin";
  const canAddAsset = isAdmin;
  const canEditAsset = isAdmin;
  const canDeleteAsset = isAdmin;

  const stats = useMemo(() => {
    if (assetStats) {
      return {
        total: assetStats.total,
        inStock: assetStats.inStock,
        assigned: assetStats.assigned,
        maintenance: assetStats.maintenance,
        retired: assetStats.retired,
        totalValue: assetStats.totalValue,
        typeBreakdown: assetStats.typeBreakdown || {},
      };
    }
    return {
      total: totalCount,
      inStock: 0,
      assigned: 0,
      maintenance: 0,
      retired: 0,
      totalValue: 0,
      typeBreakdown: {},
    };
  }, [assetStats, totalCount]);

  const typeEntries = useMemo(
    () =>
      Object.entries(stats.typeBreakdown)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6),
    [stats.typeBreakdown]
  );

  const activeFilterChips = useMemo(() => {
    const chips = [];
    if (statusFilter) chips.push({ key: "status", label: statusFilter });
    if (typeFilter) chips.push({ key: "type", label: typeFilter });
    if (search) chips.push({ key: "search", label: `"${search}"` });
    return chips;
  }, [statusFilter, typeFilter, search]);

  const handleDeleteRequest = useCallback((id) => {
    setDeleteConfirmId(id);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!deleteConfirmId) return;
    try {
      await deleteAssetMutation.mutateAsync(deleteConfirmId);
      success("Success", "Asset deleted successfully.");
      setDeleteConfirmId(null);
    } catch (err) {
      showError("Delete Failed", err.message);
    }
  }, [deleteConfirmId, deleteAssetMutation, success, showError]);

  const handleSubmitAsset = useCallback(
    async (formData) => {
      try {
        if (editingAsset) {
          await updateAssetMutation.mutateAsync({ id: editingAsset.id, data: formData });
          success("Success", "Asset updated successfully.");
        } else {
          await createAssetMutation.mutateAsync(formData);
          success("Success", "Asset created successfully.");
        }
        setShowForm(false);
        setEditingAsset(null);
      } catch (err) {
        showError("Error", err.message);
      }
    },
    [editingAsset, createAssetMutation, updateAssetMutation, success, showError]
  );

  const handleCloseForm = useCallback(() => {
    setShowForm(false);
    setEditingAsset(null);
  }, []);

  const handleStatClick = useCallback(
    (key) => {
      const statusMap = {
        inStock: "In Stock",
        assigned: "Assigned",
        maintenance: "Maintenance",
        retired: "Retired",
      };

      if (key === "total") {
        setStatusFilter("");
        setActiveStatFilter("");
      } else if (statusMap[key]) {
        setStatusFilter((prev) => {
          const next = statusMap[key];
          return prev === next ? "" : next;
        });
        setActiveStatFilter((prev) => (prev === key ? "" : key));
      }
      setCurrentPage(1);
    },
    []
  );

  const clearFilters = useCallback(() => {
    setSearchInput("");
    setSearch("");
    setStatusFilter("");
    setTypeFilter("");
    setActiveStatFilter("");
    setCurrentPage(1);
  }, []);

  const removeFilter = useCallback((key) => {
    if (key === "status") {
      setStatusFilter("");
      setActiveStatFilter("");
    } else if (key === "type") {
      setTypeFilter("");
    } else if (key === "search") {
      setSearchInput("");
      setSearch("");
    }
    setCurrentPage(1);
  }, []);

  const handleRefresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["assets"] });
    queryClient.invalidateQueries({ queryKey: ["assetStats"] });
  }, [queryClient]);

  const handleExport = useCallback(async () => {
    try {
      setExporting(true);
      const rows = await apiService.assets.exportData(filters);
      if (!rows.length) {
        showError("Export Failed", "No assets match the current filters.");
        return;
      }
      exportToCSV(rows, `assets_${new Date().toISOString().split("T")[0]}`);
      success("Exported", `${rows.length} asset record(s) exported to CSV.`);
    } catch (err) {
      showError("Export Failed", err.message || "Failed to export assets.");
    } finally {
      setExporting(false);
    }
  }, [filters, success, showError]);

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
              <div>
                <h3 className="text-lg font-semibold text-red-800 dark:text-red-200">Error Loading Assets</h3>
                <p className="text-red-600 dark:text-red-400 mt-1">{error.message}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
                Asset Management
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Track inventory, assignments, and value across your organization
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleRefresh}
                disabled={isFetching}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isFetching ? "animate-spin" : ""}`} />
                Refresh
              </button>
              <button
                type="button"
                onClick={handleExport}
                disabled={exporting}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                {exporting ? "Exporting…" : "Export CSV"}
              </button>
              {canAddAsset && (
                <motion.button
                  type="button"
                  onClick={() => setShowForm(true)}
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-5 py-2.5 rounded-xl font-medium shadow-lg"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Plus className="w-5 h-5" />
                  Add Asset
                </motion.button>
              )}
            </div>
          </div>
        </div>

        {/* Stats — 3×2 grid */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <StatCard
            icon={Database}
            title="Total Assets"
            value={statsLoading ? "…" : stats.total}
            subtitle="All tracked items"
            color="bg-gradient-to-br from-blue-500 to-blue-600"
            gradient="bg-gradient-to-br from-blue-500 to-blue-600"
            active={activeStatFilter === "" && !statusFilter}
            onClick={() => handleStatClick("total")}
          />
          <StatCard
            icon={CheckCircle}
            title="In Stock"
            value={statsLoading ? "…" : stats.inStock}
            subtitle={stats.total > 0 ? `${Math.round((stats.inStock / stats.total) * 100)}% available` : "0% available"}
            color="bg-gradient-to-br from-green-500 to-green-600"
            gradient="bg-gradient-to-br from-green-500 to-green-600"
            active={activeStatFilter === "inStock"}
            onClick={() => handleStatClick("inStock")}
          />
          <StatCard
            icon={User}
            title="Assigned"
            value={statsLoading ? "…" : stats.assigned}
            subtitle={stats.total > 0 ? `${Math.round((stats.assigned / stats.total) * 100)}% in use` : "0% in use"}
            color="bg-gradient-to-br from-indigo-500 to-indigo-600"
            gradient="bg-gradient-to-br from-indigo-500 to-indigo-600"
            active={activeStatFilter === "assigned"}
            onClick={() => handleStatClick("assigned")}
          />
          <StatCard
            icon={Clock}
            title="Maintenance"
            value={statsLoading ? "…" : stats.maintenance}
            subtitle="Being serviced"
            color="bg-gradient-to-br from-yellow-500 to-yellow-600"
            gradient="bg-gradient-to-br from-yellow-500 to-yellow-600"
            active={activeStatFilter === "maintenance"}
            onClick={() => handleStatClick("maintenance")}
          />
          <StatCard
            icon={AlertTriangle}
            title="Retired"
            value={statsLoading ? "…" : stats.retired}
            subtitle="End of life"
            color="bg-gradient-to-br from-red-500 to-red-600"
            gradient="bg-gradient-to-br from-red-500 to-red-600"
            active={activeStatFilter === "retired"}
            onClick={() => handleStatClick("retired")}
          />
          <StatCard
            icon={DollarSign}
            title="Total Value"
            value={statsLoading ? "…" : `${(stats.totalValue / 1000).toFixed(0)}K`}
            subtitle={`AED ${stats.totalValue.toLocaleString()}`}
            color="bg-gradient-to-br from-purple-500 to-purple-600"
            gradient="bg-gradient-to-br from-purple-500 to-purple-600"
          />
        </div>

        {/* Type breakdown */}
        {typeEntries.length > 0 && (
          <div className="mb-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
            <button
              type="button"
              onClick={() => setShowTypeBreakdown((v) => !v)}
              className="w-full flex items-center justify-between p-5 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 dark:bg-indigo-900 rounded-lg">
                  <BarChart3 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div className="text-left">
                  <h2 className="font-semibold text-gray-900 dark:text-white">Asset types overview</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Top categories in your inventory</p>
                </div>
              </div>
              <span className="text-sm text-gray-500">{showTypeBreakdown ? "Hide" : "Show"}</span>
            </button>
            {showTypeBreakdown && (
              <div className="px-5 pb-5 space-y-3">
                {typeEntries.map(([type, count]) => {
                  const pct = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => {
                        setTypeFilter((prev) => (prev === type ? "" : type));
                        setCurrentPage(1);
                      }}
                      className={`w-full text-left group ${typeFilter === type ? "ring-2 ring-blue-500/40 rounded-lg p-1 -m-1" : ""}`}
                    >
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium text-gray-700 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                          {type}
                        </span>
                        <span className="text-gray-500 dark:text-gray-400">
                          {count} · {pct}%
                        </span>
                      </div>
                      <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Search & filters */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-5 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by name, code, type, assignee, supplier…"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div className="flex flex-wrap gap-3">
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setActiveStatFilter("");
                  setCurrentPage(1);
                }}
                className="px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl dark:bg-gray-700 dark:text-white min-w-[140px]"
              >
                <option value="">All Status</option>
                <option value="In Stock">In Stock</option>
                <option value="Assigned">Assigned</option>
                <option value="Maintenance">Maintenance</option>
                <option value="Retired">Retired</option>
              </select>
              <select
                value={typeFilter}
                onChange={(e) => {
                  setTypeFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl dark:bg-gray-700 dark:text-white min-w-[140px]"
              >
                <option value="">All Types</option>
                {ASSET_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              <div className="relative">
                <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <select
                  value={sortValue}
                  onChange={(e) => {
                    setSortValue(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-10 pr-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl dark:bg-gray-700 dark:text-white min-w-[170px]"
                >
                  {SORT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 rounded-xl p-1">
                <button
                  type="button"
                  onClick={() => setViewMode("grid")}
                  className={`p-2 rounded-lg transition-all ${
                    viewMode === "grid"
                      ? "bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm"
                      : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                  }`}
                  title="Grid view"
                >
                  <Grid className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("list")}
                  className={`p-2 rounded-lg transition-all ${
                    viewMode === "list"
                      ? "bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm"
                      : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                  }`}
                  title="List view"
                >
                  <List className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {activeFilterChips.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
              <span className="text-sm text-gray-500 dark:text-gray-400">Active filters:</span>
              {activeFilterChips.map((chip) => (
                <button
                  key={chip.key}
                  type="button"
                  onClick={() => removeFilter(chip.key)}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                >
                  {chip.label}
                  <X className="w-3.5 h-3.5" />
                </button>
              ))}
              <button
                type="button"
                onClick={clearFilters}
                className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 underline"
              >
                Clear all
              </button>
            </div>
          )}
        </div>

        {/* Results summary */}
        {!isLoading && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            {totalCount} asset{totalCount !== 1 ? "s" : ""} found
            {isFetching && <span className="ml-2 text-blue-500">Updating…</span>}
          </p>
        )}

        {/* Loading skeleton */}
        {(isLoading || statsLoading) && (
          <div className={`grid ${viewMode === "grid" ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"} gap-4`}>
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden animate-pulse">
                <div className="h-40 bg-gray-200 dark:bg-gray-700" />
                <div className="p-5 space-y-3">
                  <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && assets.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-16 text-center"
          >
            <div className="max-w-md mx-auto">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Package className="w-10 h-10 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No Assets Found</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {activeFilterChips.length
                  ? "No assets match your filters. Try adjusting or clearing them."
                  : "Get started by adding your first asset to the inventory."}
              </p>
              {canAddAsset && !activeFilterChips.length && (
                <button
                  type="button"
                  onClick={() => setShowForm(true)}
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl font-medium"
                >
                  <Plus className="w-5 h-5" />
                  Add Your First Asset
                </button>
              )}
              {activeFilterChips.length > 0 && (
                <button type="button" onClick={clearFilters} className="text-blue-600 dark:text-blue-400 font-medium">
                  Clear filters
                </button>
              )}
            </div>
          </motion.div>
        )}

        {/* Asset grid / list */}
        {!isLoading && assets.length > 0 && (
          <div className={`grid ${viewMode === "grid" ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"} gap-4`}>
            <AnimatePresence>
              {assets.map((asset, index) => (
                <AssetCard
                  key={asset.id}
                  asset={asset}
                  viewMode={viewMode}
                  index={index}
                  onNavigate={(id) => navigate(`/assets/${id}`)}
                  onEdit={(a) => {
                    setEditingAsset(a);
                    setShowForm(true);
                  }}
                  onDelete={handleDeleteRequest}
                  canEdit={canEditAsset}
                  canDelete={canDeleteAsset}
                  deleteLoading={deleteAssetMutation.isLoading}
                />
              ))}
            </AnimatePresence>
          </div>
        )}

        <PaginationControls
          page={currentPage}
          totalPages={totalPages}
          totalItems={totalCount}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          className="mt-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4"
        />
      </div>

      <AnimatePresence>
        {showForm && (
          <AssetForm
            asset={editingAsset}
            onClose={handleCloseForm}
            onSubmit={handleSubmitAsset}
            isLoading={createAssetMutation.isLoading || updateAssetMutation.isLoading}
          />
        )}
      </AnimatePresence>

      <ConfirmDialog
        open={Boolean(deleteConfirmId)}
        title="Delete asset?"
        message="This will permanently remove the asset from inventory. This action cannot be undone."
        confirmLabel="Delete"
        loading={deleteAssetMutation.isLoading}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteConfirmId(null)}
      />
    </div>
  );
}
