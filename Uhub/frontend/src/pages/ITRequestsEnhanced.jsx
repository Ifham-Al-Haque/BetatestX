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
  Users, Timer, Target, Award, Activity, Globe,
  Monitor, Wifi, Key, Mail, Phone, Printer, Shield,
  HardDrive, HelpCircle, Laptop, Code, Database
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useTheme } from '../context/ThemeContext';
import { itServicesApi } from '../services/itServicesApiFixed';
import { supabase } from '../supabaseClient';
import { Card, CardContent, CardHeader } from '../components/ui/card';
import Button from '../components/ui/button';
import Input from '../components/ui/input';
import Label from '../components/ui/label';
import Textarea from '../components/ui/textarea';
import LoadingSpinner from '../components/LoadingSpinner';
import activityService from '../services/activityService';

// Icon mapping for categories
const categoryIcons = {
  'hardware': Monitor,
  'software': Code,
  'network': Wifi,
  'access': Key,
  'email': Mail,
  'phone': Phone,
  'printer': Printer,
  'security': Shield,
  'backup': HardDrive,
  'other': HelpCircle,
  'monitor': Monitor,
  'download': Download,
  'wifi': Wifi,
  'key': Key,
  'mail': Mail,
  'printer': Printer,
  'shield': Shield,
  'hard-drive': HardDrive,
  'help-circle': HelpCircle
};

// Priority colors and icons
const priorityConfig = {
  'Critical': { color: '#DC2626', bgColor: '#FEE2E2', icon: AlertTriangle },
  'High': { color: '#EA580C', bgColor: '#FED7AA', icon: Flag },
  'Medium': { color: '#D97706', bgColor: '#FEF3C7', icon: Clock },
  'Low': { color: '#65A30D', bgColor: '#DCFCE7', icon: Timer },
  'Planning': { color: '#6B7280', bgColor: '#F3F4F6', icon: Calendar }
};

// Status colors and icons
const statusConfig = {
  'open': { color: '#3B82F6', bgColor: '#DBEAFE', icon: FileText, label: 'Open' },
  'in_progress': { color: '#F59E0B', bgColor: '#FEF3C7', icon: Clock, label: 'In Progress' },
  'pending_user': { color: '#8B5CF6', bgColor: '#EDE9FE', icon: User, label: 'Pending User' },
  'resolved': { color: '#10B981', bgColor: '#D1FAE5', icon: CheckCircle, label: 'Resolved' },
  'closed': { color: '#6B7280', bgColor: '#F3F4F6', icon: Archive, label: 'Closed' },
  'cancelled': { color: '#EF4444', bgColor: '#FEE2E2', icon: XCircle, label: 'Cancelled' }
};

const ITRequestsEnhanced = () => {
  const { user, userProfile } = useAuth();
  const { success, error: showError } = useToast();
  const { isDark } = useTheme();
  
  // Core state
  const [requests, setRequests] = useState([]);
  const [categories, setCategories] = useState([]);
  const [priorities, setPriorities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // UI state
  const [showForm, setShowForm] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showStats, setShowStats] = useState(true);
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
    sortBy: 'created_at',
    sortOrder: 'desc'
  });

  // Enhanced form data
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category_id: '',
    priority_id: '',
    request_type: 'it_service'
  });

  // Statistics
  const [stats, setStats] = useState({
    total: 0,
    open: 0,
    inProgress: 0,
    resolved: 0,
    pending: 0
  });

  const isAdminOrManager = userProfile?.role === 'admin' || userProfile?.role === 'hr_manager';

  useEffect(() => {
    fetchData();
  }, [filters]);

  // Fetch data when user or userProfile changes
  useEffect(() => {
    if (user && userProfile) {
      fetchData();
    }
  }, [user, userProfile]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Get the current authenticated user for RLS compliance
      const { data: { user: authUser } } = await supabase.auth.getUser();
      console.log('Auth user:', authUser?.id, 'Profile role:', userProfile?.role);
      
      console.log('Fetching data with filters:', filters);
      
      const [requestsData, categoriesData, prioritiesData] = await Promise.all([
        itServicesApi.requests.getAll(filters, authUser?.id, userProfile?.role),
        itServicesApi.categories.getAll(),
        itServicesApi.priorities.getAll()
      ]);
      
      console.log('Data fetched:', {
        requests: requestsData?.length || 0,
        categories: categoriesData?.length || 0,
        priorities: prioritiesData?.length || 0
      });

      // Ensure we always have arrays
      const safeRequestsData = Array.isArray(requestsData) ? requestsData : [];
      const safeCategoriesData = Array.isArray(categoriesData) ? categoriesData : [];
      const safePrioritiesData = Array.isArray(prioritiesData) ? prioritiesData : [];
      
      setRequests(safeRequestsData);
      setCategories(safeCategoriesData);
      setPriorities(safePrioritiesData);
      
      // Calculate stats with safe array
      const requestStats = {
        total: safeRequestsData.length,
        open: safeRequestsData.filter(r => r?.status === 'open').length,
        inProgress: safeRequestsData.filter(r => r?.status === 'in_progress').length,
        resolved: safeRequestsData.filter(r => r?.status === 'resolved').length,
        pending: safeRequestsData.filter(r => r?.status === 'pending_user').length
      };
      setStats(requestStats);
      
    } catch (error) {
      console.error('Error fetching data:', error);
      showError('Failed to load data', error.message);
      
      // Ensure state is properly initialized even on error
      setRequests([]);
      setCategories([]);
      setPriorities([]);
      setStats({
        total: 0,
        open: 0,
        inProgress: 0,
        resolved: 0,
        pending: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
    success('Data refreshed successfully');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // Get the current authenticated user
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      const requestData = {
        ...formData,
        requester_id: authUser?.id // Use Supabase auth user ID for RLS compliance
      };

      if (editingRequest) {
        await itServicesApi.requests.update(editingRequest.id, requestData);
        await activityService.logResourceUpdate('it_request', editingRequest.id, editingRequest, requestData);
        success('Request updated successfully');
      } else {
        const newRequest = await itServicesApi.requests.create(requestData);
        await activityService.logResourceCreate('it_request', newRequest.id, requestData);
        success('Request created successfully');
      }
      
      setShowForm(false);
      setEditingRequest(null);
      resetForm();
      fetchData();
    } catch (error) {
      console.error('Error saving request:', error);
      showError('Failed to save request', error.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this request?')) return;
    
    try {
      console.log('Deleting request with ID:', id);
      const request = requests.find(r => r.id === id);
      console.log('Found request to delete:', request);
      
      // Try to delete from database
      const deleteResult = await itServicesApi.requests.delete(id);
      console.log('Delete result:', deleteResult);
      
      if (deleteResult) {
        // Only remove from UI state if deletion was successful
        setRequests(prevRequests => prevRequests.filter(r => r.id !== id));
        console.log('Request removed from UI state');
        
        // Log activity
        try {
          await activityService.logResourceDelete('it_request', id, request);
          console.log('Activity logged');
        } catch (activityError) {
          console.warn('Failed to log activity:', activityError);
          // Don't fail the deletion if activity logging fails
        }
        
        success('Request deleted successfully');
      } else {
        throw new Error('Delete operation returned false');
      }
      
    } catch (error) {
      console.error('Error deleting request:', error);
      
      // Check if it's an RLS permission error
      if (error.message?.includes('permission') || error.message?.includes('RLS') || error.code === 'PGRST301') {
        showError('Permission denied', 'You do not have permission to delete this request. Please contact your administrator.');
      } else {
        showError('Failed to delete request', error.message);
      }
      
      // Refresh data to show current state
      fetchData();
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      category_id: '',
      priority_id: '',
      request_type: 'it_service'
    });
  };

  const getCategoryIcon = (category) => {
    const IconComponent = categoryIcons[category?.icon] || HelpCircle;
    return IconComponent;
  };

  const getPriorityConfig = (priority) => {
    return priorityConfig[priority?.name] || priorityConfig['Medium'];
  };

  const getStatusConfig = (status) => {
    return statusConfig[status] || statusConfig['open'];
  };

  const filteredRequests = useMemo(() => {
    // Ensure requests is always an array
    if (!Array.isArray(requests)) {
      return [];
    }

    let filtered = [...requests]; // Create a copy to avoid mutating original array

    if (filters.search) {
      filtered = filtered.filter(request =>
        request?.title?.toLowerCase().includes(filters.search.toLowerCase()) ||
        request?.description?.toLowerCase().includes(filters.search.toLowerCase())
      );
    }

    if (filters.status) {
      filtered = filtered.filter(request => request?.status === filters.status);
    }

    if (filters.category_id) {
      filtered = filtered.filter(request => request?.category_id === filters.category_id);
    }

    if (filters.priority_id) {
      filtered = filtered.filter(request => request?.priority_id === filters.priority_id);
    }

    // Sort with null checks
    filtered.sort((a, b) => {
      const aVal = a?.[filters.sortBy];
      const bVal = b?.[filters.sortBy];
      const multiplier = filters.sortOrder === 'asc' ? 1 : -1;
      
      // Handle null/undefined values
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return 1 * multiplier;
      if (bVal == null) return -1 * multiplier;
      
      if (aVal < bVal) return -1 * multiplier;
      if (aVal > bVal) return 1 * multiplier;
      return 0;
    });

    return filtered;
  }, [requests, filters]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-indigo-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-lg border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl">
                <Wrench className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  IT Service Requests
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Manage and track your IT service requests
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Button
                onClick={handleRefresh}
                disabled={refreshing}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              
              <Button
                onClick={() => setShowStats(!showStats)}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <BarChart3 className="w-4 h-4" />
                {showStats ? 'Hide' : 'Show'} Stats
              </Button>
              
              <Button
                onClick={() => setShowForm(true)}
                className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
              >
                <Plus className="w-4 h-4" />
                New Request
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Statistics Cards */}
        <AnimatePresence>
          {showStats && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8"
            >
              <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-100 text-sm font-medium">Total Requests</p>
                      <p className="text-3xl font-bold">{stats.total}</p>
                    </div>
                    <FileText className="w-8 h-8 text-blue-200" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white border-0">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-orange-100 text-sm font-medium">Open</p>
                      <p className="text-3xl font-bold">{stats.open}</p>
                    </div>
                    <AlertCircle className="w-8 h-8 text-orange-200" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white border-0">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-yellow-100 text-sm font-medium">In Progress</p>
                      <p className="text-3xl font-bold">{stats.inProgress}</p>
                    </div>
                    <Clock className="w-8 h-8 text-yellow-200" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white border-0">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-100 text-sm font-medium">Resolved</p>
                      <p className="text-3xl font-bold">{stats.resolved}</p>
                    </div>
                    <CheckCircle className="w-8 h-8 text-green-200" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white border-0">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-100 text-sm font-medium">Pending User</p>
                      <p className="text-3xl font-bold">{stats.pending}</p>
                    </div>
                    <User className="w-8 h-8 text-purple-200" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Filters and Search */}
        <Card className="mb-8 bg-white dark:bg-gray-800 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Filters & Search
              </h3>
              <Button
                onClick={() => setShowFilters(!showFilters)}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <FilterIcon className="w-4 h-4" />
                {showFilters ? 'Hide Filters' : 'Show Filters'}
              </Button>
            </div>

            {/* Search Bar */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="text"
                placeholder="Search requests by title or description..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="pl-10 h-12 text-lg"
              />
            </div>

            {/* Advanced Filters */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
                >
                  <div>
                    <Label htmlFor="status-filter">Status</Label>
                    <select
                      id="status-filter"
                      value={filters.status}
                      onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    >
                      <option value="">All Statuses</option>
                      <option value="open">Open</option>
                      <option value="in_progress">In Progress</option>
                      <option value="pending_user">Pending User</option>
                      <option value="resolved">Resolved</option>
                      <option value="closed">Closed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="category-filter">Category</Label>
                    <select
                      id="category-filter"
                      value={filters.category_id}
                      onChange={(e) => setFilters({ ...filters, category_id: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    >
                      <option value="">All Categories</option>
                      {categories.map(category => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="priority-filter">Priority</Label>
                    <select
                      id="priority-filter"
                      value={filters.priority_id}
                      onChange={(e) => setFilters({ ...filters, priority_id: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    >
                      <option value="">All Priorities</option>
                      {priorities.map(priority => (
                        <option key={priority.id} value={priority.id}>
                          {priority.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="sort-filter">Sort By</Label>
                    <select
                      id="sort-filter"
                      value={`${filters.sortBy}-${filters.sortOrder}`}
                      onChange={(e) => {
                        const [sortBy, sortOrder] = e.target.value.split('-');
                        setFilters({ ...filters, sortBy, sortOrder });
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    >
                      <option value="created_at-desc">Newest First</option>
                      <option value="created_at-asc">Oldest First</option>
                      <option value="title-asc">Title A-Z</option>
                      <option value="title-desc">Title Z-A</option>
                      <option value="status-asc">Status A-Z</option>
                    </select>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>

        {/* Requests Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRequests.map((request) => {
            const category = categories.find(c => c.id === request.category_id);
            const priority = priorities.find(p => p.id === request.priority_id);
            const CategoryIcon = getCategoryIcon(category);
            const priorityConfig = getPriorityConfig(priority);
            const statusConfig = getStatusConfig(request.status);
            const StatusIcon = statusConfig.icon;

            return (
              <motion.div
                key={request.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -5, transition: { duration: 0.2 } }}
                className="group"
              >
                <Card className="h-full bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-all duration-300 border-0 overflow-hidden">
                  {/* Priority Banner */}
                  <div 
                    className="h-1 w-full"
                    style={{ backgroundColor: priorityConfig.color }}
                  />
                  
                  <CardContent className="p-6">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div 
                          className="p-2 rounded-lg"
                          style={{ backgroundColor: category?.color + '20' }}
                        >
                          <CategoryIcon 
                            className="w-5 h-5"
                            style={{ color: category?.color }}
                          />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            {request.title}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {request.request_number}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedRequest(request)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        
                        {(isAdminOrManager || request.requester_id === user?.id) && (
                          <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditingRequest(request);
                                setFormData({
                                  title: request.title,
                                  description: request.description,
                                  category_id: request.category_id,
                                  priority_id: request.priority_id,
                                  request_type: request.request_type
                                });
                                setShowForm(true);
                              }}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(request.id)}
                              className="text-red-500 hover:text-red-600"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-3">
                      {request.description}
                    </p>

                    {/* Tags */}
                    <div className="flex items-center space-x-2 mb-4">
                      <span 
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium"
                        style={{ 
                          backgroundColor: statusConfig.bgColor,
                          color: statusConfig.color 
                        }}
                      >
                        <StatusIcon className="w-3 h-3" />
                        {statusConfig.label}
                      </span>
                      
                      <span 
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium"
                        style={{ 
                          backgroundColor: priorityConfig.bgColor,
                          color: priorityConfig.color 
                        }}
                      >
                        {(() => {
                          const PriorityIcon = priorityConfig.icon;
                          return <PriorityIcon className="w-3 h-3" />;
                        })()}
                        {priority?.name}
                      </span>
                      
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                        <Tag className="w-3 h-3" />
                        {category?.name}
                      </span>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Created: {new Date(request.created_at).toLocaleDateString()}
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(request.created_at).toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Empty State */}
        {filteredRequests.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <div className="mx-auto w-24 h-24 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mb-6">
              <Wrench className="w-12 h-12 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No requests found
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {filters.search || filters.status || filters.category_id || filters.priority_id
                ? "Try adjusting your filters to see more results"
                : "Get started by creating your first IT service request"
              }
            </p>
            <Button
              onClick={() => setShowForm(true)}
              className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create New Request
            </Button>
          </motion.div>
        )}
      </div>

      {/* Request Form Modal */}
      <AnimatePresence>
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                      {editingRequest ? 'Edit Request' : 'New IT Service Request'}
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                      {editingRequest ? 'Update your request details' : 'Submit a new IT service request'}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowForm(false);
                      setEditingRequest(null);
                      resetForm();
                    }}
                    className="p-2"
                  >
                    <XCircle className="w-5 h-5" />
                  </Button>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Title */}
                  <div>
                    <Label htmlFor="title" className="text-sm font-medium mb-2 block">
                      Request Title *
                    </Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      required
                      placeholder="Brief description of your request..."
                      className="h-12"
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <Label htmlFor="description" className="text-sm font-medium mb-2 block">
                      Detailed Description *
                    </Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      required
                      rows={4}
                      placeholder="Provide detailed information about your request, including any specific requirements or context..."
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Category */}
                    <div>
                      <Label htmlFor="category_id" className="text-sm font-medium mb-2 block">
                        Category *
                      </Label>
                      <select
                        id="category_id"
                        value={formData.category_id}
                        onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                        required
                        className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      >
                        <option value="">Select Category</option>
                        {categories.map(category => (
                          <option key={category.id} value={category.id}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Priority */}
                    <div>
                      <Label htmlFor="priority_id" className="text-sm font-medium mb-2 block">
                        Priority *
                      </Label>
                      <select
                        id="priority_id"
                        value={formData.priority_id}
                        onChange={(e) => setFormData({ ...formData, priority_id: e.target.value })}
                        required
                        className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      >
                        <option value="">Select Priority</option>
                        {priorities.map(priority => (
                          <option key={priority.id} value={priority.id}>
                            {priority.name} - {priority.description}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>


                  {/* Form Actions */}
                  <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowForm(false);
                        setEditingRequest(null);
                        resetForm();
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
                    >
                      {editingRequest ? 'Update Request' : 'Submit Request'}
                    </Button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Request Details Modal */}
      <AnimatePresence>
        {selectedRequest && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                      Request Details
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                      {selectedRequest.request_number}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedRequest(null)}
                    className="p-2"
                  >
                    <XCircle className="w-5 h-5" />
                  </Button>
                </div>
                
                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                      {selectedRequest.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300">
                      {selectedRequest.description}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white mb-2">Status</h4>
                      <div className="flex items-center gap-2">
                        {(() => {
                          const statusConfig = getStatusConfig(selectedRequest.status);
                          const StatusIcon = statusConfig.icon;
                          return (
                            <span 
                              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium"
                              style={{ 
                                backgroundColor: statusConfig.bgColor,
                                color: statusConfig.color 
                              }}
                            >
                              <StatusIcon className="w-4 h-4" />
                              {statusConfig.label}
                            </span>
                          );
                        })()}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white mb-2">Priority</h4>
                      <div className="flex items-center gap-2">
                        {(() => {
                          const priority = priorities.find(p => p.id === selectedRequest.priority_id);
                          const priorityConfig = getPriorityConfig(priority);
                          return (
                            <span 
                              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium"
                              style={{ 
                                backgroundColor: priorityConfig.bgColor,
                                color: priorityConfig.color 
                              }}
                            >
                              {(() => {
                                const PriorityIcon = priorityConfig.icon;
                                return <PriorityIcon className="w-4 h-4" />;
                              })()}
                              {priority?.name}
                            </span>
                          );
                        })()}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white mb-2">Category</h4>
                      <div className="flex items-center gap-2">
                        {(() => {
                          const category = categories.find(c => c.id === selectedRequest.category_id);
                          const CategoryIcon = getCategoryIcon(category);
                          return (
                            <span className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                              <CategoryIcon className="w-4 h-4" />
                              {category?.name}
                            </span>
                          );
                        })()}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white mb-2">Created</h4>
                      <p className="text-gray-600 dark:text-gray-300">
                        {new Date(selectedRequest.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>

                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ITRequestsEnhanced;
