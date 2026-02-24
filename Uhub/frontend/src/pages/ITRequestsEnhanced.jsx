import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { 
  Plus, Search, Filter, FileText, Clock, User, 
  AlertCircle, CheckCircle, XCircle, MoreHorizontal,
  Edit, Trash2, Eye, Calendar, Tag, Building,
  Wrench, Settings, AlertTriangle, Paperclip, MessageCircle,
  TrendingUp, BarChart3, Download, Upload, Star,
  ChevronDown, ChevronUp, Filter as FilterIcon, SortAsc,
  RefreshCw, BellRing, Archive, Flag, Zap,
  Users, Timer, Target, Award, Activity, Globe,
  Monitor, Wifi, Key, Mail, Phone, Printer, Shield,
  HardDrive, HelpCircle, Laptop, Code, Database
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useTheme } from '../context/ThemeContext';
import { itServicesApi } from '../services/itServicesApiFixed';
import udriveAccessService from '../services/udriveAccessService';
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
  const queryClient = useQueryClient();
  
  // UI state
  const [activeSection, setActiveSection] = useState('requests'); // 'requests' | 'udrive-access'
  const [showForm, setShowForm] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showStats, setShowStats] = useState(true);
  const [editingRequest, setEditingRequest] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [viewMode, setViewMode] = useState('grid'); // grid, list, kanban

  // UDRIVE ACCESS state
  const [udriveAccessRecords, setUdriveAccessRecords] = useState([]);
  const [udriveAccessLoading, setUdriveAccessLoading] = useState(false);
  const [udriveAccessShowForm, setUdriveAccessShowForm] = useState(false);
  const [udriveAccessEditingRecord, setUdriveAccessEditingRecord] = useState(null);
  const [udriveAccessFormData, setUdriveAccessFormData] = useState({
    access_platform_name: '',
    platform_purpose: '',
    department_uses: '',
    infrastructure_level: '',
    original_amount: '',
    amount_in_aed: '',
    remark: ''
  });
  
  // Enhanced filters - use functional update to prevent reference changes
  const [filters, setFilters] = useState(() => ({
    status: '',
    category_id: '',
    priority_id: '',
    search: '',
    dateRange: '',
    sortBy: 'created_at',
    sortOrder: 'desc'
  }));

  // Enhanced form data
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category_id: '',
    priority_id: '',
    request_type: 'it_service'
  });

  // Statistics - now calculated via useMemo, no longer need state

  // Extract stable values to prevent infinite loops - use primitive values directly
  // This prevents object reference changes from causing re-renders
  const userId = user?.id ?? null;
  const userRole = userProfile?.role ?? null;
  const isAdminOrManager = useMemo(() => 
    userRole === 'admin' || userRole === 'hr_manager', 
    [userRole]
  );

  // Memoize filters object to prevent reference changes - create new object from values
  const memoizedFilters = useMemo(() => ({
    status: filters.status,
    category_id: filters.category_id,
    priority_id: filters.priority_id,
    search: filters.search,
    dateRange: filters.dateRange,
    sortBy: filters.sortBy,
    sortOrder: filters.sortOrder
  }), [
    filters.status,
    filters.category_id,
    filters.priority_id,
    filters.search,
    filters.dateRange,
    filters.sortBy,
    filters.sortOrder
  ]);

  // Memoize query key to prevent infinite loops - use individual filter values instead of object
  const queryKey = useMemo(() => [
    'itRequests',
    memoizedFilters.status,
    memoizedFilters.category_id,
    memoizedFilters.priority_id,
    memoizedFilters.search,
    memoizedFilters.dateRange,
    memoizedFilters.sortBy,
    memoizedFilters.sortOrder,
    userId,
    userRole
  ], [
    memoizedFilters.status,
    memoizedFilters.category_id,
    memoizedFilters.priority_id,
    memoizedFilters.search,
    memoizedFilters.dateRange,
    memoizedFilters.sortBy,
    memoizedFilters.sortOrder,
    userId,
    userRole
  ]);

  // Memoize query function to prevent recreation on every render
  const fetchRequests = useCallback(async () => {
    const data = await itServicesApi.requests.getAll(memoizedFilters, userId, userRole);
    return data || [];
  }, [memoizedFilters, userId, userRole]);

  // React Query hooks for data fetching
  const { data: requestsData, isLoading: requestsLoading, refetch: refetchRequests, isRefetching: isRefetchingRequests } = useQuery({
    queryKey,
    queryFn: fetchRequests,
    enabled: !!userId,
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const { data: categoriesData, isLoading: categoriesLoading } = useQuery({
    queryKey: ['itRequestCategories'],
    queryFn: async () => {
      const data = await itServicesApi.categories.getAll();
      return data || [];
    },
    staleTime: 10 * 60 * 1000, // Categories don't change often
  });

  const { data: prioritiesData, isLoading: prioritiesLoading } = useQuery({
    queryKey: ['itRequestPriorities'],
    queryFn: async () => {
      const data = await itServicesApi.priorities.getAll();
      return data || [];
    },
    staleTime: 10 * 60 * 1000, // Priorities don't change often
  });

  // Extract data from queries - memoize to prevent infinite loops
  const requests = useMemo(() => requestsData || [], [requestsData]);
  const categories = useMemo(() => categoriesData || [], [categoriesData]);
  const priorities = useMemo(() => prioritiesData || [], [prioritiesData]);
  const loading = requestsLoading || categoriesLoading || prioritiesLoading;
  const refreshing = isRefetchingRequests;

  // Calculate stats from requests using useMemo instead of useEffect
  const stats = useMemo(() => {
    if (!requests || !Array.isArray(requests)) {
      return {
        total: 0,
        open: 0,
        inProgress: 0,
        resolved: 0,
        pending: 0
      };
    }
    
    return {
      total: requests.length,
      open: requests.filter(r => r.status === 'open').length,
      inProgress: requests.filter(r => r.status === 'in_progress').length,
      resolved: requests.filter(r => r.status === 'resolved').length,
      pending: requests.filter(r => r.status === 'pending_user').length
    };
  }, [requests]);

  const handleRefresh = async () => {
    try {
      await refetchRequests();
      queryClient.invalidateQueries(['itRequestCategories']);
      queryClient.invalidateQueries(['itRequestPriorities']);
      success('Data refreshed successfully');
    } catch (error) {
      console.error('Error refreshing data:', error);
      showError('Failed to refresh data', error.message);
    }
  };

  // UDRIVE ACCESS: fetch records when section is active
  const fetchUdriveAccessRecords = useCallback(async () => {
    setUdriveAccessLoading(true);
    try {
      const data = await udriveAccessService.getRecords();
      setUdriveAccessRecords(data || []);
    } catch (err) {
      console.error('Error fetching UDRIVE ACCESS records:', err);
      showError('Error', err.message || 'Failed to load UDRIVE ACCESS data');
      setUdriveAccessRecords([]);
    } finally {
      setUdriveAccessLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    if (activeSection === 'udrive-access') fetchUdriveAccessRecords();
  }, [activeSection, fetchUdriveAccessRecords]);

  const resetUdriveAccessForm = () => {
    setUdriveAccessFormData({
      access_platform_name: '',
      platform_purpose: '',
      department_uses: '',
      infrastructure_level: '',
      original_amount: '',
      amount_in_aed: '',
      remark: ''
    });
    setUdriveAccessEditingRecord(null);
    setUdriveAccessShowForm(false);
  };

  const handleUdriveAccessSubmit = async (e) => {
    e.preventDefault();
    try {
      if (udriveAccessEditingRecord) {
        await udriveAccessService.updateRecord(udriveAccessEditingRecord.id, udriveAccessFormData);
        success('Record updated successfully');
      } else {
        await udriveAccessService.createRecord(udriveAccessFormData);
        success('Record added successfully');
      }
      resetUdriveAccessForm();
      fetchUdriveAccessRecords();
    } catch (err) {
      showError('Error', err.message || 'Failed to save record');
    }
  };

  const handleUdriveAccessEdit = (record) => {
    setUdriveAccessEditingRecord(record);
    setUdriveAccessFormData({
      access_platform_name: record.access_platform_name ?? '',
      platform_purpose: record.platform_purpose ?? '',
      department_uses: record.department_uses ?? '',
      infrastructure_level: record.infrastructure_level ?? '',
      original_amount: record.original_amount != null ? String(record.original_amount) : '',
      amount_in_aed: record.amount_in_aed != null ? String(record.amount_in_aed) : '',
      remark: record.remark ?? ''
    });
    setUdriveAccessShowForm(true);
  };

  const handleUdriveAccessDelete = async (id) => {
    if (!window.confirm('Delete this record?')) return;
    try {
      await udriveAccessService.deleteRecord(id);
      success('Record deleted');
      fetchUdriveAccessRecords();
    } catch (err) {
      showError('Error', err.message || 'Failed to delete record');
    }
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
      // Invalidate and refetch queries - use exact query key prefix
      queryClient.invalidateQueries({ queryKey: ['itRequests'] });
    } catch (error) {
      console.error('Error saving request:', error);
      showError('Failed to save request', error.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this request? It will be removed from your view but kept in the system.')) return;
    
    try {
      console.log('Deleting request with ID:', id);
      const request = requests.find(r => r.id === id);
      console.log('Found request to delete:', request);
      
      // Optimistically remove from UI immediately
      queryClient.setQueryData(queryKey, (oldData) => {
        if (!oldData) return oldData;
        return oldData.filter((req) => req.id !== id);
      });
      
      // Try to soft delete from database
      const deleteResult = await itServicesApi.requests.delete(id);
      console.log('Delete result:', deleteResult);
      
      if (deleteResult) {
        // Log activity first
        try {
          await activityService.logResourceDelete('it_request', id, request);
          console.log('Activity logged');
        } catch (activityError) {
          console.warn('Failed to log activity:', activityError);
          // Don't fail the deletion if activity logging fails
        }
        
        // Invalidate queries to refresh data - use exact query key prefix
        queryClient.invalidateQueries({ queryKey: ['itRequests'] });
        console.log('Queries invalidated, data will refresh');
        
        success('Request deleted successfully! It has been removed from your view.');
      } else {
        // Revert optimistic update on failure
        queryClient.invalidateQueries({ queryKey: ['itRequests'] });
        throw new Error('Delete operation returned false');
      }
      
    } catch (error) {
      console.error('Error deleting request:', error);
      
      // Revert optimistic update on error
      queryClient.invalidateQueries({ queryKey: ['itRequests'] });
      
      // Check if it's an RLS permission error
      if (error.message?.includes('permission') || error.message?.includes('RLS') || error.code === 'PGRST301') {
        showError('Permission denied', 'You do not have permission to delete this request. Please contact your administrator.');
      } else {
        showError('Failed to delete request', error.message || 'An unknown error occurred');
      }
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
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 py-4">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl">
                <Wrench className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  IT Services Panel
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {activeSection === 'requests' ? 'Manage and track your IT service requests' : 'UDRIVE ACCESS — platforms, departments, amounts'}
                </p>
              </div>
            </div>

            {/* Section tabs */}
            <div className="flex rounded-lg border border-gray-200 dark:border-gray-600 overflow-hidden bg-gray-50 dark:bg-gray-700">
              <button
                type="button"
                onClick={() => setActiveSection('requests')}
                className={`px-4 py-2 text-sm font-medium transition-all flex items-center gap-2 ${activeSection === 'requests' ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-300 shadow-sm' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
              >
                <FileText className="w-4 h-4" />
                IT Requests
              </button>
              <button
                type="button"
                onClick={() => setActiveSection('udrive-access')}
                className={`px-4 py-2 text-sm font-medium transition-all flex items-center gap-2 ${activeSection === 'udrive-access' ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-300 shadow-sm' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
              >
                <Key className="w-4 h-4" />
                UDRIVE ACCESS
              </button>
            </div>
            
            <div className="flex items-center space-x-3">
              {activeSection === 'requests' && (
                <>
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
                </>
              )}
              {activeSection === 'udrive-access' && (
                <>
                  <Button
                    onClick={fetchUdriveAccessRecords}
                    disabled={udriveAccessLoading}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <RefreshCw className={`w-4 h-4 ${udriveAccessLoading ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                  <Button
                    onClick={() => {
                      setUdriveAccessEditingRecord(null);
                      setUdriveAccessFormData({ access_platform_name: '', platform_purpose: '', department_uses: '', infrastructure_level: '', original_amount: '', amount_in_aed: '', remark: '' });
                      setUdriveAccessShowForm(true);
                    }}
                    className="flex items-center gap-2 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700"
                  >
                    <Plus className="w-4 h-4" />
                    Add Row
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* IT Requests section */}
        {activeSection === 'requests' && (
          <>
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
                        
                        {(isAdminOrManager || request.requester_id === userId) && (
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
          </>
        )}

        {/* UDRIVE ACCESS section */}
        {activeSection === 'udrive-access' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-gradient-to-br from-teal-50 to-emerald-50 dark:from-teal-900/20 dark:to-emerald-900/20 rounded-xl border border-teal-100 dark:border-teal-800">
                  <Key className="w-8 h-8 text-teal-600 dark:text-teal-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">UDRIVE ACCESS</h2>
                  <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">Access / Platform Name, Purpose, Department, Infrastructure, Amounts & Remark</p>
                </div>
              </div>

              {udriveAccessLoading ? (
                <div className="flex items-center justify-center py-12">
                  <LoadingSpinner />
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-600">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-600">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Access / Platform Name</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Platform Purpose</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Department Uses</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Infrastructure Level</th>
                        <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 dark:text-gray-300">Original Amount</th>
                        <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 dark:text-gray-300">Amount in AED</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Remark</th>
                        <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 dark:text-gray-300 w-24">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                      {udriveAccessRecords.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                            No records yet. Click &quot;Add Row&quot; to add one.
                          </td>
                        </tr>
                      ) : (
                        udriveAccessRecords.map((row) => (
                          <tr key={row.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                            <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{row.access_platform_name ?? '—'}</td>
                            <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.platform_purpose ?? '—'}</td>
                            <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.department_uses ?? '—'}</td>
                            <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.infrastructure_level ?? '—'}</td>
                            <td className="px-4 py-3 text-sm text-right text-gray-700 dark:text-gray-300">{row.original_amount != null ? Number(row.original_amount).toLocaleString() : '—'}</td>
                            <td className="px-4 py-3 text-sm text-right text-gray-700 dark:text-gray-300">{row.amount_in_aed != null ? Number(row.amount_in_aed).toLocaleString() : '—'}</td>
                            <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 max-w-xs truncate" title={row.remark ?? ''}>{row.remark ?? '—'}</td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button variant="ghost" size="sm" onClick={() => handleUdriveAccessEdit(row)} className="p-2">
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => handleUdriveAccessDelete(row.id)} className="p-2 text-red-500 hover:text-red-600">
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
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

      {/* UDRIVE ACCESS Form Modal */}
      <AnimatePresence>
        {udriveAccessShowForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    {udriveAccessEditingRecord ? 'Edit UDRIVE ACCESS' : 'Add UDRIVE ACCESS'}
                  </h2>
                  <Button variant="ghost" size="sm" onClick={resetUdriveAccessForm} className="p-2">
                    <XCircle className="w-5 h-5" />
                  </Button>
                </div>
                <form onSubmit={handleUdriveAccessSubmit} className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium">Access / Platform Name</Label>
                    <Input
                      value={udriveAccessFormData.access_platform_name}
                      onChange={(e) => setUdriveAccessFormData({ ...udriveAccessFormData, access_platform_name: e.target.value })}
                      placeholder="e.g. UDrive Portal"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Platform Purpose</Label>
                    <Input
                      value={udriveAccessFormData.platform_purpose}
                      onChange={(e) => setUdriveAccessFormData({ ...udriveAccessFormData, platform_purpose: e.target.value })}
                      placeholder="Purpose of the platform"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Department Uses</Label>
                    <Input
                      value={udriveAccessFormData.department_uses}
                      onChange={(e) => setUdriveAccessFormData({ ...udriveAccessFormData, department_uses: e.target.value })}
                      placeholder="Departments that use it"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Infrastructure Level</Label>
                    <Input
                      value={udriveAccessFormData.infrastructure_level}
                      onChange={(e) => setUdriveAccessFormData({ ...udriveAccessFormData, infrastructure_level: e.target.value })}
                      placeholder="e.g. Production, Staging"
                      className="mt-1"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Original Amount</Label>
                      <Input
                        type="number"
                        step="any"
                        value={udriveAccessFormData.original_amount}
                        onChange={(e) => setUdriveAccessFormData({ ...udriveAccessFormData, original_amount: e.target.value })}
                        placeholder="0"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Amount in AED</Label>
                      <Input
                        type="number"
                        step="any"
                        value={udriveAccessFormData.amount_in_aed}
                        onChange={(e) => setUdriveAccessFormData({ ...udriveAccessFormData, amount_in_aed: e.target.value })}
                        placeholder="0"
                        className="mt-1"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Remark</Label>
                    <Textarea
                      value={udriveAccessFormData.remark}
                      onChange={(e) => setUdriveAccessFormData({ ...udriveAccessFormData, remark: e.target.value })}
                      placeholder="Optional notes"
                      rows={3}
                      className="mt-1"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <Button type="button" variant="outline" onClick={resetUdriveAccessForm}>Cancel</Button>
                    <Button type="submit" className="bg-teal-600 hover:bg-teal-700">
                      {udriveAccessEditingRecord ? 'Update' : 'Add'} Record
                    </Button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ITRequestsEnhanced;
