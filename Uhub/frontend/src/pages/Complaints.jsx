import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Search, Filter, FileText, Clock, User, 
  AlertTriangle, CheckCircle, XCircle, MoreHorizontal,
  Edit, Trash2, Eye, Calendar, Tag, Building, 
  MessageSquare, Shield, TrendingUp, Activity, Zap,
  BarChart3, Users, CreditCard, AlertCircle, Loader2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

import UserDropdown from '../components/UserDropdown';
import DarkModeToggle from '../components/DarkModeToggle';
import { Card, CardContent, CardHeader } from '../components/ui/card';
import Button from '../components/ui/button';
import Input from '../components/ui/input';
import Label from '../components/ui/label';
import Textarea from '../components/ui/textarea';
import { complaintsApi } from '../services/complaintsApi';

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

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    priority: 'medium',
    anonymous: false
  });

  const categories = [
    'Work Environment',
    'Harassment',
    'Discrimination',
    'Pay & Benefits',
    'Management Issues',
    'Safety Concerns',
    'Other'
  ];

  const priorities = [
    { value: 'low', label: 'Low', color: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-200 dark:border-green-700' },
    { value: 'medium', label: 'Medium', color: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900 dark:text-yellow-200 dark:border-yellow-700' },
    { value: 'high', label: 'High', color: 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900 dark:text-orange-200 dark:border-orange-700' },
    { value: 'urgent', label: 'Urgent', color: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900 dark:text-red-200 dark:border-red-700' }
  ];

  useEffect(() => {
    fetchData();
  }, [filters]);

  useEffect(() => {
    if (userProfile) {
      console.log('UserProfile loaded:', userProfile);
      fetchData();
    }
  }, [userProfile]);

  useEffect(() => {
    console.log('User state:', user);
    console.log('UserProfile state:', userProfile);
  }, [user, userProfile]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      console.log('Fetching complaints for user:', user?.id, 'with role:', userProfile?.role);
      
      // Fetch real complaints from database
      const realComplaints = await complaintsApi.getComplaintsWithFilters(
        filters, 
        user?.id, 
        userProfile?.role
      );
      
      console.log('Fetched complaints:', realComplaints);
      setComplaints(realComplaints);
    } catch (error) {
      console.error('Error fetching complaints:', error);
      showError('Failed to fetch complaints from database');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingComplaint) {
        // Update existing complaint in database
        const updatedComplaint = await complaintsApi.updateComplaint(editingComplaint.id, formData);
        
        // Update local state
        const updatedComplaints = complaints.map(c => 
          c.id === editingComplaint.id ? updatedComplaint : c
        );
        setComplaints(updatedComplaints);
        success('Complaint updated successfully in database');
      } else {
        // Create new complaint in database
        const complaintData = {
          ...formData,
          complainant_id: user.id,
          complainant_name: userProfile?.full_name || 'Anonymous'
        };
        
        const newComplaint = await complaintsApi.createComplaint(complaintData);
        
        // Add to local state
        setComplaints([newComplaint, ...complaints]);
        success('Complaint submitted successfully to database');
      }
      setShowForm(false);
      setEditingComplaint(null);
      resetForm();
    } catch (error) {
      console.error('Error submitting complaint:', error);
      showError('Failed to submit complaint to database');
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
    if (window.confirm('Are you sure you want to delete this complaint? This action cannot be undone.')) {
      try {
        // Delete from database
        await complaintsApi.deleteComplaint(complaintId);
        
        // Update local state
        const updatedComplaints = complaints.filter(c => c.id !== complaintId);
        setComplaints(updatedComplaints);
        success('Complaint deleted successfully from database');
      } catch (error) {
        console.error('Error deleting complaint:', error);
        showError('Failed to delete complaint from database');
      }
    }
  };

  const handleStatusChange = async (complaintId, newStatus) => {
    try {
      // Update status in database
      const updatedComplaint = await complaintsApi.updateComplaintStatus(complaintId, newStatus);
      
      // Update local state
      const updatedComplaints = complaints.map(c => 
        c.id === complaintId ? updatedComplaint : c
      );
      setComplaints(updatedComplaints);
      success('Status updated successfully in database');
    } catch (error) {
      console.error('Error updating status:', error);
      showError('Failed to update status in database');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      category: '',
      priority: 'medium',
      anonymous: false
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'open': return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900 dark:text-blue-200 dark:border-blue-700';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900 dark:text-yellow-200 dark:border-yellow-700';
      case 'resolved': return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-200 dark:border-green-700';
      case 'closed': return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600';
      default: return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600';
    }
  };

  const getPriorityColor = (priority) => {
    const priorityObj = priorities.find(p => p.value === priority);
    return priorityObj ? priorityObj.color : 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600';
  };

  const canEdit = (complaint) => {
    return user.id === complaint.complainant_id || userProfile?.role === 'admin' || userProfile?.role === 'hr';
  };

  const canDelete = (complaint) => {
    return user.id === complaint.complainant_id || userProfile?.role === 'admin';
  };

  const canChangeStatus = (complaint) => {
    return userProfile?.role === 'admin' || userProfile?.role === 'hr';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/30 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex">
        
        <div className="flex-1 transition-all duration-300 ease-in-out" style={{ marginLeft: '320px' }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50">
              <div className="flex items-center justify-center py-16">
                <div className="text-center">
                  <Loader2 className="w-12 h-12 text-blue-600 dark:text-blue-400 mx-auto mb-4 animate-spin" />
                  <p className="text-lg font-medium text-gray-600 dark:text-gray-400">Loading complaints...</p>
                  <p className="text-sm text-gray-500 dark:text-gray-500">Please wait while we fetch your data</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/30 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex">
      
      <div className="flex-1 transition-all duration-300 ease-in-out" style={{ marginLeft: '320px' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Enhanced Header */}
          <div className="mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-xl border border-gray-200/50 dark:border-gray-700/50 bg-gradient-to-r from-white to-blue-50/50 dark:from-gray-800 dark:to-gray-700/50">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-4">
                  <div className="p-4 bg-gradient-to-br from-red-500 to-pink-600 rounded-2xl shadow-lg">
                    <AlertTriangle className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent">
                      Complaint Management
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-2 text-lg">
                      Submit and manage employee complaints and grievances with confidentiality
                    </p>
                    <div className="flex items-center gap-4 mt-4 text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-red-500" />
                        <span>Confidential Handling</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-blue-500" />
                        <span>Quick Response</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-green-500" />
                        <span>Employee Support</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    onClick={() => setShowForm(true)}
                    className="px-6 py-3 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white rounded-xl flex items-center gap-2 transition-all duration-200 shadow-lg hover:shadow-xl font-medium"
                  >
                    <Plus className="w-5 h-5" />
                    Submit Complaint
                  </Button>
                </div>
              </div>
            </div>
          </div>

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
                    <Shield className="w-6 h-6 text-white" />
                  </div>
                  <Zap className="w-5 h-5 text-white/70" />
                </div>
                <p className="text-sm font-medium text-orange-100 mb-1">Urgent</p>
                <p className="text-3xl font-bold text-white">
                  {complaints.filter(c => c.priority === 'urgent').length}
                </p>
                <p className="text-xs text-orange-100 mt-2">Requires immediate attention</p>
              </div>
            </motion.div>
          </div>

          {/* Enhanced Filters */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 mb-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 dark:bg-red-900/50 rounded-lg">
                  <Filter className="w-5 h-5 text-red-600 dark:text-red-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Filter & Search</h3>
              </div>
              <button
                onClick={() => setFilters({ status: '', priority: '', category: '', search: '' })}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-all duration-200 text-sm font-medium"
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
                  className="pl-12 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent dark:bg-gray-700 dark:text-white w-full transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-500"
                />
              </div>
              
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-500 cursor-pointer"
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
                className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-500 cursor-pointer"
              >
                <option value="">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>

              <select
                value={filters.priority}
                onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
                className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-500 cursor-pointer"
              >
                <option value="">All Priorities</option>
                {priorities.map(priority => (
                  <option key={priority.value} value={priority.value}>{priority.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Enhanced Complaint Form Modal */}
          <AnimatePresence>
            {showForm && (
              <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 20 }}
                  transition={{ type: "spring", damping: 25, stiffness: 300 }}
                  className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-gray-200/20 dark:border-gray-700/50"
                >
                  <div className="p-8 border-b border-gray-200/50 dark:border-gray-700/50 bg-gradient-to-r from-red-50 to-pink-50 dark:from-gray-800 dark:to-gray-700 rounded-t-2xl">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-3 bg-red-100 dark:bg-red-900/50 rounded-xl">
                          <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
                        </div>
                        <div>
                          <h2 className="text-3xl font-bold bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent">
                            {editingComplaint ? "Edit Complaint" : "Submit New Complaint"}
                          </h2>
                          <p className="text-gray-600 dark:text-gray-400 mt-1">
                            {editingComplaint ? "Update complaint information" : "Submit a new complaint or grievance"}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setShowForm(false);
                          setEditingComplaint(null);
                          resetForm();
                        }}
                        className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-all duration-200"
                      >
                        <XCircle className="w-6 h-6" />
                      </button>
                    </div>
                  </div>

                  <form onSubmit={handleSubmit} className="p-8 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div>
                        <Label htmlFor="title" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                          Complaint Title *
                        </Label>
                        <Input
                          id="title"
                          value={formData.title}
                          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                          required
                          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-500"
                          placeholder="Brief description of the issue"
                        />
                      </div>

                      <div>
                        <Label htmlFor="category" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                          Category *
                        </Label>
                        <select
                          id="category"
                          value={formData.category}
                          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-500"
                          required
                        >
                          <option value="">Select Category</option>
                          {categories.map(category => (
                            <option key={category} value={category}>{category}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="description" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                        Detailed Description *
                      </Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        required
                        rows={6}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-500"
                        placeholder="Please provide detailed information about your complaint..."
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div>
                        <Label htmlFor="priority" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                          Priority *
                        </Label>
                        <select
                          id="priority"
                          value={formData.priority}
                          onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-500"
                          required
                        >
                          {priorities.map(priority => (
                            <option key={priority.value} value={priority.value}>{priority.label}</option>
                          ))}
                        </select>
                      </div>

                      <div className="flex items-center space-x-3 pt-8">
                        <input
                          type="checkbox"
                          id="anonymous"
                          checked={formData.anonymous}
                          onChange={(e) => setFormData({ ...formData, anonymous: e.target.checked })}
                          className="w-5 h-5 rounded border-gray-300 text-red-600 focus:ring-red-500 focus:ring-offset-0"
                        />
                        <Label htmlFor="anonymous" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Submit anonymously
                        </Label>
                      </div>
                    </div>

                    <div className="flex justify-end space-x-4 pt-8 border-t border-gray-200 dark:border-gray-700">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setShowForm(false);
                          setEditingComplaint(null);
                          resetForm();
                        }}
                        className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 font-medium"
                      >
                        Cancel
                      </Button>
                      <Button 
                        type="submit" 
                        className="px-8 py-3 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white rounded-xl flex items-center gap-2 transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
                      >
                        {editingComplaint ? 'Update Complaint' : 'Submit Complaint'}
                      </Button>
                    </div>
                  </form>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* Enhanced Complaints List */}
          <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50">
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 dark:bg-red-900/50 rounded-lg">
                  <FileText className="w-5 h-5 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Complaints List ({complaints.length})
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">
                    Manage and track all submitted complaints
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-4 py-2 rounded-xl">
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
                <div className="w-24 h-24 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-6">
                  <AlertTriangle className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-400 mb-2">
                  No complaints found
                </h3>
                <p className="text-gray-500 dark:text-gray-500 max-w-md mx-auto">
                  {filters.search || filters.status || filters.category || filters.priority 
                    ? "Try adjusting your filters or search terms to find what you're looking for" 
                    : "Get started by submitting your first complaint"}
                </p>
                {!filters.search && !filters.status && !filters.category && !filters.priority && (
                  <button
                    onClick={() => setShowForm(true)}
                    className="mt-6 px-6 py-3 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white rounded-xl flex items-center gap-2 mx-auto transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    <Plus className="w-5 h-5" />
                    Submit First Complaint
                  </button>
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
                      className="bg-white dark:bg-gray-800 border border-gray-200/50 dark:border-gray-700/50 rounded-2xl p-6 hover:shadow-xl transition-all duration-300 group"
                    >
                      <div className="flex items-start justify-between mb-6">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-4">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
                              {complaint.title}
                            </h3>
                            <span className={`px-3 py-1.5 text-xs font-bold rounded-full border ${getStatusColor(complaint.status)}`}>
                              {complaint.status.replace('_', ' ').toUpperCase()}
                            </span>
                            <span className={`px-3 py-1.5 text-xs font-bold rounded-full border ${getPriorityColor(complaint.priority)}`}>
                              {priorities.find(p => p.value === complaint.priority)?.label || complaint.priority}
                            </span>
                          </div>

                          <p className="text-gray-600 dark:text-gray-400 mb-6 text-lg leading-relaxed">
                            {complaint.description}
                          </p>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                              <Building className="w-4 h-4 text-gray-500" />
                              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{complaint.category}</span>
                            </div>
                            
                            {!complaint.anonymous && (
                              <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                                <User className="w-4 h-4 text-gray-500" />
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">By: {complaint.complainant_name}</span>
                              </div>
                            )}
                            
                            <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                              <Calendar className="w-4 h-4 text-gray-500" />
                              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                Created: {new Date(complaint.created_at).toLocaleDateString()}
                              </span>
                            </div>
                            
                            <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                              <Clock className="w-4 h-4 text-gray-500" />
                              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                Updated: {new Date(complaint.updated_at).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          {/* Status Change Controls */}
                          {canChangeStatus(complaint) && (
                            <select
                              value={complaint.status}
                              onChange={(e) => handleStatusChange(complaint.id, e.target.value)}
                              className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:text-white"
                            >
                              <option value="open">Open</option>
                              <option value="in_progress">In Progress</option>
                              <option value="resolved">Resolved</option>
                              <option value="closed">Closed</option>
                            </select>
                          )}

                          {canEdit(complaint) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(complaint)}
                              className="p-2 bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-800 rounded-lg transition-all duration-200 hover:scale-110"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          )}
                          
                          {canDelete(complaint) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(complaint.id)}
                              className="p-2 bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-800 rounded-lg transition-all duration-200 hover:scale-110"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
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
      </div>
    </div>
  );
};

export default Complaints;
