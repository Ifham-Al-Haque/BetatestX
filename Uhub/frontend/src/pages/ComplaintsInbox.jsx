import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Filter, FileText, Clock, User, 
  AlertTriangle, CheckCircle, XCircle, MoreHorizontal,
  Edit, Trash2, Eye, Calendar, Tag, Building, 
  MessageSquare, Shield, TrendingUp, Activity, Zap,
  BarChart3, Users, CreditCard, AlertCircle, Loader2,
  Inbox, Reply, Archive, Flag, ChevronDown, ChevronUp,
  Filter as FilterIcon, X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useTheme } from '../context/ThemeContext';
import { Card, CardContent, CardHeader } from '../components/ui/card';
import Button from '../components/ui/button';
import Input from '../components/ui/input';
import Label from '../components/ui/label';
import Textarea from '../components/ui/textarea';
import { complaintsApi } from '../services/complaintsApi';

const ComplaintsInbox = () => {
  const { user, userProfile } = useAuth();
  const { success, error: showError } = useToast();
  const { isDark } = useTheme();
  
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [showResponseForm, setShowResponseForm] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    category: '',
    search: ''
  });

  const [responseData, setResponseData] = useState({
    response: '',
    status: '',
    assigned_to: ''
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
    { 
      value: 'low', 
      label: 'Low', 
      color: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800',
      icon: '🟢'
    },
    { 
      value: 'medium', 
      label: 'Medium', 
      color: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800',
      icon: '🟡'
    },
    { 
      value: 'high', 
      label: 'High', 
      color: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800',
      icon: '🟠'
    },
    { 
      value: 'urgent', 
      label: 'Urgent', 
      color: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800',
      icon: '🔴'
    }
  ];

  const statuses = [
    { 
      value: 'open', 
      label: 'Open', 
      color: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800',
      icon: '🔵'
    },
    { 
      value: 'in_progress', 
      label: 'In Progress', 
      color: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800',
      icon: '🟣'
    },
    { 
      value: 'resolved', 
      label: 'Resolved', 
      color: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800',
      icon: '✅'
    },
    { 
      value: 'closed', 
      label: 'Closed', 
      color: 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-800',
      icon: '🔒'
    }
  ];

  useEffect(() => {
    fetchData();
  }, [filters]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch all complaints for HR managers and admins
      const allComplaints = await complaintsApi.getAllComplaintsForHR();
      setComplaints(allComplaints);
    } catch (error) {
      console.error('Error fetching complaints:', error);
      showError('Failed to fetch complaints');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (complaintId, newStatus) => {
    try {
      await complaintsApi.updateComplaintStatus(complaintId, newStatus);
      success('Status Updated', 'Complaint status updated successfully');
      fetchData(); // Refresh the list
    } catch (error) {
      showError('Failed to update complaint status');
    }
  };

  const handleResponseSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedComplaint) {
        // Update complaint with response and status
        await complaintsApi.updateComplaint(selectedComplaint.id, {
          status: responseData.status,
          resolution_notes: responseData.response,
          assigned_to: responseData.assigned_to || user.id,
          assigned_at: new Date().toISOString()
        });
        
        success('Response Submitted', 'Complaint response submitted successfully');
        setShowResponseForm(false);
        setSelectedComplaint(null);
        setResponseData({ response: '', status: '', assigned_to: '' });
        fetchData(); // Refresh the list
      }
    } catch (error) {
      showError('Failed to submit response');
    }
  };

  const getPriorityColor = (priority) => {
    const priorityObj = priorities.find(p => p.value === priority);
    return priorityObj ? priorityObj.color : 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-800';
  };

  const getStatusColor = (status) => {
    const statusObj = statuses.find(s => s.value === status);
    return statusObj ? statusObj.color : 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-800';
  };

  const getPriorityIcon = (priority) => {
    const priorityObj = priorities.find(p => p.value === priority);
    return priorityObj ? priorityObj.icon : '⚪';
  };

  const getStatusIcon = (status) => {
    const statusObj = statuses.find(s => s.value === status);
    return statusObj ? statusObj.icon : '⚪';
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

  const clearFilters = () => {
    setFilters({
      status: '',
      priority: '',
      category: '',
      search: ''
    });
  };

  const hasActiveFilters = Object.values(filters).some(value => value !== '');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-6"></div>
            <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-blue-400 rounded-full animate-spin mx-auto" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
          </div>
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">Loading Complaints</h3>
          <p className="text-gray-500 dark:text-gray-400">Please wait while we fetch your complaints...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* Enhanced Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
            <div className="flex items-center space-x-4 mb-4 sm:mb-0">
              <div className="p-4 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg">
                <Inbox className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                  Complaints Inbox
                </h1>
                <p className="text-gray-600 dark:text-gray-400 text-lg">
                  Manage and respond to employee complaints efficiently
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center space-x-2 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-gray-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800"
              >
                <FilterIcon className="w-4 h-4" />
                <span>Filters</span>
                {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </Button>
              
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  onClick={clearFilters}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20"
                >
                  <X className="w-4 h-4 mr-2" />
                  Clear
                </Button>
              )}
            </div>
          </div>
          
          {/* Enhanced Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl">
                        <AlertTriangle className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="text-3xl font-bold text-gray-900 dark:text-white">
                          {complaints.filter(c => c.status === 'open').length}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Open</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-3 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl">
                        <Clock className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="text-3xl font-bold text-gray-900 dark:text-white">
                          {complaints.filter(c => c.status === 'in_progress').length}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">In Progress</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="w-3 h-3 bg-amber-500 rounded-full animate-pulse"></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-3 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl">
                        <CheckCircle className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="text-3xl font-bold text-gray-900 dark:text-white">
                          {complaints.filter(c => c.status === 'resolved').length}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Resolved</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
            >
              <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-3 bg-gradient-to-br from-red-500 to-pink-600 rounded-xl">
                        <Flag className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="text-3xl font-bold text-gray-900 dark:text-white">
                          {complaints.filter(c => c.priority === 'urgent').length}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Urgent</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </motion.div>

        {/* Enhanced Filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="mb-6 overflow-hidden"
            >
              <Card className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <Label htmlFor="status-filter" className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">
                        Status
                      </Label>
                      <select
                        id="status-filter"
                        value={filters.status}
                        onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                        className="w-full p-3 border border-gray-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-white transition-all duration-200"
                      >
                        <option value="">All Statuses</option>
                        {statuses.map(status => (
                          <option key={status.value} value={status.value}>{status.label}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <Label htmlFor="priority-filter" className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">
                        Priority
                      </Label>
                      <select
                        id="priority-filter"
                        value={filters.priority}
                        onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
                        className="w-full p-3 border border-gray-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-white transition-all duration-200"
                      >
                        <option value="">All Priorities</option>
                        {priorities.map(priority => (
                          <option key={priority.value} value={priority.value}>{priority.label}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <Label htmlFor="category-filter" className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">
                        Category
                      </Label>
                      <select
                        id="category-filter"
                        value={filters.category}
                        onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                        className="w-full p-3 border border-gray-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-white transition-all duration-200"
                      >
                        <option value="">All Categories</option>
                        {categories.map(category => (
                          <option key={category} value={category}>{category}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <Label htmlFor="search-filter" className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">
                        Search
                      </Label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                          id="search-filter"
                          type="text"
                          placeholder="Search complaints..."
                          value={filters.search}
                          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                          className="pl-10 p-3 border border-gray-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-white transition-all duration-200"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Enhanced Complaints List */}
        <div className="space-y-4">
          {complaints.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-16"
            >
              <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-lg">
                <CardContent className="p-12">
                  <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-slate-700 dark:to-slate-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Inbox className="w-12 h-12 text-gray-400 dark:text-gray-500" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">No complaints found</h3>
                  <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                    There are no complaints matching your current filters. Try adjusting your search criteria or check back later.
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            complaints.map((complaint, index) => (
              <motion.div
                key={complaint.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group">
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between space-y-4 lg:space-y-0">
                      <div className="flex-1 space-y-4">
                        {/* Header Row */}
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                              <User className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                {complaint.anonymous ? 'Anonymous Complaint' : complaint.complainant_name}
                              </h3>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                {complaint.anonymous ? 'Anonymous' : 'Employee'}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`px-3 py-1.5 text-xs font-semibold rounded-full border ${getPriorityColor(complaint.priority)} flex items-center space-x-1`}>
                              <span>{getPriorityIcon(complaint.priority)}</span>
                              <span className="capitalize">{complaint.priority}</span>
                            </span>
                            <span className={`px-3 py-1.5 text-xs font-semibold rounded-full border ${getStatusColor(complaint.status)} flex items-center space-x-1`}>
                              <span>{getStatusIcon(complaint.status)}</span>
                              <span className="capitalize">{complaint.status.replace('_', ' ')}</span>
                            </span>
                          </div>
                        </div>
                        
                        {/* Content */}
                        <div className="space-y-3">
                          <h4 className="text-lg font-medium text-gray-800 dark:text-gray-200 leading-relaxed">
                            {complaint.title}
                          </h4>
                          <p className="text-gray-600 dark:text-gray-400 leading-relaxed line-clamp-3">
                            {complaint.description}
                          </p>
                        </div>
                        
                        {/* Metadata */}
                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                          <span className="flex items-center space-x-2 bg-gray-50 dark:bg-slate-700 px-3 py-2 rounded-lg">
                            <Tag className="w-4 h-4" />
                            <span className="font-medium">{complaint.category}</span>
                          </span>
                          <span className="flex items-center space-x-2 bg-gray-50 dark:bg-slate-700 px-3 py-2 rounded-lg">
                            <Calendar className="w-4 h-4" />
                            <span className="font-medium">{formatDate(complaint.created_at)}</span>
                          </span>
                          {complaint.assigned_to && (
                            <span className="flex items-center space-x-2 bg-blue-50 dark:bg-blue-900/20 px-3 py-2 rounded-lg text-blue-700 dark:text-blue-400">
                              <User className="w-4 h-4" />
                              <span className="font-medium">Assigned</span>
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-stretch space-y-2 sm:space-y-0 sm:space-x-2 lg:space-x-0 lg:space-y-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedComplaint(complaint);
                            setResponseData({
                              response: complaint.resolution_notes || '',
                              status: complaint.status,
                              assigned_to: complaint.assigned_to || ''
                            });
                            setShowResponseForm(true);
                          }}
                          className="flex items-center justify-center space-x-2 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-300 hover:text-blue-800 dark:hover:text-blue-200 transition-all duration-200"
                        >
                          <Reply className="w-4 h-4" />
                          <span>Respond</span>
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleStatusUpdate(complaint.id, 'resolved')}
                          disabled={complaint.status === 'resolved'}
                          className="flex items-center justify-center space-x-2 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:hover:bg-emerald-900/30 border-emerald-200 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 hover:text-emerald-800 dark:hover:text-emerald-200 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <CheckCircle className="w-4 h-4" />
                          <span>Resolve</span>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </div>

        {/* Enhanced Response Form Modal */}
        <AnimatePresence>
          {showResponseForm && selectedComplaint && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-slate-700"
              >
                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200 dark:border-slate-700">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
                        <Reply className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Respond to Complaint</h2>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {selectedComplaint.anonymous ? 'Anonymous Complaint' : selectedComplaint.complainant_name}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setShowResponseForm(false);
                        setSelectedComplaint(null);
                        setResponseData({ response: '', status: '', assigned_to: '' });
                      }}
                      className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700"
                    >
                      <XCircle className="w-5 h-5" />
                    </Button>
                  </div>
                  
                  {/* Form */}
                  <form onSubmit={handleResponseSubmit} className="space-y-6">
                    <div>
                      <Label htmlFor="status" className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">
                        Update Status
                      </Label>
                      <select
                        id="status"
                        value={responseData.status}
                        onChange={(e) => setResponseData({ ...responseData, status: e.target.value })}
                        className="w-full p-3 border border-gray-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-white transition-all duration-200"
                        required
                      >
                        {statuses.map(status => (
                          <option key={status.value} value={status.value}>{status.label}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <Label htmlFor="response" className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">
                        Response / Resolution Notes
                      </Label>
                      <Textarea
                        id="response"
                        value={responseData.response}
                        onChange={(e) => setResponseData({ ...responseData, response: e.target.value })}
                        placeholder="Provide a detailed response or resolution notes..."
                        className="mt-1 p-3 border border-gray-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-white transition-all duration-200"
                        rows={4}
                        required
                      />
                    </div>
                    
                    <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-slate-700">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setShowResponseForm(false);
                          setSelectedComplaint(null);
                          setResponseData({ response: '', status: '', assigned_to: '' });
                        }}
                        className="px-6 py-2 border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700"
                      >
                        Cancel
                      </Button>
                      <Button 
                        type="submit"
                        className="px-6 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                      >
                        Submit Response
                      </Button>
                    </div>
                  </form>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ComplaintsInbox;
