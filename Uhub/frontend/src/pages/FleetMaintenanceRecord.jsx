import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { 
  FileText, 
  Wrench, 
  Plus, 
  Search, 
  Calendar,
  Car,
  DollarSign,
  TrendingUp,
  Eye,
  Edit,
  Trash,
  CheckCircle,
  XCircle,
  Settings,
  BarChart3,
  Activity,
  RefreshCw,
  SlidersHorizontal,
  ArrowUpDown,
  Ticket,
  AlertTriangle,
  Clock,
  User,
  MapPin,
  Building,
  Zap,
  ArrowRight,
  Tag,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import fleetService from '../services/fleetService';
import MaintenanceRecordModal from '../components/fleet/MaintenanceRecordModal';
import MaintenanceTicketModal from '../components/fleet/MaintenanceTicketModal';
import DetailsModal from '../components/fleet/DetailsModal';
import OperationBreadcrumb from '../components/operation/OperationBreadcrumb';
import FleetioSubNav from '../components/operation/FleetioSubNav';

const FleetMaintenanceRecord = () => {
  const { userProfile } = useAuth();
  const [activeTab, setActiveTab] = useState('records'); // 'records' or 'tickets'
  
  // Maintenance Records State
  const [maintenanceRecords, setMaintenanceRecords] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [ticketStatistics, setTicketStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [expandedTickets, setExpandedTickets] = useState(new Set()); // Track expanded tickets
  
  // Tickets State
  const [maintenanceTickets, setMaintenanceTickets] = useState([]);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [detailsData, setDetailsData] = useState(null);
  const [detailsType, setDetailsType] = useState('record');
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortBy, setSortBy] = useState('service_date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [showFilters, setShowFilters] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadMaintenanceRecords = useCallback(async () => {
    try {
      const filters = {
        status: statusFilter,
        maintenance_type: typeFilter,
        date_from: dateFrom,
        date_to: dateTo,
        search: searchTerm
      };

      const data = await fleetService.getMaintenanceRecords(null, filters);
      
      // Log for debugging - remove in production if needed
      console.log('Loaded maintenance records from database:', data?.length || 0, 'records');
      
      if (!data || data.length === 0) {
        setMaintenanceRecords([]);
        return;
      }
      
      const sortedData = [...data].sort((a, b) => {
        let aValue = a[sortBy];
        let bValue = b[sortBy];
        
        if (sortBy === 'service_date' || sortBy === 'next_service_date') {
          aValue = new Date(aValue);
          bValue = new Date(bValue);
        }
        
        if (sortBy === 'cost' || sortBy === 'labor_hours') {
          aValue = parseFloat(aValue) || 0;
          bValue = parseFloat(bValue) || 0;
        }
        
        if (sortOrder === 'asc') {
          return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
        } else {
          return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
        }
      });

      setMaintenanceRecords(sortedData);
    } catch (error) {
      console.error('Error loading maintenance records:', error);
      setMaintenanceRecords([]);
    }
  }, [statusFilter, typeFilter, dateFrom, dateTo, searchTerm, sortBy, sortOrder]);

  const loadMaintenanceTickets = useCallback(async () => {
    try {
      const filters = {
        status: statusFilter,
        maintenance_type: typeFilter,
        priority: priorityFilter,
        date_from: dateFrom,
        date_to: dateTo,
        search: searchTerm
      };

      const data = await fleetService.getMaintenanceTickets(filters);
      
      // Log for debugging - remove in production if needed
      console.log('Loaded maintenance tickets from database:', data?.length || 0, 'tickets');
      
      setMaintenanceTickets(data || []);
    } catch (error) {
      console.error('Error loading maintenance tickets:', error);
      setMaintenanceTickets([]);
    }
  }, [statusFilter, typeFilter, priorityFilter, dateFrom, dateTo, searchTerm]);

  const loadStatistics = useCallback(async () => {
    try {
      const stats = await fleetService.getMaintenanceStatistics();
      setStatistics(stats);
    } catch (error) {
      console.error('Error loading statistics:', error);
    }
  }, []);

  const loadTicketStatistics = useCallback(async () => {
    try {
      const stats = await fleetService.getTicketStatistics();
      setTicketStatistics(stats);
    } catch (error) {
      console.error('Error loading ticket statistics:', error);
    }
  }, []);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadMaintenanceRecords(),
        loadMaintenanceTickets(),
        loadStatistics(),
        loadTicketStatistics()
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }, [loadMaintenanceRecords, loadMaintenanceTickets, loadStatistics, loadTicketStatistics]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      if (activeTab === 'records') {
        loadMaintenanceRecords();
      } else {
        loadMaintenanceTickets();
      }
    }, 300);

    return () => clearTimeout(delayedSearch);
  }, [searchTerm, statusFilter, typeFilter, priorityFilter, dateFrom, dateTo, activeTab, loadMaintenanceRecords, loadMaintenanceTickets]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleCreateRecord = () => {
    if (!userProfile?.id) {
      alert('You must be linked to an employee record to create maintenance records. Please contact your administrator.');
      return;
    }
    setSelectedRecord(null);
    setShowCreateModal(true);
  };

  const handleCreateTicket = () => {
    if (!userProfile?.id) {
      alert('You must be linked to an employee record to create tickets. Please contact your administrator.');
      return;
    }
    setSelectedTicket(null);
    setShowTicketModal(true);
  };

  const handleEditRecord = (record) => {
    setSelectedRecord(record);
    setShowCreateModal(true);
  };

  const handleEditTicket = (ticket) => {
    setSelectedTicket(ticket);
    setShowTicketModal(true);
  };

  const handleDeleteRecord = async (recordId) => {
    if (window.confirm('Are you sure you want to delete this maintenance record?')) {
      try {
        console.log('Attempting to delete maintenance record:', recordId);
        const result = await fleetService.deleteMaintenanceRecord(recordId);
        console.log('Delete result:', result);
        
        // Optimistically update UI
        setMaintenanceRecords(prev => prev.filter(r => r.id !== recordId));
        
        // Reload data to ensure consistency
        await loadMaintenanceRecords();
        await loadStatistics();
        
        // Show success message
        alert('Maintenance record deleted successfully');
      } catch (error) {
        console.error('Error deleting maintenance record:', error);
        alert(`Failed to delete maintenance record: ${error.message || error}`);
        // Reload to show current state
        await loadMaintenanceRecords();
      }
    }
  };

  const handleDeleteTicket = async (ticketId) => {
    if (window.confirm('Are you sure you want to delete this ticket?')) {
      try {
        console.log('Attempting to delete maintenance ticket:', ticketId);
        const result = await fleetService.deleteMaintenanceTicket(ticketId);
        console.log('Delete result:', result);
        
        // Optimistically update UI
        setMaintenanceTickets(prev => prev.filter(t => t.id !== ticketId));
        
        // Reload data to ensure consistency
        await loadMaintenanceTickets();
        await loadTicketStatistics();
        
        // Show success message
        alert('Maintenance ticket deleted successfully');
      } catch (error) {
        console.error('Error deleting ticket:', error);
        alert(`Failed to delete ticket: ${error.message || error}`);
        // Reload to show current state
        await loadMaintenanceTickets();
      }
    }
  };

  const handleViewDetails = (data, type) => {
    setDetailsData(data);
    setDetailsType(type);
    setShowDetailsModal(true);
  };

  const handleStatusChange = async (ticketId, newStatus) => {
    try {
      const updates = { status: newStatus };
      
      // If status is being set to Completed or Closed, set completed_at
      if (newStatus === 'Completed' || newStatus === 'Closed') {
        updates.completed_at = new Date().toISOString();
      }

      await fleetService.updateMaintenanceTicket(ticketId, updates);
      
      // Reload data to show updated status and any auto-created records
      await loadData();
      
      // Show success message
      if (newStatus === 'Completed' || newStatus === 'Closed') {
        alert('Ticket status updated. Maintenance record has been automatically created.');
      } else {
        alert('Ticket status updated successfully.');
      }
    } catch (error) {
      console.error('Error updating ticket status:', error);
      alert(`Failed to update status: ${error.message || 'Unknown error'}`);
      // Reload to show current state
      await loadMaintenanceTickets();
    }
  };

  const handleConvertTicketToRecord = async (ticket) => {
    if (!userProfile?.id) {
      alert('You must be linked to an employee record to convert tickets. Please contact your administrator.');
      return;
    }

    if (window.confirm('Convert this ticket to a maintenance record?')) {
      try {
        const maintenanceData = {
          vehicle_id: ticket.vehicle_id,
          maintenance_type: ticket.maintenance_type,
          description: ticket.description || ticket.title,
          service_provider: '',
          cost: ticket.estimated_cost || ticket.actual_cost || null,
          mileage_at_service: ticket.mileage_at_request,
          service_date: ticket.service_date || new Date().toISOString().split('T')[0],
          next_service_date: ticket.estimated_completion_date,
          status: 'Completed',
          technician_notes: ticket.notes || '',
          parts_replaced: [],
          labor_hours: null,
          invoice_number: '',
          created_by: userProfile.id // This is the employee_id
        };

        await fleetService.convertTicketToMaintenanceRecord(ticket.id, maintenanceData);
        await loadData();
        alert('Ticket converted to maintenance record successfully!');
      } catch (error) {
        console.error('Error converting ticket:', error);
        alert(`Failed to convert ticket: ${error.message || 'Unknown error'}`);
      }
    }
  };

  const isAdmin = userProfile?.role === 'admin' || userProfile?.role === 'manager' || userProfile?.role === 'fleet_manager';

  const handleModalSuccess = () => {
    setShowCreateModal(false);
    setShowTicketModal(false);
    setSelectedRecord(null);
    setSelectedTicket(null);
    loadData();
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('');
    setTypeFilter('');
    setPriorityFilter('');
    setDateFrom('');
    setDateTo('');
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
    if (activeTab === 'records') {
    loadMaintenanceRecords();
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed': case 'closed': return 'bg-green-100 text-green-800 border-green-200';
      case 'in progress': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'scheduled': case 'assigned': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      case 'open': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'pending parts': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeColor = (type) => {
    switch (type?.toLowerCase()) {
      case 'scheduled': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'repair': return 'bg-red-100 text-red-800 border-red-200';
      case 'inspection': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'emergency': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed': case 'closed': return CheckCircle;
      case 'in progress': return Settings;
      case 'scheduled': case 'assigned': return Clock;
      case 'cancelled': return XCircle;
      case 'open': return AlertTriangle;
      case 'pending parts': return Clock;
      default: return Clock;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    if (!amount) return 'AED 0.00';
    return new Intl.NumberFormat('en-AE', {
      style: 'currency',
      currency: 'AED'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
            <Wrench className="w-6 h-6 text-blue-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
          </div>
          <p className="text-gray-700 font-medium">Loading Fleet Maintenance System...</p>
          <p className="text-gray-500 text-sm mt-1">Please wait while we fetch your data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <OperationBreadcrumb
          items={[
            { label: 'UDrive Fleetio', href: '/operation/fleetio/modules' },
            { label: 'Maintenance' },
          ]}
        />
        <div className="mb-6 border-b border-gray-200 pb-3">
          <FleetioSubNav />
        </div>
        {/* Enhanced Header */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 flex items-center mb-2">
                <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-3 rounded-2xl mr-4 shadow-lg">
                  <Wrench className="w-8 h-8 text-white" />
                </div>
                Fleet Maintenance Management
              </h1>
              <p className="text-gray-600 mt-2 text-lg">
                Comprehensive fleet maintenance tracking and ticketing system
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="bg-white hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-xl border border-gray-300 flex items-center transition-all shadow-sm hover:shadow-md"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="bg-white hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-xl border border-gray-300 flex items-center transition-all shadow-sm hover:shadow-md"
              >
                <SlidersHorizontal className="w-4 h-4 mr-2" />
                Filters
              </button>
              {activeTab === 'records' ? (
              <button
                onClick={handleCreateRecord}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3 rounded-xl flex items-center transition-all shadow-lg hover:shadow-xl"
              >
                <Plus className="w-5 h-5 mr-2" />
                Add Record
              </button>
              ) : (
                <button
                  onClick={handleCreateTicket}
                  className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white px-6 py-3 rounded-xl flex items-center transition-all shadow-lg hover:shadow-xl"
                >
                  <Ticket className="w-5 h-5 mr-2" />
                  Create Ticket
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="bg-white rounded-2xl shadow-lg p-2 inline-flex border border-gray-200">
            <button
              onClick={() => setActiveTab('records')}
              className={`px-6 py-3 rounded-xl font-medium transition-all flex items-center ${
                activeTab === 'records'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <FileText className="w-5 h-5 mr-2" />
              Maintenance Records
              {maintenanceRecords.length > 0 && (
                <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                  activeTab === 'records' ? 'bg-white/20' : 'bg-gray-200'
                }`}>
                  {maintenanceRecords.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('tickets')}
              className={`px-6 py-3 rounded-xl font-medium transition-all flex items-center ${
                activeTab === 'tickets'
                  ? 'bg-gradient-to-r from-orange-600 to-red-600 text-white shadow-md'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Ticket className="w-5 h-5 mr-2" />
              Maintenance Tickets
              {maintenanceTickets.length > 0 && (
                <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                  activeTab === 'tickets' ? 'bg-white/20' : 'bg-gray-200'
                }`}>
                  {maintenanceTickets.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Enhanced Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {activeTab === 'records' ? (
            <>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
                className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl shadow-lg p-6 border-2 border-blue-200 hover:shadow-xl transition-all hover:scale-105"
          >
            <div className="flex items-center justify-between">
              <div>
                    <p className="text-sm font-semibold text-blue-700 mb-1 uppercase tracking-wide">Total Records</p>
                    <p className="text-4xl font-bold text-blue-900">{statistics?.totalRecords || maintenanceRecords.length}</p>
                    <p className="text-sm text-blue-600 mt-2 flex items-center font-medium">
                      <TrendingUp className="w-4 h-4 mr-1" />
                  All time
                </p>
              </div>
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg">
                    <FileText className="w-10 h-10 text-white" />
              </div>
            </div>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
                className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl shadow-lg p-6 border-2 border-green-200 hover:shadow-xl transition-all hover:scale-105"
          >
            <div className="flex items-center justify-between">
              <div>
                    <p className="text-sm font-semibold text-green-700 mb-1 uppercase tracking-wide">Completed</p>
                    <p className="text-4xl font-bold text-green-900">
                  {statistics?.statusBreakdown?.Completed || maintenanceRecords.filter(r => r.status?.toLowerCase() === 'completed').length}
                </p>
                    <p className="text-sm text-green-600 mt-2 flex items-center font-medium">
                      <CheckCircle className="w-4 h-4 mr-1" />
                  Success rate
                </p>
              </div>
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-green-500 to-green-600 shadow-lg">
                    <CheckCircle className="w-10 h-10 text-white" />
              </div>
            </div>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
                className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-2xl shadow-lg p-6 border-2 border-yellow-200 hover:shadow-xl transition-all hover:scale-105"
          >
            <div className="flex items-center justify-between">
              <div>
                    <p className="text-sm font-semibold text-yellow-700 mb-1 uppercase tracking-wide">In Progress</p>
                    <p className="text-4xl font-bold text-yellow-900">
                  {statistics?.statusBreakdown?.['In Progress'] || maintenanceRecords.filter(r => r.status?.toLowerCase() === 'in progress').length}
                </p>
                    <p className="text-sm text-yellow-600 mt-2 flex items-center font-medium">
                      <Activity className="w-4 h-4 mr-1" />
                  Active
                </p>
              </div>
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-yellow-500 to-yellow-600 shadow-lg">
                    <Settings className="w-10 h-10 text-white" />
              </div>
            </div>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
                className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl shadow-lg p-6 border-2 border-purple-200 hover:shadow-xl transition-all hover:scale-105"
          >
            <div className="flex items-center justify-between">
              <div>
                    <p className="text-sm font-semibold text-purple-700 mb-1 uppercase tracking-wide">Total Cost</p>
                    <p className="text-3xl font-bold text-purple-900">
                  {formatCurrency(statistics?.totalCost || maintenanceRecords.reduce((sum, r) => sum + (r.cost || 0), 0))}
                </p>
                    <p className="text-sm text-purple-600 mt-2 flex items-center font-medium">
                      <BarChart3 className="w-4 h-4 mr-1" />
                  Investment
                </p>
              </div>
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 shadow-lg">
                    <DollarSign className="w-10 h-10 text-white" />
              </div>
            </div>
          </motion.div>
            </>
          ) : (
            <>
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl shadow-lg p-6 border-2 border-gray-200 hover:shadow-xl transition-all hover:scale-105"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-700 mb-1 uppercase tracking-wide">Open Tickets</p>
                    <p className="text-4xl font-bold text-gray-900">{ticketStatistics?.open_tickets || maintenanceTickets.filter(t => t.status === 'Open').length}</p>
                    <p className="text-sm text-gray-600 mt-2 flex items-center font-medium">
                      <Activity className="w-4 h-4 mr-1" />
                      Needs attention
                    </p>
                  </div>
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-gray-500 to-gray-600 shadow-lg">
                    <Ticket className="w-10 h-10 text-white" />
                  </div>
                </div>
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl shadow-lg p-6 border-2 border-blue-200 hover:shadow-xl transition-all hover:scale-105"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-blue-700 mb-1 uppercase tracking-wide">In Progress</p>
                    <p className="text-4xl font-bold text-blue-900">{ticketStatistics?.in_progress_tickets || maintenanceTickets.filter(t => t.status === 'In Progress').length}</p>
                    <p className="text-sm text-blue-600 mt-2 flex items-center font-medium">
                      <Activity className="w-4 h-4 mr-1" />
                      Active work
                    </p>
                  </div>
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg">
                    <Settings className="w-10 h-10 text-white" />
                  </div>
                </div>
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-gradient-to-br from-red-50 to-red-100 rounded-2xl shadow-lg p-6 border-2 border-red-200 hover:shadow-xl transition-all hover:scale-105"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-red-700 mb-1 uppercase tracking-wide">Urgent</p>
                    <p className="text-4xl font-bold text-red-900">{ticketStatistics?.urgent_tickets || maintenanceTickets.filter(t => t.priority === 'Urgent').length}</p>
                    <p className="text-sm text-red-600 mt-2 flex items-center font-medium">
                      <Zap className="w-4 h-4 mr-1" />
                      High priority
                    </p>
                  </div>
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-red-500 to-red-600 shadow-lg">
                    <AlertTriangle className="w-10 h-10 text-white" />
                  </div>
                </div>
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl shadow-lg p-6 border-2 border-green-200 hover:shadow-xl transition-all hover:scale-105"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-green-700 mb-1 uppercase tracking-wide">Completed</p>
                    <p className="text-4xl font-bold text-green-900">{ticketStatistics?.completed_tickets || maintenanceTickets.filter(t => t.status === 'Completed').length}</p>
                    <p className="text-sm text-green-600 mt-2 flex items-center font-medium">
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Resolved
                    </p>
                  </div>
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-green-500 to-green-600 shadow-lg">
                    <CheckCircle className="w-10 h-10 text-white" />
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </div>

        {/* Enhanced Filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-white rounded-2xl shadow-lg mb-6 overflow-hidden"
            >
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="text"
                        placeholder={activeTab === 'records' ? 'Search records...' : 'Search tickets...'}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    >
                      <option value="">All Status</option>
                      {activeTab === 'records' ? (
                        <>
                      <option value="Completed">Completed</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Scheduled">Scheduled</option>
                      <option value="Cancelled">Cancelled</option>
                        </>
                      ) : (
                        <>
                          <option value="Open">Open</option>
                          <option value="Assigned">Assigned</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Pending Parts">Pending Parts</option>
                          <option value="Completed">Completed</option>
                          <option value="Cancelled">Cancelled</option>
                          <option value="Closed">Closed</option>
                        </>
                      )}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                    <select
                      value={typeFilter}
                      onChange={(e) => setTypeFilter(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    >
                      <option value="">All Types</option>
                      <option value="Scheduled">Scheduled</option>
                      <option value="Repair">Repair</option>
                      <option value="Inspection">Inspection</option>
                      <option value="Emergency">Emergency</option>
                    </select>
                  </div>

                  {activeTab === 'tickets' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                      <select
                        value={priorityFilter}
                        onChange={(e) => setPriorityFilter(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      >
                        <option value="">All Priorities</option>
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                        <option value="Urgent">Urgent</option>
                      </select>
                    </div>
                  )}
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">From Date</label>
                    <input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">To Date</label>
                    <input
                      type="date"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  </div>
                </div>
                
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={clearFilters}
                      className="text-gray-600 hover:text-gray-800 text-sm font-medium"
                    >
                      Clear Filters
                    </button>
                    <span className="text-sm text-gray-500">
                      Showing {activeTab === 'records' ? maintenanceRecords.length : maintenanceTickets.length} {activeTab === 'records' ? 'records' : 'tickets'}
                    </span>
                  </div>
                  
                  {activeTab === 'records' && (
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">Sort by:</span>
                    <button
                      onClick={() => handleSort('service_date')}
                      className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
                        sortBy === 'service_date' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      Date <ArrowUpDown className="w-3 h-3 inline ml-1" />
                    </button>
                    <button
                      onClick={() => handleSort('cost')}
                      className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
                        sortBy === 'cost' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      Cost <ArrowUpDown className="w-3 h-3 inline ml-1" />
                    </button>
                  </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Content Area - Records or Tickets */}
        {activeTab === 'records' ? (
        <div className="space-y-4">
          {maintenanceRecords.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white rounded-2xl shadow-lg p-12 text-center"
            >
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No maintenance records found</h3>
                <p className="text-gray-600 mb-6">Get started by adding your first maintenance record or converting a ticket.</p>
                <div className="flex items-center justify-center space-x-3">
              <button
                onClick={handleCreateRecord}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl flex items-center transition-all"
              >
                <Plus className="w-5 h-5 mr-2" />
                    Add Record
              </button>
                  {maintenanceTickets.length > 0 && (
                    <button
                      onClick={() => setActiveTab('tickets')}
                      className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-xl flex items-center transition-all"
                    >
                      <Ticket className="w-5 h-5 mr-2" />
                      View Tickets
                    </button>
                  )}
                </div>
            </motion.div>
          ) : (
            maintenanceRecords.map((record, index) => {
              const StatusIcon = getStatusIcon(record.status);
                const getTypeGradient = (type) => {
                  switch (type?.toLowerCase()) {
                    case 'repair': return 'from-red-500 to-red-600';
                    case 'emergency': return 'from-orange-500 to-orange-600';
                    case 'scheduled': return 'from-blue-500 to-blue-600';
                    case 'inspection': return 'from-purple-500 to-purple-600';
                    default: return 'from-gray-500 to-gray-600';
                  }
                };
                
              return (
                <motion.div
                  key={record.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-200 overflow-hidden group"
                  >
                    {/* Header Section with Gradient */}
                    <div className={`bg-gradient-to-r ${getTypeGradient(record.maintenance_type)} p-6 text-white`}>
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-4 flex-1">
                          <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl group-hover:scale-110 transition-transform shadow-lg">
                            <Wrench className="w-7 h-7 text-white" />
                        </div>
                          <div className="flex-1">
                            <h3 className="text-2xl font-bold mb-2 line-clamp-2">
                              {record.description || 'Maintenance Record'}
                          </h3>
                            <div className="flex items-center space-x-3 text-white/90">
                              <div className="flex items-center space-x-1">
                                <Car className="w-4 h-4" />
                                <span className="text-sm font-medium">
                                  {record.fleet_vehicles?.vehicle_number || 'N/A'}
                                </span>
                              </div>
                              {record.fleet_vehicles && (
                                <>
                                  <span className="text-white/50">•</span>
                                  <span className="text-sm">
                                    {record.fleet_vehicles.make} {record.fleet_vehicles.model}
                                  </span>
                                </>
                              )}
                            </div>
                        </div>
                      </div>
                      
                        <div className="flex flex-col items-end space-y-2 ml-4">
                          <div className="flex items-center space-x-2">
                            <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-lg text-sm font-medium border border-white/30">
                          {record.maintenance_type}
                        </span>
                            <span className={`px-3 py-1 rounded-lg text-sm font-medium border flex items-center ${
                              record.status === 'Completed' ? 'bg-green-500/20 border-green-300' :
                              record.status === 'In Progress' ? 'bg-blue-500/20 border-blue-300' :
                              'bg-yellow-500/20 border-yellow-300'
                            }`}>
                              <StatusIcon className="w-4 h-4 mr-1" />
                          {record.status}
                        </span>
                          </div>
                        <div className="text-right">
                            <p className="text-xs text-white/80 uppercase tracking-wide">Total Cost</p>
                            <p className="text-3xl font-bold">{formatCurrency(record.cost || 0)}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Content Section */}
                    <div className="p-6">
                      
                      {/* Key Information Grid */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl p-4 border border-blue-200 hover:shadow-md transition-shadow">
                          <div className="flex items-center space-x-2 mb-2">
                            <div className="p-2 bg-blue-500 rounded-lg">
                              <Calendar className="w-4 h-4 text-white" />
                        </div>
                            <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">Service Date</p>
                          </div>
                          <p className="text-lg font-bold text-gray-900">{formatDate(record.service_date)}</p>
                      </div>
                      
                        <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-xl p-4 border border-purple-200 hover:shadow-md transition-shadow">
                          <div className="flex items-center space-x-2 mb-2">
                            <div className="p-2 bg-purple-500 rounded-lg">
                              <Building className="w-4 h-4 text-white" />
                        </div>
                            <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">Provider</p>
                      </div>
                          <p className="text-lg font-bold text-gray-900 truncate" title={record.service_provider || 'Not specified'}>
                            {record.service_provider || 'Not specified'}
                          </p>
                        </div>
                        
                        <div className="bg-gradient-to-br from-green-50 to-green-100/50 rounded-xl p-4 border border-green-200 hover:shadow-md transition-shadow">
                          <div className="flex items-center space-x-2 mb-2">
                            <div className="p-2 bg-green-500 rounded-lg">
                              <MapPin className="w-4 h-4 text-white" />
                            </div>
                            <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">Mileage</p>
                          </div>
                          <p className="text-lg font-bold text-gray-900">
                            {record.mileage_at_service ? `${record.mileage_at_service.toLocaleString()} km` : 'N/A'}
                          </p>
                      </div>
                      
                        <div className="bg-gradient-to-br from-orange-50 to-orange-100/50 rounded-xl p-4 border border-orange-200 hover:shadow-md transition-shadow">
                          <div className="flex items-center space-x-2 mb-2">
                            <div className="p-2 bg-orange-500 rounded-lg">
                              <Clock className="w-4 h-4 text-white" />
                        </div>
                            <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">Labor Hours</p>
                          </div>
                          <p className="text-lg font-bold text-gray-900">{record.labor_hours ? `${record.labor_hours}h` : '0h'}</p>
                      </div>
                    </div>
                    
                    {/* Parts Replaced */}
                    {record.parts_replaced && record.parts_replaced.length > 0 && (
                        <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
                          <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                            <Tag className="w-4 h-4 mr-2 text-blue-600" />
                            Parts Replaced
                          </h4>
                        <div className="flex flex-wrap gap-2">
                          {record.parts_replaced.map((part, partIndex) => (
                            <span
                              key={partIndex}
                                className="px-4 py-2 bg-white text-blue-700 text-sm font-medium rounded-lg border border-blue-200 shadow-sm hover:shadow-md transition-shadow"
                            >
                              {part}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                      {/* Next Service Alert */}
                    {record.next_service_date && (
                        <div className="mb-6 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl border-2 border-yellow-300 shadow-sm">
                          <div className="flex items-center space-x-3">
                            <div className="p-2 bg-yellow-400 rounded-lg">
                              <Calendar className="w-5 h-5 text-yellow-900" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-yellow-900">Next Service Due</p>
                              <p className="text-lg font-bold text-yellow-900">{formatDate(record.next_service_date)}</p>
                            </div>
                          </div>
                      </div>
                    )}
                    
                      {/* Actions Footer */}
                      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                        <div className="flex items-center space-x-3">
                        <button 
                          onClick={() => handleEditRecord(record)}
                            className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg flex items-center text-sm font-medium transition-all hover:shadow-md"
                        >
                            <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </button>
                          <button 
                            onClick={() => handleViewDetails(record, 'record')}
                            className="px-4 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg flex items-center text-sm font-medium transition-all hover:shadow-md"
                          >
                            <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </button>
                          {/* Only show delete if admin OR record not converted from ticket */}
                          {(isAdmin || !record.converted_from_ticket) && (
                        <button 
                          onClick={() => handleDeleteRecord(record.id)}
                              className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg flex items-center text-sm font-medium transition-all hover:shadow-md"
                        >
                              <Trash className="w-4 h-4 mr-2" />
                          Delete
                        </button>
                          )}
                      </div>
                      
                      {record.employees && (
                          <div className="flex items-center space-x-2 text-sm text-gray-600 bg-gray-50 px-4 py-2 rounded-lg">
                            <User className="w-4 h-4 text-gray-400" />
                            <span className="font-medium">Created by</span>
                            <span className="font-semibold text-gray-900">{record.employees.full_name}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
        ) : (
          <div className="space-y-4">
            {maintenanceTickets.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-white rounded-2xl shadow-lg p-12 text-center"
              >
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Ticket className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No maintenance tickets found</h3>
                <p className="text-gray-600 mb-6">Create a ticket to request maintenance for a vehicle.</p>
                <button
                  onClick={handleCreateTicket}
                  className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-xl flex items-center mx-auto transition-all"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Create First Ticket
                </button>
              </motion.div>
            ) : (
              maintenanceTickets.map((ticket, index) => {
                const StatusIcon = getStatusIcon(ticket.status);
                const isExpanded = expandedTickets.has(ticket.id);
                const getPriorityGradient = (priority) => {
                  switch (priority?.toLowerCase()) {
                    case 'urgent': return 'from-red-500 to-red-600';
                    case 'high': return 'from-orange-500 to-orange-600';
                    case 'medium': return 'from-yellow-500 to-yellow-600';
                    case 'low': return 'from-green-500 to-green-600';
                    default: return 'from-orange-400 to-orange-500';
                  }
                };

                const toggleTicket = () => {
                  setExpandedTickets(prev => {
                    const newSet = new Set(prev);
                    if (newSet.has(ticket.id)) {
                      newSet.delete(ticket.id);
                    } else {
                      newSet.add(ticket.id);
                    }
                    return newSet;
                  });
                };
                
                return (
                  <motion.div
                    key={ticket.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-200 overflow-hidden group"
                  >
                    {/* Header Section with Gradient - Clickable */}
                    <div 
                      className={`bg-gradient-to-r ${getPriorityGradient(ticket.priority)} p-6 text-white cursor-pointer hover:opacity-95 transition-opacity`}
                      onClick={toggleTicket}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-4 flex-1">
                          <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl group-hover:scale-110 transition-transform shadow-lg">
                            <Ticket className="w-7 h-7 text-white" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <h3 className="text-2xl font-bold line-clamp-1">
                                {ticket.title}
                              </h3>
                              <span className="px-2 py-1 bg-white/20 backdrop-blur-sm text-white text-xs font-mono rounded border border-white/30">
                                {ticket.ticket_number}
                              </span>
                            </div>
                            <p className="text-white/90 mb-2 line-clamp-2">{ticket.description}</p>
                            <div className="flex items-center space-x-3 text-white/90 flex-wrap">
                              {ticket.vehicle_id_text && (
                                <div className="flex items-center space-x-1">
                                  <Car className="w-4 h-4" />
                                  <span className="text-sm font-medium">
                                    {ticket.vehicle_id_text}
                                  </span>
                                </div>
                              )}
                              {ticket.vehicle_plate_number && (
                                <>
                                  {ticket.vehicle_id_text && <span className="text-white/50">•</span>}
                                  <span className="text-sm font-medium">
                                    {ticket.vehicle_plate_number}
                                  </span>
                                </>
                              )}
                              {ticket.vehicle_model && (
                                <>
                                  {(ticket.vehicle_id_text || ticket.vehicle_plate_number) && <span className="text-white/50">•</span>}
                                  <span className="text-sm">
                                    {ticket.vehicle_model}
                                  </span>
                                </>
                              )}
                              {ticket.vehicle_year && (
                                <>
                                  {(ticket.vehicle_id_text || ticket.vehicle_plate_number || ticket.vehicle_model) && <span className="text-white/50">•</span>}
                                  <span className="text-sm">
                                    {ticket.vehicle_year}
                                  </span>
                                </>
                              )}
                              {ticket.vehicle_color && (
                                <>
                                  {(ticket.vehicle_id_text || ticket.vehicle_plate_number || ticket.vehicle_model || ticket.vehicle_year) && <span className="text-white/50">•</span>}
                                  <span className="text-sm">
                                    {ticket.vehicle_color}
                                  </span>
                                </>
                              )}
                              {!ticket.vehicle_id_text && !ticket.vehicle_plate_number && ticket.fleet_vehicles && (
                                <>
                                  <div className="flex items-center space-x-1">
                                    <Car className="w-4 h-4" />
                                    <span className="text-sm font-medium">
                                      {ticket.fleet_vehicles.vehicle_number || 'N/A'}
                                    </span>
                                  </div>
                                  <span className="text-white/50">•</span>
                                  <span className="text-sm">
                                    {ticket.fleet_vehicles.make} {ticket.fleet_vehicles.model}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex flex-col items-end space-y-2 ml-4">
                          <div className="flex items-center space-x-2">
                            <span className={`px-3 py-1 bg-white/20 backdrop-blur-sm rounded-lg text-sm font-medium border border-white/30`}>
                              {ticket.priority} Priority
                            </span>
                            {/* Status Dropdown */}
                            <select
                              value={ticket.status}
                              onChange={(e) => {
                                e.stopPropagation(); // Prevent header click
                                handleStatusChange(ticket.id, e.target.value);
                              }}
                              onClick={(e) => e.stopPropagation()} // Prevent header click
                              className={`px-3 py-1 rounded-lg text-sm font-medium border cursor-pointer focus:outline-none focus:ring-2 focus:ring-white/50 ${
                                ticket.status === 'Completed' || ticket.status === 'Closed' 
                                  ? 'bg-green-500/20 border-green-300 text-white' 
                                  : 'bg-white/20 border-white/30 text-white'
                              }`}
                              disabled={ticket.status === 'Completed' || ticket.status === 'Closed'}
                            >
                              <option value="Open" className="text-gray-900">Open</option>
                              <option value="Assigned" className="text-gray-900">Assigned</option>
                              <option value="In Progress" className="text-gray-900">In Progress</option>
                              <option value="Pending Parts" className="text-gray-900">Pending Parts</option>
                              <option value="Completed" className="text-gray-900">Completed</option>
                              <option value="Cancelled" className="text-gray-900">Cancelled</option>
                              <option value="Closed" className="text-gray-900">Closed</option>
                            </select>
                            {/* Expand/Collapse Button */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleTicket();
                              }}
                              className="p-2 bg-white/20 backdrop-blur-sm rounded-lg hover:bg-white/30 transition-all border border-white/30 flex items-center justify-center"
                              title={isExpanded ? 'Collapse' : 'Expand'}
                            >
                              {isExpanded ? (
                                <ChevronUp className="w-5 h-5 text-white" />
                              ) : (
                                <ChevronDown className="w-5 h-5 text-white" />
                              )}
                            </button>
                          </div>
                          {ticket.estimated_cost && (
                            <div className="text-right">
                              <p className="text-xs text-white/80 uppercase tracking-wide">Est. Cost</p>
                              <p className="text-2xl font-bold">{formatCurrency(ticket.estimated_cost)}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Content Section - Collapsible */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3, ease: 'easeInOut' }}
                          className="overflow-hidden"
                        >
                          <div className="p-6">
                            {/* Key Information Grid */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                              <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl p-4 border border-blue-200 hover:shadow-md transition-shadow">
                                <div className="flex items-center space-x-2 mb-2">
                                  <div className="p-2 bg-blue-500 rounded-lg">
                                    <Calendar className="w-4 h-4 text-white" />
                                  </div>
                                  <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">Created</p>
                                </div>
                                <p className="text-lg font-bold text-gray-900">{formatDate(ticket.created_at)}</p>
                              </div>
                              
                              {ticket.assigned_employee && (
                                <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-xl p-4 border border-purple-200 hover:shadow-md transition-shadow">
                                  <div className="flex items-center space-x-2 mb-2">
                                    <div className="p-2 bg-purple-500 rounded-lg">
                                      <User className="w-4 h-4 text-white" />
                                    </div>
                                    <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">Assigned To</p>
                                  </div>
                                  <p className="text-lg font-bold text-gray-900 truncate" title={ticket.assigned_employee.full_name}>
                                    {ticket.assigned_employee.full_name}
                                  </p>
                                </div>
                              )}
                              
                              {ticket.estimated_cost && (
                                <div className="bg-gradient-to-br from-green-50 to-green-100/50 rounded-xl p-4 border border-green-200 hover:shadow-md transition-shadow">
                                  <div className="flex items-center space-x-2 mb-2">
                                    <div className="p-2 bg-green-500 rounded-lg">
                                      <DollarSign className="w-4 h-4 text-white" />
                                    </div>
                                    <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">Est. Cost</p>
                                  </div>
                                  <p className="text-lg font-bold text-gray-900">{formatCurrency(ticket.estimated_cost)}</p>
                                </div>
                              )}
                              
                              {ticket.garage_name && (
                                <div className="bg-gradient-to-br from-indigo-50 to-indigo-100/50 rounded-xl p-4 border border-indigo-200 hover:shadow-md transition-shadow">
                                  <div className="flex items-center space-x-2 mb-2">
                                    <div className="p-2 bg-indigo-500 rounded-lg">
                                      <Building className="w-4 h-4 text-white" />
                                    </div>
                                    <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">Garage</p>
                                  </div>
                                  <p className="text-lg font-bold text-gray-900 truncate" title={ticket.garage_name}>
                                    {ticket.garage_name}
                                  </p>
                                </div>
                              )}
                            </div>

                            {/* Additional Vehicle Details */}
                            {(ticket.vehicle_id_text || ticket.vehicle_plate_number || ticket.hardware_id || ticket.vehicle_model || ticket.vehicle_year || ticket.vehicle_color) && (
                              <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                          <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                            <Car className="w-4 h-4 mr-2 text-blue-600" />
                            Vehicle Details
                          </h4>
                          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                            {ticket.vehicle_id_text && (
                              <div>
                                <p className="text-xs text-gray-600 uppercase tracking-wide mb-1">Vehicle ID</p>
                                <p className="font-medium text-gray-900">{ticket.vehicle_id_text}</p>
                              </div>
                            )}
                            {ticket.vehicle_plate_number && (
                              <div>
                                <p className="text-xs text-gray-600 uppercase tracking-wide mb-1">Plate Number</p>
                                <p className="font-medium text-gray-900">{ticket.vehicle_plate_number}</p>
                              </div>
                            )}
                            {ticket.hardware_id && (
                              <div>
                                <p className="text-xs text-gray-600 uppercase tracking-wide mb-1">Hardware ID</p>
                                <p className="font-medium text-gray-900">{ticket.hardware_id}</p>
                              </div>
                            )}
                            {ticket.vehicle_model && (
                              <div>
                                <p className="text-xs text-gray-600 uppercase tracking-wide mb-1">Model</p>
                                <p className="font-medium text-gray-900">{ticket.vehicle_model}</p>
                              </div>
                            )}
                            {ticket.vehicle_year && (
                              <div>
                                <p className="text-xs text-gray-600 uppercase tracking-wide mb-1">Year</p>
                                <p className="font-medium text-gray-900">{ticket.vehicle_year}</p>
                              </div>
                            )}
                            {ticket.vehicle_color && (
                              <div>
                                <p className="text-xs text-gray-600 uppercase tracking-wide mb-1">Color</p>
                                <p className="font-medium text-gray-900">{ticket.vehicle_color}</p>
                              </div>
                            )}
                                </div>
                              </div>
                            )}

                            {/* Garage Information */}
                            {ticket.garage_name && (
                              <div className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200">
                          <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                            <Building className="w-4 h-4 mr-2 text-purple-600" />
                            Service Garage
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <p className="text-xs text-gray-600 uppercase tracking-wide mb-1">Garage Name</p>
                              <p className="font-medium text-gray-900">{ticket.garage_name}</p>
                            </div>
                            {ticket.garage_location && (
                              <div>
                                <p className="text-xs text-gray-600 uppercase tracking-wide mb-1">Location</p>
                                <p className="font-medium text-gray-900">{ticket.garage_location}</p>
                              </div>
                            )}
                                </div>
                              </div>
                            )}

                            {/* Conversion Notice */}
                            {ticket.maintenance_record_id && (
                              <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border-2 border-green-300 shadow-sm">
                          <div className="flex items-center space-x-3">
                            <div className="p-2 bg-green-400 rounded-lg">
                              <CheckCircle className="w-5 h-5 text-green-900" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-green-900">Converted to Maintenance Record</p>
                              <p className="text-xs text-green-700">This ticket has been successfully converted</p>
                            </div>
                                </div>
                              </div>
                            )}
                            
                            {/* Actions Footer */}
                            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                        <div className="flex items-center space-x-3">
                          <button 
                            onClick={() => handleEditTicket(ticket)}
                            className="px-4 py-2 bg-orange-50 hover:bg-orange-100 text-orange-700 rounded-lg flex items-center text-sm font-medium transition-all hover:shadow-md"
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                          </button>
                          <button 
                            onClick={() => handleViewDetails(ticket, 'ticket')}
                            className="px-4 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg flex items-center text-sm font-medium transition-all hover:shadow-md"
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            View Details
                          </button>
                          {ticket.status !== 'Completed' && ticket.status !== 'Closed' && !ticket.maintenance_record_id && (
                            <button 
                              onClick={() => handleConvertTicketToRecord(ticket)}
                              className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg flex items-center text-sm font-medium transition-all hover:shadow-md"
                            >
                              <ArrowRight className="w-4 h-4 mr-2" />
                              Convert to Record
                            </button>
                          )}
                          {/* Only show delete if ticket not converted OR user is admin */}
                          {(!ticket.maintenance_record_id || isAdmin) && (
                            <button 
                              onClick={() => handleDeleteTicket(ticket.id)}
                              className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg flex items-center text-sm font-medium transition-all hover:shadow-md"
                            >
                              <Trash className="w-4 h-4 mr-2" />
                              Delete
                            </button>
                          )}
                        </div>
                        
                        {ticket.employees && (
                          <div className="flex items-center space-x-2 text-sm text-gray-600 bg-gray-50 px-4 py-2 rounded-lg">
                            <User className="w-4 h-4 text-gray-400" />
                            <span className="font-medium">Requested by</span>
                            <span className="font-semibold text-gray-900">{ticket.employees.full_name}</span>
                          </div>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })
            )}
          </div>
        )}

        {/* Modals */}
        <MaintenanceRecordModal
          isOpen={showCreateModal}
          onClose={() => {
            setShowCreateModal(false);
            setSelectedRecord(null);
          }}
          record={selectedRecord}
          onSuccess={handleModalSuccess}
        />

        <MaintenanceTicketModal
          isOpen={showTicketModal}
          onClose={() => {
            setShowTicketModal(false);
            setSelectedTicket(null);
          }}
          ticket={selectedTicket}
          onSuccess={handleModalSuccess}
        />

        <DetailsModal
          isOpen={showDetailsModal}
          onClose={() => {
            setShowDetailsModal(false);
            setDetailsData(null);
          }}
          data={detailsData}
          type={detailsType}
        />
      </div>
    </div>
  );
};

export default FleetMaintenanceRecord;
