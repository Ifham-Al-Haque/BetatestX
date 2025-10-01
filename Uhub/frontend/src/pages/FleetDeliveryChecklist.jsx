import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import deliveryService from '../services/deliveryService';
import { 
  ClipboardList, 
  CheckSquare, 
  Plus, 
  Search, 
  Filter, 
  Calendar,
  Truck,
  Package,
  TrendingUp,
  Eye,
  Edit,
  Download,
  AlertTriangle,
  Clock,
  User,
  Star,
  Phone,
  DollarSign,
  XCircle,
  MoreVertical,
  CheckCircle,
  XCircle as XCircleIcon,
  Pause,
  Play,
  RefreshCw,
  BarChart3,
  PieChart,
  Activity,
  Zap,
  Shield,
  MapPin,
  Timer,
  FileText,
  Settings,
  Archive,
  Trash2,
  Copy,
  Share2,
  Bell,
  Target,
  Award,
  TrendingDown,
  ArrowUp,
  ArrowDown,
  ChevronRight,
  ChevronDown,
  Sparkles,
  Layers,
  Grid,
  List,
  SortAsc,
  SortDesc
} from 'lucide-react';

import UserDropdown from '../components/UserDropdown';
import DarkModeToggle from '../components/DarkModeToggle';
import Button from '../components/ui/button';
import Input from '../components/ui/input';
import Label from '../components/ui/label';
import Textarea from '../components/ui/textarea';

const FleetDeliveryChecklist = () => {
  const { user } = useAuth();
  const { success, error: showError } = useToast();
  const [deliveryChecklists, setDeliveryChecklists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // grid, list
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [expandedCard, setExpandedCard] = useState(null);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [dateRange, setDateRange] = useState({ from: '', to: '' });
  const [quickStats, setQuickStats] = useState({
    total: 0,
    completed: 0,
    inProgress: 0,
    pending: 0,
    overdue: 0,
    totalValue: 0,
    avgCompletionTime: 0
  });

  const [formData, setFormData] = useState({
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    desired_fleet: '',
    rental_amount: '',
    confirm_amount: '',
    rental_duration: '',
    custom_duration: '',
    location: '',
    special_notes: '',
    priority: 'medium',
    delivery_date: '',
    driver_name: '',
    driver_phone: '',
    driver_license: '',
    vehicle_number: '',
    vehicle_make: '',
    vehicle_model: '',
    vehicle_plate: ''
  });

  const loadDeliveryChecklistData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await deliveryService.getDeliveryOverview();
      setDeliveryChecklists(data);
      calculateQuickStats(data);
    } catch (error) {
      console.error('Error loading delivery checklist data:', error);
      showError('Failed to load delivery data');
    } finally {
      setLoading(false);
    }
  }, [showError]);

  const calculateQuickStats = (data) => {
    const stats = {
      total: data.length,
      completed: data.filter(item => item.status === 'completed').length,
      inProgress: data.filter(item => item.status === 'in_progress').length,
      pending: data.filter(item => item.status === 'not_started').length,
      overdue: data.filter(item => {
        if (item.status === 'completed') return false;
        const createdDate = new Date(item.created_at);
        const daysDiff = (new Date() - createdDate) / (1000 * 60 * 60 * 24);
        return daysDiff > 7; // Overdue if more than 7 days
      }).length,
      totalValue: data.reduce((sum, item) => sum + (parseFloat(item.delivery_fee) || 0), 0),
      avgCompletionTime: 0 // Will be calculated based on completion times
    };
    setQuickStats(stats);
  };

  const filteredData = deliveryChecklists.filter(item => {
    const matchesSearch = !searchTerm || 
      item.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.order_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.vehicle_number?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = !statusFilter || item.status === statusFilter;
    const matchesPriority = !priorityFilter || item.priority === priorityFilter;
    
    const matchesDateRange = !dateRange.from || !dateRange.to || (
      new Date(item.created_at) >= new Date(dateRange.from) &&
      new Date(item.created_at) <= new Date(dateRange.to)
    );

    return matchesSearch && matchesStatus && matchesPriority && matchesDateRange;
  });

  const sortedData = [...filteredData].sort((a, b) => {
    let aValue = a[sortBy];
    let bValue = b[sortBy];
    
    if (sortBy === 'created_at') {
      aValue = new Date(aValue);
      bValue = new Date(bValue);
    }
    
    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  useEffect(() => {
    loadDeliveryChecklistData();
  }, [loadDeliveryChecklistData]);

  const handleCreateChecklist = () => {
    setShowCreateModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const orderData = {
        customer_name: formData.customer_name,
        customer_phone: formData.customer_phone,
        customer_email: formData.customer_email,
        pickup_address: formData.location,
        delivery_address: formData.location, // Same as pickup for now
        order_type: 'Standard',
        priority: formData.priority,
        special_instructions: formData.special_notes,
        delivery_fee: parseFloat(formData.rental_amount) || 0,
        payment_status: 'Pending',
        created_by: user.id,
        // Rental duration information
        rental_duration: formData.rental_duration,
        custom_duration: formData.custom_duration,
        // Driver information (manually entered)
        driver_name: formData.driver_name,
        driver_phone: formData.driver_phone,
        driver_license: formData.driver_license,
        // Vehicle information (manually entered)
        vehicle_number: formData.vehicle_number,
        vehicle_make: formData.vehicle_make,
        vehicle_model: formData.vehicle_model,
        vehicle_plate: formData.vehicle_plate
      };

      await deliveryService.createOrder(orderData);
      success('Delivery order created successfully');
      setShowCreateModal(false);
      setFormData({
        customer_name: '',
        customer_phone: '',
        customer_email: '',
        desired_fleet: '',
        rental_amount: '',
        confirm_amount: '',
        rental_duration: '',
        custom_duration: '',
        location: '',
        special_notes: '',
        priority: 'medium',
        delivery_date: '',
        driver_name: '',
        driver_phone: '',
        driver_license: '',
        vehicle_number: '',
        vehicle_make: '',
        vehicle_model: '',
        vehicle_plate: ''
      });
      loadDeliveryChecklistData();
    } catch (error) {
      console.error('Error creating delivery order:', error);
      showError('Failed to create delivery order');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'on_hold': return 'bg-yellow-100 text-yellow-800';
      case 'not_started': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return CheckSquare;
      case 'in_progress': return TrendingUp;
      case 'on_hold': return AlertTriangle;
      case 'not_started': return Clock;
      default: return Clock;
    }
  };

  const handleStatusUpdate = async (id, newStatus) => {
    try {
      // Update status logic here
      await deliveryService.updateOrderStatus(id, newStatus);
      success(`Status updated to ${newStatus}`);
      loadDeliveryChecklistData();
    } catch (error) {
      showError('Failed to update status');
    }
  };

  const handleBulkAction = async (action, itemIds) => {
    try {
      // Bulk action logic here
      success(`Bulk action ${action} completed`);
      loadDeliveryChecklistData();
    } catch (error) {
      showError('Failed to perform bulk action');
    }
  };

  const toggleItemSelection = (id) => {
    setSelectedItems(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  const selectAllItems = () => {
    setSelectedItems(sortedData.map(item => item.id));
  };

  const clearSelection = () => {
    setSelectedItems([]);
  };

  const getProgressPercentage = (item) => {
    // Calculate progress based on status and completion
    switch (item.status) {
      case 'completed': return 100;
      case 'in_progress': return 65;
      case 'on_hold': return 30;
      case 'not_started': return 0;
      default: return 0;
    }
  };

  const getDaysSinceCreated = (createdAt) => {
    const created = new Date(createdAt);
    const now = new Date();
    return Math.floor((now - created) / (1000 * 60 * 60 * 24));
  };

  const isOverdue = (item) => {
    if (item.status === 'completed') return false;
    return getDaysSinceCreated(item.created_at) > 7;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto mb-6"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Truck className="w-6 h-6 text-blue-600 animate-pulse" />
        </div>
          </div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">Loading Fleet Delivery Checklists</h3>
          <p className="text-gray-600">Preparing your delivery management dashboard...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden">
      {/* Background Pattern */}
      <div 
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23e0e7ff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      ></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {/* Enhanced Header with Glassmorphism */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 relative overflow-hidden">
            {/* Decorative Elements */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400/20 to-indigo-600/20 rounded-full -translate-y-16 translate-x-16"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-purple-400/20 to-pink-600/20 rounded-full translate-y-12 -translate-x-12"></div>
            
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between relative z-10">
              <div className="flex-1">
                <div className="flex items-center mb-6">
                  <div className="relative">
                    <div className="p-4 bg-gradient-to-r from-blue-500 via-indigo-600 to-purple-600 rounded-2xl mr-6 shadow-lg">
                      <ClipboardList className="w-8 h-8 text-white" />
                    </div>
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full animate-pulse"></div>
                  </div>
            <div>
                    <h1 className="text-5xl font-black bg-gradient-to-r from-slate-900 via-blue-800 to-indigo-800 bg-clip-text text-transparent mb-2">
                Fleet Delivery Checklist
              </h1>
                    <p className="text-slate-600 text-xl font-medium">
                      Advanced delivery management and tracking system
              </p>
            </div>
                </div>
                
                {/* Enhanced Quick Stats with Animations */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-8">
                  <motion.div 
                    whileHover={{ scale: 1.05, y: -2 }}
                    className="bg-gradient-to-br from-emerald-50 to-green-100 p-6 rounded-2xl border border-emerald-200/50 shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-emerald-700 font-semibold mb-1">Completed</p>
                        <motion.p 
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="text-3xl font-black text-emerald-800"
                        >
                          {quickStats.completed}
                        </motion.p>
            </div>
                      <div className="p-3 bg-gradient-to-r from-emerald-500 to-green-600 rounded-xl shadow-lg">
                        <CheckCircle className="w-6 h-6 text-white" />
          </div>
        </div>
                    <div className="mt-3 w-full bg-emerald-200 rounded-full h-1">
                      <motion.div 
                        className="bg-gradient-to-r from-emerald-500 to-green-600 h-1 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${(quickStats.completed / Math.max(quickStats.total, 1)) * 100}%` }}
                        transition={{ duration: 1, delay: 0.5 }}
                      />
                    </div>
                  </motion.div>
                  
                  <motion.div 
                    whileHover={{ scale: 1.05, y: -2 }}
                    className="bg-gradient-to-br from-blue-50 to-cyan-100 p-6 rounded-2xl border border-blue-200/50 shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-blue-700 font-semibold mb-1">In Progress</p>
                        <motion.p 
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="text-3xl font-black text-blue-800"
                        >
                          {quickStats.inProgress}
                        </motion.p>
              </div>
                      <div className="p-3 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-xl shadow-lg">
                        <Activity className="w-6 h-6 text-white" />
              </div>
            </div>
                    <div className="mt-3 w-full bg-blue-200 rounded-full h-1">
                      <motion.div 
                        className="bg-gradient-to-r from-blue-500 to-cyan-600 h-1 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${(quickStats.inProgress / Math.max(quickStats.total, 1)) * 100}%` }}
                        transition={{ duration: 1, delay: 0.7 }}
                      />
          </div>
                  </motion.div>
                  
                  <motion.div 
                    whileHover={{ scale: 1.05, y: -2 }}
                    className="bg-gradient-to-br from-amber-50 to-yellow-100 p-6 rounded-2xl border border-amber-200/50 shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-amber-700 font-semibold mb-1">Pending</p>
                        <motion.p 
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="text-3xl font-black text-amber-800"
                        >
                          {quickStats.pending}
                        </motion.p>
              </div>
                      <div className="p-3 bg-gradient-to-r from-amber-500 to-yellow-600 rounded-xl shadow-lg">
                        <Clock className="w-6 h-6 text-white" />
              </div>
            </div>
                    <div className="mt-3 w-full bg-amber-200 rounded-full h-1">
                      <motion.div 
                        className="bg-gradient-to-r from-amber-500 to-yellow-600 h-1 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${(quickStats.pending / Math.max(quickStats.total, 1)) * 100}%` }}
                        transition={{ duration: 1, delay: 0.9 }}
                      />
          </div>
                  </motion.div>
                  
                  <motion.div 
                    whileHover={{ scale: 1.05, y: -2 }}
                    className="bg-gradient-to-br from-rose-50 to-red-100 p-6 rounded-2xl border border-rose-200/50 shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-rose-700 font-semibold mb-1">Overdue</p>
                        <motion.p 
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="text-3xl font-black text-rose-800"
                        >
                          {quickStats.overdue}
                        </motion.p>
              </div>
                      <div className="p-3 bg-gradient-to-r from-rose-500 to-red-600 rounded-xl shadow-lg">
                        <AlertTriangle className="w-6 h-6 text-white" />
              </div>
                    </div>
                    <div className="mt-3 w-full bg-rose-200 rounded-full h-1">
                      <motion.div 
                        className="bg-gradient-to-r from-rose-500 to-red-600 h-1 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${(quickStats.overdue / Math.max(quickStats.total, 1)) * 100}%` }}
                        transition={{ duration: 1, delay: 1.1 }}
                      />
                    </div>
                  </motion.div>
            </div>
          </div>
          
              <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-4 mt-8 lg:mt-0 lg:ml-8">
                <div className="flex items-center space-x-3">
                  <DarkModeToggle />
                  <UserDropdown />
              </div>
                
                <div className="flex items-center space-x-3">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowAnalytics(!showAnalytics)}
                    className="px-6 py-3 bg-white/80 backdrop-blur-sm hover:bg-white text-slate-700 rounded-xl flex items-center transition-all duration-200 shadow-lg hover:shadow-xl border border-slate-200/50"
                  >
                    <BarChart3 className="w-5 h-5 mr-2" />
                    Analytics
                  </motion.button>
                  
                  <motion.button
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleCreateChecklist}
                    className="px-8 py-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 text-white rounded-xl flex items-center transition-all duration-300 shadow-2xl hover:shadow-3xl transform hover:-translate-y-1 font-semibold"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Create Order
                  </motion.button>
              </div>
            </div>
          </div>
        </div>
        </motion.div>

        {/* Enhanced Filters and Controls with Glassmorphism */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-xl border border-white/30 mb-8 relative overflow-hidden"
        >
          {/* Decorative Background */}
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-400/10 to-indigo-600/10 rounded-full -translate-y-10 translate-x-10"></div>
          <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-tr from-purple-400/10 to-pink-600/10 rounded-full translate-y-8 -translate-x-8"></div>
          
          <div className="p-8 relative z-10">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              {/* Search and Basic Filters */}
              <div className="flex flex-col sm:flex-row gap-4 flex-1">
                <div className="relative flex-1">
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <input
                    type="text"
                      placeholder="Search orders, customers, vehicles..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-12 pr-4 py-4 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400 w-full bg-white/80 backdrop-blur-sm focus:bg-white transition-all duration-300 shadow-lg focus:shadow-xl"
                  />
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/5 to-indigo-500/5 opacity-0 focus-within:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                      className="px-4 py-4 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400 bg-white/80 backdrop-blur-sm focus:bg-white transition-all duration-300 shadow-lg focus:shadow-xl appearance-none pr-10 min-w-[140px]"
                >
                  <option value="">All Status</option>
                  <option value="not_started">Not Started</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="on_hold">On Hold</option>
                </select>
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                
                  <div className="relative">
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                      className="px-4 py-4 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400 bg-white/80 backdrop-blur-sm focus:bg-white transition-all duration-300 shadow-lg focus:shadow-xl appearance-none pr-10 min-w-[140px]"
                >
                  <option value="">All Priorities</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              </div>
              
              {/* View Controls */}
              <div className="flex items-center gap-4">
                <div className="flex items-center bg-slate-100/80 backdrop-blur-sm rounded-2xl p-1 shadow-lg">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setViewMode('grid')}
                    className={`p-3 rounded-xl transition-all duration-200 ${
                      viewMode === 'grid' 
                        ? 'bg-white shadow-lg text-blue-600' 
                        : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
                    }`}
                  >
                    <Grid className="w-4 h-4" />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setViewMode('list')}
                    className={`p-3 rounded-xl transition-all duration-200 ${
                      viewMode === 'list' 
                        ? 'bg-white shadow-lg text-blue-600' 
                        : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
                    }`}
                  >
                    <List className="w-4 h-4" />
                  </motion.button>
              </div>
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowFilters(!showFilters)}
                  className={`px-6 py-4 rounded-2xl flex items-center transition-all duration-200 shadow-lg hover:shadow-xl ${
                    showFilters 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-white/80 backdrop-blur-sm text-slate-700 hover:bg-white border border-slate-200'
                  }`}
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Filters
                </motion.button>
                
                <div className="relative">
                  <select
                    value={`${sortBy}-${sortOrder}`}
                    onChange={(e) => {
                      const [field, order] = e.target.value.split('-');
                      setSortBy(field);
                      setSortOrder(order);
                    }}
                    className="px-4 py-4 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400 bg-white/80 backdrop-blur-sm focus:bg-white transition-all duration-300 shadow-lg focus:shadow-xl appearance-none pr-10 min-w-[160px]"
                  >
                    <option value="created_at-desc">Newest First</option>
                    <option value="created_at-asc">Oldest First</option>
                    <option value="customer_name-asc">Customer A-Z</option>
                    <option value="customer_name-desc">Customer Z-A</option>
                    <option value="delivery_fee-desc">Highest Value</option>
                    <option value="delivery_fee-asc">Lowest Value</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
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
                  className="mt-8 pt-8 border-t border-slate-200/50"
                >
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-3">Date From</label>
                      <input
                        type="date"
                        value={dateRange.from}
                        onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400 bg-white/80 backdrop-blur-sm focus:bg-white transition-all duration-300 shadow-lg focus:shadow-xl"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-3">Date To</label>
                      <input
                        type="date"
                        value={dateRange.to}
                        onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400 bg-white/80 backdrop-blur-sm focus:bg-white transition-all duration-300 shadow-lg focus:shadow-xl"
                      />
                    </div>
                    <div className="flex items-end">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setDateRange({ from: '', to: '' })}
                        className="px-6 py-3 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all duration-200"
                      >
                        Clear Dates
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Bulk Actions Bar */}
        {selectedItems.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 text-blue-600 mr-3" />
                <span className="text-blue-800 font-medium">
                  {selectedItems.length} item{selectedItems.length > 1 ? 's' : ''} selected
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleBulkAction('status_update', selectedItems)}
                  className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  Update Status
                </button>
                <button
                  onClick={() => handleBulkAction('export', selectedItems)}
                  className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                >
                  Export Selected
                </button>
                <button
                  onClick={clearSelection}
                  className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm"
                >
                  Clear
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Enhanced Delivery Cards with Premium Design */}
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8' : 'space-y-6'}>
          <AnimatePresence>
            {sortedData.map((delivery, index) => {
            const StatusIcon = getStatusIcon(delivery.status);
              const progress = getProgressPercentage(delivery);
              const daysSince = getDaysSinceCreated(delivery.created_at);
              const overdue = isOverdue(delivery);
              const isExpanded = expandedCard === delivery.id;
              const isSelected = selectedItems.includes(delivery.id);
              
            return (
              <motion.div
                key={delivery.id}
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.95 }}
                  transition={{ delay: index * 0.1, type: "spring", stiffness: 100 }}
                  whileHover={{ y: -8, scale: 1.02 }}
                  className={`bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/30 hover:shadow-3xl transition-all duration-500 relative overflow-hidden group ${
                    isSelected ? 'ring-4 ring-blue-400/50 shadow-blue-200/50' : ''
                  } ${overdue ? 'border-l-4 border-l-red-500 shadow-red-100/50' : ''}`}
                >
                  {/* Decorative Background Elements */}
                  <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-400/10 to-indigo-600/10 rounded-full -translate-y-10 translate-x-10 group-hover:scale-110 transition-transform duration-500"></div>
                  <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-tr from-purple-400/10 to-pink-600/10 rounded-full translate-y-8 -translate-x-8 group-hover:scale-110 transition-transform duration-500"></div>
                  {/* Enhanced Card Header */}
                  <div className="p-8 border-b border-slate-200/50 relative z-10">
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex items-center space-x-5">
                        <div className="relative">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleItemSelection(delivery.id)}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          />
                          <motion.div 
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            className={`w-6 h-6 rounded-xl border-2 flex items-center justify-center transition-all duration-200 ${
                              isSelected 
                                ? 'bg-gradient-to-r from-blue-500 to-indigo-600 border-blue-500 shadow-lg' 
                                : 'border-slate-300 hover:border-blue-400 hover:bg-blue-50'
                            }`}
                          >
                            {isSelected && <CheckCircle className="w-4 h-4 text-white" />}
                          </motion.div>
                      </div>
                        
                        <div className="relative">
                          <div className="p-4 bg-gradient-to-r from-blue-500 via-indigo-600 to-purple-600 rounded-2xl shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                            <Truck className="w-7 h-7 text-white" />
                          </div>
                          <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full animate-pulse"></div>
                        </div>
                        
                        <div className="flex-1">
                          <h3 className="text-xl font-black text-slate-900 mb-2 group-hover:text-blue-600 transition-colors duration-300">
                          {delivery.order_number}
                        </h3>
                          <p className="text-slate-600 font-semibold text-lg mb-2">{delivery.customer_name}</p>
                          <div className="flex items-center">
                            <Phone className="w-4 h-4 text-slate-400 mr-2" />
                            <span className="text-sm text-slate-500 font-medium">{delivery.customer_phone}</span>
                          </div>
                      </div>
                    </div>
                    
                      <div className="flex items-center space-x-3">
                        <motion.span 
                          whileHover={{ scale: 1.05 }}
                          className={`px-4 py-2 rounded-xl text-xs font-bold shadow-lg ${getPriorityColor(delivery.priority)}`}
                        >
                          {delivery.priority.toUpperCase()}
                        </motion.span>
                        
                        <motion.span 
                          whileHover={{ scale: 1.05 }}
                          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center shadow-lg ${getStatusColor(delivery.status)}`}
                        >
                          <StatusIcon className="w-4 h-4 mr-2" />
                          {delivery.status.replace('_', ' ').toUpperCase()}
                        </motion.span>
                        
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => setExpandedCard(isExpanded ? null : delivery.id)}
                          className="p-3 hover:bg-slate-100 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
                        >
                          {isExpanded ? <ChevronDown className="w-5 h-5 text-slate-600" /> : <ChevronRight className="w-5 h-5 text-slate-600" />}
                        </motion.button>
                      </div>
                    </div>
                    
                    {/* Enhanced Progress Bar */}
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-bold text-slate-700">Progress</span>
                        <span className="text-lg font-black text-slate-900">{progress}%</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-3 shadow-inner">
                        <motion.div
                          className="bg-gradient-to-r from-blue-500 via-indigo-600 to-purple-600 h-3 rounded-full shadow-lg"
                          initial={{ width: 0 }}
                          animate={{ width: `${progress}%` }}
                          transition={{ duration: 1, delay: 0.5, type: "spring", stiffness: 100 }}
                        />
                    </div>
                  </div>
                  
                    {/* Enhanced Quick Info */}
                    <div className="grid grid-cols-2 gap-4">
                      <motion.div 
                        whileHover={{ scale: 1.05, y: -2 }}
                        className="text-center p-4 bg-gradient-to-br from-emerald-50 to-green-100 rounded-2xl border border-emerald-200/50 shadow-lg hover:shadow-xl transition-all duration-300"
                      >
                        <DollarSign className="w-6 h-6 text-emerald-600 mx-auto mb-2" />
                        <p className="text-xs text-emerald-700 font-semibold mb-1">Value</p>
                        <p className="text-xl font-black text-emerald-800">${delivery.delivery_fee || 0}</p>
                      </motion.div>
                      <motion.div 
                        whileHover={{ scale: 1.05, y: -2 }}
                        className={`text-center p-4 rounded-2xl border shadow-lg hover:shadow-xl transition-all duration-300 ${
                          overdue 
                            ? 'bg-gradient-to-br from-red-50 to-rose-100 border-red-200/50' 
                            : 'bg-gradient-to-br from-blue-50 to-cyan-100 border-blue-200/50'
                        }`}
                      >
                        <Clock className={`w-6 h-6 mx-auto mb-2 ${overdue ? 'text-red-600' : 'text-blue-600'}`} />
                        <p className={`text-xs font-semibold mb-1 ${overdue ? 'text-red-700' : 'text-blue-700'}`}>Days</p>
                        <p className={`text-xl font-black ${overdue ? 'text-red-800' : 'text-blue-800'}`}>
                          {daysSince}d
                        </p>
                      </motion.div>
                    </div>
                  </div>
                  
                  {/* Expanded Content */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="p-6 bg-gray-50"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Vehicle Info */}
                      <div>
                            <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                              <Truck className="w-4 h-4 mr-2 text-blue-600" />
                              Vehicle Details
                            </h4>
                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <span className="text-sm text-gray-600">Number:</span>
                                <span className="text-sm font-medium">{delivery.vehicle_number || 'Unassigned'}</span>
                              </div>
                        {delivery.vehicle_make && delivery.vehicle_model && (
                                <div className="flex justify-between">
                                  <span className="text-sm text-gray-600">Model:</span>
                                  <span className="text-sm font-medium">{delivery.vehicle_make} {delivery.vehicle_model}</span>
                                </div>
                        )}
                        {delivery.vehicle_plate && (
                                <div className="flex justify-between">
                                  <span className="text-sm text-gray-600">Plate:</span>
                                  <span className="text-sm font-medium">{delivery.vehicle_plate}</span>
                      </div>
                        )}
                      </div>
                    </div>
                          
                          {/* Driver Info */}
                      <div>
                            <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                              <User className="w-4 h-4 mr-2 text-blue-600" />
                              Driver Details
                            </h4>
                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <span className="text-sm text-gray-600">Name:</span>
                                <span className="text-sm font-medium">{delivery.driver_name || 'Unassigned'}</span>
                      </div>
                              {delivery.driver_phone && (
                                <div className="flex justify-between">
                                  <span className="text-sm text-gray-600">Phone:</span>
                                  <span className="text-sm font-medium">{delivery.driver_phone}</span>
                    </div>
                              )}
                              {delivery.driver_license && (
                                <div className="flex justify-between">
                                  <span className="text-sm text-gray-600">License:</span>
                                  <span className="text-sm font-medium">{delivery.driver_license}</span>
                                </div>
                              )}
                      </div>
                    </div>
                  </div>
                  
                        {/* Addresses */}
                        <div className="mt-6">
                          <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                            <MapPin className="w-4 h-4 mr-2 text-blue-600" />
                            Addresses
                          </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-3 bg-white rounded-lg border">
                              <p className="text-xs text-gray-500 mb-1">Pickup</p>
                        <p className="text-sm text-gray-900">{delivery.pickup_address}</p>
                      </div>
                            <div className="p-3 bg-white rounded-lg border">
                              <p className="text-xs text-gray-500 mb-1">Delivery</p>
                        <p className="text-sm text-gray-900">{delivery.delivery_address}</p>
                      </div>
                    </div>
                  </div>
                  
                        {/* Special Instructions */}
                  {delivery.special_instructions && (
                          <div className="mt-6">
                            <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                              <FileText className="w-4 h-4 mr-2 text-blue-600" />
                              Special Instructions
                            </h4>
                            <div className="p-3 bg-white rounded-lg border">
                              <p className="text-sm text-gray-700">{delivery.special_instructions}</p>
                            </div>
                    </div>
                  )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                  
                  {/* Enhanced Action Buttons */}
                  <div className="p-8 border-t border-slate-200/50 relative z-10">
                  <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <motion.button
                          whileHover={{ scale: 1.05, y: -2 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleStatusUpdate(delivery.id, 'in_progress')}
                          className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-600 text-white rounded-xl hover:from-blue-600 hover:to-cyan-700 transition-all duration-200 text-sm font-bold shadow-lg hover:shadow-xl flex items-center"
                        >
                          <Play className="w-4 h-4 mr-2" />
                          Start
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.05, y: -2 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleStatusUpdate(delivery.id, 'completed')}
                          className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl hover:from-emerald-600 hover:to-green-700 transition-all duration-200 text-sm font-bold shadow-lg hover:shadow-xl flex items-center"
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Complete
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.05, y: -2 }}
                          whileTap={{ scale: 0.95 }}
                          className="px-6 py-3 bg-gradient-to-r from-slate-500 to-slate-600 text-white rounded-xl hover:from-slate-600 hover:to-slate-700 transition-all duration-200 text-sm font-bold shadow-lg hover:shadow-xl flex items-center"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View
                        </motion.button>
                    </div>
                    
                      <div className="flex items-center space-x-2">
                        <motion.button
                          whileHover={{ scale: 1.1, rotate: 5 }}
                          whileTap={{ scale: 0.9 }}
                          className="p-3 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
                        >
                          <Edit className="w-5 h-5" />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.1, rotate: -5 }}
                          whileTap={{ scale: 0.9 }}
                          className="p-3 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
                        >
                          <Download className="w-5 h-5" />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          className="p-3 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
                        >
                          <MoreVertical className="w-5 h-5" />
                        </motion.button>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
          </AnimatePresence>
        </div>
        
        {/* Enhanced Empty State */}
        {sortedData.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-20 relative"
          >
            {/* Background Pattern */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-indigo-100/50 rounded-3xl"></div>
            
            <div className="relative z-10">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 100 }}
                className="mx-auto w-32 h-32 bg-gradient-to-br from-blue-100 to-indigo-200 rounded-full flex items-center justify-center mb-8 shadow-2xl"
              >
                <ClipboardList className="w-16 h-16 text-blue-600" />
              </motion.div>
              
              <motion.h3
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-3xl font-black text-slate-900 mb-4"
              >
                No delivery orders found
              </motion.h3>
              
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="text-slate-600 text-lg mb-8 max-w-md mx-auto"
              >
                Get started by creating your first delivery order and manage your fleet operations efficiently
              </motion.p>
              
              <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleCreateChecklist}
                className="px-8 py-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white rounded-2xl hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 transition-all duration-300 shadow-2xl hover:shadow-3xl font-bold text-lg"
              >
                <Plus className="w-6 h-6 mr-3 inline" />
                Create Delivery Order
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* Create Delivery Order Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900">Create Delivery Order</h2>
                  <Button
                    variant="outline"
                    onClick={() => setShowCreateModal(false)}
                  >
                    <XCircle className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              <form onSubmit={handleSubmit} className="p-6">
                <div className="space-y-6">
                  {/* Customer Details Section */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                      <User className="w-5 h-5 mr-2 text-blue-600" />
                      Customer Details
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="customer_name">Customer Name *</Label>
                        <Input
                          id="customer_name"
                          value={formData.customer_name}
                          onChange={(e) => setFormData({...formData, customer_name: e.target.value})}
                          required
                          placeholder="Enter customer name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="customer_phone">Phone Number *</Label>
                        <Input
                          id="customer_phone"
                          value={formData.customer_phone}
                          onChange={(e) => setFormData({...formData, customer_phone: e.target.value})}
                          required
                          placeholder="Enter phone number"
                        />
                      </div>
                      <div>
                        <Label htmlFor="customer_email">Email Address</Label>
                        <Input
                          id="customer_email"
                          type="email"
                          value={formData.customer_email}
                          onChange={(e) => setFormData({...formData, customer_email: e.target.value})}
                          placeholder="Enter email address"
                        />
                      </div>
                      <div>
                        <Label htmlFor="location">Location *</Label>
                        <Input
                          id="location"
                          value={formData.location}
                          onChange={(e) => setFormData({...formData, location: e.target.value})}
                          required
                          placeholder="Enter delivery location"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Fleet and Rental Details Section */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                      <Truck className="w-5 h-5 mr-2 text-blue-600" />
                      Fleet & Rental Details
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="desired_fleet">Desired Fleet</Label>
                        <select
                          id="desired_fleet"
                          value={formData.desired_fleet}
                          onChange={(e) => setFormData({...formData, desired_fleet: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Select Fleet Type</option>
                          <option value="sedan">Sedan</option>
                          <option value="suv">SUV</option>
                          <option value="truck">Truck</option>
                          <option value="van">Van</option>
                          <option value="luxury">Luxury</option>
                        </select>
                      </div>
                      <div>
                        <Label htmlFor="vehicle_number">Vehicle Number *</Label>
                        <Input
                          id="vehicle_number"
                          value={formData.vehicle_number}
                          onChange={(e) => setFormData({...formData, vehicle_number: e.target.value})}
                          required
                          placeholder="Enter vehicle number"
                        />
                      </div>
                      <div>
                        <Label htmlFor="vehicle_make">Vehicle Make *</Label>
                        <Input
                          id="vehicle_make"
                          value={formData.vehicle_make}
                          onChange={(e) => setFormData({...formData, vehicle_make: e.target.value})}
                          required
                          placeholder="Enter vehicle make (e.g., Toyota, Ford)"
                        />
                      </div>
                      <div>
                        <Label htmlFor="vehicle_model">Vehicle Model *</Label>
                        <Input
                          id="vehicle_model"
                          value={formData.vehicle_model}
                          onChange={(e) => setFormData({...formData, vehicle_model: e.target.value})}
                          required
                          placeholder="Enter vehicle model"
                        />
                      </div>
                      <div>
                        <Label htmlFor="vehicle_plate">License Plate</Label>
                        <Input
                          id="vehicle_plate"
                          value={formData.vehicle_plate}
                          onChange={(e) => setFormData({...formData, vehicle_plate: e.target.value})}
                          placeholder="Enter license plate number"
                        />
                      </div>
                      <div>
                        <Label htmlFor="rental_amount">Rental Amount *</Label>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                          <Input
                            id="rental_amount"
                            type="number"
                            step="0.01"
                            value={formData.rental_amount}
                            onChange={(e) => setFormData({...formData, rental_amount: e.target.value})}
                            required
                            placeholder="0.00"
                            className="pl-10"
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="confirm_amount">Confirm Amount *</Label>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                          <Input
                            id="confirm_amount"
                            type="number"
                            step="0.01"
                            value={formData.confirm_amount}
                            onChange={(e) => setFormData({...formData, confirm_amount: e.target.value})}
                            required
                            placeholder="0.00"
                            className="pl-10"
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="rental_duration">Rental Duration *</Label>
                        <select
                          id="rental_duration"
                          value={formData.rental_duration}
                          onChange={(e) => setFormData({...formData, rental_duration: e.target.value})}
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Select Duration</option>
                          <option value="1_hour">1 Hour</option>
                          <option value="2_hours">2 Hours</option>
                          <option value="4_hours">4 Hours</option>
                          <option value="8_hours">8 Hours</option>
                          <option value="1_day">1 Day</option>
                          <option value="2_days">2 Days</option>
                          <option value="3_days">3 Days</option>
                          <option value="1_week">1 Week</option>
                          <option value="2_weeks">2 Weeks</option>
                          <option value="1_month">1 Month</option>
                          <option value="custom">Custom</option>
                        </select>
                      </div>
                      {formData.rental_duration === 'custom' && (
                        <div>
                          <Label htmlFor="custom_duration">Custom Duration</Label>
                          <Input
                            id="custom_duration"
                            value={formData.custom_duration}
                            onChange={(e) => setFormData({...formData, custom_duration: e.target.value})}
                            placeholder="e.g., 5 days, 2 weeks, 3 months"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Assignment Details Section */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                      <Calendar className="w-5 h-5 mr-2 text-blue-600" />
                      Assignment Details
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div>
                        <Label htmlFor="driver_name">Driver Name</Label>
                        <Input
                          id="driver_name"
                          value={formData.driver_name}
                          onChange={(e) => setFormData({...formData, driver_name: e.target.value})}
                          placeholder="Enter driver name (if known)"
                        />
                      </div>
                      <div>
                        <Label htmlFor="driver_phone">Driver Phone</Label>
                        <Input
                          id="driver_phone"
                          value={formData.driver_phone}
                          onChange={(e) => setFormData({...formData, driver_phone: e.target.value})}
                          placeholder="Enter driver phone number (if known)"
                        />
                      </div>
                      <div>
                        <Label htmlFor="driver_license">Driver License Number</Label>
                        <Input
                          id="driver_license"
                          value={formData.driver_license}
                          onChange={(e) => setFormData({...formData, driver_license: e.target.value})}
                          placeholder="Enter driver license number"
                        />
                      </div>
                      <div>
                        <Label htmlFor="priority">Priority</Label>
                        <select
                          id="priority"
                          value={formData.priority}
                          onChange={(e) => setFormData({...formData, priority: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                          <option value="urgent">Urgent</option>
                        </select>
                      </div>
                      <div>
                        <Label htmlFor="delivery_date">Delivery Date</Label>
                        <Input
                          id="delivery_date"
                          type="date"
                          value={formData.delivery_date}
                          onChange={(e) => setFormData({...formData, delivery_date: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Special Notes Section */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                      <Package className="w-5 h-5 mr-2 text-blue-600" />
                      Additional Information
                    </h3>
                    <div>
                      <Label htmlFor="special_notes">Special Notes</Label>
                      <Textarea
                        id="special_notes"
                        value={formData.special_notes}
                        onChange={(e) => setFormData({...formData, special_notes: e.target.value})}
                        rows={4}
                        placeholder="Enter any special instructions, requirements, or notes for this delivery..."
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 mt-8 pt-6 border-t border-gray-200">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowCreateModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                    Create Delivery Order
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FleetDeliveryChecklist;




