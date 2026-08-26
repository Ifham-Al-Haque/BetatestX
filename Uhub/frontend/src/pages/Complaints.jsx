import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Search, Filter, FileText, Clock, User, 
  AlertTriangle, CheckCircle, XCircle, MoreHorizontal,
  Edit, Trash2, Eye, Calendar, Tag, Building, 
  MessageSquare, Shield, TrendingUp, Activity, Zap,
  BarChart3, Users, CreditCard, AlertCircle, Loader2,
  Send, Archive, Flag, ChevronDown, ChevronUp,
  Filter as FilterIcon, X, Star
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { complaintsApi } from '../services/complaintsApi';
import HRCommentThread from '../components/hr/HRCommentThread';
import ComplaintFormModal, { COMPLAINT_FORM_DEFAULTS } from '../components/hr/ComplaintFormModal';
import {
  COMPLAINT_CATEGORIES,
  COMPLAINT_PRIORITIES,
  getComplaintStatusColor,
  getComplaintPriorityColor,
  isHROrAdmin,
} from '../config/hrPanelConfig';

const Complaints = () => {
  const { user, userProfile } = useAuth();
  const { success, error: showError } = useToast();
  
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingComplaint, setEditingComplaint] = useState(null);
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    category: '',
    search: ''
  });
  const [expandedThreadId, setExpandedThreadId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({ ...COMPLAINT_FORM_DEFAULTS });

  const categories = COMPLAINT_CATEGORIES;

  const priorities = COMPLAINT_PRIORITIES;

  useEffect(() => {
    fetchData();
  }, [filters]);

  useEffect(() => {
    if (userProfile) {
      fetchData();
    }
  }, [userProfile]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const realComplaints = await complaintsApi.getComplaintsWithFilters(
        filters, 
        user?.id, 
        userProfile?.role
      );
      
      setComplaints(realComplaints);
    } catch (error) {
      console.error('Error fetching complaints:', error);
      showError('Failed to fetch complaints from database');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({ ...COMPLAINT_FORM_DEFAULTS });
    setEditingComplaint(null);
  };

  const openNewComplaintForm = () => {
    resetForm();
    setShowForm(true);
  };

  const closeComplaintForm = () => {
    if (submitting) return;
    setShowForm(false);
    resetForm();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setSubmitting(true);
      if (editingComplaint) {
        await complaintsApi.updateComplaint(editingComplaint.id, formData);
        success('Complaint Updated', 'Your complaint has been successfully updated');
      } else {
        await complaintsApi.createComplaint({
          ...formData,
          complainant_id: user.id,
          complainant_name: userProfile?.full_name || user.email,
          complainant_email: user.email,
          complainant_department: userProfile?.department || 'Unassigned'
        });
        success('Complaint Submitted', 'Your complaint has been submitted successfully');
      }
      
      setShowForm(false);
      resetForm();
      fetchData();
    } catch (error) {
      console.error('Error submitting complaint:', error);
      showError('Failed to submit complaint', 'Please check your input and try again');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (complaint) => {
    setEditingComplaint(complaint);
    setFormData({
      title: complaint.title,
      description: complaint.description,
      category: complaint.category,
      priority: complaint.priority,
      anonymous: complaint.anonymous
    });
    setShowForm(true);
  };

  const handleDelete = async (complaintId) => {
    if (window.confirm('Are you sure you want to delete this complaint?')) {
      try {
        await complaintsApi.deleteComplaint(complaintId);
        success('Complaint Deleted', 'Complaint has been successfully deleted');
        fetchData();
      } catch (error) {
        console.error('Error deleting complaint:', error);
        showError('Failed to delete complaint', 'Please try again');
      }
    }
  };

  const handleStatusUpdate = async (complaintId, newStatus) => {
    try {
      await complaintsApi.updateComplaintStatus(complaintId, newStatus);
      success('Status Updated', 'Complaint status updated successfully');
      fetchData();
    } catch (error) {
      showError('Failed to update complaint status');
    }
  };

  const getStatusColor = getComplaintStatusColor;

  const getPriorityColor = getComplaintPriorityColor;

  const canEdit = (complaint) => {
    return user.id === complaint.complainant_id || userProfile?.role === 'admin' || isHROrAdmin(userProfile?.role);
  };

  const canDelete = (complaint) => {
    return user.id === complaint.complainant_id || userProfile?.role === 'admin';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-lg text-gray-600">Loading complaints...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
      {/* Header Section */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-gradient-to-r from-red-500 to-pink-500 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Complaint Management</h1>
                <p className="text-sm text-gray-600">Submit and manage your complaints confidentially</p>
              </div>
            </div>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={openNewComplaintForm}
              className="px-6 py-3 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white font-semibold rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Submit Complaint
            </motion.button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Enhanced Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-red-500 to-pink-600 p-6 rounded-2xl shadow-xl text-white relative overflow-hidden group hover:scale-105 transition-all duration-300"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16 group-hover:scale-110 transition-transform duration-300"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                  <AlertTriangle className="w-6 h-6 text-white" />
                </div>
                <TrendingUp className="w-5 h-5 text-white/70" />
              </div>
              <p className="text-sm font-medium text-red-100 mb-1">Total Complaints</p>
              <p className="text-3xl font-bold text-white">{complaints.length}</p>
              <p className="text-xs text-red-100 mt-2">All categories</p>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-2xl shadow-xl text-white relative overflow-hidden group hover:scale-105 transition-all duration-300"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16 group-hover:scale-110 transition-transform duration-300"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                  <Clock className="w-6 h-6 text-white" />
                </div>
                <Activity className="w-5 h-5 text-white/70" />
              </div>
              <p className="text-sm font-medium text-blue-100 mb-1">Open Complaints</p>
              <p className="text-3xl font-bold text-white">
                {complaints.filter(c => c.status === 'open').length}
              </p>
              <p className="text-xs text-blue-100 mt-2">Awaiting response</p>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-br from-green-500 to-emerald-600 p-6 rounded-2xl shadow-xl text-white relative overflow-hidden group hover:scale-105 transition-all duration-300"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16 group-hover:scale-110 transition-transform duration-300"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
                <BarChart3 className="w-5 h-5 text-white/70" />
              </div>
              <p className="text-sm font-medium text-green-100 mb-1">Resolved</p>
              <p className="text-3xl font-bold text-white">
                {complaints.filter(c => c.status === 'resolved').length}
              </p>
              <p className="text-xs text-green-100 mt-2">Successfully handled</p>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-gradient-to-br from-orange-500 to-red-600 p-6 rounded-2xl shadow-xl text-white relative overflow-hidden group hover:scale-105 transition-all duration-300"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16 group-hover:scale-110 transition-transform duration-300"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                  <AlertTriangle className="w-6 h-6 text-white" />
                </div>
                <Zap className="w-5 h-5 text-white/70" />
              </div>
              <p className="text-sm font-medium text-orange-100 mb-1">High Priority</p>
              <p className="text-3xl font-bold text-white">
                {complaints.filter(c => c.priority === 'high' || c.priority === 'urgent').length}
              </p>
              <p className="text-xs text-orange-100 mt-2">Requires attention</p>
            </div>
          </motion.div>
        </div>

        {/* Enhanced Filters */}
        <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-200 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <Filter className="w-5 h-5 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Filter & Search</h3>
            </div>
            <button
              onClick={() => setFilters({ status: '', priority: '', category: '', search: '' })}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-all duration-200 text-sm font-medium"
            >
              Clear All Filters
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-red-500 transition-colors" />
              <input
                type="text"
                placeholder="Search complaints..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent w-full transition-all duration-200 hover:border-gray-400"
              />
            </div>
            
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 hover:border-gray-400 cursor-pointer"
            >
              <option value="">All Status</option>
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>

            <select
              value={filters.category}
              onChange={(e) => setFilters({ ...filters, category: e.target.value })}
              className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 hover:border-gray-400 cursor-pointer"
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>

            <select
              value={filters.priority}
              onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
              className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 hover:border-gray-400 cursor-pointer"
            >
              <option value="">All Priorities</option>
              {priorities.map(priority => (
                <option key={priority.value} value={priority.value}>{priority.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Enhanced Complaints List */}
        <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-200">
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <FileText className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Your Complaints ({complaints.length})
                </h2>
                <p className="text-gray-600 mt-1">
                  View and manage your submitted complaints
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-500 bg-gray-100 px-4 py-2 rounded-xl">
              <Filter className="w-4 h-4" />
              <span>Showing {complaints.length} complaints</span>
            </div>
          </div>

          {complaints.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-16"
            >
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertTriangle className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-600 mb-2">
                No complaints found
              </h3>
              <p className="text-gray-500 max-w-md mx-auto">
                {filters.search || filters.status || filters.category || filters.priority
                  ? "Try adjusting your filters or search terms to find what you're looking for" 
                  : "You haven't submitted any complaints yet. Click 'Submit Complaint' to get started."}
              </p>
              {!filters.search && !filters.status && !filters.category && !filters.priority && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={openNewComplaintForm}
                  className="mt-6 px-6 py-3 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-xl hover:from-red-600 hover:to-pink-600 transition-all duration-200 font-medium"
                >
                  Submit Your First Complaint
                </motion.button>
              )}
            </motion.div>
          ) : (
            <div className="space-y-6">
              <AnimatePresence>
                {complaints.map((complaint, index) => (
                  <motion.div
                    key={complaint.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    layout
                    className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-xl transition-all duration-300 group"
                  >
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-4">
                          <h3 className="text-xl font-bold text-gray-900 group-hover:text-red-600 transition-colors">
                            {complaint.title}
                          </h3>
                          <span className={`px-3 py-1.5 text-xs font-bold rounded-full border ${getStatusColor(complaint.status)}`}>
                            {complaint.status.replace('_', ' ').toUpperCase()}
                          </span>
                          <span className={`px-3 py-1.5 text-xs font-bold rounded-full border ${getPriorityColor(complaint.priority)}`}>
                            {priorities.find(p => p.value === complaint.priority)?.label || complaint.priority}
                          </span>
                        </div>

                        <p className="text-gray-600 mb-6 text-lg leading-relaxed">
                          {complaint.description}
                        </p>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl">
                            <Building className="w-4 h-4 text-gray-500" />
                            <span className="text-sm font-medium text-gray-700">{complaint.category}</span>
                          </div>
                          
                          <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl">
                            <Calendar className="w-4 h-4 text-gray-500" />
                            <span className="text-sm font-medium text-gray-700">
                              Created: {new Date(complaint.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl">
                            <Clock className="w-4 h-4 text-gray-500" />
                            <span className="text-sm font-medium text-gray-700">
                              Updated: {new Date(complaint.updated_at).toLocaleDateString()}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl">
                            <Shield className="w-4 h-4 text-gray-500" />
                            <span className="text-sm font-medium text-gray-700">
                              {complaint.anonymous ? 'Anonymous' : 'Named'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setExpandedThreadId(
                            expandedThreadId === complaint.id ? null : complaint.id
                          )}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50"
                        >
                          <MessageSquare className="w-4 h-4" />
                          {expandedThreadId === complaint.id ? 'Hide responses' : 'HR responses'}
                        </button>
                      </div>

                      {expandedThreadId === complaint.id && (
                        <div className="mt-4" onClick={(e) => e.stopPropagation()}>
                          <HRCommentThread
                            entityType="complaint"
                            entityId={complaint.id}
                            canReply
                          />
                        </div>
                      )}

                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        {canEdit(complaint) && (
                          <button
                            onClick={() => handleEdit(complaint)}
                            className="p-2 bg-blue-100 text-blue-600 hover:bg-blue-200 rounded-lg transition-all duration-200 hover:scale-110"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        )}
                        
                        {canDelete(complaint) && (
                          <button
                            onClick={() => handleDelete(complaint.id)}
                            className="p-2 bg-red-100 text-red-600 hover:bg-red-200 rounded-lg transition-all duration-200 hover:scale-110"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      <ComplaintFormModal
        open={showForm}
        onClose={closeComplaintForm}
        onSubmit={handleSubmit}
        formData={formData}
        setFormData={setFormData}
        editingComplaint={editingComplaint}
        submitting={submitting}
      />
    </div>
  );
};

export default Complaints;
