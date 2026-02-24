import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Search, Filter, FileText, Clock, User, 
  AlertCircle, CheckCircle, XCircle, MoreHorizontal,
  Edit, Trash2, Eye, Calendar, Tag, Building,
  Wrench, Settings, AlertTriangle, Paperclip, MessageCircle,
  TrendingUp, BarChart3, Download, Upload, Star,
  ChevronDown, ChevronUp, Filter as FilterIcon, SortAsc,
  RefreshCw, Bell, BellRing, Archive, Flag, Zap,
  Users, Timer, Target, Award, Activity, Globe
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useTheme } from '../context/ThemeContext';
import { itServicesApi } from '../services/itServicesApi';
import { Card, CardContent, CardHeader } from '../components/ui/card';
import Button from '../components/ui/button';
import Input from '../components/ui/input';
import Label from '../components/ui/label';
import Textarea from '../components/ui/textarea';
import LoadingSpinner from '../components/LoadingSpinner';
import ITAnalytics from '../components/ITAnalytics';
import MobileOptimized from '../components/MobileOptimized';
import { usePWA } from '../hooks/usePWA';
import offlineStorage from '../services/offlineStorage';
import { emailService } from '../services/emailService';
import { workflowService } from '../services/workflowService';
import { integrationService } from '../services/integrationService';

const ITRequests = () => {
  const { user, userProfile } = useAuth();
  const { success, error: showError } = useToast();
  const { isDark } = useTheme();
  const { isOnline, canInstall, install } = usePWA();
  
  // Core state
  const [requests, setRequests] = useState([]);
  const [categories, setCategories] = useState([]);
  const [priorities, setPriorities] = useState([]);
  const [itStaff, setItStaff] = useState([]); // Add IT staff state
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // UI state
  const [showForm, setShowForm] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [editingRequest, setEditingRequest] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [viewMode, setViewMode] = useState('grid'); // grid, list, kanban
  
  // Enhanced filters
  const [filters, setFilters] = useState({
    status: '',
    category_id: '',
    priority_id: '',
    search: '',
    dateRange: '',
    assignedTo: '',
    sortBy: 'created_at',
    sortOrder: 'desc'
  });

  // Enhanced form data
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category_id: '',
    priority_id: '',
    request_type: 'it_service',
    estimated_completion_date: '',
    assigned_to: '', // Add assignment field
    attachments: [],
    comments: []
  });

  // File attachment state
  const [attachments, setAttachments] = useState([]);
  const [uploadingFiles, setUploadingFiles] = useState(false);

  // Comments state
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');

  // Analytics state
  const [analytics, setAnalytics] = useState({
    totalRequests: 0,
    openRequests: 0,
    inProgressRequests: 0,
    resolvedRequests: 0,
    averageResolutionTime: 0,
    categoryBreakdown: [],
    priorityBreakdown: [],
    monthlyTrends: []
  });

  useEffect(() => {
    fetchData();
  }, [filters]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch categories, priorities, and IT staff for assignment
      const [categoriesData, prioritiesData, itStaffData] = await Promise.allSettled([
        itServicesApi.categories.getAll().catch(err => {
          console.error('Error fetching categories:', err);
          return [];
        }),
        itServicesApi.priorities.getAll().catch(err => {
          console.error('Error fetching priorities:', err);
          return [];
        }),
        itServicesApi.users.getITStaff().catch(err => {
          console.error('Error fetching IT staff:', err);
          return [];
        })
      ]);

      setCategories(categoriesData.status === 'fulfilled' ? categoriesData.value : []);
      setPriorities(prioritiesData.status === 'fulfilled' ? prioritiesData.value : []);
      setItStaff(itStaffData.status === 'fulfilled' ? itStaffData.value : []);
      
      // Set empty requests array since this is a request creation page
      setRequests([]);
      setAnalytics({
        totalRequests: 0,
        openRequests: 0,
        inProgressRequests: 0,
        resolvedRequests: 0,
        averageResolutionTime: 0,
        categoryBreakdown: [],
        priorityBreakdown: [],
        monthlyTrends: []
      });

      // Show warning if categories/priorities failed to load
      const failedCount = [categoriesData, prioritiesData, itStaffData]
        .filter(result => result.status === 'rejected').length;
      
      if (failedCount > 0) {
        showError('Warning', `Failed to load some form data. Please check your database setup.`);
      }
    } catch (err) {
      console.error('Error in fetchData:', err);
      showError('Error', 'Failed to load form data. Please check your database connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const stats = await itServicesApi.requests.getStats(user?.id, userProfile?.role);
      return {
        totalRequests: stats.total_requests,
        openRequests: stats.open_requests,
        inProgressRequests: stats.in_progress_requests,
        resolvedRequests: stats.resolved_requests,
        averageResolutionTime: 0, // Will be calculated
        categoryBreakdown: [],
        priorityBreakdown: [],
        monthlyTrends: []
      };
    } catch (err) {
      console.error('Error fetching analytics:', err);
      return analytics;
    }
  };

  const refreshData = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // Validate required fields
      if (!formData.title.trim()) {
        showError('Validation Error', 'Title is required');
        return;
      }
      if (!formData.description.trim()) {
        showError('Validation Error', 'Description is required');
        return;
      }
      if (!formData.category_id) {
        showError('Validation Error', 'Category is required');
        return;
      }
      if (!formData.priority_id) {
        showError('Validation Error', 'Priority is required');
        return;
      }

      const requestData = {
        ...formData,
        requester_id: user?.id, // Use user.id directly
        estimated_completion_date: formData.estimated_completion_date || null,
        assigned_to: formData.assigned_to || null, // Include assignment
        attachments: attachments,
        comments: comments
      };

      if (isOnline) {
        // Online: Submit directly to server
        if (editingRequest) {
          await itServicesApi.requests.update(editingRequest.id, requestData);
          success('Success', 'Request updated successfully!');
        } else {
          const newRequest = await itServicesApi.requests.create(requestData);
          success('Success', 'Request submitted successfully!');
          
          // Send email notification
          try {
            await emailService.sendRequestStatusUpdate(
              newRequest, 
              user.email, 
              'created', 
              'open'
            );
          } catch (emailError) {
            console.warn('Failed to send email notification:', emailError);
          }
        }
      } else {
        // Offline: Save to local storage
        if (editingRequest) {
          await offlineStorage.saveOfflineRequest({
            ...requestData,
            id: editingRequest.id,
            action: 'update'
          });
          success('Success', 'Request saved offline. Will sync when online.');
        } else {
          await offlineStorage.saveOfflineRequest({
            ...requestData,
            action: 'create'
          });
          success('Success', 'Request saved offline. Will sync when online.');
        }
        
        // Add to sync queue
        await offlineStorage.addToSyncQueue(
          editingRequest ? 'update_request' : 'create_request',
          requestData
        );
      }

      setShowForm(false);
      setEditingRequest(null);
      resetForm();
      fetchData();
    } catch (err) {
      console.error('Error submitting request:', err);
      showError('Error', 'Failed to submit request. Please try again.');
    }
  };

  const handleEdit = (request) => {
    setEditingRequest(request);
    setFormData({
      title: request.title,
      description: request.description,
      category_id: request.category_id,
      priority_id: request.priority_id,
      request_type: request.request_type,
      estimated_completion_date: request.estimated_completion_date || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (requestId) => {
    if (window.confirm('Are you sure you want to delete this request? It will be removed from your view but kept in the system.')) {
      try {
        // Optimistically remove from UI immediately
        setRequests(prevRequests => prevRequests.filter(req => req.id !== requestId));
        
        // Update analytics optimistically
        setAnalytics(prevAnalytics => {
          const request = requests.find(r => r.id === requestId);
          if (!request) return prevAnalytics;
          
          const newAnalytics = { ...prevAnalytics };
          if (request.status === 'open') {
            newAnalytics.openRequests = Math.max(0, newAnalytics.openRequests - 1);
          } else if (request.status === 'in_progress') {
            newAnalytics.inProgressRequests = Math.max(0, newAnalytics.inProgressRequests - 1);
          } else if (request.status === 'resolved') {
            newAnalytics.resolvedRequests = Math.max(0, newAnalytics.resolvedRequests - 1);
          }
          newAnalytics.totalRequests = Math.max(0, newAnalytics.totalRequests - 1);
          return newAnalytics;
        });
        
        // Perform soft delete in background
        await itServicesApi.requests.delete(requestId);
        success('Success', 'Request deleted successfully! It has been removed from your view.');
        
        // Refresh data to ensure consistency (but UI already updated)
        fetchData();
      } catch (err) {
        console.error('Error deleting request:', err);
        
        // Revert optimistic update on error
        fetchData();
        showError('Error', 'Failed to delete request. Please try again.');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      category_id: '',
      priority_id: '',
      request_type: 'it_service',
      estimated_completion_date: '',
      assigned_to: '', // Reset assignment field
      attachments: [],
      comments: []
    });
    setAttachments([]);
    setComments([]);
  };

  // File attachment handlers
  const handleFileUpload = async (files) => {
    setUploadingFiles(true);
    try {
      const uploadedFiles = [];
      for (const file of files) {
        // In a real implementation, you would upload to a file storage service
        const fileData = {
          id: Date.now() + Math.random(),
          name: file.name,
          size: file.size,
          type: file.type,
          url: URL.createObjectURL(file), // Temporary URL for demo
          uploadedAt: new Date().toISOString()
        };
        uploadedFiles.push(fileData);
      }
      setAttachments(prev => [...prev, ...uploadedFiles]);
      success('Success', `${uploadedFiles.length} file(s) uploaded successfully!`);
    } catch (err) {
      showError('Error', 'Failed to upload files. Please try again.');
    } finally {
      setUploadingFiles(false);
    }
  };

  const removeAttachment = (fileId) => {
    setAttachments(prev => prev.filter(file => file.id !== fileId));
  };

  // Comments handlers
  const addComment = async () => {
    if (!newComment.trim()) return;
    
    const comment = {
      id: Date.now(),
      text: newComment,
      author: userProfile?.full_name || user?.email,
      authorId: user?.id,
      createdAt: new Date().toISOString(),
      isInternal: false
    };
    
    setComments(prev => [...prev, comment]);
    setNewComment('');
    success('Success', 'Comment added successfully!');
  };

  const removeComment = (commentId) => {
    setComments(prev => prev.filter(comment => comment.id !== commentId));
  };

  // Enhanced filtering and sorting
  const filteredAndSortedRequests = useMemo(() => {
    let filtered = requests;

    // Apply search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(request =>
        request.title.toLowerCase().includes(searchTerm) ||
        request.description?.toLowerCase().includes(searchTerm) ||
        request.request_number?.toLowerCase().includes(searchTerm)
      );
    }

    // Apply date range filter
    if (filters.dateRange) {
      const now = new Date();
      const daysAgo = parseInt(filters.dateRange);
      const cutoffDate = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000));
      filtered = filtered.filter(request =>
        new Date(request.created_at) >= cutoffDate
      );
    }

    // Sort requests
    filtered.sort((a, b) => {
      const aValue = a[filters.sortBy];
      const bValue = b[filters.sortBy];
      
      if (filters.sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [requests, filters]);

  // Check if user has admin/IT management access
  const isAdminOrITManager = useMemo(() => {
    return userProfile?.role === 'admin' || userProfile?.role === 'it_management';
  }, [userProfile?.role]);

  const getPriorityColor = (priority) => {
    if (!priority) return {
      bg: 'var(--bg-tertiary)',
      text: 'var(--text-muted)',
      border: 'var(--border-primary)',
      icon: 'Flag'
    };
    
    const level = priority.level;
    if (level === 1) return {
      bg: 'var(--accent-danger)',
      text: 'white',
      border: 'var(--accent-danger)',
      icon: 'AlertTriangle'
    };
    if (level === 2) return {
      bg: 'var(--accent-warning)',
      text: 'white',
      border: 'var(--accent-warning)',
      icon: 'Zap'
    };
    if (level === 3) return {
      bg: 'var(--accent-info)',
      text: 'white',
      border: 'var(--accent-info)',
      icon: 'Clock'
    };
    if (level === 4) return {
      bg: 'var(--accent-success)',
      text: 'white',
      border: 'var(--accent-success)',
      icon: 'CheckCircle'
    };
    return {
      bg: 'var(--bg-tertiary)',
      text: 'var(--text-muted)',
      border: 'var(--border-primary)',
      icon: 'Flag'
    };
  };

  const getStatusColor = (status) => {
    const statusColors = {
      'open': {
        bg: 'var(--accent-primary)',
        text: 'white',
        border: 'var(--accent-primary)',
        icon: 'AlertCircle'
      },
      'assigned': {
        bg: 'var(--accent-info)',
        text: 'white',
        border: 'var(--accent-info)',
        icon: 'User'
      },
      'in_progress': {
        bg: 'var(--accent-warning)',
        text: 'white',
        border: 'var(--accent-warning)',
        icon: 'Activity'
      },
      'pending_user': {
        bg: 'var(--accent-secondary)',
        text: 'white',
        border: 'var(--accent-secondary)',
        icon: 'Clock'
      },
      'resolved': {
        bg: 'var(--accent-success)',
        text: 'white',
        border: 'var(--accent-success)',
        icon: 'CheckCircle'
      },
      'closed': {
        bg: 'var(--bg-tertiary)',
        text: 'var(--text-muted)',
        border: 'var(--border-primary)',
        icon: 'Archive'
      },
      'cancelled': {
        bg: 'var(--accent-danger)',
        text: 'white',
        border: 'var(--accent-danger)',
        icon: 'XCircle'
      }
    };
    return statusColors[status] || {
      bg: 'var(--bg-tertiary)',
      text: 'var(--text-muted)',
      border: 'var(--border-primary)',
      icon: 'HelpCircle'
    };
  };

  const getStatusIcon = (status) => {
    const icons = {
      'open': AlertCircle,
      'assigned': User,
      'in_progress': Activity,
      'pending_user': Clock,
      'resolved': CheckCircle,
      'closed': Archive,
      'cancelled': XCircle
    };
    return icons[status] || AlertCircle;
  };

  const getPriorityIcon = (priority) => {
    if (!priority) return Flag;
    const level = priority.level;
    if (level === 1) return AlertTriangle;
    if (level === 2) return Zap;
    if (level === 3) return Clock;
    if (level === 4) return CheckCircle;
    return Flag;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getSLAStatus = (request) => {
    if (!request.priority || !request.created_at) return null;
    try {
      const created = new Date(request.created_at);
      const now = new Date();
      const hoursElapsed = (now - created) / (1000 * 60 * 60);
      const slaHours = request.priority.sla_hours || 72; // Default to 72 hours if sla_hours is missing
      
      if (hoursElapsed > slaHours) {
        return { status: 'overdue', hours: Math.floor(hoursElapsed - slaHours) };
      } else if (hoursElapsed > slaHours * 0.8) {
        return { status: 'warning', hours: Math.floor(slaHours - hoursElapsed) };
      }
      return { status: 'ok', hours: Math.floor(slaHours - hoursElapsed) };
    } catch (error) {
      console.warn('Error calculating SLA status:', error);
      return null;
    }
  };

  if (loading) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center"
        style={{
          background: 'var(--bg-primary)',
          color: 'var(--text-primary)'
        }}
      >
        <LoadingSpinner size="xl" text="Loading IT requests..." />
      </div>
    );
  }

  return (
    <MobileOptimized currentPage="it-requests">
      <div 
        className="min-h-screen p-4 md:p-6 transition-all duration-500"
        style={{
          background: 'linear-gradient(135deg, var(--bg-primary) 0%, var(--bg-secondary) 100%)',
          color: 'var(--text-primary)'
        }}
      >
      <div className="max-w-7xl mx-auto">
        {/* Enhanced Header with Gradient Background */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="mb-8"
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-8">
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-4">
                <motion.div 
                  className="p-4 rounded-2xl shadow-lg"
                  style={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    boxShadow: '0 10px 30px rgba(102, 126, 234, 0.3)'
                  }}
                  whileHover={{ scale: 1.05, rotate: 5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <FileText className="w-8 h-8 text-white" />
                </motion.div>
            <div>
                  <motion.h1 
                    className="text-4xl md:text-5xl font-bold mb-2 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1 }}
                  >
                    Submit IT Request
                  </motion.h1>
                  <motion.p 
                    className="text-lg md:text-xl"
                    style={{ color: 'var(--text-muted)' }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    Create a new IT service request for hardware, software, or technical support
                  </motion.p>
            </div>
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  variant="outline"
                  onClick={refreshData}
                  disabled={refreshing}
                  className="flex items-center gap-2 transition-all duration-200 hover:shadow-md"
                  style={{
                    background: 'var(--card-bg)',
                    borderColor: 'var(--card-border)',
                    color: 'var(--text-primary)'
                  }}
                >
                  <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </Button>
              </motion.div>
              
              {isAdminOrITManager && (
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    variant="outline"
                    onClick={() => setShowAnalytics(!showAnalytics)}
                    className="flex items-center gap-2 transition-all duration-200 hover:shadow-md"
                    style={{
                      background: 'var(--card-bg)',
                      borderColor: 'var(--card-border)',
                      color: 'var(--text-primary)'
                    }}
                  >
                    <BarChart3 className="w-4 h-4" />
                    <span>Analytics</span>
                  </Button>
                </motion.div>
              )}
              
            <motion.div 
              whileHover={{ scale: 1.05 }} 
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Button
                onClick={() => {
                  setEditingRequest(null);
                  resetForm();
                  setShowForm(true);
                }}
                className="flex items-center gap-2 shadow-lg hover:shadow-xl transition-all duration-300"
                style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  boxShadow: '0 10px 30px rgba(102, 126, 234, 0.4)'
                }}
              >
                <Plus className="w-4 h-4" />
                <span>New Request</span>
              </Button>
            </motion.div>
            </div>
          </div>

          {/* Enhanced Stats Cards with Gradient Backgrounds */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, type: "spring", stiffness: 100 }}
              whileHover={{ y: -5 }}
            >
              <Card 
                className="cursor-pointer group overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300"
                style={{
                  background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(99, 102, 241, 0.1) 100%)',
                  border: '1px solid rgba(59, 130, 246, 0.2)'
                }}
                onClick={() => setFilters({ ...filters, status: 'open' })}
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-500"></div>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <motion.div 
                        className="p-3 rounded-xl shadow-md"
                        style={{
                          background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
                        }}
                        whileHover={{ rotate: 360 }}
                        transition={{ duration: 0.6 }}
                      >
                        <AlertCircle className="w-6 h-6 text-white" />
                  </motion.div>
                  <div>
                        <p 
                          className="text-3xl font-bold mb-1 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent"
                        >
                          {analytics.openRequests}
                        </p>
                        <p 
                          className="text-sm font-medium"
                          style={{ color: 'var(--text-muted)' }}
                        >
                          Open Requests
                        </p>
                  </div>
                    </div>
                    <motion.div
                      initial={{ opacity: 0, scale: 0 }}
                      whileHover={{ opacity: 1, scale: 1 }}
                      transition={{ type: "spring", stiffness: 200 }}
                    >
                      <TrendingUp className="w-5 h-5 text-green-500" />
                    </motion.div>
                </div>
              </CardContent>
            </Card>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 100 }}
              whileHover={{ y: -5 }}
            >
              <Card 
                className="cursor-pointer group overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300"
                style={{
                  background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.1) 0%, rgba(245, 158, 11, 0.1) 100%)',
                  border: '1px solid rgba(251, 191, 36, 0.2)'
                }}
                onClick={() => setFilters({ ...filters, status: 'in_progress' })}
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-400 to-orange-500"></div>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <motion.div 
                        className="p-3 rounded-xl shadow-md"
                        style={{
                          background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                        }}
                        animate={{ rotate: [0, 10, -10, 0] }}
                        transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                      >
                        <Activity className="w-6 h-6 text-white" />
                  </motion.div>
                  <div>
                        <p 
                          className="text-3xl font-bold mb-1 bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent"
                        >
                          {analytics.inProgressRequests}
                        </p>
                        <p 
                          className="text-sm font-medium"
                          style={{ color: 'var(--text-muted)' }}
                        >
                          In Progress
                        </p>
                  </div>
                    </div>
                    <motion.div
                      initial={{ opacity: 0, scale: 0 }}
                      whileHover={{ opacity: 1, scale: 1 }}
                      transition={{ type: "spring", stiffness: 200 }}
                    >
                      <Timer className="w-5 h-5 text-blue-500" />
                    </motion.div>
                </div>
              </CardContent>
            </Card>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, type: "spring", stiffness: 100 }}
              whileHover={{ y: -5 }}
            >
              <Card 
                className="cursor-pointer group overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300"
                style={{
                  background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(22, 163, 74, 0.1) 100%)',
                  border: '1px solid rgba(34, 197, 94, 0.2)'
                }}
                onClick={() => setFilters({ ...filters, status: 'resolved' })}
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-400 to-emerald-500"></div>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <motion.div 
                        className="p-3 rounded-xl shadow-md"
                        style={{
                          background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                        }}
                        whileHover={{ scale: 1.1 }}
                        transition={{ type: "spring", stiffness: 300 }}
                      >
                        <CheckCircle className="w-6 h-6 text-white" />
                  </motion.div>
                  <div>
                        <p 
                          className="text-3xl font-bold mb-1 bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent"
                        >
                          {analytics.resolvedRequests}
                        </p>
                        <p 
                          className="text-sm font-medium"
                          style={{ color: 'var(--text-muted)' }}
                        >
                          Resolved
                        </p>
                  </div>
                    </div>
                    <motion.div
                      initial={{ opacity: 0, scale: 0 }}
                      whileHover={{ opacity: 1, scale: 1 }}
                      transition={{ type: "spring", stiffness: 200 }}
                    >
                      <Award className="w-5 h-5 text-green-500" />
                    </motion.div>
                </div>
              </CardContent>
            </Card>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, type: "spring", stiffness: 100 }}
              whileHover={{ y: -5 }}
            >
              <Card 
                className="cursor-pointer group overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300"
                style={{
                  background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(124, 58, 237, 0.1) 100%)',
                  border: '1px solid rgba(139, 92, 246, 0.2)'
                }}
                onClick={() => setFilters({ ...filters, status: '' })}
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-400 to-violet-500"></div>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <motion.div 
                        className="p-3 rounded-xl shadow-md"
                        style={{
                          background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                        }}
                        whileHover={{ rotate: 360 }}
                        transition={{ duration: 0.6 }}
                      >
                        <FileText className="w-6 h-6 text-white" />
                  </motion.div>
                  <div>
                        <p 
                          className="text-3xl font-bold mb-1 bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent"
                        >
                          {analytics.totalRequests}
                        </p>
                        <p 
                          className="text-sm font-medium"
                          style={{ color: 'var(--text-muted)' }}
                        >
                          Total Requests
                        </p>
                  </div>
                    </div>
                    <motion.div
                      initial={{ opacity: 0, scale: 0 }}
                      whileHover={{ opacity: 1, scale: 1 }}
                      transition={{ type: "spring", stiffness: 200 }}
                    >
                      <Target className="w-5 h-5 text-purple-500" />
                    </motion.div>
                </div>
              </CardContent>
            </Card>
            </motion.div>
          </div>
        </motion.div>

        {/* Enhanced Filters & Controls */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card 
            className="mb-6"
            style={{
              background: 'var(--card-bg)',
              borderColor: 'var(--card-border)',
              boxShadow: 'var(--shadow-md)'
            }}
          >
          <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
                <div className="flex items-center gap-4">
                  <h3 
                    className="text-lg font-semibold"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    Filters & Controls
                  </h3>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowFilters(!showFilters)}
                      className="flex items-center gap-2"
                      style={{
                        background: 'var(--bg-tertiary)',
                        borderColor: 'var(--border-primary)',
                        color: 'var(--text-primary)'
                      }}
                    >
                      <FilterIcon className="w-4 h-4" />
                      <span>Advanced</span>
                      {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Label 
                      htmlFor="view-mode"
                      className="text-sm font-medium"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      View:
                    </Label>
                    <select
                      id="view-mode"
                      value={viewMode}
                      onChange={(e) => setViewMode(e.target.value)}
                      className="px-3 py-1 text-sm rounded-md border"
                      style={{
                        background: 'var(--bg-tertiary)',
                        borderColor: 'var(--border-primary)',
                        color: 'var(--text-primary)'
                      }}
                    >
                      <option value="grid">Grid</option>
                      <option value="list">List</option>
                      <option value="kanban">Kanban</option>
                    </select>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Label 
                      htmlFor="sort-by"
                      className="text-sm font-medium"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      Sort:
                    </Label>
                    <select
                      id="sort-by"
                      value={filters.sortBy}
                      onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
                      className="px-3 py-1 text-sm rounded-md border"
                      style={{
                        background: 'var(--bg-tertiary)',
                        borderColor: 'var(--border-primary)',
                        color: 'var(--text-primary)'
                      }}
                    >
                      <option value="created_at">Date Created</option>
                      <option value="title">Title</option>
                      <option value="status">Status</option>
                      <option value="priority_id">Priority</option>
                    </select>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setFilters({ 
                        ...filters, 
                        sortOrder: filters.sortOrder === 'asc' ? 'desc' : 'asc' 
                      })}
                      className="p-1"
                      style={{
                        background: 'var(--bg-tertiary)',
                        borderColor: 'var(--border-primary)',
                        color: 'var(--text-primary)'
                      }}
                    >
                      <SortAsc className={`w-4 h-4 ${filters.sortOrder === 'desc' ? 'rotate-180' : ''}`} />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Basic Filters */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                  <Label 
                    htmlFor="status-filter"
                    className="text-sm font-medium mb-2 block"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    Status
                  </Label>
                <select
                  id="status-filter"
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                    className="w-full p-3 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    style={{
                      background: 'var(--bg-tertiary)',
                      borderColor: 'var(--border-primary)',
                      color: 'var(--text-primary)'
                    }}
                >
                  <option value="">All Statuses</option>
                  <option value="open">Open</option>
                    <option value="assigned">Assigned</option>
                  <option value="in_progress">In Progress</option>
                  <option value="pending_user">Pending User</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              
              <div>
                  <Label 
                    htmlFor="category-filter"
                    className="text-sm font-medium mb-2 block"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    Category
                  </Label>
                <select
                  id="category-filter"
                  value={filters.category_id}
                  onChange={(e) => setFilters({ ...filters, category_id: e.target.value })}
                    className="w-full p-3 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    style={{
                      background: 'var(--bg-tertiary)',
                      borderColor: 'var(--border-primary)',
                      color: 'var(--text-primary)'
                    }}
                >
                  <option value="">All Categories</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>{category.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                  <Label 
                    htmlFor="priority-filter"
                    className="text-sm font-medium mb-2 block"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    Priority
                  </Label>
                <select
                  id="priority-filter"
                  value={filters.priority_id}
                  onChange={(e) => setFilters({ ...filters, priority_id: e.target.value })}
                    className="w-full p-3 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    style={{
                      background: 'var(--bg-tertiary)',
                      borderColor: 'var(--border-primary)',
                      color: 'var(--text-primary)'
                    }}
                >
                  <option value="">All Priorities</option>
                  {priorities.map(priority => (
                    <option key={priority.id} value={priority.id}>{priority.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                  <Label 
                    htmlFor="search-filter"
                    className="text-sm font-medium mb-2 block"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    Search
                  </Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                <Input
                  id="search-filter"
                  type="text"
                  placeholder="Search requests..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                      className="pl-10"
                      style={{
                        background: 'var(--bg-tertiary)',
                        borderColor: 'var(--border-primary)',
                        color: 'var(--text-primary)'
                      }}
                />
              </div>
            </div>
              </div>

              {/* Advanced Filters */}
              <AnimatePresence>
                {showFilters && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-6 pt-6 border-t"
                    style={{ borderColor: 'var(--border-primary)' }}
                  >
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label 
                          htmlFor="date-range"
                          className="text-sm font-medium mb-2 block"
                          style={{ color: 'var(--text-primary)' }}
                        >
                          Date Range
                        </Label>
                        <select
                          id="date-range"
                          value={filters.dateRange}
                          onChange={(e) => setFilters({ ...filters, dateRange: e.target.value })}
                          className="w-full p-3 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                          style={{
                            background: 'var(--bg-tertiary)',
                            borderColor: 'var(--border-primary)',
                            color: 'var(--text-primary)'
                          }}
                        >
                          <option value="">All Time</option>
                          <option value="1">Last 24 hours</option>
                          <option value="7">Last 7 days</option>
                          <option value="30">Last 30 days</option>
                          <option value="90">Last 3 months</option>
                        </select>
                      </div>
                      
                      {isAdminOrITManager && (
                        <div>
                          <Label 
                            htmlFor="assigned-to"
                            className="text-sm font-medium mb-2 block"
                            style={{ color: 'var(--text-primary)' }}
                          >
                            Assigned To
                          </Label>
                          <select
                            id="assigned-to"
                            value={filters.assignedTo}
                            onChange={(e) => setFilters({ ...filters, assignedTo: e.target.value })}
                            className="w-full p-3 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                            style={{
                              background: 'var(--bg-tertiary)',
                              borderColor: 'var(--border-primary)',
                              color: 'var(--text-primary)'
                            }}
                          >
                            <option value="">All Assignees</option>
                            <option value="unassigned">Unassigned</option>
                            {/* Add user options here */}
                          </select>
                        </div>
                      )}
                      
                      <div className="flex items-end">
                        <Button
                          variant="outline"
                          onClick={() => setFilters({
                            status: '',
                            category_id: '',
                            priority_id: '',
                            search: '',
                            dateRange: '',
                            assignedTo: '',
                            sortBy: 'created_at',
                            sortOrder: 'desc'
                          })}
                          className="w-full"
                          style={{
                            background: 'var(--bg-tertiary)',
                            borderColor: 'var(--border-primary)',
                            color: 'var(--text-primary)'
                          }}
                        >
                          Clear Filters
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
          </CardContent>
        </Card>
        </motion.div>

        {/* Enhanced Requests List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="space-y-6"
        >
          {filteredAndSortedRequests.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 100 }}
            >
              <Card 
                className="text-center py-16 border-0 shadow-xl overflow-hidden relative"
                style={{
                  background: 'linear-gradient(135deg, var(--card-bg) 0%, var(--bg-secondary) 100%)',
                  borderColor: 'var(--card-border)',
                }}
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
                <CardContent className="p-8">
                  <motion.div 
                    className="w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center relative"
                    style={{
                      background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
                      border: '3px solid rgba(102, 126, 234, 0.3)'
                    }}
                    animate={{ 
                      rotate: [0, 10, -10, 0],
                      scale: [1, 1.05, 1]
                    }}
                    transition={{ 
                      duration: 3, 
                      repeat: Infinity, 
                      repeatDelay: 2 
                    }}
                  >
                    <FileText className="w-12 h-12" style={{ color: 'var(--text-muted)' }} />
                  </motion.div>
                  <motion.h3 
                    className="text-2xl md:text-3xl font-bold mb-3 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    No requests found
                  </motion.h3>
                  <motion.p 
                    className="text-lg mb-8 max-w-md mx-auto"
                    style={{ color: 'var(--text-muted)' }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    {filters.search || filters.status || filters.category_id || filters.priority_id
                      ? 'No requests match your current filters. Try adjusting your search criteria.'
                      : 'You haven\'t submitted any IT service requests yet. Get started by creating your first request!'}
                  </motion.p>
                  <motion.div 
                    className="flex flex-col sm:flex-row gap-3 justify-center"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button
                        onClick={() => {
                          setEditingRequest(null);
                          resetForm();
                          setShowForm(true);
                        }}
                        className="flex items-center gap-2 shadow-lg hover:shadow-xl transition-all duration-300"
                        style={{
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          color: 'white',
                          boxShadow: '0 10px 30px rgba(102, 126, 234, 0.4)'
                        }}
                      >
                        <Plus className="w-4 h-4" />
                        <span>Submit Your First Request</span>
                      </Button>
                    </motion.div>
                  {(filters.search || filters.status || filters.category_id || filters.priority_id) && (
                    <Button
                      variant="outline"
                      onClick={() => setFilters({
                        status: '',
                        category_id: '',
                        priority_id: '',
                        search: '',
                        dateRange: '',
                        assignedTo: '',
                        sortBy: 'created_at',
                        sortOrder: 'desc'
                      })}
                      className="flex items-center gap-2"
                      style={{
                        background: 'var(--bg-tertiary)',
                        borderColor: 'var(--border-primary)',
                        color: 'var(--text-primary)'
                      }}
                    >
                      <RefreshCw className="w-4 h-4" />
                      <span>Clear Filters</span>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6">
              {filteredAndSortedRequests.map((request, index) => {
              const sla = getSLAStatus(request);
                const statusColor = getStatusColor(request.status);
                const priorityColor = getPriorityColor(request.priority);
                const StatusIcon = getStatusIcon(request.status);
                const PriorityIcon = getPriorityIcon(request.priority);
                
              return (
                  <motion.div
                    key={request.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05, type: "spring", stiffness: 100 }}
                    whileHover={{ y: -8, scale: 1.01 }}
                    layout
                  >
                    <Card 
                      className="cursor-pointer group overflow-hidden border-0 shadow-md hover:shadow-2xl transition-all duration-300 relative"
                      style={{
                        background: 'var(--card-bg)',
                        border: '1px solid var(--card-border)',
                      }}
                      onClick={() => setSelectedRequest(request)}
                    >
                      {/* Gradient accent bar */}
                      <div 
                        className="absolute top-0 left-0 w-full h-1"
                        style={{
                          background: `linear-gradient(90deg, ${statusColor.bg} 0%, ${priorityColor.bg} 100%)`
                        }}
                      ></div>
                  <CardContent className="p-6 pt-7">
                        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                          {/* Main Content */}
                      <div className="flex-1">
                            {/* Header */}
                            <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
                              <div className="flex items-center gap-3 flex-1">
                                <motion.h3 
                                  className="text-xl font-bold group-hover:text-blue-600 transition-colors duration-200"
                                  style={{ color: 'var(--text-primary)' }}
                                  whileHover={{ x: 5 }}
                                >
                            {request.title}
                          </motion.h3>
                                {request.request_number && (
                                  <motion.span 
                                    className="px-3 py-1 text-xs font-mono rounded-lg font-semibold shadow-sm"
                                    style={{
                                      background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)',
                                      color: 'var(--text-primary)',
                                      border: '1px solid rgba(99, 102, 241, 0.3)'
                                    }}
                                    whileHover={{ scale: 1.05 }}
                                  >
                                    #{request.request_number}
                          </motion.span>
                                )}
                              </div>
                              
                              {/* Status and Priority Badges */}
                              <div className="flex flex-wrap items-center gap-2">
                                <motion.span 
                                  className="px-3 py-1.5 text-sm font-semibold rounded-full flex items-center gap-2 shadow-md"
                                  style={{
                                    background: statusColor.bg,
                                    color: statusColor.text,
                                    border: `1px solid ${statusColor.border}`
                                  }}
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                >
                                  <StatusIcon className="w-4 h-4" />
                                  {request.status.replace('_', ' ').toUpperCase()}
                          </motion.span>
                                
                                <motion.span 
                                  className="px-3 py-1.5 text-sm font-semibold rounded-full flex items-center gap-2 shadow-md"
                                  style={{
                                    background: priorityColor.bg,
                                    color: priorityColor.text,
                                    border: `1px solid ${priorityColor.border}`
                                  }}
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                >
                                  <PriorityIcon className="w-4 h-4" />
                                  {request.priority?.name || 'Unknown'}
                                </motion.span>
                                
                          {sla && (
                                  <motion.span 
                                    className={`px-3 py-1.5 text-sm font-semibold rounded-full flex items-center gap-2 shadow-md ${
                                      sla.status === 'overdue' ? 'bg-gradient-to-r from-red-500 to-red-600 text-white animate-pulse' :
                                      sla.status === 'warning' ? 'bg-gradient-to-r from-yellow-500 to-amber-500 text-white' :
                                      'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
                                    }`}
                                    animate={sla.status === 'overdue' ? { scale: [1, 1.05, 1] } : {}}
                                    transition={{ duration: 2, repeat: Infinity }}
                                  >
                                    <Timer className="w-4 h-4" />
                              {sla.status === 'overdue' ? `Overdue ${sla.hours}h` :
                               sla.status === 'warning' ? `${sla.hours}h left` :
                               `${sla.hours}h left`}
                            </motion.span>
                          )}
                              </div>
                        </div>
                        
                            {/* Description */}
                            <p 
                              className="text-base mb-4 line-clamp-2"
                              style={{ color: 'var(--text-secondary)' }}
                            >
                              {request.description}
                            </p>
                            
                            {/* Meta Information */}
                            <div className="flex flex-wrap items-center gap-4 text-sm mb-4">
                              <span 
                                className="flex items-center gap-2"
                                style={{ color: 'var(--text-muted)' }}
                              >
                            <Tag className="w-4 h-4" />
                                {request.category?.name || 'Unknown Category'}
                          </span>
                              <span 
                                className="flex items-center gap-2"
                                style={{ color: 'var(--text-muted)' }}
                              >
                            <Calendar className="w-4 h-4" />
                            {formatDate(request.created_at)}
                          </span>
                          {request.assigned_to && (
                                <span 
                                  className="flex items-center gap-2"
                                  style={{ color: 'var(--text-muted)' }}
                                >
                                  <User className="w-4 h-4" />
                              Assigned to {request.assignee?.full_name || 'Unknown'}
                            </span>
                          )}
                              {request.attachments && request.attachments.length > 0 && (
                                <span 
                                  className="flex items-center gap-2"
                                  style={{ color: 'var(--text-muted)' }}
                                >
                                  <Paperclip className="w-4 h-4" />
                                  {request.attachments.length} attachment(s)
                                </span>
                              )}
                              {request.comments && request.comments.length > 0 && (
                                <span 
                                  className="flex items-center gap-2"
                                  style={{ color: 'var(--text-muted)' }}
                                >
                                  <MessageCircle className="w-4 h-4" />
                                  {request.comments.length} comment(s)
                            </span>
                          )}
                        </div>

                            {/* Resolution Notes */}
                        {request.resolution_notes && (
                              <div 
                                className="p-4 rounded-lg mb-4"
                                style={{
                                  background: 'var(--bg-tertiary)',
                                  border: '1px solid var(--border-primary)'
                                }}
                              >
                                <p 
                                  className="text-sm"
                                  style={{ color: 'var(--text-primary)' }}
                                >
                              <strong>Response:</strong> {request.resolution_notes}
                            </p>
                          </div>
                        )}
                      </div>
                      
                          {/* Actions */}
                          <div className="flex flex-col sm:flex-row lg:flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedRequest(request);
                                }}
                                className="flex items-center gap-2 w-full transition-all duration-200 hover:shadow-md"
                                style={{
                                  background: 'var(--bg-tertiary)',
                                  borderColor: 'var(--border-primary)',
                                  color: 'var(--text-primary)'
                                }}
                              >
                                <Eye className="w-4 h-4" />
                                <span>View</span>
                              </Button>
                            </motion.div>
                            
                            {request.status === 'open' && request.requester_id === user?.id && (
                          <>
                            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                              <Button
                                variant="outline"
                                size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEdit(request);
                                  }}
                                  className="flex items-center gap-2 w-full transition-all duration-200 hover:shadow-md"
                                  style={{
                                    background: 'var(--bg-tertiary)',
                                    borderColor: 'var(--border-primary)',
                                    color: 'var(--text-primary)'
                                  }}
                                >
                                  <Edit className="w-4 h-4" />
                                  <span>Edit</span>
                              </Button>
                            </motion.div>
                            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                              <Button
                                variant="outline"
                                size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDelete(request.id);
                                  }}
                                  className="flex items-center gap-2 w-full transition-all duration-200 hover:shadow-md text-red-500 hover:text-red-600 hover:bg-red-50"
                                  style={{
                                    background: 'var(--bg-tertiary)',
                                    borderColor: 'var(--border-primary)'
                                  }}
                                >
                                  <Trash2 className="w-4 h-4" />
                                  <span>Delete</span>
                              </Button>
                            </motion.div>
                          </>
                        )}
                            
                            {isAdminOrITManager && (
                              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    // Handle admin actions
                                  }}
                                  className="flex items-center gap-2 w-full transition-all duration-200 hover:shadow-lg"
                                  style={{
                                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                    color: 'white',
                                    border: 'none'
                                  }}
                                >
                                  <Settings className="w-4 h-4" />
                                  <span>Manage</span>
                                </Button>
                              </motion.div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
                  </motion.div>
              );
              })}
        </div>
          )}
        </motion.div>

        {/* Enhanced Request Form Modal */}
        <AnimatePresence>
          {showForm && (
            <motion.div 
              className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setShowForm(false);
                setEditingRequest(null);
                resetForm();
              }}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
                style={{
                  background: 'var(--card-bg)',
                  border: '1px solid var(--card-border)',
                  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
                }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header with gradient */}
                <div 
                  className="p-6 border-b relative overflow-hidden"
                  style={{
                    background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
                    borderColor: 'var(--card-border)'
                  }}
                >
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-500"></div>
                  <div className="flex items-center justify-between relative z-10">
                    <div>
                      <motion.h2 
                        className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }}
                      >
                        {editingRequest ? 'Edit Request' : 'New IT Service Request'}
                      </motion.h2>
                      <motion.p 
                        className="text-sm md:text-base mt-2"
                        style={{ color: 'var(--text-muted)' }}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                      >
                        {editingRequest ? 'Update your request details' : 'Submit a new IT service request with optional attachments and comments'}
                      </motion.p>
                    </div>
                    <motion.div
                      whileHover={{ rotate: 90, scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setShowForm(false);
                          setEditingRequest(null);
                          resetForm();
                        }}
                        className="p-2 rounded-full hover:bg-red-100 transition-colors"
                        style={{
                          background: 'var(--bg-tertiary)',
                          color: 'var(--text-muted)'
                        }}
                      >
                        <XCircle className="w-5 h-5" />
                      </Button>
                    </motion.div>
                  </div>
                </div>
                
                {/* Scrollable content */}
                <div className="overflow-y-auto flex-1 p-6">
                  
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Basic Information */}
                    <motion.div 
                      className="space-y-4"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                    >
                      <div className="flex items-center gap-2 mb-4">
                        <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500">
                          <FileText className="w-4 h-4 text-white" />
                        </div>
                        <h3 
                          className="text-lg font-semibold"
                          style={{ color: 'var(--text-primary)' }}
                        >
                          Basic Information
                        </h3>
                      </div>
                      
                    <div>
                        <Label 
                          htmlFor="title"
                          className="text-sm font-medium mb-2 block"
                          style={{ color: 'var(--text-primary)' }}
                        >
                          Title *
                        </Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        placeholder="Brief description of your request"
                        required
                          className="w-full p-3 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                          style={{
                            background: 'var(--bg-tertiary)',
                            borderColor: 'var(--border-primary)',
                            color: 'var(--text-primary)'
                          }}
                      />
                    </div>
                    
                    <div>
                        <Label 
                          htmlFor="description"
                          className="text-sm font-medium mb-2 block"
                          style={{ color: 'var(--text-primary)' }}
                        >
                          Description *
                        </Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Detailed description of your IT service request"
                        rows={4}
                        required
                          className="w-full p-3 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                          style={{
                            background: 'var(--bg-tertiary)',
                            borderColor: 'var(--border-primary)',
                            color: 'var(--text-primary)'
                          }}
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                          <Label 
                            htmlFor="category"
                            className="text-sm font-medium mb-2 block"
                            style={{ color: 'var(--text-primary)' }}
                          >
                            Category *
                          </Label>
                        <select
                          id="category"
                          value={formData.category_id}
                          onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                          required
                            className="w-full p-3 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                            style={{
                              background: 'var(--bg-tertiary)',
                              borderColor: 'var(--border-primary)',
                              color: 'var(--text-primary)'
                            }}
                        >
                          <option value="">Select Category</option>
                          {categories.map(category => (
                            <option key={category.id} value={category.id}>{category.name}</option>
                          ))}
                        </select>
                      </div>
                      
                      <div>
                          <Label 
                            htmlFor="priority"
                            className="text-sm font-medium mb-2 block"
                            style={{ color: 'var(--text-primary)' }}
                          >
                            Priority *
                          </Label>
                        <select
                          id="priority"
                          value={formData.priority_id}
                          onChange={(e) => setFormData({ ...formData, priority_id: e.target.value })}
                          required
                            className="w-full p-3 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                            style={{
                              background: 'var(--bg-tertiary)',
                              borderColor: 'var(--border-primary)',
                              color: 'var(--text-primary)'
                            }}
                        >
                          <option value="">Select Priority</option>
                          {priorities.map(priority => (
                            <option key={priority.id} value={priority.id}>
                              {priority.name} ({(priority.sla_hours || 72)}h SLA)
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label 
                          htmlFor="assigned_to"
                          className="text-sm font-medium mb-2 block"
                          style={{ color: 'var(--text-primary)' }}
                        >
                          Assign to IT Staff (Optional)
                        </Label>
                        <select
                          id="assigned_to"
                          value={formData.assigned_to}
                          onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
                          className="w-full p-3 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                          style={{
                            background: 'var(--bg-tertiary)',
                            borderColor: 'var(--border-primary)',
                            color: 'var(--text-primary)'
                          }}
                        >
                          <option value="">Select IT Staff Member (Optional)</option>
                          {itStaff.map(staff => (
                            <option key={staff.id} value={staff.id}>
                              {staff.full_name} ({staff.role}) - {staff.department || 'IT'}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      <div>
                        <Label 
                          htmlFor="estimated_date"
                          className="text-sm font-medium mb-2 block"
                          style={{ color: 'var(--text-primary)' }}
                        >
                          Estimated Completion Date (Optional)
                        </Label>
                        <Input
                          id="estimated_date"
                          type="date"
                          value={formData.estimated_completion_date}
                          onChange={(e) => setFormData({ ...formData, estimated_completion_date: e.target.value })}
                          className="w-full p-3 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                          style={{
                            background: 'var(--bg-tertiary)',
                            borderColor: 'var(--border-primary)',
                            color: 'var(--text-primary)'
                          }}
                        />
                      </div>
                    </div>
                    
                    </motion.div>
                    
                    {/* File Attachments */}
                    <motion.div 
                      className="space-y-4"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                    >
                      <div className="flex items-center gap-2 mb-4">
                        <div className="p-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500">
                          <Paperclip className="w-4 h-4 text-white" />
                        </div>
                        <h3 
                          className="text-lg font-semibold"
                          style={{ color: 'var(--text-primary)' }}
                        >
                          File Attachments (Optional)
                        </h3>
                      </div>
                      
                      <motion.div 
                        className="border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 hover:border-blue-500 hover:bg-blue-50/50"
                        style={{
                          borderColor: 'var(--border-primary)',
                          background: 'var(--bg-tertiary)'
                        }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <input
                          type="file"
                          multiple
                          onChange={(e) => handleFileUpload(Array.from(e.target.files))}
                          className="hidden"
                          id="file-upload"
                          accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif,.zip,.rar"
                        />
                        <label
                          htmlFor="file-upload"
                          className="cursor-pointer flex flex-col items-center gap-3"
                        >
                          <div 
                            className="p-3 rounded-full"
                            style={{
                              background: 'var(--accent-primary)',
                              color: 'white'
                            }}
                          >
                            <Upload className="w-6 h-6" />
                          </div>
                          <div>
                            <p 
                              className="text-sm font-medium"
                              style={{ color: 'var(--text-primary)' }}
                            >
                              Click to upload files or drag and drop
                            </p>
                            <p 
                              className="text-xs"
                              style={{ color: 'var(--text-muted)' }}
                            >
                              PDF, DOC, images, or archives (max 10MB each)
                            </p>
                          </div>
                        </label>
                      </motion.div>
                      
                      {/* Attached Files */}
                      {attachments.length > 0 && (
                        <motion.div 
                          className="space-y-2"
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          transition={{ duration: 0.3 }}
                        >
                          <h4 
                            className="text-sm font-medium"
                            style={{ color: 'var(--text-primary)' }}
                          >
                            Attached Files ({attachments.length})
                          </h4>
                          <div className="space-y-2">
                            {attachments.map((file, idx) => (
                              <motion.div
                                key={file.id}
                                className="flex items-center justify-between p-3 rounded-lg hover:shadow-md transition-all duration-200"
                                style={{
                                  background: 'var(--bg-secondary)',
                                  border: '1px solid var(--border-primary)'
                                }}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                whileHover={{ x: 5 }}
                              >
                                <div className="flex items-center gap-3">
                                  <Paperclip className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                                  <div>
                                    <p 
                                      className="text-sm font-medium"
                                      style={{ color: 'var(--text-primary)' }}
                                    >
                                      {file.name}
                                    </p>
                                    <p 
                                      className="text-xs"
                                      style={{ color: 'var(--text-muted)' }}
                                    >
                                      {(file.size / 1024 / 1024).toFixed(2)} MB
                                    </p>
                                  </div>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeAttachment(file.id)}
                                  className="p-1 text-red-500 hover:text-red-600"
                                >
                                  <XCircle className="w-4 h-4" />
                                </Button>
                              </motion.div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </motion.div>

                    {/* Comments */}
                    <motion.div 
                      className="space-y-4"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                    >
                      <div className="flex items-center gap-2 mb-4">
                        <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500">
                          <MessageCircle className="w-4 h-4 text-white" />
                        </div>
                        <h3 
                          className="text-lg font-semibold"
                          style={{ color: 'var(--text-primary)' }}
                        >
                          Additional Comments (Optional)
                        </h3>
                      </div>
                      
                      <div>
                        <Textarea
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          placeholder="Add any additional information or context..."
                          rows={3}
                          className="w-full p-3 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                          style={{
                            background: 'var(--bg-tertiary)',
                            borderColor: 'var(--border-primary)',
                            color: 'var(--text-primary)'
                          }}
                        />
                      </div>
                      
                      {comments.length > 0 && (
                        <div className="space-y-2">
                          <h4 
                            className="text-sm font-medium"
                            style={{ color: 'var(--text-primary)' }}
                          >
                            Comments ({comments.length})
                          </h4>
                          <div className="space-y-2">
                            {comments.map((comment) => (
                              <div
                                key={comment.id}
                                className="p-3 rounded-lg"
                                style={{
                                  background: 'var(--bg-secondary)',
                                  border: '1px solid var(--border-primary)'
                                }}
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <p 
                                    className="text-sm font-medium"
                                    style={{ color: 'var(--text-primary)' }}
                                  >
                                    {comment.author}
                                  </p>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeComment(comment.id)}
                                    className="p-1 text-red-500 hover:text-red-600"
                                  >
                                    <XCircle className="w-3 h-3" />
                                  </Button>
                                </div>
                                <p 
                                  className="text-sm"
                                  style={{ color: 'var(--text-secondary)' }}
                                >
                                  {comment.text}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Form Actions */}
                    <motion.div 
                      className="flex justify-end gap-3 pt-6 border-t sticky bottom-0 bg-white dark:bg-gray-900 pb-0"
                      style={{ borderColor: 'var(--border-primary)' }}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6 }}
                    >
                      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setShowForm(false);
                            setEditingRequest(null);
                            resetForm();
                          }}
                          className="px-6 py-3 transition-all duration-200 hover:shadow-md"
                          style={{
                            background: 'var(--bg-tertiary)',
                            borderColor: 'var(--border-primary)',
                            color: 'var(--text-primary)'
                          }}
                        >
                          Cancel
                        </Button>
                      </motion.div>
                      <motion.div 
                        whileHover={{ scale: 1.05 }} 
                        whileTap={{ scale: 0.95 }}
                      >
                        <Button 
                          type="submit"
                          className="px-6 py-3 shadow-lg hover:shadow-xl transition-all duration-300"
                          style={{
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            color: 'white',
                            boxShadow: '0 10px 30px rgba(102, 126, 234, 0.4)'
                          }}
                        >
                          {editingRequest ? 'Update Request' : 'Submit Request'}
                        </Button>
                      </motion.div>
                    </motion.div>
                  </form>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Request Detail Modal */}
        <AnimatePresence>
          {selectedRequest && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
                style={{
                  background: 'var(--card-bg)',
                  border: '1px solid var(--card-border)',
                  boxShadow: 'var(--shadow-xl)'
                }}
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 
                        className="text-2xl font-bold"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        Request Details
                      </h2>
                      <p 
                        className="text-sm mt-1"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        {selectedRequest.request_number || `Request #${selectedRequest.id}`}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedRequest(null)}
                      className="p-2"
                      style={{
                        background: 'var(--bg-tertiary)',
                        color: 'var(--text-muted)'
                      }}
                    >
                      <XCircle className="w-5 h-5" />
                    </Button>
                  </div>
                  
                  <div className="space-y-6">
                    {/* Request Information */}
                    <div className="space-y-4">
                      <h3 
                        className="text-lg font-semibold"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        {selectedRequest.title}
                      </h3>
                      <p 
                        className="text-base"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        {selectedRequest.description}
                      </p>
                    </div>
                    
                    {/* Status and Priority */}
                    <div className="flex flex-wrap gap-3">
                      <span 
                        className="px-3 py-1 text-sm font-medium rounded-full flex items-center gap-2"
                        style={{
                          background: getStatusColor(selectedRequest.status).bg,
                          color: getStatusColor(selectedRequest.status).text,
                          border: `1px solid ${getStatusColor(selectedRequest.status).border}`
                        }}
                      >
                        {React.createElement(getStatusIcon(selectedRequest.status), { className: "w-4 h-4" })}
                        {selectedRequest.status.replace('_', ' ').toUpperCase()}
                      </span>
                      
                      <span 
                        className="px-3 py-1 text-sm font-medium rounded-full flex items-center gap-2"
                        style={{
                          background: getPriorityColor(selectedRequest.priority).bg,
                          color: getPriorityColor(selectedRequest.priority).text,
                          border: `1px solid ${getPriorityColor(selectedRequest.priority).border}`
                        }}
                      >
                        {React.createElement(getPriorityIcon(selectedRequest.priority), { className: "w-4 h-4" })}
                        {selectedRequest.priority?.name || 'Unknown'}
                      </span>
                    </div>
                    
                    {/* Meta Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label 
                          className="text-sm font-medium mb-2 block"
                          style={{ color: 'var(--text-primary)' }}
                        >
                          Category
                        </Label>
                        <p 
                          className="text-sm"
                          style={{ color: 'var(--text-secondary)' }}
                        >
                          {selectedRequest.category?.name || 'Unknown'}
                        </p>
                      </div>
                      <div>
                        <Label 
                          className="text-sm font-medium mb-2 block"
                          style={{ color: 'var(--text-primary)' }}
                        >
                          Created Date
                        </Label>
                        <p 
                          className="text-sm"
                          style={{ color: 'var(--text-secondary)' }}
                        >
                          {formatDate(selectedRequest.created_at)}
                        </p>
                      </div>
                      {selectedRequest.assigned_to && (
                        <div>
                          <Label 
                            className="text-sm font-medium mb-2 block"
                            style={{ color: 'var(--text-primary)' }}
                          >
                            Assigned To
                          </Label>
                          <p 
                            className="text-sm"
                            style={{ color: 'var(--text-secondary)' }}
                          >
                            {selectedRequest.assignee?.full_name || 'Unknown'}
                          </p>
                        </div>
                      )}
                      {selectedRequest.estimated_completion_date && (
                        <div>
                          <Label 
                            className="text-sm font-medium mb-2 block"
                            style={{ color: 'var(--text-primary)' }}
                          >
                            Estimated Completion
                          </Label>
                          <p 
                            className="text-sm"
                            style={{ color: 'var(--text-secondary)' }}
                          >
                            {new Date(selectedRequest.estimated_completion_date).toLocaleDateString()}
                          </p>
                        </div>
                      )}
                    </div>
                    
                    {/* Resolution Notes */}
                    {selectedRequest.resolution_notes && (
                      <div 
                        className="p-4 rounded-lg"
                        style={{
                          background: 'var(--bg-tertiary)',
                          border: '1px solid var(--border-primary)'
                        }}
                      >
                        <h4 
                          className="text-sm font-medium mb-2"
                          style={{ color: 'var(--text-primary)' }}
                        >
                          Resolution Notes
                        </h4>
                        <p 
                          className="text-sm"
                          style={{ color: 'var(--text-secondary)' }}
                        >
                          {selectedRequest.resolution_notes}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Analytics Modal */}
        <AnimatePresence>
          {showAnalytics && (
            <ITAnalytics onClose={() => setShowAnalytics(false)} />
          )}
        </AnimatePresence>
      </div>
    </div>
    </MobileOptimized>
  );
};

export default ITRequests;
