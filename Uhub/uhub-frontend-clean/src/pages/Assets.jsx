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
  FileText, Building, ImageIcon
} from "lucide-react";
import { useAssets, useDeleteAsset, useCreateAsset, useUpdateAsset } from "../hooks/useApi";
import { useToast } from "../context/ToastContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../supabaseClient";

// Asset Form Component
const AssetForm = ({ asset, onClose, onSubmit, isLoading }) => {
  const [formData, setFormData] = useState({
    name: asset?.name || "",
    type: asset?.type || "",
    status: asset?.status || "In Stock",
    assigned_to: asset?.assigned_to || "",
    asset_code: asset?.asset_code || "",
    lpo_number: asset?.lpo_number || "",
    purchase_price: asset?.purchase_price || "",
    purchase_date: asset?.purchase_date || "",
    supplier: asset?.supplier || "",
    asset_picture_url: asset?.asset_picture_url || ""
  });

  // Fetch employees for dropdown
  const { data: employeesData } = useQuery({
    queryKey: ['employees', 'dropdown'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('employees')
        .select('id, full_name, employee_id')
        .order('full_name');
      if (error) throw error;
      return data;
    }
  });

  const employees = employeesData || [];

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-gray-100 dark:border-gray-700"
      >
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {asset ? "Edit Asset" : "Add New Asset"}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {asset ? "Update asset information" : "Create a new asset record"}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all duration-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Information */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                Asset Name *
              </label>
              <div className="relative">
                <Monitor className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200"
                  placeholder="Enter asset name"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                Asset Type *
              </label>
              <div className="relative">
                <Database className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  required
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200"
                >
                  <option value="">Select Type</option>
                  <option value="Laptop">Laptop</option>
                  <option value="Desktop">Desktop</option>
                  <option value="Mobile">Mobile</option>
                  <option value="Server">Server</option>
                  <option value="Printer">Printer</option>
                  <option value="Network">Network</option>
                  <option value="Monitor">Monitor</option>
                  <option value="Keyboard">Keyboard</option>
                  <option value="Mouse">Mouse</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                Asset Code
              </label>
              <div className="relative">
                <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  name="asset_code"
                  value={formData.asset_code}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200"
                  placeholder="Enter asset code"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                Status
              </label>
              <div className="relative">
                <CheckCircle className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200"
                >
                  <option value="In Stock">In Stock</option>
                  <option value="Assigned">Assigned</option>
                  <option value="Maintenance">Maintenance</option>
                  <option value="Retired">Retired</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                Assigned To (Employee ID)
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <select
                  name="assigned_to"
                  value={formData.assigned_to}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200"
                >
                  <option value="">Select Employee</option>
                  {employees.map((employee) => (
                    <option key={employee.id} value={employee.id}>
                      {employee.full_name} ({employee.employee_id})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                LPO Number
              </label>
              <div className="relative">
                <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  name="lpo_number"
                  value={formData.lpo_number}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200"
                  placeholder="Enter LPO number"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                Purchase Price (AED)
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="number"
                  name="purchase_price"
                  value={formData.purchase_price}
                  onChange={handleChange}
                  step="0.01"
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200"
                  placeholder="Enter purchase price"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                Purchase Date
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="date"
                  name="purchase_date"
                  value={formData.purchase_date}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                Supplier
              </label>
              <div className="relative">
                <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  name="supplier"
                  value={formData.supplier}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200"
                  placeholder="Enter supplier name"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
              Asset Picture URL
            </label>
            <div className="relative">
              <ImageIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="url"
                name="asset_picture_url"
                value={formData.asset_picture_url}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200"
                placeholder="https://example.com/asset-image.jpg"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl flex items-center gap-2 transition-all duration-200 font-medium disabled:opacity-50 transform hover:scale-105"
            >
              <Save className="w-4 h-4" />
              {isLoading ? "Saving..." : (asset ? "Update Asset" : "Create Asset")}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default function Assets() {
    const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingAsset, setEditingAsset] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);
  
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
            <StatCard
              icon={Database}
              title="Total Assets"
              value={stats.total}
              color="bg-gradient-to-br from-blue-500 to-blue-600"
              gradient="bg-gradient-to-br from-blue-500 to-blue-600"
            />
            <StatCard
              icon={CheckCircle}
              title="In Stock"
              value={stats.inStock}
              color="bg-gradient-to-br from-green-500 to-green-600"
              gradient="bg-gradient-to-br from-green-500 to-green-600"
            />
            <StatCard
              icon={User}
              title="Assigned"
              value={stats.assigned}
              color="bg-gradient-to-br from-indigo-500 to-indigo-600"
              gradient="bg-gradient-to-br from-indigo-500 to-indigo-600"
            />
            <StatCard
              icon={Clock}
              title="Maintenance"
              value={stats.maintenance}
              color="bg-gradient-to-br from-yellow-500 to-yellow-600"
              gradient="bg-gradient-to-br from-yellow-500 to-yellow-600"
            />
            <StatCard
              icon={AlertTriangle}
              title="Retired"
              value={stats.retired}
              color="bg-gradient-to-br from-red-500 to-red-600"
              gradient="bg-gradient-to-br from-red-500 to-red-600"
            />
          </div>

          {/* Enhanced Search and Filters */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6 mb-8">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search assets by name, code, or type..."
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
                  <option value="Mobile">Mobile</option>
                  <option value="Server">Server</option>
                  <option value="Printer">Printer</option>
                  <option value="Network">Network</option>
                </select>
              </div>
            </div>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-12">
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <span className="ml-4 text-lg text-gray-600 dark:text-gray-400">Loading assets...</span>
              </div>
            </div>
          )}

          {/* Enhanced Assets Grid */}
          {!isLoading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence>
                {assets.map((asset, index) => (
                  <motion.div
                    key={asset.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6 hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 cursor-pointer group overflow-hidden relative"
                    onClick={() => navigate(`/assets/${asset.id}`)}
                  >
                    {/* Background gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-700 dark:to-gray-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    
                    <div className="relative z-10">
                      <div className="flex items-start justify-between mb-6">
                        <div className="flex items-center">
                          <div className="p-3 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900 dark:to-indigo-900 rounded-xl group-hover:scale-110 transition-transform duration-300">
                            {getAssetIcon(asset.type)}
                          </div>
                          <div className="ml-4">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300">
                              {asset.name}
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                              {asset.type}
                            </p>
                          </div>
                        </div>
                        {(canEditAsset() || canDeleteAsset()) && (
                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
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
                              >
                                <Trash className="w-4 h-4" />
                              </motion.button>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</span>
                          <span className={`px-3 py-1 text-xs font-bold rounded-full ${getStatusColor(asset.status)}`}>
                            {asset.status}
                          </span>
                        </div>

                        {asset.asset_code && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Asset Code</span>
                            <span className="text-sm font-mono font-semibold text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                              {asset.asset_code}
                            </span>
                          </div>
                        )}

                        {asset.assigned_to && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Assigned to</span>
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                              {asset.assigned_employee ? (
                                `${asset.assigned_employee.full_name} (${asset.assigned_employee.employee_id})`
                              ) : (
                                asset.assigned_to
                              )}
                            </span>
                          </div>
                        )}

                        {asset.purchase_price && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Purchase Price</span>
                            <span className="text-sm font-bold text-green-600 dark:text-green-400">
                              AED {parseFloat(asset.purchase_price).toLocaleString()}
                            </span>
                          </div>
                        )}

                        {asset.created_at && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Created</span>
                            <span className="text-sm text-gray-900 dark:text-white">
                              {new Date(asset.created_at).toLocaleDateString()}
                            </span>
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
