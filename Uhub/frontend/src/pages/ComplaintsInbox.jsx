import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Inbox, 
  Search, 
  Filter, 
  FileText, 
  Clock, 
  User, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  MoreHorizontal,
  Edit, 
  Trash2, 
  Eye, 
  Calendar, 
  Tag, 
  Building, 
  MessageSquare, 
  Shield, 
  TrendingUp, 
  Activity, 
  Zap,
  BarChart3, 
  Users, 
  CreditCard, 
  AlertCircle, 
  Loader2,
  Star,
  Department
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { complaintsApi } from '../services/complaintsApi';

const ComplaintsInbox = () => {
  const { user, userProfile } = useAuth();
  const { success, error: showError } = useToast();
  
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    category: '',
    department: '',
    search: ''
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
    { value: 'low', label: 'Low', color: 'bg-green-100 text-green-800 border-green-200' },
    { value: 'medium', label: 'Medium', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
    { value: 'high', label: 'High', color: 'bg-orange-100 text-orange-800 border-orange-200' },
    { value: 'urgent', label: 'Urgent', color: 'bg-red-100 text-red-800 border-red-200' }
  ];

  const departments = [
    'IT', 'HR', 'Finance', 'Marketing', 'Sales', 'Operations', 
    'Customer Service', 'Engineering', 'Design', 'Unassigned'
  ];

  useEffect(() => {
    fetchData();
  }, [filters]);

  useEffect(() => {
    if (userProfile) {
      fetchData();
    }
  }, [userProfile]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // First, let's test if we can connect to the database
      console.log('Testing database connection...');
      const dbTest = await complaintsApi.testDatabaseConnection();
      
      if (!dbTest.success) {
        throw new Error(`Database connection failed: ${dbTest.error.message}`);
      }
      
      // HR managers and admins can see all complaints with filters
      const allComplaints = await complaintsApi.getAllComplaintsWithFilters(filters);
      console.log('Successfully fetched complaints:', allComplaints);
      setComplaints(allComplaints);
    } catch (error) {
      console.error('Error fetching complaints:', error);
      console.error('Error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      
      // Check if it's a table not found error
      if (error.message && error.message.includes('relation') && error.message.includes('does not exist')) {
        showError('Complaints table not found. Please check database setup.');
      } else if (error.message && error.message.includes('permission')) {
        showError('Permission denied. Please check your database access.');
      } else {
        showError(`Failed to fetch complaints: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (complaintId, newStatus) => {
    try {
      const updatedComplaint = await complaintsApi.updateComplaintStatus(complaintId, newStatus);
      
      // Update local state
      const updatedComplaints = complaints.map(c => 
        c.id === complaintId ? updatedComplaint : c
      );
      setComplaints(updatedComplaints);
      success('Status updated successfully');
    } catch (error) {
      console.error('Error updating status:', error);
      showError('Failed to update status');
    }
  };

  const handlePriorityChange = async (complaintId, newPriority) => {
    try {
      const updatedComplaint = await complaintsApi.updateComplaintPriority(complaintId, newPriority);
      
      // Update local state
      const updatedComplaints = complaints.map(c => 
        c.id === complaintId ? updatedComplaint : c
      );
      setComplaints(updatedComplaints);
      success('Priority updated successfully');
    } catch (error) {
      console.error('Error updating priority:', error);
      showError('Failed to update priority');
    }
  };

  const handleAssignDepartment = async (complaintId, department) => {
    try {
      const updatedComplaint = await complaintsApi.assignComplaintToDepartment(complaintId, department);
      
      // Update local state
      const updatedComplaints = complaints.map(c => 
        c.id === complaintId ? updatedComplaint : c
      );
      setComplaints(updatedComplaints);
      success('Complaint assigned to department successfully');
    } catch (error) {
      console.error('Error assigning department:', error);
      showError('Failed to assign department');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'open': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'resolved': return 'bg-green-100 text-green-800 border-green-200';
      case 'closed': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority) => {
    const priorityObj = priorities.find(p => p.value === priority);
    return priorityObj ? priorityObj.color : 'bg-gray-100 text-gray-800 border-gray-200';
  };

  // Check if user has access to complaints inbox
  if (!userProfile || (userProfile.role !== 'admin' && userProfile.role !== 'hr_manager')) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-600 mb-2">Access Denied</h2>
          <p className="text-gray-500">You don't have permission to access the complaints inbox.</p>
          <p className="text-sm text-gray-400 mt-2">Only HR managers and administrators can view this page.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-lg text-gray-600">Loading complaints inbox...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
      {/* Header Section */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-gradient-to-r from-red-500 to-pink-500 rounded-lg">
                <Inbox className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Complaints Inbox</h1>
                <p className="text-sm text-gray-600">Manage and monitor all employee complaints</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{userProfile?.full_name || user?.email}</p>
                <p className="text-xs text-gray-500 capitalize">{userProfile?.role || 'User'}</p>
              </div>
              <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-pink-600 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold text-sm">
                  {(userProfile?.full_name || user?.email || 'U').charAt(0).toUpperCase()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
                  <AlertTriangle className="w-6 h-6 text-white" />
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
        <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-200 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <Filter className="w-5 h-5 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Filter & Search</h3>
            </div>
            <button
              onClick={() => setFilters({ status: '', priority: '', category: '', department: '', search: '' })}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-all duration-200 text-sm font-medium"
            >
              Clear All Filters
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-red-500 transition-colors" />
              <input
                type="text"
                placeholder="Search complaints..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent w-full transition-all duration-200 hover:border-gray-400"
              />
            </div>
            
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 hover:border-gray-400 cursor-pointer"
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
              className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 hover:border-gray-400 cursor-pointer"
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>

            <select
              value={filters.priority}
              onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
              className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 hover:border-gray-400 cursor-pointer"
            >
              <option value="">All Priorities</option>
              {priorities.map(priority => (
                <option key={priority.value} value={priority.value}>{priority.label}</option>
              ))}
            </select>

            <select
              value={filters.department}
              onChange={(e) => setFilters({ ...filters, department: e.target.value })}
              className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 hover:border-gray-400 cursor-pointer"
            >
              <option value="">All Departments</option>
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Enhanced Complaints List */}
        <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-200">
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <FileText className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  All Complaints ({complaints.length})
                </h2>
                <p className="text-gray-600 mt-1">
                  Manage and monitor all employee complaints
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-500 bg-gray-100 px-4 py-2 rounded-xl">
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
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Inbox className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-600 mb-2">
                No complaints found
              </h3>
              <p className="text-gray-500 max-w-md mx-auto">
                {filters.search || filters.status || filters.category || filters.priority || filters.department
                  ? "Try adjusting your filters or search terms to find what you're looking for" 
                  : "No complaints have been submitted yet"}
              </p>
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
                    className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-xl transition-all duration-300 group"
                  >
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-4">
                          <h3 className="text-xl font-bold text-gray-900 group-hover:text-red-600 transition-colors">
                            {complaint.title}
                          </h3>
                          <span className={`px-3 py-1.5 text-xs font-bold rounded-full border ${getStatusColor(complaint.status)}`}>
                            {complaint.status.replace('_', ' ').toUpperCase()}
                          </span>
                          <span className={`px-3 py-1.5 text-xs font-bold rounded-full border ${getPriorityColor(complaint.priority)}`}>
                            {priorities.find(p => p.value === complaint.priority)?.label || complaint.priority}
                          </span>
                        </div>

                        <p className="text-gray-600 mb-6 text-lg leading-relaxed">
                          {complaint.description}
                        </p>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl">
                            <Building className="w-4 h-4 text-gray-500" />
                            <span className="text-sm font-medium text-gray-700">{complaint.category}</span>
                          </div>
                          
                          {!complaint.anonymous && (
                            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl">
                              <User className="w-4 h-4 text-gray-500" />
                              <span className="text-sm font-medium text-gray-700">By: {complaint.complainant_name}</span>
                            </div>
                          )}
                          
                          <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl">
                            <Calendar className="w-4 h-4 text-gray-500" />
                            <span className="text-sm font-medium text-gray-700">
                              Created: {new Date(complaint.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl">
                            <Clock className="w-4 h-4 text-gray-500" />
                            <span className="text-sm font-medium text-gray-700">
                              Updated: {new Date(complaint.updated_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        {/* Status Change Controls */}
                        <select
                          value={complaint.status}
                          onChange={(e) => handleStatusChange(complaint.id, e.target.value)}
                          className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:text-white"
                        >
                          <option value="open">Open</option>
                          <option value="in_progress">In Progress</option>
                          <option value="resolved">Resolved</option>
                          <option value="closed">Closed</option>
                        </select>

                        {/* Priority Change Controls */}
                        <select
                          value={complaint.priority}
                          onChange={(e) => handlePriorityChange(complaint.id, e.target.value)}
                          className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:text-white"
                        >
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                          <option value="urgent">Urgent</option>
                        </select>

                        {/* Department Assignment */}
                        <select
                          value={complaint.assigned_department || ''}
                          onChange={(e) => handleAssignDepartment(complaint.id, e.target.value)}
                          className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:text-white"
                        >
                          <option value="">Assign Department</option>
                          {departments.map(dept => (
                            <option key={dept} value={dept}>{dept}</option>
                          ))}
                        </select>

                        <button
                          onClick={() => {
                            setSelectedComplaint(complaint);
                            setShowDetails(true);
                          }}
                          className="p-2 bg-blue-100 text-blue-600 hover:bg-blue-200 rounded-lg transition-all duration-200 hover:scale-110"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      {/* Complaint Details Modal */}
      <AnimatePresence>
        {showDetails && selectedComplaint && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-gray-200/20"
            >
              <div className="p-8 border-b border-gray-200/50 bg-gradient-to-r from-red-50 to-pink-50 rounded-t-2xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-red-100 rounded-xl">
                      <AlertTriangle className="w-6 h-6 text-red-600" />
                    </div>
                    <div>
                      <h2 className="text-3xl font-bold text-gray-900">
                        Complaint Details
                      </h2>
                      <p className="text-gray-600 mt-1">
                        Review and manage complaint: {selectedComplaint.title}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setShowDetails(false);
                      setSelectedComplaint(null);
                    }}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all duration-200"
                  >
                    <XCircle className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <div className="p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Complaint Information</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Title:</span>
                        <span className="font-medium">{selectedComplaint.title}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Category:</span>
                        <span className="font-medium">{selectedComplaint.category}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Priority:</span>
                        <span className="font-medium capitalize">{selectedComplaint.priority}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Status:</span>
                        <span className="font-medium capitalize">{selectedComplaint.status.replace('_', ' ')}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Complainant Details</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Name:</span>
                        <span className="font-medium">
                          {selectedComplaint.anonymous ? 'Anonymous' : selectedComplaint.complainant_name}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Email:</span>
                        <span className="font-medium">{selectedComplaint.complainant_email || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Department:</span>
                        <span className="font-medium">{selectedComplaint.complainant_department || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Submitted:</span>
                        <span className="font-medium">
                          {new Date(selectedComplaint.created_at).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Description</h3>
                  <div className="bg-gray-50 p-4 rounded-xl">
                    <p className="text-gray-700 leading-relaxed">{selectedComplaint.description}</p>
                  </div>
                </div>

                <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                  <button
                    onClick={() => {
                      setShowDetails(false);
                      setSelectedComplaint(null);
                    }}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-200 font-medium"
                  >
                    Close
                  </button>
                  <button 
                    onClick={() => handleStatusChange(selectedComplaint.id, 'resolved')}
                    className="px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
                  >
                    Mark as Resolved
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ComplaintsInbox;
