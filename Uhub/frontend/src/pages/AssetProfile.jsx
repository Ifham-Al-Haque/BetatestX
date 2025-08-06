import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  ArrowLeft, Edit, Trash, Monitor, Laptop, Smartphone, Server, 
  Printer, Network, User, Calendar, DollarSign, FileText, 
  Building, Image as ImageIcon, CheckCircle, AlertTriangle, Clock
} from "lucide-react";
import { useAsset, useDeleteAsset } from "../hooks/useApi";
import { useToast } from "../context/ToastContext";
import { useSidebar } from "../context/SidebarContext";
import Sidebar from "../components/Sidebar";
import LoadingSpinner from "../components/LoadingSpinner";

export default function AssetProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { sidebarWidth } = useSidebar();
  const { success, error: showError } = useToast();
  
  const { data: asset, isLoading, error } = useAsset(id);
  const deleteAssetMutation = useDeleteAsset();

  const getAssetIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'laptop': return <Laptop className="w-8 h-8" />;
      case 'desktop': return <Monitor className="w-8 h-8" />;
      case 'mobile': return <Smartphone className="w-8 h-8" />;
      case 'server': return <Server className="w-8 h-8" />;
      case 'printer': return <Printer className="w-8 h-8" />;
      case 'network': return <Network className="w-8 h-8" />;
      default: return <Monitor className="w-8 h-8" />;
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

  const handleDelete = async () => {
    const confirmDelete = window.confirm("Are you sure you want to delete this asset?");
    if (!confirmDelete) return;

    try {
      await deleteAssetMutation.mutateAsync(id);
      success("Success", "Asset deleted successfully.");
      navigate('/assets');
    } catch (err) {
      showError("Delete Failed", err.message);
    }
  };

  const handleEdit = () => {
    navigate(`/assets/${id}/edit`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex">
        <Sidebar />
        <div className="flex-1 transition-all duration-300 ease-in-out" style={{ marginLeft: `${sidebarWidth}px` }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <LoadingSpinner />
          </div>
        </div>
      </div>
    );
  }

  if (error || !asset) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex">
        <Sidebar />
        <div className="flex-1 transition-all duration-300 ease-in-out" style={{ marginLeft: `${sidebarWidth}px` }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h3 className="text-red-800 font-medium">Error Loading Asset</h3>
              <p className="text-red-600 mt-1">{error?.message || 'Asset not found'}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex">
      <Sidebar />
      <div className="flex-1 transition-all duration-300 ease-in-out" style={{ marginLeft: `${sidebarWidth}px` }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => navigate('/assets')}
              className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Assets
            </button>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-xl mr-4">
                  {getAssetIcon(asset.type)}
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    {asset.name}
                  </h1>
                  <p className="text-lg text-gray-600 dark:text-gray-400">
                    {asset.type}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <button
                  onClick={handleEdit}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  <Edit className="w-4 h-4" />
                  Edit Asset
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleteAssetMutation.isLoading}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50"
                >
                  <Trash className="w-4 h-4" />
                  Delete
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Asset Image */}
              {asset.asset_picture_url && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6"
                >
                  <div className="flex items-center gap-2 mb-4">
                    <ImageIcon className="w-5 h-5 text-gray-500" />
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                      Asset Image
                    </h2>
                  </div>
                  <div className="aspect-video bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                    <img
                      src={asset.asset_picture_url}
                      alt={asset.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                    <div className="hidden w-full h-full items-center justify-center text-gray-500">
                      <div className="text-center">
                        <ImageIcon className="w-12 h-12 mx-auto mb-2" />
                        <p>Image not available</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Asset Details */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6"
              >
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                  Asset Details
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</span>
                      <span className={`px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(asset.status)}`}>
                        {asset.status}
                      </span>
                    </div>

                    {asset.asset_code && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Asset Code</span>
                        <span className="text-sm text-gray-900 dark:text-white font-mono">
                          {asset.asset_code}
                        </span>
                      </div>
                    )}

                    {asset.assigned_to && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Assigned to</span>
                        <span className="text-sm text-gray-900 dark:text-white">
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
                        <span className="text-sm text-gray-900 dark:text-white font-semibold">
                          AED {parseFloat(asset.purchase_price).toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    {asset.purchase_date && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Purchase Date</span>
                        <span className="text-sm text-gray-900 dark:text-white">
                          {new Date(asset.purchase_date).toLocaleDateString()}
                        </span>
                      </div>
                    )}

                    {asset.supplier && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Supplier</span>
                        <span className="text-sm text-gray-900 dark:text-white">
                          {asset.supplier}
                        </span>
                      </div>
                    )}

                    {asset.lpo_number && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">LPO Number</span>
                        <span className="text-sm text-gray-900 dark:text-white font-mono">
                          {asset.lpo_number}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Created</span>
                      <span className="text-sm text-gray-900 dark:text-white">
                        {new Date(asset.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Quick Stats */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6"
              >
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Quick Info
                </h3>
                
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                      <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Type</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{asset.type}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                      <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Status</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{asset.status}</p>
                    </div>
                  </div>

                  {asset.purchase_price && (
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                        <DollarSign className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Value</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          AED {parseFloat(asset.purchase_price).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                      <Calendar className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Added</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {new Date(asset.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Asset History (Placeholder for future) */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6"
              >
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Asset History
                </h3>
                <div className="text-center py-8">
                  <Clock className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Asset history will be displayed here
                  </p>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 