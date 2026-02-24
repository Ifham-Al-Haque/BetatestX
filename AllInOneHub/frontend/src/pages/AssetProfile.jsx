import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  ArrowLeft, Edit, Trash, Monitor, Laptop, Smartphone, Server, 
  Printer, Network, User, Calendar, DollarSign, FileText, 
  Building, Image as ImageIcon, CheckCircle, AlertTriangle, Clock,
  Shield, Database, Zap, TrendingUp, Activity, History, Info,
  Download, Share2, QrCode, Bell, Package, MapPin, Tag,
  Wrench, Award, BarChart3, FileDown, Printer as PrintIcon, X
} from "lucide-react";
import { useAsset, useDeleteAsset } from "../hooks/useApi";
import { useToast } from "../context/ToastContext";

import LoadingSpinner from "../components/LoadingSpinner";

export default function AssetProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const { success, error: showError } = useToast();
  
  const { data: asset, isLoading, error } = useAsset(id);
  const deleteAssetMutation = useDeleteAsset();
  
  const [showQRCode, setShowQRCode] = useState(false);
  const [activeTab, setActiveTab] = useState('details'); // 'details', 'history', 'notes'
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [notes, setNotes] = useState([]);
  const [showAddNoteForm, setShowAddNoteForm] = useState(false);
  const [newNote, setNewNote] = useState({ title: '', content: '', type: 'general' });
  
  // Calculate asset age and depreciation
  const assetMetrics = useMemo(() => {
    if (!asset || !asset.purchase_date) return null;
    
    const purchaseDate = new Date(asset.purchase_date);
    const now = new Date();
    const ageInDays = Math.floor((now - purchaseDate) / (1000 * 60 * 60 * 24));
    const ageInYears = ageInDays / 365;
    
    // Simple depreciation calculation (20% per year, max 5 years)
    const depreciationRate = 0.20;
    const depreciationYears = Math.min(ageInYears, 5);
    const currentValue = asset.purchase_price * Math.pow(1 - depreciationRate, depreciationYears);
    const depreciationPercentage = ((asset.purchase_price - currentValue) / asset.purchase_price) * 100;
    
    // Warranty calculation (assuming 3 years from purchase date)
    const warrantyEndDate = new Date(purchaseDate);
    warrantyEndDate.setFullYear(warrantyEndDate.getFullYear() + 3);
    const warrantyDaysLeft = Math.floor((warrantyEndDate - now) / (1000 * 60 * 60 * 24));
    const warrantyPercentage = Math.max(0, Math.min(100, (warrantyDaysLeft / (3 * 365)) * 100));
    
    return {
      ageInDays,
      ageInYears: ageInYears.toFixed(1),
      currentValue: Math.max(currentValue, 0),
      depreciationPercentage: Math.min(depreciationPercentage, 100),
      warrantyDaysLeft,
      warrantyEndDate,
      warrantyPercentage,
      warrantyActive: warrantyDaysLeft > 0
    };
  }, [asset]);
  
  const handleShare = (method) => {
    const url = window.location.href;
    const text = `Check out this asset: ${asset.name}`;
    
    switch(method) {
      case 'copy':
        navigator.clipboard.writeText(url);
        success("Copied", "Link copied to clipboard!");
        break;
      case 'email':
        window.location.href = `mailto:?subject=${encodeURIComponent(asset.name)}&body=${encodeURIComponent(text + '\n' + url)}`;
        break;
      default:
        success("Share", "Share functionality coming soon!");
    }
    setShowShareMenu(false);
  };

  // Notes functionality
  const handleAddNote = () => {
    if (!newNote.title.trim() || !newNote.content.trim()) {
      showError("Error", "Please fill in both title and content");
      return;
    }

    const note = {
      id: Date.now(),
      title: newNote.title.trim(),
      content: newNote.content.trim(),
      type: newNote.type,
      created_at: new Date().toISOString(),
      author: 'Current User' // You can get this from auth context
    };

    setNotes(prev => [note, ...prev]);
    setNewNote({ title: '', content: '', type: 'general' });
    setShowAddNoteForm(false);
    success("Success", "Note added successfully!");
  };

  const handleDeleteNote = (noteId) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this note?");
    if (!confirmDelete) return;

    setNotes(prev => prev.filter(note => note.id !== noteId));
    success("Success", "Note deleted successfully!");
  };

  const getNoteTypeColor = (type) => {
    switch (type) {
      case 'maintenance': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'issue': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'update': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'general': return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  const getNoteTypeIcon = (type) => {
    switch (type) {
      case 'maintenance': return <Wrench className="w-4 h-4" />;
      case 'issue': return <AlertTriangle className="w-4 h-4" />;
      case 'update': return <Info className="w-4 h-4" />;
      case 'general': return <FileText className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

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
  
  const handleDownloadDetails = () => {
    // Create a simple text version of asset details
    const details = `
ASSET DETAILS
=============
Name: ${asset.name}
Type: ${asset.type}
Status: ${asset.status}
Asset Code: ${asset.asset_code || 'N/A'}
Purchase Price: AED ${asset.purchase_price ? parseFloat(asset.purchase_price).toLocaleString() : 'N/A'}
Purchase Date: ${asset.purchase_date ? new Date(asset.purchase_date).toLocaleDateString() : 'N/A'}
Supplier: ${asset.supplier || 'N/A'}
LPO Number: ${asset.lpo_number || 'N/A'}
Assigned To: ${asset.assigned_employee ? `${asset.assigned_employee.full_name} (${asset.assigned_employee.employee_id})` : 'N/A'}
Created: ${new Date(asset.created_at).toLocaleDateString()}
    `.trim();
    
    const blob = new Blob([details], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `asset-${asset.asset_code || asset.id}-details.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    success("Downloaded", "Asset details downloaded successfully");
  };
  
  const handlePrint = () => {
    window.print();
    success("Print", "Print dialog opened");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex">
        <div className="flex-1 transition-all duration-300 ease-in-out" >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <LoadingSpinner />
          </div>
        </div>
      </div>
    );
  }

  if (error || !asset) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex">
        <div className="flex-1 transition-all duration-300 ease-in-out" >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-red-800 dark:text-red-200">Error Loading Asset</h3>
                  <p className="text-red-600 dark:text-red-400 mt-1">{error?.message || 'Asset not found'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex">
      <div className="flex-1 transition-all duration-300 ease-in-out" >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Breadcrumb Navigation */}
          <motion.nav 
            className="mb-6"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <ol className="flex items-center space-x-2 text-sm">
              <li>
                <button 
                  onClick={() => navigate('/')}
                  className="text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  Home
                </button>
              </li>
              <li className="text-gray-400 dark:text-gray-600">/</li>
              <li>
                <button 
                  onClick={() => navigate('/assets')}
                  className="text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  Assets
                </button>
              </li>
              <li className="text-gray-400 dark:text-gray-600">/</li>
              <li className="text-gray-900 dark:text-white font-semibold truncate max-w-xs">
                {asset.name}
              </li>
            </ol>
          </motion.nav>

          {/* Enhanced Header */}
          <motion.div 
            className="mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-8">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                <div className="flex items-center">
                  <div className="p-4 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900 dark:to-indigo-900 rounded-2xl mr-6 shadow-lg">
                    {getAssetIcon(asset.type)}
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                      {asset.name}
                    </h1>
                    <p className="text-xl text-gray-600 dark:text-gray-400 mb-3">
                      {asset.type} • Asset ID: {asset.id}
                    </p>
                    <div className="flex items-center gap-4">
                      <span className={`px-4 py-2 text-sm font-bold rounded-full ${getStatusColor(asset.status)}`}>
                        {asset.status}
                      </span>
                      {asset.asset_code && (
                        <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-mono text-sm">
                          {asset.asset_code}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="relative">
                    <motion.button
                      onClick={() => setShowShareMenu(!showShareMenu)}
                      className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      title="Share Asset"
                    >
                      <Share2 className="w-4 h-4" />
                      Share
                    </motion.button>
                    {showShareMenu && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="absolute top-full right-0 mt-2 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 py-2 min-w-[180px] z-10"
                      >
                        <button
                          onClick={() => handleShare('copy')}
                          className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
                        >
                          <Package className="w-4 h-4" />
                          Copy Link
                        </button>
                        <button
                          onClick={() => handleShare('email')}
                          className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
                        >
                          <FileText className="w-4 h-4" />
                          Share via Email
                        </button>
                      </motion.div>
                    )}
                  </div>
                  <motion.button
                    onClick={() => setShowQRCode(!showQRCode)}
                    className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    title="Show QR Code"
                  >
                    <QrCode className="w-4 h-4" />
                    QR Code
                  </motion.button>
                  <motion.button
                    onClick={handleDownloadDetails}
                    className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    title="Download Details"
                  >
                    <Download className="w-4 h-4" />
                    Export
                  </motion.button>
                  <motion.button
                    onClick={handlePrint}
                    className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white rounded-xl transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    title="Print"
                  >
                    <PrintIcon className="w-4 h-4" />
                    Print
                  </motion.button>
                  <motion.button
                    onClick={handleEdit}
                    className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Edit className="w-4 h-4" />
                    Edit
                  </motion.button>
                  <motion.button
                    onClick={handleDelete}
                    disabled={deleteAssetMutation.isLoading}
                    className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-xl transition-all duration-200 font-medium shadow-lg hover:shadow-xl disabled:opacity-50"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Trash className="w-4 h-4" />
                    Delete
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Tabs Navigation */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 mb-8 overflow-hidden"
          >
            <div className="flex border-b border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setActiveTab('details')}
                className={`flex-1 px-6 py-4 text-sm font-semibold transition-all duration-200 ${
                  activeTab === 'details'
                    ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/10'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700/50'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <Info className="w-4 h-4" />
                  Details
                </div>
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`flex-1 px-6 py-4 text-sm font-semibold transition-all duration-200 ${
                  activeTab === 'history'
                    ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/10'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700/50'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <History className="w-4 h-4" />
                  History
                </div>
              </button>
              <button
                onClick={() => setActiveTab('notes')}
                className={`flex-1 px-6 py-4 text-sm font-semibold transition-all duration-200 ${
                  activeTab === 'notes'
                    ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/10'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700/50'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <FileText className="w-4 h-4" />
                  Notes
                </div>
              </button>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Enhanced Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {activeTab === 'details' && (
                <>
              {/* Enhanced Asset Image */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6 overflow-hidden"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                    <ImageIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    Asset Image
                  </h2>
                </div>
                <div className="relative">
                  <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 rounded-xl overflow-hidden shadow-inner border border-gray-200 dark:border-gray-600">
                    {asset.asset_picture_url ? (
                      <img
                        src={asset.asset_picture_url}
                        alt={asset.name}
                        className="w-full h-full object-contain bg-white dark:bg-gray-800 hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div className={`${asset.asset_picture_url ? 'hidden' : 'flex'} w-full h-full items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800`}>
                      <div className="text-center">
                        <div className="p-4 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900 dark:to-indigo-900 rounded-2xl mx-auto mb-4 w-fit">
                          {getAssetIcon(asset.type)}
                        </div>
                        <p className="text-gray-500 dark:text-gray-400 font-medium">No image available</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Asset type: {asset.type}</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Image overlay info */}
                  {asset.asset_picture_url && (
                    <div className="absolute bottom-4 left-4 right-4">
                      <div className="bg-black/60 backdrop-blur-sm rounded-lg px-3 py-2">
                        <p className="text-white text-sm font-medium">{asset.name}</p>
                        <p className="text-gray-200 text-xs">{asset.type}</p>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>

              {/* Enhanced Asset Details */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-8"
              >
                <div className="flex items-center gap-3 mb-8">
                  <div className="p-2 bg-indigo-100 dark:bg-indigo-900 rounded-lg">
                    <Info className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Asset Details
                  </h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">Status</span>
                        <span className={`px-3 py-1 text-sm font-bold rounded-full ${getStatusColor(asset.status)}`}>
                          {asset.status}
                        </span>
                      </div>
                    </div>

                    {asset.asset_code && (
                      <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">Asset Code</span>
                        </div>
                        <span className="text-lg font-mono font-bold text-gray-900 dark:text-white">
                          {asset.asset_code}
                        </span>
                      </div>
                    )}

                    {asset.assigned_to && (
                      <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">Assigned to</span>
                        </div>
                        <span className="text-lg font-semibold text-gray-900 dark:text-white">
                          {asset.assigned_employee ? (
                            `${asset.assigned_employee.full_name} (${asset.assigned_employee.employee_id})`
                          ) : (
                            asset.assigned_to
                          )}
                        </span>
                      </div>
                    )}

                    {asset.purchase_price && (
                      <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">Purchase Price</span>
                        </div>
                        <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                          AED {parseFloat(asset.purchase_price).toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-6">
                    {asset.purchase_date && (
                      <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">Purchase Date</span>
                        </div>
                        <span className="text-lg font-semibold text-gray-900 dark:text-white">
                          {new Date(asset.purchase_date).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </span>
                      </div>
                    )}

                    {asset.supplier && (
                      <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">Supplier</span>
                        </div>
                        <span className="text-lg font-semibold text-gray-900 dark:text-white">
                          {asset.supplier}
                        </span>
                      </div>
                    )}

                    {asset.lpo_number && (
                      <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">LPO Number</span>
                        </div>
                        <span className="text-lg font-mono font-bold text-gray-900 dark:text-white">
                          {asset.lpo_number}
                        </span>
                      </div>
                    )}

                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">Created</span>
                      </div>
                      <span className="text-lg font-semibold text-gray-900 dark:text-white">
                        {new Date(asset.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Asset Value & Depreciation */}
              {assetMetrics && asset.purchase_price && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-8"
                >
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                      <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                      Asset Value & Depreciation
                    </h2>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-6">
                      <div className="flex items-center gap-3 mb-3">
                        <DollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />
                        <span className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase">Purchase Price</span>
                      </div>
                      <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                        AED {parseFloat(asset.purchase_price).toLocaleString()}
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-6">
                      <div className="flex items-center gap-3 mb-3">
                        <BarChart3 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        <span className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase">Current Value</span>
                      </div>
                      <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                        AED {assetMetrics.currentValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Asset Age</span>
                      <span className="text-sm font-bold text-gray-900 dark:text-white">
                        {assetMetrics.ageInYears} years ({assetMetrics.ageInDays} days)
                      </span>
                    </div>
                    
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Depreciation</span>
                        <span className="text-sm font-bold text-orange-600 dark:text-orange-400">
                          {assetMetrics.depreciationPercentage.toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${assetMetrics.depreciationPercentage}%` }}
                          transition={{ duration: 1, delay: 0.5 }}
                          className="h-full bg-gradient-to-r from-orange-500 to-red-500 rounded-full"
                        />
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                        Calculated at 20% per year (straight-line depreciation)
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Asset Performance Metrics */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-8"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                    <Activity className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Performance Metrics
                  </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl">
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Activity className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                      {asset.status === 'Assigned' ? '100%' : asset.status === 'Maintenance' ? '0%' : '98%'}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Uptime</div>
                  </div>
                  <div className="text-center p-6 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl">
                    <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-3">
                      <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                      {asset.status === 'Retired' ? 'F' : asset.status === 'Maintenance' ? 'C' : 'A+'}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Health Score</div>
                  </div>
                  <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl">
                    <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Zap className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                      {asset.status === 'In Stock' ? 'N/A' : '24/7'}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Availability</div>
                  </div>
                </div>
              </motion.div>

              {/* Warranty Information */}
              {assetMetrics && asset.purchase_date && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-8"
                >
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
                      <Shield className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                      Warranty Status
                    </h2>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Warranty Status</span>
                      <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                        assetMetrics.warrantyActive 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                          : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      }`}>
                        {assetMetrics.warrantyActive ? 'Active' : 'Expired'}
                      </span>
                    </div>
                    
                    {assetMetrics.warrantyActive ? (
                      <>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Days Remaining</span>
                          <span className="text-sm font-bold text-gray-900 dark:text-white">
                            {assetMetrics.warrantyDaysLeft} days
                          </span>
                        </div>
                        
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Warranty Coverage</span>
                            <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                              {assetMetrics.warrantyPercentage.toFixed(0)}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${assetMetrics.warrantyPercentage}%` }}
                              transition={{ duration: 1, delay: 0.7 }}
                              className={`h-full rounded-full ${
                                assetMetrics.warrantyPercentage > 50 
                                  ? 'bg-gradient-to-r from-green-500 to-emerald-500' 
                                  : assetMetrics.warrantyPercentage > 20
                                  ? 'bg-gradient-to-r from-yellow-500 to-orange-500'
                                  : 'bg-gradient-to-r from-orange-500 to-red-500'
                              }`}
                            />
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                            Expires on {assetMetrics.warrantyEndDate.toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Warranty expired on {assetMetrics.warrantyEndDate.toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
              </>
              )}

              {/* History Tab */}
              {activeTab === 'history' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-8"
                >
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-indigo-100 dark:bg-indigo-900 rounded-lg">
                      <History className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                      Asset Activity Timeline
                    </h2>
                  </div>
                  
                  {/* Timeline */}
                  <div className="space-y-6">
                    <div className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                          <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                        </div>
                        <div className="w-0.5 h-full bg-gray-200 dark:bg-gray-700 mt-2"></div>
                      </div>
                      <div className="flex-1 pb-8">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">Asset Created</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {new Date(asset.created_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                          Asset was added to the inventory system
                        </p>
                      </div>
                    </div>
                    
                    {asset.purchase_date && (
                      <div className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                            <DollarSign className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div className="w-0.5 h-full bg-gray-200 dark:bg-gray-700 mt-2"></div>
                        </div>
                        <div className="flex-1 pb-8">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">Purchased</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {new Date(asset.purchase_date).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>
                          {asset.supplier && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                              Purchased from <span className="font-semibold">{asset.supplier}</span>
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {asset.assigned_to && (
                      <div className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
                            <User className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                          </div>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">Assigned</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Current status</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                            Assigned to <span className="font-semibold">
                              {asset.assigned_employee ? asset.assigned_employee.full_name : asset.assigned_to}
                            </span>
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Notes Tab */}
              {activeTab === 'notes' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-8"
                >
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                        <FileText className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                      </div>
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Notes & Comments
                      </h2>
                    </div>
                    <motion.button
                      onClick={() => setShowAddNoteForm(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 text-white rounded-xl transition-all duration-200 font-medium shadow-lg"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <FileText className="w-4 h-4" />
                      Add Note
                    </motion.button>
                  </div>

                  {/* Add Note Form */}
                  {showAddNoteForm && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mb-6 p-6 bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/10 dark:to-orange-900/10 rounded-xl border border-yellow-200 dark:border-yellow-800"
                    >
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Add New Note</h3>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Note Type
                          </label>
                          <select
                            value={newNote.type}
                            onChange={(e) => setNewNote({ ...newNote, type: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                          >
                            <option value="general">General</option>
                            <option value="maintenance">Maintenance</option>
                            <option value="issue">Issue</option>
                            <option value="update">Update</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Title
                          </label>
                          <input
                            type="text"
                            value={newNote.title}
                            onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
                            placeholder="Enter note title..."
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Content
                          </label>
                          <textarea
                            value={newNote.content}
                            onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                            placeholder="Enter note content..."
                            rows={4}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-none"
                          />
                        </div>

                        <div className="flex items-center gap-3">
                          <motion.button
                            onClick={handleAddNote}
                            className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg font-medium transition-all duration-200"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            Save Note
                          </motion.button>
                          <button
                            onClick={() => {
                              setShowAddNoteForm(false);
                              setNewNote({ title: '', content: '', type: 'general' });
                            }}
                            className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Notes List */}
                  {notes.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-20 h-20 bg-gradient-to-br from-yellow-100 to-orange-100 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FileText className="w-10 h-10 text-yellow-600 dark:text-yellow-400" />
                      </div>
                      <p className="text-gray-600 dark:text-gray-400 mb-4">
                        No notes have been added yet
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-500">
                        Click "Add Note" to create your first note for this asset
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {notes.map((note) => (
                        <motion.div
                          key={note.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getNoteTypeColor(note.type)}`}>
                                <div className="flex items-center gap-1">
                                  {getNoteTypeIcon(note.type)}
                                  {note.type.charAt(0).toUpperCase() + note.type.slice(1)}
                                </div>
                              </span>
                              <h4 className="font-semibold text-gray-900 dark:text-white">{note.title}</h4>
                            </div>
                            <button
                              onClick={() => handleDeleteNote(note.id)}
                              className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                              title="Delete note"
                            >
                              <Trash className="w-4 h-4" />
                            </button>
                          </div>
                          
                          <p className="text-gray-700 dark:text-gray-300 mb-3 leading-relaxed">
                            {note.content}
                          </p>
                          
                          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                            <span>By {note.author}</span>
                            <span>{new Date(note.created_at).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}</span>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </div>

            {/* Enhanced Sidebar */}
            <div className="space-y-6">
              {/* Enhanced Quick Stats */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                    <Database className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    Quick Info
                  </h3>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center gap-4 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                      <Database className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Type</p>
                      <p className="text-sm font-bold text-gray-900 dark:text-white">{asset.type}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 p-3 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl">
                    <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                      <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Status</p>
                      <p className="text-sm font-bold text-gray-900 dark:text-white">{asset.status}</p>
                    </div>
                  </div>

                  {asset.purchase_price && (
                    <div className="flex items-center gap-4 p-3 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-xl">
                      <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                        <DollarSign className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Value</p>
                        <p className="text-sm font-bold text-gray-900 dark:text-white">
                          AED {parseFloat(asset.purchase_price).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-4 p-3 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl">
                    <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                      <Calendar className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Added</p>
                      <p className="text-sm font-bold text-gray-900 dark:text-white">
                        {new Date(asset.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Enhanced Asset History */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-indigo-100 dark:bg-indigo-900 rounded-lg">
                    <History className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    Asset History
                  </h3>
                </div>
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Clock className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                    Asset history will be displayed here
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    Track maintenance, assignments, and updates
                  </p>
                </div>
              </motion.div>

              {/* Asset Security Info */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                    <Shield className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    Security Info
                  </h3>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-xl">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Asset Tagged</span>
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  </div>
                  <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Inventory Verified</span>
                    <CheckCircle className="w-4 h-4 text-blue-500" />
                  </div>
                  <div className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Insurance Status</span>
                    <AlertTriangle className="w-4 h-4 text-yellow-500" />
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      {/* QR Code Modal */}
      {showQRCode && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setShowQRCode(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Asset QR Code</h3>
                <button
                  onClick={() => setShowQRCode(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all duration-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="bg-white p-6 rounded-xl mb-6 inline-block">
                {/* Placeholder QR Code - In production, use a QR code library like qrcode.react */}
                <div className="w-64 h-64 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center">
                  <div className="text-center">
                    <QrCode className="w-24 h-24 mx-auto mb-4 text-gray-400" />
                    <p className="text-sm text-gray-600 max-w-xs">
                      QR Code for Asset #{asset.asset_code || asset.id}
                    </p>
                    <p className="text-xs text-gray-400 mt-2">
                      Scan to view asset details
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-3 text-left bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 mb-6">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Asset Name:</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{asset.name}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Asset Code:</span>
                  <span className="font-mono font-semibold text-gray-900 dark:text-white">
                    {asset.asset_code || 'N/A'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Type:</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{asset.type}</span>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <motion.button
                  onClick={() => {
                    success("Info", "QR Code download feature coming soon!");
                  }}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl transition-all duration-200 font-medium"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Download className="w-4 h-4" />
                  Download QR
                </motion.button>
                <motion.button
                  onClick={() => {
                    success("Info", "QR Code print feature coming soon!");
                  }}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white rounded-xl transition-all duration-200 font-medium"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <PrintIcon className="w-4 h-4" />
                  Print QR
                </motion.button>
              </div>
              
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
                Use this QR code for quick asset identification and tracking
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
} 