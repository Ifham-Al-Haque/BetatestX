import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
import { useTheme } from '../context/ThemeContext';
import { itServicesApi } from '../services/itServicesApi';
import { supabase } from '../supabaseClient';
import { Card, CardContent, CardHeader } from '../components/ui/card';
import Button from '../components/ui/button';
import Input from '../components/ui/input';
import Label from '../components/ui/label';
import Textarea from '../components/ui/textarea';
import LoadingSpinner from '../components/LoadingSpinner';
import ITAnalytics from '../components/ITAnalytics';

const RequestInbox = () => {
  const { user, userProfile } = useAuth();
  const { success, error: showError } = useToast();
  const { isDark } = useTheme();
  
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

  const fetchData = async () => {
    try {
      setLoading(true);
      const [categoriesData, prioritiesData, requestsData, usersData, itStaffData, analyticsData] = await Promise.all([
        itServicesApi.categories.getAll(),
        itServicesApi.priorities.getAll(),
        itServicesApi.requests.getAllForTech(), // Get all requests for tech roles
        fetchUsers(),
        itServicesApi.users.getITStaff(), // Get IT staff for assignments
        fetchAnalytics()
      ]);

      setCategories(categoriesData);
      setPriorities(prioritiesData);
      setRequests(requestsData);
      setUsers(usersData);
      setItStaff(itStaffData);
      setAnalytics(analyticsData);
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
      <div 
        className="min-h-screen flex items-center justify-center"
        style={{
          background: 'var(--bg-primary)',
          color: 'var(--text-primary)'
        }}
      >
        <LoadingSpinner size="xl" text="Loading request inbox..." />
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen p-4 md:p-6 transition-all duration-500"
      style={{
        background: 'linear-gradient(135deg, var(--bg-primary) 0%, var(--bg-secondary) 100%)',
        color: 'var(--text-primary)'
      }}
    >
      <div className="max-w-7xl mx-auto">
        {/* Enhanced Header */}
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
                  <Inbox className="w-8 h-8 text-white" />
            </motion.div>
            <div>
                  <motion.h1 
                    className="text-4xl md:text-5xl font-bold mb-2 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1 }}
                  >
                    Request Inbox
                  </motion.h1>
                  <motion.p 
                    className="text-lg md:text-xl"
                    style={{ color: 'var(--text-muted)' }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    Manage all IT service requests across the organization
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
            </div>
          </div>

          {/* Enhanced Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card 
                className="hover:shadow-lg transition-all duration-300 cursor-pointer group"
                style={{
                  background: 'var(--card-bg)',
                  borderColor: 'var(--card-border)',
                  boxShadow: 'var(--shadow-md)'
                }}
                onClick={() => setFilters({ ...filters, status: 'open' })}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div 
                        className="p-3 rounded-xl"
                        style={{
                          background: 'var(--accent-primary)',
                          boxShadow: 'var(--shadow-sm)'
                        }}
                      >
                        <AlertCircle className="w-6 h-6 text-white" />
                  </div>
                  <div>
                        <p 
                          className="text-3xl font-bold mb-1"
                          style={{ color: 'var(--text-primary)' }}
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
                    <TrendingUp className="w-5 h-5 text-green-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </CardContent>
            </Card>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card 
                className="hover:shadow-lg transition-all duration-300 cursor-pointer group"
                style={{
                  background: 'var(--card-bg)',
                  borderColor: 'var(--card-border)',
                  boxShadow: 'var(--shadow-md)'
                }}
                onClick={() => setFilters({ ...filters, assignedTo: 'unassigned' })}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div 
                        className="p-3 rounded-xl"
                        style={{
                          background: 'var(--accent-warning)',
                          boxShadow: 'var(--shadow-sm)'
                        }}
                      >
                        <Users className="w-6 h-6 text-white" />
                  </div>
                  <div>
                        <p 
                          className="text-3xl font-bold mb-1"
                          style={{ color: 'var(--text-primary)' }}
                        >
                          {analytics.unassignedRequests}
                        </p>
                        <p 
                          className="text-sm font-medium"
                          style={{ color: 'var(--text-muted)' }}
                        >
                          Unassigned
                        </p>
                  </div>
                    </div>
                    <AlertTriangle className="w-5 h-5 text-yellow-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </CardContent>
            </Card>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card 
                className="hover:shadow-lg transition-all duration-300 cursor-pointer group"
                style={{
                  background: 'var(--card-bg)',
                  borderColor: 'var(--card-border)',
                  boxShadow: 'var(--shadow-md)'
                }}
                onClick={() => setFilters({ ...filters, status: 'in_progress' })}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div 
                        className="p-3 rounded-xl"
                        style={{
                          background: 'var(--accent-info)',
                          boxShadow: 'var(--shadow-sm)'
                        }}
                      >
                        <Activity className="w-6 h-6 text-white" />
                  </div>
                  <div>
                        <p 
                          className="text-3xl font-bold mb-1"
                          style={{ color: 'var(--text-primary)' }}
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
                    <Timer className="w-5 h-5 text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </CardContent>
            </Card>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card 
                className="hover:shadow-lg transition-all duration-300 cursor-pointer group"
                style={{
                  background: 'var(--card-bg)',
                  borderColor: 'var(--card-border)',
                  boxShadow: 'var(--shadow-md)'
                }}
                onClick={() => setFilters({ ...filters, status: 'resolved' })}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div 
                        className="p-3 rounded-xl"
                        style={{
                          background: 'var(--accent-success)',
                          boxShadow: 'var(--shadow-sm)'
                        }}
                      >
                        <CheckCircle className="w-6 h-6 text-white" />
                  </div>
                  <div>
                        <p 
                          className="text-3xl font-bold mb-1"
                          style={{ color: 'var(--text-primary)' }}
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
                    <Award className="w-5 h-5 text-green-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </CardContent>
            </Card>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Card 
                className="hover:shadow-lg transition-all duration-300 cursor-pointer group"
                style={{
                  background: 'var(--card-bg)',
                  borderColor: 'var(--card-border)',
                  boxShadow: 'var(--shadow-md)'
                }}
                onClick={() => setFilters({ ...filters, status: '' })}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div 
                        className="p-3 rounded-xl"
                        style={{
                          background: 'var(--accent-secondary)',
                          boxShadow: 'var(--shadow-sm)'
                        }}
                      >
                        <Inbox className="w-6 h-6 text-white" />
          </div>
                      <div>
                        <p 
                          className="text-3xl font-bold mb-1"
                          style={{ color: 'var(--text-primary)' }}
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
                    <Target className="w-5 h-5 text-purple-500 opacity-0 group-hover:opacity-100 transition-opacity" />
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
          transition={{ delay: 0.6 }}
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
                      <Filter className="w-4 h-4" />
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
          </CardContent>
        </Card>
        </motion.div>

        {/* Enhanced Requests List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="space-y-6"
        >
          {filteredAndSortedRequests.length === 0 ? (
            <Card 
              className="text-center py-12"
              style={{
                background: 'var(--card-bg)',
                borderColor: 'var(--card-border)',
                boxShadow: 'var(--shadow-md)'
              }}
            >
              <CardContent className="p-8">
                <div 
                  className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center"
                  style={{
                    background: 'var(--bg-tertiary)',
                    border: '2px solid var(--border-primary)'
                  }}
                >
                  <Inbox className="w-10 h-10" style={{ color: 'var(--text-muted)' }} />
                </div>
                <h3 
                  className="text-xl font-semibold mb-3"
                  style={{ color: 'var(--text-primary)' }}
                >
                  No requests found
                </h3>
                <p 
                  className="text-lg mb-6"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {filters.search || filters.status || filters.category_id || filters.priority_id
                    ? 'No requests match your current filters. Try adjusting your search criteria.'
                    : 'No IT service requests have been submitted yet.'}
                </p>
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
                      requester: '',
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
                    transition={{ delay: index * 0.1 }}
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
                        
                          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                            <Button
                              variant="outline"
                              size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedRequest(request);
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
        </motion.div>

        {/* Request Detail Management Modal */}
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
                    <div className="lg:col-span-2 space-y-6">
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
                    </div>

                    {/* Management Actions */}
                    <div className="space-y-6">
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
                                    assigned_to: selectedRequest.assigned_to
                                  });
                                  
                                  success('Request updated successfully!');
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
                    </div>
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
  );
};

export default RequestInbox;