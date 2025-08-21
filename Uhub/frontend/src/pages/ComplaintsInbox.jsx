import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Filter, FileText, Clock, User, 
  AlertTriangle, CheckCircle, XCircle, MoreHorizontal,
  Edit, Trash2, Eye, Calendar, Tag, Building, 
  MessageSquare, Shield, TrendingUp, Activity, Zap,
  BarChart3, Users, CreditCard, AlertCircle, Loader2,
  Inbox, Reply, Archive, Flag
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Card, CardContent, CardHeader } from '../components/ui/card';
import Button from '../components/ui/button';
import Input from '../components/ui/input';
import Label from '../components/ui/label';
import Textarea from '../components/ui/textarea';
import { complaintsApi } from '../services/complaintsApi';

const ComplaintsInbox = () => {
  const { user, userProfile } = useAuth();
  const { success, error: showError } = useToast();
  
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [showResponseForm, setShowResponseForm] = useState(false);
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
    { value: 'low', label: 'Low', color: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-200 dark:border-green-700' },
    { value: 'medium', label: 'Medium', color: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900 dark:text-yellow-200 dark:border-green-700' },
    { value: 'high', label: 'High', color: 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900 dark:text-orange-200 dark:border-orange-700' },
    { value: 'urgent', label: 'Urgent', color: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900 dark:text-red-200 dark:border-red-700' }
  ];

  const statuses = [
    { value: 'open', label: 'Open', color: 'bg-blue-100 text-blue-800 border-blue-200' },
    { value: 'in_progress', label: 'In Progress', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
    { value: 'resolved', label: 'Resolved', color: 'bg-green-100 text-green-800 border-green-200' },
    { value: 'closed', label: 'Closed', color: 'bg-gray-100 text-gray-800 border-gray-200' }
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
    return priorityObj ? priorityObj.color : 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getStatusColor = (status) => {
    const statusObj = statuses.find(s => s.value === status);
    return statusObj ? statusObj.color : 'bg-gray-100 text-gray-800 border-gray-200';
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading complaints inbox...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Inbox className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Complaints Inbox</h1>
              <p className="text-gray-600">Manage and respond to employee complaints</p>
            </div>
          </div>
          
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <AlertTriangle className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">
                      {complaints.filter(c => c.status === 'open').length}
                    </p>
                    <p className="text-sm text-gray-600">Open</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <Clock className="w-5 h-5 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">
                      {complaints.filter(c => c.status === 'in_progress').length}
                    </p>
                    <p className="text-sm text-gray-600">In Progress</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">
                      {complaints.filter(c => c.status === 'resolved').length}
                    </p>
                    <p className="text-sm text-gray-600">Resolved</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <Flag className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">
                      {complaints.filter(c => c.priority === 'urgent').length}
                    </p>
                    <p className="text-sm text-gray-600">Urgent</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="status-filter">Status</Label>
                <select
                  id="status-filter"
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  className="w-full mt-1 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Statuses</option>
                  {statuses.map(status => (
                    <option key={status.value} value={status.value}>{status.label}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <Label htmlFor="priority-filter">Priority</Label>
                <select
                  id="priority-filter"
                  value={filters.priority}
                  onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
                  className="w-full mt-1 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Priorities</option>
                  {priorities.map(priority => (
                    <option key={priority.value} value={priority.value}>{priority.label}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <Label htmlFor="category-filter">Category</Label>
                <select
                  id="category-filter"
                  value={filters.category}
                  onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                  className="w-full mt-1 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Categories</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <Label htmlFor="search-filter">Search</Label>
                <Input
                  id="search-filter"
                  type="text"
                  placeholder="Search complaints..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  className="mt-1"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Complaints List */}
        <div className="space-y-4">
          {complaints.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Inbox className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No complaints found</h3>
                <p className="text-gray-600">There are no complaints matching your current filters.</p>
              </CardContent>
            </Card>
          ) : (
            complaints.map((complaint) => (
              <Card key={complaint.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {complaint.anonymous ? 'Anonymous Complaint' : complaint.complainant_name}
                        </h3>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getPriorityColor(complaint.priority)}`}>
                          {complaint.priority}
                        </span>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(complaint.status)}`}>
                          {complaint.status}
                        </span>
                      </div>
                      
                      <h4 className="text-md font-medium text-gray-800 mb-2">{complaint.title}</h4>
                      <p className="text-gray-600 mb-3 line-clamp-2">{complaint.description}</p>
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span className="flex items-center space-x-1">
                          <Tag className="w-4 h-4" />
                          {complaint.category}
                        </span>
                        <span className="flex items-center space-x-1">
                          <Calendar className="w-4 h-4" />
                          {formatDate(complaint.created_at)}
                        </span>
                        {complaint.assigned_to && (
                          <span className="flex items-center space-x-1">
                            <User className="w-4 h-4" />
                            Assigned
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
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
                      >
                        <Reply className="w-4 h-4 mr-2" />
                        Respond
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleStatusUpdate(complaint.id, 'resolved')}
                        disabled={complaint.status === 'resolved'}
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Resolve
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Response Form Modal */}
        <AnimatePresence>
          {showResponseForm && selectedComplaint && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-gray-900">Respond to Complaint</h2>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setShowResponseForm(false);
                        setSelectedComplaint(null);
                        setResponseData({ response: '', status: '', assigned_to: '' });
                      }}
                    >
                      <XCircle className="w-5 h-5" />
                    </Button>
                  </div>
                  
                  <form onSubmit={handleResponseSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="status">Update Status</Label>
                      <select
                        id="status"
                        value={responseData.status}
                        onChange={(e) => setResponseData({ ...responseData, status: e.target.value })}
                        className="w-full mt-1 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      >
                        {statuses.map(status => (
                          <option key={status.value} value={status.value}>{status.label}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <Label htmlFor="response">Response / Resolution Notes</Label>
                      <Textarea
                        id="response"
                        value={responseData.response}
                        onChange={(e) => setResponseData({ ...responseData, response: e.target.value })}
                        placeholder="Provide a detailed response or resolution notes..."
                        className="mt-1"
                        rows={4}
                        required
                      />
                    </div>
                    
                    <div className="flex justify-end space-x-3 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setShowResponseForm(false);
                          setSelectedComplaint(null);
                          setResponseData({ response: '', status: '', assigned_to: '' });
                        }}
                      >
                        Cancel
                      </Button>
                      <Button type="submit">
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
