// src/pages/Assets.jsx
import { useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Monitor, Laptop, Smartphone, Server, Printer, Network, 
  Search, Filter, Plus, Edit, Trash, User, Calendar, 
  CheckCircle, AlertTriangle, Clock, DollarSign 
} from "lucide-react";
import { useAssets, useDeleteAsset } from "../hooks/useApi";
import { useToast } from "../context/ToastContext";

export default function Assets() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingAsset, setEditingAsset] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);
  
  const { success, error: showError } = useToast();
  
  // Use React Query hooks
  const filters = useMemo(() => ({
    search,
    status: statusFilter,
    type: typeFilter
  }), [search, statusFilter, typeFilter]);
  
  const { data: assetsData, isLoading, error } = useAssets(currentPage, pageSize, filters);
  const deleteAssetMutation = useDeleteAsset();

  const assets = assetsData?.data || [];
  const totalCount = assetsData?.count || 0;

  const formData = useState({
    name: "",
    type: "",
    status: "In Stock",
    assigned_to: "",
    serial_number: "",
    purchase_date: "",
    warranty_expiry: "",
    purchase_price: "",
    location: "",
    notes: ""
  })[0];

  const handleDelete = useCallback(async (id) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this asset?");
    if (!confirmDelete) return;

    try {
      await deleteAssetMutation.mutateAsync(id);
      success("Success", "Asset deleted successfully.");
    } catch (err) {
      showError("Delete Failed", err.message);
    }
  }, [deleteAssetMutation, success, showError]);

  const handleSearch = useCallback((value) => {
    setSearch(value);
    setCurrentPage(1);
  }, []);

  const handleFilterChange = useCallback((filterType, value) => {
    if (filterType === 'status') {
      setStatusFilter(value);
    } else if (filterType === 'type') {
      setTypeFilter(value);
    }
    setCurrentPage(1);
  }, []);

  const handlePageChange = useCallback((page) => {
    setCurrentPage(page);
  }, []);

  const totalPages = Math.ceil(totalCount / pageSize);

  // Asset statistics
  const stats = useMemo(() => {
    const total = assets.length;
    const inStock = assets.filter(asset => asset.status === 'In Stock').length;
    const assigned = assets.filter(asset => asset.status === 'Assigned').length;
    const maintenance = assets.filter(asset => asset.status === 'Maintenance').length;
    const retired = assets.filter(asset => asset.status === 'Retired').length;

    return { total, inStock, assigned, maintenance, retired };
  }, [assets]);

  if (error) {
    return (
      <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900">
        <div className="ml-64 p-6 w-full">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 className="text-red-800 font-medium">Error Loading Assets</h3>
            <p className="text-red-600 mt-1">{error.message}</p>
          </div>
        </div>
      </div>
    );
  }

  const getAssetIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'laptop': return <Laptop className="w-6 h-6" />;
      case 'desktop': return <Monitor className="w-6 h-6" />;
      case 'mobile': return <Smartphone className="w-6 h-6" />;
      case 'server': return <Server className="w-6 h-6" />;
      case 'printer': return <Printer className="w-6 h-6" />;
      case 'network': return <Network className="w-6 h-6" />;
      default: return <Monitor className="w-6 h-6" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'In Stock': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'Assigned': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'Maintenance': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'Retired': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  const StatCard = ({ icon: Icon, title, value, subtitle, color }) => (
    <div className={`bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border-l-4 ${color}`}>
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <Icon className="w-8 h-8 text-gray-400" />
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-semibold text-gray-900 dark:text-white">{value}</p>
          {subtitle && <p className="text-xs text-gray-500 dark:text-gray-400">{subtitle}</p>}
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="ml-64 p-6 w-full">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100">
            Asset Management
          </h2>
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Asset
          </button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-6">
          <StatCard
            icon={Monitor}
            title="Total Assets"
            value={stats.total}
            color="border-blue-500"
          />
          <StatCard
            icon={CheckCircle}
            title="In Stock"
            value={stats.inStock}
            color="border-green-500"
          />
          <StatCard
            icon={User}
            title="Assigned"
            value={stats.assigned}
            color="border-blue-500"
          />
          <StatCard
            icon={Clock}
            title="Maintenance"
            value={stats.maintenance}
            color="border-yellow-500"
          />
          <StatCard
            icon={AlertTriangle}
            title="Retired"
            value={stats.retired}
            color="border-red-500"
          />
        </div>

        {/* Search and Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search assets..."
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              <option value="">All Status</option>
              <option value="In Stock">In Stock</option>
              <option value="Assigned">Assigned</option>
              <option value="Maintenance">Maintenance</option>
              <option value="Retired">Retired</option>
            </select>
            <select
              value={typeFilter}
              onChange={(e) => handleFilterChange('type', e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              <option value="">All Types</option>
              <option value="Laptop">Laptop</option>
              <option value="Desktop">Desktop</option>
              <option value="Mobile">Mobile</option>
              <option value="Server">Server</option>
              <option value="Printer">Printer</option>
              <option value="Network">Network</option>
            </select>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600 dark:text-gray-400">Loading assets...</span>
            </div>
          </div>
        )}

        {/* Assets Grid */}
        {!isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {assets.map((asset, index) => (
                <motion.div
                  key={asset.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center">
                      <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                        {getAssetIcon(asset.type)}
                      </div>
                      <div className="ml-3">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {asset.name}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {asset.type}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setEditingAsset(asset);
                          setShowForm(true);
                        }}
                        className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(asset.id)}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                        disabled={deleteAssetMutation.isLoading}
                      >
                        <Trash className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500 dark:text-gray-400">Status</span>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(asset.status)}`}>
                        {asset.status}
                      </span>
                    </div>

                    {asset.serial_number && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500 dark:text-gray-400">Serial Number</span>
                        <span className="text-sm text-gray-900 dark:text-white">{asset.serial_number}</span>
                      </div>
                    )}

                    {asset.employees?.full_name && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500 dark:text-gray-400">Assigned to</span>
                        <span className="text-sm text-gray-900 dark:text-white">{asset.employees.full_name}</span>
                      </div>
                    )}

                    {asset.purchase_price && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500 dark:text-gray-400">Purchase Price</span>
                        <span className="text-sm text-gray-900 dark:text-white">AED {asset.purchase_price}</span>
                      </div>
                    )}

                    {asset.location && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500 dark:text-gray-400">Location</span>
                        <span className="text-sm text-gray-900 dark:text-white">{asset.location}</span>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Showing <span className="font-medium">{(currentPage - 1) * pageSize + 1}</span> to{" "}
                  <span className="font-medium">
                    {Math.min(currentPage * pageSize, totalCount)}
                  </span>{" "}
                  of <span className="font-medium">{totalCount}</span> results
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
