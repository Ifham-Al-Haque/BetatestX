import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
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
import { useNotifications } from '../context/NotificationContext';
import { itServicesApi } from '../services/itServicesApiFixed';
import udriveAccessService from '../services/udriveAccessService';
import { supabase } from '../supabaseClient';
import { Card, CardContent, CardHeader } from '../components/ui/card';
import Button from '../components/ui/button';
import EnhancedButton from '../components/ui/EnhancedButton';
import Input from '../components/ui/input';
import Label from '../components/ui/label';
import Textarea from '../components/ui/textarea';
import activityService from '../services/activityService';
import PaginationControls from '../components/ui/PaginationControls';
import { safeMotion, fadeUp } from '../utils/motion';
import { TableSkeleton } from '../components/LoadingSkeleton';
import ITRequestFormModal from '../components/it-services/ITRequestFormModal';
import { getCategoryIcon, formatDescriptionWithSubcategory, parseSubcategoryFromDescription, stripSubcategoryPrefix } from '../constants/itServiceCategories';
import { resolveItRequestRequesterId } from '../services/unifiedNotify';

// Priority colors and icons
const priorityConfig = {
  'Critical': { color: '#DC2626', bgColor: '#FEE2E2', icon: AlertTriangle },
  'High': { color: '#EA580C', bgColor: '#FED7AA', icon: Flag },
  'Medium': { color: '#D97706', bgColor: '#FEF3C7', icon: Clock },
  'Low': { color: '#65A30D', bgColor: '#DCFCE7', icon: Timer },
  'Planning': { color: '#6B7280', bgColor: '#F3F4F6', icon: Calendar }
};

// Status colors and icons (covers all DB status values)
const statusConfig = {
  'open': { color: '#3B82F6', bgColor: '#DBEAFE', icon: FileText, label: 'Open' },
  'assigned': { color: '#0EA5E9', bgColor: '#E0F2FE', icon: User, label: 'Assigned' },
  'in_progress': { color: '#F59E0B', bgColor: '#FEF3C7', icon: Clock, label: 'In Progress' },
  'pending_approval': { color: '#8B5CF6', bgColor: '#EDE9FE', icon: AlertCircle, label: 'Pending Approval' },
  'pending_user': { color: '#8B5CF6', bgColor: '#EDE9FE', icon: User, label: 'Pending User' },
  'resolved': { color: '#10B981', bgColor: '#D1FAE5', icon: CheckCircle, label: 'Resolved' },
  'closed': { color: '#6B7280', bgColor: '#F3F4F6', icon: Archive, label: 'Closed' },
  'cancelled': { color: '#EF4444', bgColor: '#FEE2E2', icon: XCircle, label: 'Cancelled' }
};

const ITRequestsEnhanced = () => {
  const { user, userProfile } = useAuth();
  const { success, error: showError } = useToast();
  const prefersReducedMotion = useReducedMotion();
  const { addNotification } = useNotifications();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // UI state
  const [activeSection, setActiveSection] = useState('requests'); // 'requests' | 'udrive-access'
  const [showForm, setShowForm] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showStats, setShowStats] = useState(true);
  const [editingRequest, setEditingRequest] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [viewMode, setViewMode] = useState('grid'); // grid, list, kanban
  const [requestPage, setRequestPage] = useState(1);
  const [accessPage, setAccessPage] = useState(1);
  const REQUEST_PAGE_SIZE = 12;
  const ACCESS_PAGE_SIZE = 10;

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
    request_type: 'it_service',
    subcategory: ''
  });

  const [formSubmitting, setFormSubmitting] = useState(false);
  const [searchInput, setSearchInput] = useState('');

  // Debounce search input → filters.search (smoother typing)
  useEffect(() => {
    const t = setTimeout(() => {
      setFilters((prev) => (prev.search === searchInput ? prev : { ...prev, search: searchInput }));
    }, 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  // Open form when navigated from IT Services hub (?new=1)
  useEffect(() => {
    if (searchParams.get('new') === '1') {
      setShowForm(true);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // Statistics - now calculated via useMemo, no longer need state

  // Extract stable values to prevent infinite loops - use primitive values directly
  // This prevents object reference changes from causing re-renders
  const userId = user?.id ?? null;
  const uhubUserId = userProfile?.id ?? null;
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
    uhubUserId,
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
    uhubUserId,
    userRole
  ]);

  // Memoize query function to prevent recreation on every render
  const fetchRequests = useCallback(async () => {
    const data = await itServicesApi.requests.getAll(memoizedFilters, userId, userRole, uhubUserId);
    return data || [];
  }, [memoizedFilters, userId, userRole, uhubUserId]);

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
    setFormSubmitting(true);
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      let requesterId = editingRequest?.requester_id;
      if (!requesterId) {
        requesterId =
          uhubUserId ||
          (authUser?.id ? await resolveItRequestRequesterId(authUser.id) : null) ||
          user?.id;
      }
      if (!requesterId && !editingRequest) {
        showError('Cannot create request', 'You must be logged in to raise a ticket. Please sign in and try again.');
        setFormSubmitting(false);
        return;
      }
      const requestData = {
        ...formData,
        description: formatDescriptionWithSubcategory(formData.subcategory, formData.description),
        requester_id: requesterId
      };
      delete requestData.subcategory;

      if (editingRequest) {
        await itServicesApi.requests.update(editingRequest.id, requestData);
        await activityService.logResourceUpdate('it_request', editingRequest.id, editingRequest, requestData);
        success('Request updated successfully');
      } else {
        const newRequest = await itServicesApi.requests.create(requestData);
        await activityService.logResourceCreate('it_request', newRequest.id, requestData);
        // Show in-app notification immediately (broadcast often doesn't deliver to same client)
        addNotification({
          id: `it_request_created_${newRequest.id}_${Date.now()}`,
          type: 'it_request',
          title: 'IT Request Submitted',
          message: `Your IT request has been submitted: ${newRequest.title}`,
          priority: 'medium',
          data: {
            request_id: newRequest.id,
            request_title: newRequest.title,
            request_number: newRequest.request_number,
            status: newRequest.status
          },
          timestamp: new Date(),
          read: false
        }, { autoDismiss: false, preserveId: true, playSound: true });
        success('Request created successfully');
      }
      
      setShowForm(false);
      setEditingRequest(null);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ['itRequests'] });
    } catch (error) {
      console.error('Error saving request:', error);
      showError('Failed to save request', error.message);
    } finally {
      setFormSubmitting(false);
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
      request_type: 'it_service',
      subcategory: ''
    });
  };

  const getPriorityConfig = (priority) => {
    return priorityConfig[priority?.name] || priorityConfig['Medium'];
  };

  const getStatusConfig = (status) => {
    return statusConfig[status] || statusConfig['open'];
  };

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getSLAStatus = (request) => {
    if (!request?.priority || !request?.created_at) return null;
    try {
      const created = new Date(request.created_at);
      const now = new Date();
      const hoursElapsed = (now - created) / (1000 * 60 * 60);
      const slaHours = request.priority.sla_hours || 72;
      if (hoursElapsed > slaHours) {
        return { status: 'overdue', hours: Math.floor(hoursElapsed - slaHours) };
      }
      if (hoursElapsed > slaHours * 0.8) {
        return { status: 'warning', hours: Math.floor(slaHours - hoursElapsed) };
      }
      return { status: 'ok', hours: Math.floor(slaHours - hoursElapsed) };
    } catch {
      return null;
    }
  };

  const renderRequestCard = (request, index) => {
    const category = request.category || categories.find(c => c.id === request.category_id);
    const priority = request.priority || priorities.find(p => p.id === request.priority_id);
    const CategoryIcon = getCategoryIcon(category);
    const priorityCfg = getPriorityConfig(priority);
    const statusConfigItem = getStatusConfig(request.status);
    const StatusIcon = statusConfigItem.icon;
    const requesterName = request.requester?.full_name || request.requester?.email || null;
    const sla = getSLAStatus(request);

    return (
      <motion.div
        key={request.id}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: prefersReducedMotion ? 0 : Math.min(index * 0.05, 0.35) }}
        whileHover={safeMotion(prefersReducedMotion, { y: -4, transition: { duration: 0.2 } }, {})}
        className="group"
      >
        <Card
          className="h-full shadow-sm hover:shadow-lg transition-all duration-300 border overflow-hidden rounded-xl cursor-pointer"
          style={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)' }}
          onClick={() => setSelectedRequest(request)}
        >
          <div className="h-1 w-full" style={{ backgroundColor: priorityCfg.color }} />
          <CardContent className="p-5 md:p-6">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-3 min-w-0">
                <div className="p-2 rounded-lg flex-shrink-0" style={{ backgroundColor: `${category?.color || '#14b8a6'}20` }}>
                  <CategoryIcon className="w-5 h-5" style={{ color: category?.color || '#14b8a6' }} />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold truncate transition-colors" style={{ color: 'var(--text-primary)' }}>
                    {request.title}
                  </h3>
                  <p className="text-sm font-mono" style={{ color: 'var(--text-muted)' }}>
                    {request.request_number}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="sm" onClick={() => setSelectedRequest(request)} aria-label="View details">
                  <Eye className="w-4 h-4" />
                </Button>
                {(isAdminOrManager || request.requester_id === userId) && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const parsed = parseSubcategoryFromDescription(request.description);
                        setEditingRequest(request);
                        setFormData({
                          title: request.title,
                          description: parsed.body,
                          category_id: request.category_id,
                          priority_id: request.priority_id,
                          request_type: request.request_type,
                          subcategory: parsed.subcategory
                        });
                        setShowForm(true);
                      }}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(request.id)} className="text-red-500 hover:text-red-600">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </>
                )}
              </div>
            </div>
            <p className="text-sm mb-3 line-clamp-2" style={{ color: 'var(--text-secondary)' }}>
              {stripSubcategoryPrefix(request.description)}
            </p>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span
                className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium"
                style={{ backgroundColor: statusConfigItem.bgColor, color: statusConfigItem.color }}
              >
                <StatusIcon className="w-3 h-3" />
                {statusConfigItem.label}
              </span>
              <span
                className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium"
                style={{ backgroundColor: priorityCfg.bgColor, color: priorityCfg.color }}
              >
                {(() => {
                  const PriorityIcon = priorityCfg.icon;
                  return <PriorityIcon className="w-3 h-3" />;
                })()}
                {priority?.name}
              </span>
              {sla && (
                <span
                  className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                    sla.status === 'overdue' ? 'bg-red-500 text-white' :
                    sla.status === 'warning' ? 'bg-amber-500 text-white' :
                    'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                  }`}
                >
                  {sla.status === 'overdue' ? `Overdue ${sla.hours}h` : `${sla.hours}h left`}
                </span>
              )}
              {category?.name && (
                <span
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium"
                  style={{ background: 'var(--bg-tertiary)', color: 'var(--text-muted)' }}
                >
                  <Tag className="w-3 h-3" />
                  {category.name}
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs" style={{ color: 'var(--text-muted)' }}>
              {requesterName && (
                <span className="flex items-center gap-1">
                  <User className="w-3 h-3" />
                  {requesterName}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {formatDate(request.created_at)}
              </span>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  const renderRequestList = () => (
    <div className="rounded-xl border overflow-hidden" style={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)' }}>
      <div className="overflow-x-auto max-h-[68vh] overflow-y-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-10">
            <tr style={{ background: 'var(--bg-tertiary)', borderBottom: '1px solid var(--border-primary)' }}>
              <th className="text-left py-3 px-4 font-semibold" style={{ color: 'var(--text-muted)' }}>Request</th>
              <th className="text-left py-3 px-4 font-semibold" style={{ color: 'var(--text-muted)' }}>Status</th>
              <th className="text-left py-3 px-4 font-semibold" style={{ color: 'var(--text-muted)' }}>Priority</th>
              <th className="text-left py-3 px-4 font-semibold" style={{ color: 'var(--text-muted)' }}>Date</th>
              <th className="w-10" />
            </tr>
          </thead>
          <tbody>
            {pagedRequests.map((request, index) => {
              const statusConfigItem = getStatusConfig(request.status);
              const priority = request.priority || priorities.find(p => p.id === request.priority_id);
              const priorityCfg = getPriorityConfig(priority);
              const StatusIcon = statusConfigItem.icon;
              const PriorityIcon = priorityCfg.icon;
              return (
                <motion.tr
                  key={request.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.02 }}
                  className="border-b cursor-pointer transition-colors"
                  style={{ borderColor: 'var(--border-primary)' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-tertiary)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                  onClick={() => setSelectedRequest(request)}
                >
                  <td className="py-3 px-4">
                    <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{request.title}</span>
                    {request.request_number && (
                      <span className="ml-2 text-xs font-mono" style={{ color: 'var(--text-muted)' }}>{request.request_number}</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium"
                      style={{ backgroundColor: statusConfigItem.bgColor, color: statusConfigItem.color }}
                    >
                      <StatusIcon className="w-3.5 h-3.5" />
                      {statusConfigItem.label}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium"
                      style={{ backgroundColor: priorityCfg.bgColor, color: priorityCfg.color }}
                    >
                      <PriorityIcon className="w-3.5 h-3.5" />
                      {priority?.name || '—'}
                    </span>
                  </td>
                  <td className="py-3 px-4" style={{ color: 'var(--text-muted)' }}>{formatDate(request.created_at)}</td>
                  <td className="py-3 px-2">
                    <Button variant="ghost" size="sm" className="p-1.5" onClick={(e) => { e.stopPropagation(); setSelectedRequest(request); }}>
                      <Eye className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                    </Button>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );

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

  useEffect(() => {
    setRequestPage(1);
  }, [filters, activeSection, viewMode]);

  useEffect(() => {
    setAccessPage(1);
  }, [udriveAccessRecords, activeSection]);

  const requestTotalPages = Math.max(1, Math.ceil(filteredRequests.length / REQUEST_PAGE_SIZE));
  const requestCurrentPage = Math.min(requestPage, requestTotalPages);
  const pagedRequests = useMemo(() => {
    const start = (requestCurrentPage - 1) * REQUEST_PAGE_SIZE;
    return filteredRequests.slice(start, start + REQUEST_PAGE_SIZE);
  }, [filteredRequests, requestCurrentPage]);

  const accessTotalPages = Math.max(1, Math.ceil(udriveAccessRecords.length / ACCESS_PAGE_SIZE));
  const accessCurrentPage = Math.min(accessPage, accessTotalPages);
  const pagedAccessRecords = useMemo(() => {
    const start = (accessCurrentPage - 1) * ACCESS_PAGE_SIZE;
    return udriveAccessRecords.slice(start, start + ACCESS_PAGE_SIZE);
  }, [udriveAccessRecords, accessCurrentPage]);

  const closeFormModal = () => {
    setShowForm(false);
    setEditingRequest(null);
    resetForm();
  };

  const closeDetailModal = () => setSelectedRequest(null);

  return (
    <div
      className="min-h-screen p-4 md:p-6 transition-colors duration-300"
      style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div {...fadeUp(0)} className="mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
            <div className="flex items-center gap-4">
              <motion.div
                className="p-3.5 rounded-2xl"
                style={{
                  background: 'linear-gradient(135deg, #14b8a6 0%, #0891b2 100%)',
                  boxShadow: '0 4px 14px rgba(20, 184, 166, 0.35)'
                }}
                whileHover={safeMotion(prefersReducedMotion, { scale: 1.03 }, {})}
              >
                <Wrench className="w-7 h-7 text-white" />
              </motion.div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                  IT Services Panel
                </h1>
                <p className="text-sm md:text-base mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  {activeSection === 'requests'
                    ? 'Manage and track your IT service requests'
                    : 'UDRIVE ACCESS — platforms, departments, amounts'}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {activeSection === 'requests' && (
                <>
                  <EnhancedButton
                    onClick={handleRefresh}
                    disabled={refreshing}
                    variant="secondary"
                    size="sm"
                    className="flex items-center gap-2 rounded-xl"
                    style={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)', color: 'var(--text-primary)' }}
                  >
                    <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                    Refresh
                  </EnhancedButton>
                  <EnhancedButton
                    onClick={() => setShowStats(!showStats)}
                    variant="secondary"
                    size="sm"
                    className="flex items-center gap-2 rounded-xl"
                    style={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)', color: 'var(--text-primary)' }}
                  >
                    <BarChart3 className="w-4 h-4" />
                    {showStats ? 'Hide' : 'Show'} Stats
                  </EnhancedButton>
                  <EnhancedButton
                    onClick={() => setShowForm(true)}
                    className="flex items-center gap-2 rounded-xl text-white border-0"
                    style={{ background: 'linear-gradient(135deg, #14b8a6 0%, #0891b2 100%)' }}
                  >
                    <Plus className="w-4 h-4" />
                    New Request
                  </EnhancedButton>
                </>
              )}
              {activeSection === 'udrive-access' && (
                <>
                  <EnhancedButton
                    onClick={fetchUdriveAccessRecords}
                    disabled={udriveAccessLoading}
                    variant="secondary"
                    size="sm"
                    className="flex items-center gap-2 rounded-xl"
                    style={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)', color: 'var(--text-primary)' }}
                  >
                    <RefreshCw className={`w-4 h-4 ${udriveAccessLoading ? 'animate-spin' : ''}`} />
                    Refresh
                  </EnhancedButton>
                  <EnhancedButton
                    onClick={() => {
                      setUdriveAccessEditingRecord(null);
                      setUdriveAccessFormData({ access_platform_name: '', platform_purpose: '', department_uses: '', infrastructure_level: '', original_amount: '', amount_in_aed: '', remark: '' });
                      setUdriveAccessShowForm(true);
                    }}
                    className="flex items-center gap-2 rounded-xl text-white border-0"
                    style={{ background: 'linear-gradient(135deg, #14b8a6 0%, #059669 100%)' }}
                  >
                    <Plus className="w-4 h-4" />
                    Add Row
                  </EnhancedButton>
                </>
              )}
            </div>
          </div>

          {/* Section tabs */}
          <div
            className="inline-flex rounded-xl border overflow-hidden p-0.5"
            style={{ background: 'var(--bg-tertiary)', borderColor: 'var(--border-primary)' }}
          >
            <button
              type="button"
              onClick={() => setActiveSection('requests')}
              className="px-4 py-2 text-sm font-medium transition-all flex items-center gap-2 rounded-lg"
              style={{
                background: activeSection === 'requests' ? 'var(--accent-primary)' : 'transparent',
                color: activeSection === 'requests' ? 'white' : 'var(--text-secondary)'
              }}
            >
              <FileText className="w-4 h-4" />
              IT Requests
            </button>
            <button
              type="button"
              onClick={() => setActiveSection('udrive-access')}
              className="px-4 py-2 text-sm font-medium transition-all flex items-center gap-2 rounded-lg"
              style={{
                background: activeSection === 'udrive-access' ? 'var(--accent-primary)' : 'transparent',
                color: activeSection === 'udrive-access' ? 'white' : 'var(--text-secondary)'
              }}
            >
              <Key className="w-4 h-4" />
              UDRIVE ACCESS
            </button>
          </div>
        </motion.div>

        {activeSection === 'requests' && (
          <>
        {/* Clickable stat cards */}
        <AnimatePresence>
          {showStats && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="grid grid-cols-2 lg:grid-cols-5 gap-3 md:gap-4 mb-6"
            >
              {[
                { key: 'open', label: 'Open', value: stats.open, icon: AlertCircle, color: 'var(--accent-primary)', filter: 'open' },
                { key: 'in_progress', label: 'In Progress', value: stats.inProgress, icon: Activity, color: 'var(--accent-warning)', filter: 'in_progress' },
                { key: 'resolved', label: 'Resolved', value: stats.resolved, icon: CheckCircle, color: 'var(--accent-success)', filter: 'resolved' },
                { key: 'pending', label: 'Pending User', value: stats.pending, icon: User, color: 'var(--accent-secondary)', filter: 'pending_user' },
                { key: 'total', label: 'Total', value: stats.total, icon: FileText, color: 'var(--accent-info)', filter: '' },
              ].map((stat, i) => {
                const isActive = stat.filter ? filters.status === stat.filter : !filters.status;
                const Icon = stat.icon;
                return (
                  <motion.div
                    key={stat.key}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <motion.div
                      className={`rounded-xl cursor-pointer transition-all duration-200 border-2 ${isActive ? 'ring-2 ring-offset-2' : ''}`}
                      style={{
                        background: 'var(--card-bg)',
                        borderColor: isActive ? stat.color : 'var(--card-border)',
                        boxShadow: isActive ? '0 4px 14px rgba(0,0,0,0.08)' : 'var(--shadow-sm)'
                      }}
                      whileHover={safeMotion(prefersReducedMotion, { y: -2 }, {})}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => setFilters((f) => ({
                        ...f,
                        status: stat.filter ? (f.status === stat.filter ? '' : stat.filter) : ''
                      }))}
                    >
                      <div className="p-4 flex items-center gap-3">
                        <div className="p-2.5 rounded-lg" style={{ background: stat.color }}>
                          <Icon className="w-5 h-5 text-white" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xl font-bold tabular-nums" style={{ color: 'var(--text-primary)' }}>{stat.value}</p>
                          <p className="text-xs font-medium truncate" style={{ color: 'var(--text-muted)' }}>{stat.label}</p>
                        </div>
                      </div>
                    </motion.div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Filters toolbar */}
        <motion.div {...fadeUp(0.08)} className="mb-5">
          <div
            className="rounded-xl border p-4 md:p-5"
            style={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)' }}
          >
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>View</span>
                  <div
                    className="inline-flex p-0.5 rounded-lg border"
                    style={{ background: 'var(--bg-tertiary)', borderColor: 'var(--border-primary)' }}
                  >
                    {['grid', 'list'].map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setViewMode(mode)}
                        className="px-3 py-1.5 text-sm font-medium rounded-md capitalize transition-all"
                        style={{
                          background: viewMode === mode ? 'var(--accent-primary)' : 'transparent',
                          color: viewMode === mode ? 'white' : 'var(--text-secondary)'
                        }}
                      >
                        {mode}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowFilters(!showFilters)}
                    className="flex items-center gap-1.5 text-sm font-medium rounded-lg px-2.5 py-1.5"
                    style={{
                      background: showFilters ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
                      color: showFilters ? 'white' : 'var(--text-secondary)',
                      border: '1px solid var(--border-primary)'
                    }}
                  >
                    <FilterIcon className="w-4 h-4" />
                    Filters
                    {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
                <select
                  value={`${filters.sortBy}-${filters.sortOrder}`}
                  onChange={(e) => {
                    const [sortBy, sortOrder] = e.target.value.split('-');
                    setFilters({ ...filters, sortBy, sortOrder });
                  }}
                  className="text-sm rounded-lg border px-3 py-2"
                  style={{
                    background: 'var(--bg-tertiary)',
                    borderColor: 'var(--border-primary)',
                    color: 'var(--text-primary)'
                  }}
                >
                  <option value="created_at-desc">Newest First</option>
                  <option value="created_at-asc">Oldest First</option>
                  <option value="title-asc">Title A-Z</option>
                  <option value="title-desc">Title Z-A</option>
                </select>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 pointer-events-none" style={{ color: 'var(--text-muted)' }} />
                <Input
                  type="text"
                  placeholder="Search requests by title or description..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="pl-10 h-11"
                  style={{
                    background: 'var(--bg-tertiary)',
                    borderColor: 'var(--border-primary)',
                    color: 'var(--text-primary)'
                  }}
                />
              </div>

              <AnimatePresence>
                {showFilters && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t"
                    style={{ borderColor: 'var(--border-primary)' }}
                  >
                    <div>
                      <Label htmlFor="status-filter">Status</Label>
                      <select
                        id="status-filter"
                        value={filters.status}
                        onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border mt-1"
                        style={{ background: 'var(--bg-tertiary)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}
                      >
                        <option value="">All Statuses</option>
                        <option value="open">Open</option>
                        <option value="assigned">Assigned</option>
                        <option value="in_progress">In Progress</option>
                        <option value="pending_approval">Pending Approval</option>
                        <option value="pending_user">Pending User</option>
                        <option value="resolved">Resolved</option>
                        <option value="closed">Closed</option>
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="category-filter">Category</Label>
                      <select
                        id="category-filter"
                        value={filters.category_id}
                        onChange={(e) => setFilters({ ...filters, category_id: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border mt-1"
                        style={{ background: 'var(--bg-tertiary)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}
                      >
                        <option value="">All Categories</option>
                        {categories.map(category => (
                          <option key={category.id} value={category.id}>{category.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="priority-filter">Priority</Label>
                      <select
                        id="priority-filter"
                        value={filters.priority_id}
                        onChange={(e) => setFilters({ ...filters, priority_id: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border mt-1"
                        style={{ background: 'var(--bg-tertiary)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}
                      >
                        <option value="">All Priorities</option>
                        {priorities.map(priority => (
                          <option key={priority.id} value={priority.id}>{priority.name}</option>
                        ))}
                      </select>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>

        {/* Requests */}
        {loading ? (
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6' : ''}>
            {Array.from({ length: viewMode === 'grid' ? 6 : 1 }).map((_, i) => (
              viewMode === 'list' ? (
                <TableSkeleton key={`skeleton-${i}`} rows={8} columns={5} />
              ) : (
                <motion.div
                  key={`skeleton-${i}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="rounded-xl border overflow-hidden"
                  style={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)' }}
                >
                  <div className="p-6 space-y-4">
                    <div className="h-4 w-48 rounded animate-pulse" style={{ background: 'var(--bg-tertiary)' }} />
                    <div className="h-3 w-full rounded animate-pulse" style={{ background: 'var(--bg-tertiary)' }} />
                    <div className="h-3 w-2/3 rounded animate-pulse" style={{ background: 'var(--bg-tertiary)' }} />
                  </div>
                </motion.div>
              )
            ))}
          </div>
        ) : viewMode === 'list' ? (
          renderRequestList()
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {pagedRequests.map((request, index) => renderRequestCard(request, index))}
          </div>
        )}
        <PaginationControls
          page={requestCurrentPage}
          totalPages={requestTotalPages}
          totalItems={filteredRequests.length}
          pageSize={REQUEST_PAGE_SIZE}
          onPageChange={setRequestPage}
        />

        {/* Empty State */}
        {!loading && filteredRequests.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-14 px-4 rounded-xl border mt-4"
            style={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)' }}
          >
            <div
              className="mx-auto w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
              style={{ background: 'linear-gradient(135deg, #14b8a6 0%, #0891b2 100%)' }}
            >
              <Wrench className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
              No requests found
            </h3>
            <p className="text-sm mb-6 max-w-sm mx-auto" style={{ color: 'var(--text-muted)' }}>
              {filters.search || filters.status || filters.category_id || filters.priority_id
                ? 'Try adjusting your filters or search to see more results.'
                : 'Create your first IT request and we\'ll get back to you soon.'}
            </p>
            <Button
              onClick={() => setShowForm(true)}
              className="text-white border-0"
              style={{ background: 'linear-gradient(135deg, #14b8a6 0%, #0891b2 100%)' }}
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
            <div className="rounded-xl border p-6" style={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)' }}>
              <div className="flex items-center gap-4 mb-6">
                <div
                  className="p-3 rounded-xl"
                  style={{ background: 'linear-gradient(135deg, rgba(20,184,166,0.15) 0%, rgba(8,145,178,0.15) 100%)', border: '1px solid var(--border-primary)' }}
                >
                  <Key className="w-8 h-8" style={{ color: '#14b8a6' }} />
                </div>
                <div>
                  <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>UDRIVE ACCESS</h2>
                  <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>Access / Platform Name, Purpose, Department, Infrastructure, Amounts & Remark</p>
                </div>
              </div>

              {udriveAccessLoading ? (
                <TableSkeleton rows={6} columns={8} />
              ) : (
                <>
                  <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-600 max-h-[70vh] overflow-y-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-600 sticky top-0 z-10">
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
                          pagedAccessRecords.map((row) => (
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
                  <PaginationControls
                    page={accessCurrentPage}
                    totalPages={accessTotalPages}
                    totalItems={udriveAccessRecords.length}
                    pageSize={ACCESS_PAGE_SIZE}
                    onPageChange={setAccessPage}
                    className="px-1"
                  />
                </>
              )}
            </div>
          </div>
        )}
      </div>

      <ITRequestFormModal
        open={showForm}
        onClose={closeFormModal}
        editingRequest={editingRequest}
        formData={formData}
        setFormData={setFormData}
        categories={categories}
        priorities={priorities}
        formSubmitting={formSubmitting}
        onSubmit={handleSubmit}
      />

      {/* Request Details Modal */}
      <AnimatePresence>
        {selectedRequest && (
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={closeDetailModal}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
              style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}
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
                    onClick={closeDetailModal}
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
                    {(() => {
                      const parsed = parseSubcategoryFromDescription(selectedRequest.description);
                      return (
                        <>
                          {parsed.subcategory && (
                            <span
                              className="inline-flex mb-2 px-2.5 py-1 rounded-full text-xs font-medium"
                              style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}
                            >
                              {parsed.subcategory}
                            </span>
                          )}
                          <p className="text-gray-600 dark:text-gray-300 whitespace-pre-wrap">
                            {parsed.body || selectedRequest.description}
                          </p>
                        </>
                      );
                    })()}
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

                    {(selectedRequest.requester?.full_name || selectedRequest.requester?.email) && (
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white mb-2">Requester</h4>
                        <p className="text-gray-600 dark:text-gray-300">
                          {selectedRequest.requester?.full_name || selectedRequest.requester?.email}
                          {selectedRequest.requester?.department && (
                            <span className="text-gray-500 dark:text-gray-400 text-sm"> · {selectedRequest.requester.department}</span>
                          )}
                        </p>
                      </div>
                    )}

                    {selectedRequest.resolution_notes && (
                      <div className="md:col-span-2">
                        <h4 className="font-medium text-gray-900 dark:text-white mb-2">Resolution notes</h4>
                        <p className="text-gray-600 dark:text-gray-300 whitespace-pre-wrap">
                          {selectedRequest.resolution_notes}
                        </p>
                      </div>
                    )}
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
