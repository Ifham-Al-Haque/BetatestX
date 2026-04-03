// src/pages/Assets.jsx
import { useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { 
  Monitor, Laptop, Smartphone, Server, Printer, Network, 
  Search, Filter, Plus, Edit, Trash, User, Calendar, 
  CheckCircle, AlertTriangle, Clock, DollarSign, X, Save,
  TrendingUp, Shield, Zap, Database, Smartphone as PhoneIcon,
  FileText, Building, ImageIcon, Grid, List, Download, Eye,
  Package, Settings
} from "lucide-react";
import { useAssets, useAssetStats, useDeleteAsset, useCreateAsset, useUpdateAsset } from "../hooks/useApi";
import { useToast } from "../context/ToastContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../supabaseClient";
import AssetForm from "../components/AssetForm";

// Using shared AssetForm from components/AssetForm

export default function Assets() {
    const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingAsset, setEditingAsset] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);
  const [viewMode, setViewMode] = useState("grid"); // 'grid' or 'list'
  
  const { success, error: showError } = useToast();
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  
  // Use React Query hooks
  const filters = useMemo(() => ({
    search,
    status: statusFilter,
    type: typeFilter
  }), [search, statusFilter, typeFilter]);
  
  const { data: assetsData, isLoading, error } = useAssets(currentPage, pageSize, filters);
  const { data: assetStats, isLoading: statsLoading } = useAssetStats();
  const deleteAssetMutation = useDeleteAsset();
  const createAssetMutation = useCreateAsset();
  const updateAssetMutation = useUpdateAsset();

  const assets = assetsData?.data || [];
  const totalCount = assetsData?.count || 0;

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

  const handleSubmitAsset = useCallback(async (formData) => {
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
  }, [editingAsset, createAssetMutation, updateAssetMutation, success, showError]);

  const handleCloseForm = useCallback(() => {
    setShowForm(false);
    setEditingAsset(null);
  }, []);

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

  // Role-based permission functions
  const canViewAsset = useCallback(() => {
    const userRole = userProfile?.role;
    return userRole === 'admin' || userRole === 'hr_manager';
  }, [userProfile?.role]);

  const canEditAsset = useCallback(() => {
    const userRole = userProfile?.role;
    return userRole === 'admin';
  }, [userProfile?.role]);

  const canDeleteAsset = useCallback(() => {
    const userRole = userProfile?.role;
    return userRole === 'admin';
  }, [userProfile?.role]);

  const canAddAsset = useCallback(() => {
    const userRole = userProfile?.role;
    return userRole === 'admin';
  }, [userProfile?.role]);

  // Asset statistics - use API stats instead of calculating from paginated results
  const stats = useMemo(() => {
    if (assetStats) {
      return {
        total: assetStats.total,
        inStock: assetStats.inStock,
        assigned: assetStats.assigned,
        maintenance: assetStats.maintenance,
        retired: assetStats.retired,
        totalValue: assetStats.totalValue
      };
    }
    
    // Fallback to paginated data if stats not available
    const total = totalCount || assets.length;
    const inStock = assets.filter(asset => asset.status === 'In Stock').length;
    const assigned = assets.filter(asset => asset.status === 'Assigned').length;
    const maintenance = assets.filter(asset => asset.status === 'Maintenance').length;
    const retired = assets.filter(asset => asset.status === 'Retired').length;
    const totalValue = assets.reduce((sum, asset) => sum + (parseFloat(asset.purchase_price) || 0), 0);

    return { total, inStock, assigned, maintenance, retired, totalValue };
  }, [assetStats, assets, totalCount]);

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex">
        <div className="flex-1 transition-all duration-300 ease-in-out" >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-red-800 dark:text-red-200">Error Loading Assets</h3>
                  <p className="text-red-600 dark:text-red-400 mt-1">{error.message}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const getAssetIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'laptop': return <Laptop className="w-6 h-6" />;
      case 'desktop': return <Monitor className="w-6 h-6" />;
      case 'mobile': return <PhoneIcon className="w-6 h-6" />;
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

  const StatCard = ({ icon: Icon, title, value, subtitle, color, gradient }) => (
    <motion.div 
      className={`bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden relative group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1`}
      whileHover={{ scale: 1.02 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className={`absolute inset-0 ${gradient} opacity-5 group-hover:opacity-10 transition-opacity duration-300`}></div>
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className={`p-3 ${color} rounded-xl`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
            {subtitle && <p className="text-xs text-gray-500 dark:text-gray-400">{subtitle}</p>}
          </div>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex">
      <div className="flex-1 transition-all duration-300 ease-in-out" >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header Section */}
          <div className="mb-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div>
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                  Asset Management
                </h1>
                <p className="text-lg text-gray-600 dark:text-gray-400">
                  Manage and track your organization's valuable assets
                </p>
              </div>
              {canAddAsset() && (
                <motion.button
                  onClick={() => setShowForm(true)}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 rounded-xl flex items-center gap-3 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Plus className="w-5 h-5" />
                  Add Asset
                </motion.button>
              )}
            </div>
          </div>

          {/* Enhanced Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 mb-8">
            <StatCard
              icon={Database}
              title="Total Assets"
              value={stats.total}
              subtitle="All tracked items"
              color="bg-gradient-to-br from-blue-500 to-blue-600"
              gradient="bg-gradient-to-br from-blue-500 to-blue-600"
            />
            <StatCard
              icon={CheckCircle}
              title="In Stock"
              value={stats.inStock}
              subtitle={`${stats.total > 0 ? Math.round((stats.inStock / stats.total) * 100) : 0}% available`}
              color="bg-gradient-to-br from-green-500 to-green-600"
              gradient="bg-gradient-to-br from-green-500 to-green-600"
            />
            <StatCard
              icon={User}
              title="Assigned"
              value={stats.assigned}
              subtitle={`${stats.total > 0 ? Math.round((stats.assigned / stats.total) * 100) : 0}% in use`}
              color="bg-gradient-to-br from-indigo-500 to-indigo-600"
              gradient="bg-gradient-to-br from-indigo-500 to-indigo-600"
            />
            <StatCard
              icon={Clock}
              title="Maintenance"
              value={stats.maintenance}
              subtitle="Being serviced"
              color="bg-gradient-to-br from-yellow-500 to-yellow-600"
              gradient="bg-gradient-to-br from-yellow-500 to-yellow-600"
            />
            <StatCard
              icon={AlertTriangle}
              title="Retired"
              value={stats.retired}
              subtitle="End of life"
              color="bg-gradient-to-br from-red-500 to-red-600"
              gradient="bg-gradient-to-br from-red-500 to-red-600"
            />
            <StatCard
              icon={DollarSign}
              title="Total Value"
              value={`${(stats.totalValue / 1000).toFixed(0)}K`}
              subtitle={`AED ${stats.totalValue.toLocaleString()}`}
              color="bg-gradient-to-br from-purple-500 to-purple-600"
              gradient="bg-gradient-to-br from-purple-500 to-purple-600"
            />
          </div>

          {/* Enhanced Search and Filters */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6 mb-8">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search assets by name, code, type, or assigned employee..."
                  value={search}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200 text-lg"
                />
              </div>
              <div className="flex gap-3">
                <select
                  value={statusFilter}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200 min-w-[140px]"
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
                  className="px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200 min-w-[140px]"
                >
                  <option value="">All Types</option>
                  <option value="Laptop">Laptop</option>
                  <option value="Desktop">Desktop</option>
                  <option value="All in One">All in One</option>
                  <option value="Mobile">Mobile</option>
                  <option value="Server">Server</option>
                  <option value="Printer">Printer</option>
                  <option value="Network">Network</option>
                  <option value="Monitor">Monitor</option>
                  <option value="Keyboard">Keyboard</option>
                  <option value="Mouse">Mouse</option>
                  <option value="Keyboard and Mouse">Keyboard and Mouse</option>
                  <option value="Headset">Headset</option>
                  <option value="Speaker">Speaker</option>
                  <option value="Camera">Camera</option>
                  <option value="Laptop Stand">Laptop Stand</option>
                </select>
                
                {/* View Mode Toggle */}
                <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 rounded-xl p-1">
                  <motion.button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded-lg transition-all duration-200 ${
                      viewMode === 'grid' 
                        ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-md' 
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    title="Grid View"
                  >
                    <Grid className="w-5 h-5" />
                  </motion.button>
                  <motion.button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded-lg transition-all duration-200 ${
                      viewMode === 'list' 
                        ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-md' 
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    title="List View"
                  >
                    <List className="w-5 h-5" />
                  </motion.button>
                </div>
              </div>
            </div>
          </div>

          {/* Loading State with Skeleton */}
          {(isLoading || statsLoading) && (
            <div className={`grid ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'} gap-6`}>
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6 animate-pulse">
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
                      <div className="flex-1">
                        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4/6"></div>
                  </div>
              </div>
              ))}
            </div>
          )}

          {/* Enhanced Assets Grid/List */}
          {!isLoading && assets.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-16 text-center"
            >
              <div className="max-w-md mx-auto">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Package className="w-12 h-12 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                  No Assets Found
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  {search || statusFilter || typeFilter 
                    ? "No assets match your search criteria. Try adjusting your filters." 
                    : "Get started by adding your first asset to the system."}
                </p>
                {canAddAsset() && !search && !statusFilter && !typeFilter && (
                  <motion.button
                    onClick={() => setShowForm(true)}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-3 rounded-xl flex items-center gap-3 mx-auto transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Plus className="w-5 h-5" />
                    Add Your First Asset
                  </motion.button>
                )}
              </div>
            </motion.div>
          )}

          {!isLoading && assets.length > 0 && (
            <div className={`grid ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'} gap-6`}>
              <AnimatePresence>
                {assets.map((asset, index) => (
                  <motion.div
                    key={asset.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className={`bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 cursor-pointer group overflow-hidden relative ${
                      viewMode === 'list' ? 'p-4' : 'p-6'
                    }`}
                    onClick={() => navigate(`/assets/${asset.id}`)}
                  >
                    {/* Background gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-700 dark:to-gray-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    
                    <div className={`relative z-10 ${viewMode === 'list' ? 'flex items-center gap-6' : ''}`}>
                      {/* Asset Image */}
                      {asset.asset_picture_url && (
                        <div className={`${viewMode === 'list' ? 'w-24 h-24' : 'w-full h-48 mb-4'} bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 rounded-xl overflow-hidden flex-shrink-0 shadow-inner`}>
                          <img
                            src={asset.asset_picture_url}
                            alt={asset.name}
                            className="w-full h-full object-contain bg-white dark:bg-gray-800 group-hover:scale-105 transition-transform duration-300"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                          <div className="hidden w-full h-full items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600">
                            <div className="text-center">
                              {getAssetIcon(asset.type)}
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">No Image</p>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      <div className={viewMode === 'list' ? 'flex-1 flex items-center justify-between' : ''}>
                        <div className={viewMode === 'list' ? 'flex-1' : ''}>
                          <div className={`flex items-start justify-between ${viewMode === 'list' ? 'mb-2' : 'mb-6'}`}>
                            <div className={`flex items-center ${viewMode === 'list' ? 'gap-4' : ''}`}>
                              {!asset.asset_picture_url && (
                                <div className={`${viewMode === 'list' ? 'w-24 h-24' : 'w-full h-48 mb-4'} bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 rounded-xl overflow-hidden flex-shrink-0 shadow-inner flex items-center justify-center`}>
                                  <div className="text-center">
                                    <div className="p-3 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900 dark:to-indigo-900 rounded-xl group-hover:scale-105 transition-transform duration-300 mx-auto mb-2 w-fit">
                                      {getAssetIcon(asset.type)}
                                    </div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">No Image</p>
                                  </div>
                                </div>
                              )}
                              <div className={!asset.asset_picture_url && viewMode === 'grid' ? 'ml-4' : ''}>
                                <h3 className={`font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300 ${viewMode === 'list' ? 'text-lg' : 'text-xl'}`}>
                              {asset.name}
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                              {asset.type}
                            </p>
                          </div>
                        </div>
                          </div>

                          <div className={`${viewMode === 'list' ? 'flex items-center gap-6 flex-wrap' : 'space-y-4'}`}>
                            <div className={`flex items-center ${viewMode === 'list' ? 'gap-2' : 'justify-between'}`}>
                              {viewMode === 'grid' && <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</span>}
                              <span className={`px-3 py-1 text-xs font-bold rounded-full ${getStatusColor(asset.status)}`}>
                                {asset.status}
                              </span>
                            </div>

                            {asset.asset_code && (
                              <div className={`flex items-center ${viewMode === 'list' ? 'gap-2' : 'justify-between'}`}>
                                {viewMode === 'grid' && <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Asset Code</span>}
                                <span className="text-sm font-mono font-semibold text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                                  {asset.asset_code}
                                </span>
                              </div>
                            )}

                            {asset.purchase_price && (
                              <div className={`flex items-center ${viewMode === 'list' ? 'gap-2' : 'justify-between'}`}>
                                {viewMode === 'grid' && <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Purchase Price</span>}
                                <span className="text-sm font-bold text-green-600 dark:text-green-400">
                                  AED {parseFloat(asset.purchase_price).toLocaleString()}
                                </span>
                              </div>
                            )}

                            {asset.assigned_to && viewMode === 'grid' && (
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Assigned to</span>
                                <span className="text-sm font-medium text-gray-900 dark:text-white">
                                  {asset.assigned_employee ? (
                                    `${asset.assigned_employee.full_name}`
                                  ) : (
                                    asset.assigned_to
                                  )}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Action Buttons */}
                        {(canEditAsset() || canDeleteAsset()) && (
                          <div className={`flex items-center gap-2 ${viewMode === 'list' ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity duration-300`}>
                            <motion.button
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/assets/${asset.id}`);
                              }}
                              className="p-2 text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all duration-200"
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </motion.button>
                            {canEditAsset() && (
                              <motion.button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingAsset(asset);
                                  setShowForm(true);
                                }}
                                className="p-2 text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-all duration-200"
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                title="Edit Asset"
                              >
                                <Edit className="w-4 h-4" />
                              </motion.button>
                            )}
                            {canDeleteAsset() && (
                              <motion.button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(asset.id);
                                }}
                                className="p-2 text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all duration-200"
                                disabled={deleteAssetMutation.isLoading}
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                title="Delete Asset"
                              >
                                <Trash className="w-4 h-4" />
                              </motion.button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}

          {/* Enhanced Pagination */}
          {totalPages > 1 && (
            <div className="mt-8 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    Showing <span className="font-semibold">{(currentPage - 1) * pageSize + 1}</span> to{" "}
                    <span className="font-semibold">
                      {Math.min(currentPage * pageSize, totalCount)}
                    </span>{" "}
                    of <span className="font-semibold">{totalCount}</span> results
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <motion.button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Previous
                  </motion.button>
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                    Page {currentPage} of {totalPages}
                  </span>
                  <motion.button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Next
                  </motion.button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Asset Form Modal */}
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
    </div>
  );
}
