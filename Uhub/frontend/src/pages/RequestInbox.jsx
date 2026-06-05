import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { 
  Inbox, Users, Clock, AlertTriangle, CheckCircle, XCircle, 
  MoreHorizontal, Edit, Trash2, Eye, Calendar, Tag, Building,
  Wrench, Settings, AlertCircle, Activity, Archive, User,
  TrendingUp, BarChart3, Download, Upload, Star, Filter,
  ChevronDown, ChevronUp, SortAsc, RefreshCw, Bell, BellRing,
  Timer, Target, Award, MessageCircle, Paperclip, Globe,
  Zap, Flag, HelpCircle, Search
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { itServicesApi } from '../services/itServicesApi';
import { supabase } from '../supabaseClient';
import { Card, CardContent, CardHeader } from '../components/ui/card';
import Button from '../components/ui/button';
import EnhancedButton from '../components/ui/EnhancedButton';
import Input from '../components/ui/input';
import Label from '../components/ui/label';
import Textarea from '../components/ui/textarea';
import LoadingSpinner from '../components/LoadingSpinner';
import ITAnalytics from '../components/ITAnalytics';
import { CardSkeleton, TableSkeleton } from '../components/LoadingSkeleton';
import PaginationControls from '../components/ui/PaginationControls';
import { fadeUp, safeMotion } from '../utils/motion';

const RequestInbox = () => {
  const { user, userProfile } = useAuth();
  const { success, error: showError } = useToast();
  const prefersReducedMotion = useReducedMotion();
  
  // Core state
  const [requests, setRequests] = useState([]);
  const [categories, setCategories] = useState([]);
  const [priorities, setPriorities] = useState([]);
  const [users, setUsers] = useState([]);
  const [itStaff, setItStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // UI state
  const [showFilters, setShowFilters] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // grid, list, kanban
  
  // Enhanced filters
  const [filters, setFilters] = useState({
    status: '',
    category_id: '',
    priority_id: '',
    search: '',
    dateRange: '',
    assignedTo: '',
    requester: '',
    sortBy: 'created_at',
    sortOrder: 'desc'
  });
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 12;

  // Analytics state
  const [analytics, setAnalytics] = useState({
    totalRequests: 0,
    openRequests: 0,
    inProgressRequests: 0,
    resolvedRequests: 0,
    averageResolutionTime: 0,
    categoryBreakdown: [],
    priorityBreakdown: [],
    monthlyTrends: [],
    unassignedRequests: 0,
    overdueRequests: 0
  });

  useEffect(() => {
    fetchData();
  }, [filters]);

  const openRequestDetail = async (request) => {
    setDetailLoading(true);
    try {
      const full = await itServicesApi.requests.getById(request.id);
      setSelectedRequest(full || request);
    } catch (e) {
      setSelectedRequest(request);
    } finally {
      setDetailLoading(false);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [categoriesData, prioritiesData, requestsResult, usersData, itStaffData] = await Promise.all([
        itServicesApi.categories.getAll(),
        itServicesApi.priorities.getAll(),
        itServicesApi.requests.getAll({}, user?.id, userProfile?.role),
        fetchUsers(),
        itServicesApi.users.getITStaff()
      ]);

      const requestsData = requestsResult?.data ?? requestsResult ?? [];
      const list = Array.isArray(requestsData) ? requestsData : [];

      setCategories(categoriesData);
      setPriorities(prioritiesData);
      setRequests(list);
      setUsers(usersData);
      setItStaff(itStaffData);
      // Compute analytics from the same list so Total / Unassigned / Open match what's shown (cancelled excluded)
      setAnalytics({
        totalRequests: list.length,
        openRequests: list.filter(r => r.status === 'open').length,
        inProgressRequests: list.filter(r => r.status === 'in_progress').length,
        resolvedRequests: list.filter(r => r.status === 'resolved').length,
        averageResolutionTime: analytics.averageResolutionTime ?? 0,
        categoryBreakdown: analytics.categoryBreakdown ?? [],
        priorityBreakdown: analytics.priorityBreakdown ?? [],
        monthlyTrends: analytics.monthlyTrends ?? [],
        unassignedRequests: list.filter(r => !r.assigned_to && r.status === 'open').length,
        overdueRequests: analytics.overdueRequests ?? 0
      });
    } catch (err) {
      console.error('Error fetching data:', err);
      showError('Error', 'Failed to fetch data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      // Try multiple approaches to fetch users
      let usersData = [];
      
      // Approach 1: Try employees table first
      try {
        const { data: employeesData, error: employeesError } = await supabase
          .from('employees')
          .select('id, full_name, email, department, role, auth_user_id')
          .order('full_name');
        
        if (!employeesError && employeesData) {
          usersData = employeesData;
          console.log('Fetched users from employees table:', usersData.length);
        }
      } catch (employeesError) {
        console.log('Employees table query failed:', employeesError);
      }

      // Approach 2: Try users table if employees failed
      if (usersData.length === 0) {
        try {
          const { data: usersTableData, error: usersError } = await supabase
            .from('users')
            .select('id, full_name, email, department, role, auth_user_id')
            .order('full_name');
          
          if (!usersError && usersTableData) {
            usersData = usersTableData;
            console.log('Fetched users from users table:', usersData.length);
          }
        } catch (usersError) {
          console.log('Users table query failed:', usersError);
        }
      }

      return usersData;
    } catch (err) {
      console.error('Error fetching users:', err);
      return [];
    }
  };

  const fetchAnalytics = async () => {
    try {
      const stats = await itServicesApi.requests.getStats();
      return {
        totalRequests: stats.total_requests,
        openRequests: stats.open_requests,
        inProgressRequests: stats.in_progress_requests,
        resolvedRequests: stats.resolved_requests,
        averageResolutionTime: 0,
        categoryBreakdown: [],
        priorityBreakdown: [],
        monthlyTrends: [],
        unassignedRequests: stats.unassigned_requests,
        overdueRequests: 0
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

  // Enhanced filtering and sorting
  const filteredAndSortedRequests = useMemo(() => {
    let filtered = requests;

    if (filters.status) {
      filtered = filtered.filter(request => request.status === filters.status);
    }
    if (filters.category_id) {
      filtered = filtered.filter(request =>
        String(request.category_id) === String(filters.category_id)
      );
    }
    if (filters.priority_id) {
      filtered = filtered.filter(request =>
        String(request.priority_id) === String(filters.priority_id)
      );
    }
    if (filters.assignedTo === 'unassigned') {
      filtered = filtered.filter(request => !request.assigned_to);
    } else if (filters.assignedTo) {
      filtered = filtered.filter(request =>
        String(request.assigned_to) === String(filters.assignedTo)
      );
    }

    // Apply search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(request =>
        request.title.toLowerCase().includes(searchTerm) ||
        request.description?.toLowerCase().includes(searchTerm) ||
        request.request_number?.toLowerCase().includes(searchTerm) ||
        request.requester?.full_name?.toLowerCase().includes(searchTerm) ||
        request.requester?.email?.toLowerCase().includes(searchTerm) ||
        request.requester?.department?.toLowerCase().includes(searchTerm)
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

    // Apply requester filter
    if (filters.requester) {
      filtered = filtered.filter(request =>
        request.requester_id === filters.requester
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

  const totalPages = Math.max(1, Math.ceil(filteredAndSortedRequests.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pagedRequests = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredAndSortedRequests.slice(start, start + PAGE_SIZE);
  }, [filteredAndSortedRequests, currentPage]);

  // Keep pagination predictable as filters/views change
  useEffect(() => {
    setPage(1);
  }, [filters, viewMode]);

  // Utility functions (same as ITRequests)
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
      const slaHours = request.priority.sla_hours || 72;
      
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
      <div className="min-h-screen p-4 md:p-6" style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
        <div className="max-w-7xl mx-auto space-y-6">
          <CardSkeleton cards={5} />
          <TableSkeleton rows={8} columns={6} />
        </div>
      </div>
    );
  }

  const statusColumns = ['open', 'assigned', 'in_progress', 'pending_user', 'resolved', 'closed'];

  return (
    <div 
      className="min-h-screen p-4 md:p-6 transition-all duration-500"
      style={{
        background: 'var(--bg-primary)',
        color: 'var(--text-primary)'
      }}
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          {...fadeUp(0)}
          className="mb-6"
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
            <div className="flex items-center gap-4">
              <motion.div 
                className="p-3.5 rounded-2xl"
                style={{
                  background: 'linear-gradient(135deg, #14b8a6 0%, #0891b2 100%)',
                  boxShadow: '0 4px 14px rgba(20, 184, 166, 0.35)'
                }}
                whileHover={safeMotion(prefersReducedMotion, { scale: 1.03 }, {})}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              >
                <Inbox className="w-7 h-7 text-white" />
              </motion.div>
              <div>
                <h1 
                  className="text-2xl md:text-3xl font-bold tracking-tight"
                  style={{ color: 'var(--text-primary)' }}
                >
                  Request Inbox
                </h1>
                <p 
                  className="text-sm md:text-base mt-0.5"
                  style={{ color: 'var(--text-muted)' }}
                >
                  Manage IT service requests
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <motion.div whileHover={safeMotion(prefersReducedMotion, { scale: 1.02 }, {})} whileTap={safeMotion(prefersReducedMotion, { scale: 0.98 }, {})}>
                <EnhancedButton
                  variant="secondary"
                  onClick={refreshData}
                  disabled={refreshing}
                  className="flex items-center gap-2 rounded-xl border transition-all duration-200"
                  style={{
                    background: 'var(--card-bg)',
                    borderColor: 'var(--card-border)',
                    color: 'var(--text-primary)'
                  }}
                >
                  <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                  Refresh
                </EnhancedButton>
              </motion.div>
              <motion.div whileHover={safeMotion(prefersReducedMotion, { scale: 1.02 }, {})} whileTap={safeMotion(prefersReducedMotion, { scale: 0.98 }, {})}>
                <EnhancedButton
                  variant="secondary"
                  onClick={() => setShowAnalytics(!showAnalytics)}
                  className="flex items-center gap-2 rounded-xl border transition-all duration-200"
                  style={{
                    background: 'var(--card-bg)',
                    borderColor: 'var(--card-border)',
                    color: 'var(--text-primary)'
                  }}
                >
                  <BarChart3 className="w-4 h-4" />
                  Analytics
                </EnhancedButton>
              </motion.div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 md:gap-4 mb-6">
            {[
              { key: 'open', label: 'Open', value: analytics.openRequests, icon: AlertCircle, color: 'var(--accent-primary)', onClick: () => setFilters(f => ({ ...f, status: f.status === 'open' ? '' : 'open' })) },
              { key: 'unassigned', label: 'Unassigned', value: analytics.unassignedRequests, icon: Users, color: 'var(--accent-warning)', onClick: () => setFilters(f => ({ ...f, assignedTo: f.assignedTo === 'unassigned' ? '' : 'unassigned' })) },
              { key: 'in_progress', label: 'In Progress', value: analytics.inProgressRequests, icon: Activity, color: 'var(--accent-info)', onClick: () => setFilters(f => ({ ...f, status: f.status === 'in_progress' ? '' : 'in_progress' })) },
              { key: 'resolved', label: 'Resolved', value: analytics.resolvedRequests, icon: CheckCircle, color: 'var(--accent-success)', onClick: () => setFilters(f => ({ ...f, status: f.status === 'resolved' ? '' : 'resolved' })) },
              { key: 'total', label: 'Total', value: analytics.totalRequests, icon: Inbox, color: 'var(--accent-secondary)', onClick: () => setFilters(f => ({ ...f, status: '', assignedTo: '' })) }
            ].map((stat, i) => {
              const isActive = (stat.key === 'open' && filters.status === 'open') || (stat.key === 'unassigned' && filters.assignedTo === 'unassigned') || (stat.key === 'in_progress' && filters.status === 'in_progress') || (stat.key === 'resolved' && filters.status === 'resolved') || (stat.key === 'total' && !filters.status && !filters.assignedTo);
              const Icon = stat.icon;
              return (
                <motion.div
                  key={stat.key}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 * i, duration: 0.3 }}
                >
                  <motion.div
                    className={`rounded-xl cursor-pointer transition-all duration-200 border-2 ${isActive ? 'ring-2 ring-offset-2' : ''}`}
                    style={{
                      background: 'var(--card-bg)',
                      borderColor: isActive ? stat.color : 'var(--card-border)',
                      boxShadow: isActive ? '0 4px 14px rgba(0,0,0,0.08)' : 'var(--shadow-sm)',
                      ringColor: stat.color
                    }}
                    whileHover={safeMotion(prefersReducedMotion, { y: -2, boxShadow: '0 8px 24px rgba(0,0,0,0.1)' }, {})}
                    whileTap={{ scale: 0.99 }}
                    onClick={stat.onClick}
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
          </div>
        </motion.div>

        {/* Filters & Controls */}
        <motion.div
          {...fadeUp(0.08)}
          className="mb-5"
        >
          <div 
            className="rounded-xl border p-4 md:p-5 transition-all duration-200"
            style={{
              background: 'var(--card-bg)',
              borderColor: 'var(--card-border)'
            }}
          >
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>View</span>
                  <div 
                    className="inline-flex p-0.5 rounded-lg border"
                    style={{ background: 'var(--bg-tertiary)', borderColor: 'var(--border-primary)' }}
                  >
                    {['grid', 'list', 'kanban'].map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setViewMode(mode)}
                        className="px-3 py-1.5 text-sm font-medium rounded-md capitalize transition-all duration-200"
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
                    className="flex items-center gap-1.5 text-sm font-medium rounded-lg px-2.5 py-1.5 transition-colors"
                    style={{
                      background: showFilters ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
                      color: showFilters ? 'white' : 'var(--text-secondary)',
                      border: '1px solid var(--border-primary)'
                    }}
                  >
                    <Filter className="w-4 h-4" />
                    Advanced
                    {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={filters.sortBy}
                    onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
                    className="text-sm rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all"
                    style={{
                      background: 'var(--bg-tertiary)',
                      borderColor: 'var(--border-primary)',
                      color: 'var(--text-primary)'
                    }}
                  >
                    <option value="created_at">Date</option>
                    <option value="title">Title</option>
                    <option value="status">Status</option>
                    <option value="priority_id">Priority</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => setFilters({ ...filters, sortOrder: filters.sortOrder === 'asc' ? 'desc' : 'asc' })}
                    className="p-2 rounded-lg border transition-colors"
                    style={{
                      background: 'var(--bg-tertiary)',
                      borderColor: 'var(--border-primary)',
                      color: 'var(--text-primary)'
                    }}
                  >
                    <SortAsc className={`w-4 h-4 ${filters.sortOrder === 'desc' ? 'rotate-180' : ''}`} />
                  </button>
                </div>
              </div>

              {/* Basic Filters */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
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
                    htmlFor="requester-filter"
                    className="text-sm font-medium mb-2 block"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    Requester
                  </Label>
                <select
                    id="requester-filter"
                    value={filters.requester}
                    onChange={(e) => setFilters({ ...filters, requester: e.target.value })}
                    className="w-full p-3 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    style={{
                      background: 'var(--bg-tertiary)',
                      borderColor: 'var(--border-primary)',
                      color: 'var(--text-primary)'
                    }}
                  >
                    <option value="">All Requesters</option>
                    {users.map(user => (
                      <option key={user.id} value={user.id}>
                        {user.full_name} {user.department ? `(${user.department})` : ''}
                      </option>
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
                    transition={{ duration: 0.25 }}
                    className="mt-4 pt-4 border-t"
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
                          {itStaff.map(staff => (
                            <option key={staff.id} value={staff.id}>
                              {staff.full_name} {staff.role ? `(${staff.role})` : ''}
                            </option>
                          ))}
                        </select>
              </div>
                      
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
                            requester: '',
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
            </div>
          </div>
        </motion.div>

        {/* Requests List */}
        <motion.div
          {...fadeUp(0.12)}
          className="space-y-4"
        >
          {filteredAndSortedRequests.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-2xl border text-center py-14 px-6"
              style={{
                background: 'var(--card-bg)',
                borderColor: 'var(--card-border)'
              }}
            >
              <div 
                className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center"
                style={{ background: 'var(--bg-tertiary)' }}
              >
                <Inbox className="w-8 h-8" style={{ color: 'var(--text-muted)' }} />
              </div>
              <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                No requests found
              </h3>
              <p className="text-sm mb-5 max-w-sm mx-auto" style={{ color: 'var(--text-muted)' }}>
                {filters.search || filters.status || filters.category_id || filters.priority_id
                  ? 'No requests match your filters. Try adjusting criteria.'
                  : 'No IT service requests yet.'}
              </p>
              {(filters.search || filters.status || filters.category_id || filters.priority_id) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setFilters({
                    status: '', category_id: '', priority_id: '', search: '',
                    dateRange: '', assignedTo: '', requester: '',
                    sortBy: 'created_at', sortOrder: 'desc'
                  })}
                  className="rounded-xl"
                  style={{
                    background: 'var(--bg-tertiary)',
                    borderColor: 'var(--border-primary)',
                    color: 'var(--text-primary)'
                  }}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Clear filters
                </Button>
              )}
            </motion.div>
          ) : viewMode === 'kanban' ? (
            <div className="flex gap-4 overflow-x-auto pb-2">
              {statusColumns.map((statusKey) => {
                const columnRequests = pagedRequests.filter(r => r.status === statusKey);
                const statusColor = getStatusColor(statusKey);
                const StatusIcon = getStatusIcon(statusKey);
                return (
                  <div
                    key={statusKey}
                    className="flex-shrink-0 w-72 rounded-xl border overflow-hidden flex flex-col"
                    style={{
                      background: 'var(--card-bg)',
                      borderColor: 'var(--card-border)'
                    }}
                  >
                    <div 
                      className="px-4 py-3 flex items-center gap-2 border-b"
                      style={{ background: statusColor.bg, color: statusColor.text, borderColor: 'var(--card-border)' }}
                    >
                      <StatusIcon className="w-4 h-4" />
                      <span className="text-sm font-semibold capitalize">{statusKey.replace('_', ' ')}</span>
                      <span className="ml-auto text-xs opacity-90">({columnRequests.length})</span>
                    </div>
                    <div className="flex-1 overflow-y-auto max-h-[70vh] p-2 space-y-2">
                      {columnRequests.map((request, idx) => {
                        const sla = getSLAStatus(request);
                        const priorityColor = getPriorityColor(request.priority);
                        const PriorityIcon = getPriorityIcon(request.priority);
                        return (
                          <motion.div
                            key={request.id}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.03 }}
                            className="rounded-lg border p-3 cursor-pointer hover:shadow-md transition-shadow"
                            style={{
                              background: 'var(--card-bg)',
                              borderColor: 'var(--border-primary)'
                            }}
                            onClick={() => openRequestDetail(request)}
                          >
                            <p className="font-medium text-sm line-clamp-2 mb-2" style={{ color: 'var(--text-primary)' }}>{request.title}</p>
                            <div className="flex flex-wrap gap-1.5 mb-2">
                              <span className="px-2 py-0.5 text-xs rounded-full" style={{ background: priorityColor.bg, color: priorityColor.text }}>
                                {request.priority?.name || '—'}
                              </span>
                              {sla && (
                                <span className={`px-2 py-0.5 text-xs rounded-full ${sla.status === 'overdue' ? 'bg-red-500 text-white' : sla.status === 'warning' ? 'bg-amber-500 text-white' : 'bg-emerald-500/20 text-emerald-700'}`}>
                                  {sla.status === 'overdue' ? `Overdue ${sla.hours}h` : `${sla.hours}h left`}
                                </span>
                              )}
                            </div>
                            <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                              {request.requester?.full_name || request.requester_name || 'Unknown'}
                            </p>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : viewMode === 'list' ? (
            <div className="rounded-xl border overflow-hidden" style={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)' }}>
              <div className="overflow-x-auto max-h-[68vh] overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 z-10">
                    <tr style={{ background: 'var(--bg-tertiary)', borderBottom: '1px solid var(--border-primary)' }}>
                      <th className="text-left py-3 px-4 font-semibold backdrop-blur-sm" style={{ color: 'var(--text-muted)' }}>Request</th>
                      <th className="text-left py-3 px-4 font-semibold backdrop-blur-sm" style={{ color: 'var(--text-muted)' }}>Status</th>
                      <th className="text-left py-3 px-4 font-semibold backdrop-blur-sm" style={{ color: 'var(--text-muted)' }}>Priority</th>
                      <th className="text-left py-3 px-4 font-semibold backdrop-blur-sm" style={{ color: 'var(--text-muted)' }}>Requester</th>
                      <th className="text-left py-3 px-4 font-semibold backdrop-blur-sm" style={{ color: 'var(--text-muted)' }}>Date</th>
                      <th className="w-10 backdrop-blur-sm"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagedRequests.map((request, index) => {
                      const statusColor = getStatusColor(request.status);
                      const priorityColor = getPriorityColor(request.priority);
                      const StatusIcon = getStatusIcon(request.status);
                      const PriorityIcon = getPriorityIcon(request.priority);
                      return (
                        <motion.tr
                          key={request.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: index * 0.02 }}
                          className="border-b cursor-pointer transition-colors duration-150"
                          style={{ borderColor: 'var(--border-primary)', background: 'transparent' }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-tertiary)'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                          onClick={() => openRequestDetail(request)}
                        >
                          <td className="py-3 px-4">
                            <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{request.title}</span>
                            {request.request_number && (
                              <span className="ml-2 text-xs font-mono" style={{ color: 'var(--text-muted)' }}>{request.request_number}</span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium" style={{ background: statusColor.bg, color: statusColor.text }}>
                              <StatusIcon className="w-3.5 h-3.5" />
                              {request.status.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium" style={{ background: priorityColor.bg, color: priorityColor.text }}>
                              <PriorityIcon className="w-3.5 h-3.5" />
                              {request.priority?.name || '—'}
                            </span>
                          </td>
                          <td className="py-3 px-4" style={{ color: 'var(--text-secondary)' }}>{request.requester?.full_name || request.requester_name || 'Unknown'}</td>
                          <td className="py-3 px-4" style={{ color: 'var(--text-muted)' }}>{formatDate(request.created_at)}</td>
                          <td className="py-3 px-2">
                            <Button variant="ghost" size="sm" className="p-1.5" onClick={(e) => { e.stopPropagation(); openRequestDetail(request); }}>
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
          ) : (
            <div className="grid gap-4">
              {pagedRequests.map((request, index) => {
              const sla = getSLAStatus(request);
                const statusColor = getStatusColor(request.status);
                const priorityColor = getPriorityColor(request.priority);
                const StatusIcon = getStatusIcon(request.status);
                const PriorityIcon = getPriorityIcon(request.priority);
                
              return (
                  <motion.div
                    key={request.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: prefersReducedMotion ? 0 : Math.min(index * 0.04, 0.3), duration: 0.3 }}
                    whileHover={safeMotion(prefersReducedMotion, { y: -2 }, {})}
                    className="transition-shadow duration-200"
                  >
                    <Card 
                      className="cursor-pointer group overflow-hidden rounded-xl border shadow-sm hover:shadow-lg relative transition-all duration-200"
                      style={{
                        background: 'var(--card-bg)',
                        borderColor: 'var(--card-border)'
                      }}
                      onClick={() => openRequestDetail(request)}
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
                              <div className="flex items-center gap-3">
                                <h3 
                                  className="text-xl font-semibold group-hover:underline"
                                  style={{ color: 'var(--text-primary)' }}
                                >
                            {request.title}
                          </h3>
                                {request.request_number && (
                                  <span 
                                    className="px-2 py-1 text-xs font-mono rounded-md"
                                    style={{
                                      background: 'var(--bg-tertiary)',
                                      color: 'var(--text-muted)',
                                      border: '1px solid var(--border-primary)'
                                    }}
                                  >
                                    {request.request_number}
                          </span>
                                )}
                              </div>
                              
                              {/* Status and Priority Badges */}
                              <div className="flex flex-wrap items-center gap-2">
                                <span 
                                  className="px-3 py-1 text-sm font-medium rounded-full flex items-center gap-2"
                                  style={{
                                    background: statusColor.bg,
                                    color: statusColor.text,
                                    border: `1px solid ${statusColor.border}`
                                  }}
                                >
                                  <StatusIcon className="w-4 h-4" />
                                  {request.status.replace('_', ' ').toUpperCase()}
                          </span>
                                
                                <span 
                                  className="px-3 py-1 text-sm font-medium rounded-full flex items-center gap-2"
                                  style={{
                                    background: priorityColor.bg,
                                    color: priorityColor.text,
                                    border: `1px solid ${priorityColor.border}`
                                  }}
                                >
                                  <PriorityIcon className="w-4 h-4" />
                                  {request.priority?.name || 'Unknown'}
                                </span>
                                
                          {sla && (
                                  <span 
                                    className={`px-3 py-1 text-sm font-medium rounded-full flex items-center gap-2 ${
                                      sla.status === 'overdue' ? 'bg-red-500 text-white' :
                                      sla.status === 'warning' ? 'bg-yellow-500 text-white' :
                                      'bg-green-500 text-white'
                                    }`}
                                  >
                                    <Timer className="w-4 h-4" />
                              {sla.status === 'overdue' ? `Overdue ${sla.hours}h` :
                               sla.status === 'warning' ? `${sla.hours}h left` :
                               `${sla.hours}h left`}
                            </span>
                          )}
                              </div>
                        </div>
                        
                            {/* Requester Info */}
                            <div className="flex items-center gap-2 mb-3">
                              <User className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                              <span 
                                className="text-sm font-medium"
                                style={{ color: 'var(--text-muted)' }}
                              >
                                Requested by: {request.requester?.full_name || request.requester_name || 'Unknown User'}
                              </span>
                              {(request.requester?.email || request.requester_email) && (
                                <span 
                                  className="text-xs px-2 py-1 rounded-md"
                                  style={{
                                    background: 'var(--bg-tertiary)',
                                    color: 'var(--text-muted)'
                                  }}
                                >
                                  {request.requester?.email || request.requester_email}
                                </span>
                              )}
                              {(request.requester?.department || request.requester_department) && (
                                <span 
                                  className="text-xs px-2 py-1 rounded-md"
                                  style={{
                                    background: 'var(--accent-primary)',
                                    color: 'white'
                                  }}
                                >
                                  {request.requester?.department || request.requester_department}
                                </span>
                              )}
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
                              <span 
                                className="flex items-center gap-2"
                                style={{ color: 'var(--text-muted)' }}
                              >
                            <User className="w-4 h-4" />
                                {request.requester?.full_name || request.requester?.email || 'Unknown User'}
                          </span>
                          {request.assigned_to && (
                                <span 
                                  className="flex items-center gap-2"
                                  style={{ color: 'var(--text-muted)' }}
                                >
                              <Wrench className="w-4 h-4" />
                              Assigned to {request.assignee?.full_name || 'Unknown'}
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
                        <motion.div whileHover={safeMotion(prefersReducedMotion, { scale: 1.05 }, {})} whileTap={safeMotion(prefersReducedMotion, { scale: 0.95 }, {})}>
                          <Button
                            variant="outline"
                            size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                openRequestDetail(request);
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
                        
                          <motion.div whileHover={safeMotion(prefersReducedMotion, { scale: 1.05 }, {})} whileTap={safeMotion(prefersReducedMotion, { scale: 0.95 }, {})}>
                            <Button
                              variant="outline"
                              size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openRequestDetail(request);
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
                      </div>
                    </div>
                  </CardContent>
                </Card>
                  </motion.div>
              );
              })}
        </div>
                    )}

          <PaginationControls
            page={currentPage}
            totalPages={totalPages}
            totalItems={filteredAndSortedRequests.length}
            pageSize={PAGE_SIZE}
            onPageChange={setPage}
          />
        </motion.div>

        {/* Loading overlay when fetching request detail */}
        {detailLoading && (
          <motion.div 
            initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={prefersReducedMotion ? { opacity: 1 } : { opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-black/40 backdrop-blur-sm"
          >
            <LoadingSpinner />
            <span className="text-white font-medium">Loading request details...</span>
          </motion.div>
        )}

        {/* Request Detail Modal */}
        <AnimatePresence>
          {selectedRequest && !detailLoading && (
            <motion.div 
              initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={prefersReducedMotion ? { opacity: 1 } : { opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50"
              onClick={() => setSelectedRequest(null)}
            >
              <motion.div
                initial={prefersReducedMotion ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={prefersReducedMotion ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.96 }}
                transition={prefersReducedMotion ? { duration: 0 } : { type: 'spring', damping: 25, stiffness: 300 }}
                onClick={(e) => e.stopPropagation()}
                className="rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
                style={{
                  background: 'var(--card-bg)',
                  border: '1px solid var(--card-border)',
                  boxShadow: 'var(--shadow-xl)'
                }}
              >
                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <div 
                        className="p-3 rounded-xl"
                        style={{
                          background: 'var(--gradient-primary)',
                          boxShadow: 'var(--shadow-md)'
                        }}
                      >
                        <Eye className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h2 
                          className="text-2xl font-bold"
                          style={{ color: 'var(--text-primary)' }}
                        >
                          Request Details
                        </h2>
                        <p 
                          className="text-sm"
                          style={{ color: 'var(--text-muted)' }}
                        >
                          {selectedRequest.request_number} • View and manage this request
                        </p>
                      </div>
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

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Content */}
                    <motion.div
                      {...fadeUp(0.02)}
                      className="lg:col-span-2 space-y-6"
                    >
                      {/* Request Info */}
                      <Card style={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)' }}>
                        <CardHeader>
                          <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                            Request Information
                          </h3>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div>
                            <Label className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
                              Title
                            </Label>
                            <p className="text-base font-medium" style={{ color: 'var(--text-primary)' }}>
                              {selectedRequest.title}
                            </p>
                          </div>
                          <div>
                            <Label className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
                              Description
                            </Label>
                            <p className="text-base" style={{ color: 'var(--text-secondary)' }}>
                              {selectedRequest.description}
                            </p>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
                                Category
                              </Label>
                              <p className="text-base" style={{ color: 'var(--text-primary)' }}>
                                {selectedRequest.category_name || selectedRequest.category?.name || 'N/A'}
                              </p>
                            </div>
                            <div>
                              <Label className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
                                Priority
                              </Label>
                              <p className="text-base" style={{ color: 'var(--text-primary)' }}>
                                {selectedRequest.priority_name || selectedRequest.priority?.name || 'N/A'}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Requester Details */}
                      <Card style={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)' }}>
                        <CardHeader>
                          <h3 className="text-lg font-semibold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                            <User className="w-5 h-5" />
                            Requester Details
                          </h3>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
                                Name
                              </Label>
                              <p className="text-base font-medium" style={{ color: 'var(--text-primary)' }}>
                                {selectedRequest.requester?.full_name || selectedRequest.requester_name || 'Unknown User'}
                              </p>
                            </div>
                            <div>
                              <Label className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
                                Email
                              </Label>
                              <p className="text-base" style={{ color: 'var(--text-primary)' }}>
                                {selectedRequest.requester?.email || selectedRequest.requester_email || 'N/A'}
                              </p>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
                                Department
                              </Label>
                              <p className="text-base" style={{ color: 'var(--text-primary)' }}>
                                {selectedRequest.requester?.department || selectedRequest.requester_department || 'N/A'}
                              </p>
                            </div>
                            <div>
                              <Label className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
                                Role
                              </Label>
                              <p className="text-base" style={{ color: 'var(--text-primary)' }}>
                                {selectedRequest.requester?.role || selectedRequest.requester_role || 'N/A'}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>

                    {/* Management Actions */}
                    <motion.div
                      {...fadeUp(0.06)}
                      className="space-y-6"
                    >
                      {/* Status & Assignment */}
                      <Card style={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)' }}>
                        <CardHeader>
                          <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                            Management
                          </h3>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div>
                            <Label className="text-sm font-medium mb-2 block" style={{ color: 'var(--text-muted)' }}>
                              Status
                            </Label>
                            <select
                              value={selectedRequest.status}
                              onChange={(e) => {
                                // Handle status change
                                const newStatus = e.target.value;
                                setSelectedRequest(prev => ({ ...prev, status: newStatus }));
                              }}
                              className="w-full p-2 rounded-lg border"
                              style={{
                                background: 'var(--bg-tertiary)',
                                borderColor: 'var(--border-primary)',
                                color: 'var(--text-primary)'
                              }}
                            >
                              <option value="open">Open</option>
                              <option value="assigned">Assigned</option>
                              <option value="in_progress">In Progress</option>
                              <option value="pending_approval">Pending Approval</option>
                              <option value="resolved">Resolved</option>
                              <option value="closed">Closed</option>
                              <option value="cancelled">Cancelled</option>
                            </select>
                          </div>

                          <div>
                            <Label className="text-sm font-medium mb-2 block" style={{ color: 'var(--text-muted)' }}>
                              Assign to IT Staff
                            </Label>
                            <select
                              value={selectedRequest.assigned_to || ''}
                              onChange={(e) => {
                                // Handle assignment change
                                const assignedTo = e.target.value;
                                setSelectedRequest(prev => ({ ...prev, assigned_to: assignedTo }));
                              }}
                              className="w-full p-2 rounded-lg border"
                              style={{
                                background: 'var(--bg-tertiary)',
                                borderColor: 'var(--border-primary)',
                                color: 'var(--text-primary)'
                              }}
                            >
                              <option value="">Unassigned</option>
                              {itStaff.map(staff => (
                                <option key={staff.id} value={staff.id}>
                                  {staff.full_name} ({staff.role})
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <Label className="text-sm font-medium mb-2 block" style={{ color: 'var(--text-muted)' }}>
                              Resolution Notes
                            </Label>
                            <Textarea
                              placeholder="Add resolution notes..."
                              rows={3}
                              className="w-full p-2 rounded-lg border"
                              style={{
                                background: 'var(--bg-tertiary)',
                                borderColor: 'var(--border-primary)',
                                color: 'var(--text-primary)'
                              }}
                            />
                          </div>

                          {/* Action Buttons */}
                          <div className="flex flex-col gap-2">
                            <Button
                              onClick={async () => {
                                try {
                                  console.log('Updating request:', selectedRequest.id, {
                                    status: selectedRequest.status,
                                    assigned_to: selectedRequest.assigned_to
                                  });
                                  
                                  await itServicesApi.requests.update(selectedRequest.id, {
                                    status: selectedRequest.status,
                                    assigned_to: selectedRequest.assigned_to || null
                                  });
                                  
                                  if (selectedRequest.assigned_to) {
                                    const assignee = itStaff.find(s => s.id === selectedRequest.assigned_to);
                                    success(assignee?.email
                                      ? `Request updated. Notification sent to ${assignee.email}`
                                      : 'Request updated. Assignment notification sent to assignee.');
                                  } else {
                                    success('Request updated successfully!');
                                  }
                                  setSelectedRequest(null);
                                  fetchData();
                                } catch (error) {
                                  console.error('Failed to update request:', error);
                                  showError('Failed to update request', error.message || 'Unknown error occurred');
                                }
                              }}
                              className="w-full"
                              style={{
                                background: 'var(--gradient-primary)',
                                color: 'white',
                                border: 'none'
                              }}
                            >
                              <Settings className="w-4 h-4 mr-2" />
                              Save Changes
                            </Button>
                            
                            <Button
                              variant="outline"
                              onClick={() => {
                                // Handle ticket creation from request
                                console.log('Create ticket for request:', selectedRequest.id);
                              }}
                              className="w-full"
                              style={{
                                background: 'var(--bg-tertiary)',
                                borderColor: 'var(--border-primary)',
                                color: 'var(--text-primary)'
                              }}
                            >
                              <Wrench className="w-4 h-4 mr-2" />
                              Create Ticket
                            </Button>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Request Timeline */}
                      <Card style={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)' }}>
                        <CardHeader>
                          <h3 className="text-lg font-semibold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                            <Clock className="w-5 h-5" />
                            Timeline
                          </h3>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="text-sm">
                            <div className="flex items-center gap-2 mb-1">
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                              <span style={{ color: 'var(--text-muted)' }}>Created</span>
                            </div>
                            <p className="text-xs ml-4" style={{ color: 'var(--text-secondary)' }}>
                              {new Date(selectedRequest.created_at).toLocaleString()}
                            </p>
                          </div>
                          
                          {selectedRequest.assigned_at && (
                            <div className="text-sm">
                              <div className="flex items-center gap-2 mb-1">
                                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                                <span style={{ color: 'var(--text-muted)' }}>Assigned</span>
                              </div>
                              <p className="text-xs ml-4" style={{ color: 'var(--text-secondary)' }}>
                                {new Date(selectedRequest.assigned_at).toLocaleString()}
                              </p>
                            </div>
                          )}
                          
                          {selectedRequest.actual_completion_date && (
                            <div className="text-sm">
                              <div className="flex items-center gap-2 mb-1">
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                <span style={{ color: 'var(--text-muted)' }}>Completed</span>
                              </div>
                              <p className="text-xs ml-4" style={{ color: 'var(--text-secondary)' }}>
                                {new Date(selectedRequest.actual_completion_date).toLocaleString()}
                              </p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
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
  );
};

export default RequestInbox;