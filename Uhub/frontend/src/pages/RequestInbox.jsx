import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Filter, FileText, Clock, User, 
  AlertTriangle, CheckCircle, XCircle, MoreHorizontal,
  Edit, Trash2, Eye, Calendar, Tag, Building, 
  MessageSquare, Shield, TrendingUp, Activity, Zap,
  BarChart3, Users, CreditCard, AlertCircle, Loader2,
  Inbox, Reply, Archive, Flag, Wrench, Settings
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Card, CardContent, CardHeader } from '../components/ui/card';
import Button from '../components/ui/button';
import Input from '../components/ui/input';
import Label from '../components/ui/label';
import Textarea from '../components/ui/textarea';
import { itServicesApi } from '../services/itServicesApi';

const RequestInbox = () => {
  const { user, userProfile } = useAuth();
  const { success, error: showError } = useToast();
  
  const [requests, setRequests] = useState([]);
  const [categories, setCategories] = useState([]);
  const [priorities, setPriorities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showResponseForm, setShowResponseForm] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    category: '',
    assignee: '',
    search: '',
    date_from: '',
    date_to: ''
  });

  const [responseData, setResponseData] = useState({
    response: '',
    status: '',
    assigned_to: ''
  });

  const statuses = [
    { value: 'open', label: 'Open', color: 'bg-blue-100 text-blue-800 border-blue-200' },
    { value: 'in_progress', label: 'In Progress', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
    { value: 'pending_user', label: 'Pending User', color: 'bg-orange-100 text-orange-800 border-orange-200' },
    { value: 'resolved', label: 'Resolved', color: 'bg-green-100 text-green-800 border-green-200' },
    { value: 'closed', label: 'Closed', color: 'bg-gray-100 text-gray-800 border-gray-200' },
    { value: 'cancelled', label: 'Cancelled', color: 'bg-red-100 text-red-800 border-red-200' }
  ];

  useEffect(() => {
    fetchData();
  }, [filters]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch all requests for tech roles and admins
      const [categoriesData, prioritiesData, requestsData] = await Promise.all([
        itServicesApi.categories.getAll(),
        itServicesApi.priorities.getAll(),
        itServicesApi.requests.getAllForTech()
      ]);

      setCategories(categoriesData);
      setPriorities(prioritiesData);
      setRequests(requestsData);
    } catch (error) {
      console.error('Error fetching data:', error);
      showError('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (requestId, newStatus) => {
    try {
      await itServicesApi.requests.updateStatus(requestId, newStatus);
      success('Status Updated', 'Request status updated successfully');
      fetchData(); // Refresh the list
    } catch (error) {
      showError('Failed to update request status');
    }
  };

  const handleAssignRequest = async (requestId, assignedTo) => {
    try {
      await itServicesApi.requests.assignRequest(requestId, assignedTo);
      success('Request Assigned', 'Request assigned successfully');
      fetchData(); // Refresh the list
    } catch (error) {
      showError('Failed to assign request');
    }
  };

  const handleResponseSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedRequest) {
        // Update request with response and status
        await itServicesApi.requests.updateStatus(
          selectedRequest.id, 
          responseData.status, 
          responseData.response,
          responseData.assigned_to
        );
        
        success('Response Submitted', 'Request response submitted successfully');
        setShowResponseForm(false);
        setSelectedRequest(null);
        setResponseData({ response: '', status: '', assigned_to: '' });
        fetchData(); // Refresh the list
      }
    } catch (error) {
      showError('Failed to submit response');
    }
  };

  const handleCloseRequest = async (requestId) => {
    try {
      await itServicesApi.requests.closeRequest(requestId, user.id, 'Request closed by tech support');
      success('Request Closed', 'Request closed successfully');
      fetchData(); // Refresh the list
    } catch (error) {
      showError('Failed to close request');
    }
  };

  const getPriorityColor = (priority) => {
    if (!priority) return 'bg-gray-100 text-gray-800 border-gray-200';
    
    const level = priority.level;
    if (level === 1) return 'bg-red-100 text-red-800 border-red-200';
    if (level === 2) return 'bg-orange-100 text-orange-800 border-orange-200';
    if (level === 3) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    if (level === 4) return 'bg-green-100 text-green-800 border-green-200';
    return 'bg-gray-100 text-gray-800 border-gray-200';
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

  const getSLAStatus = (request) => {
    if (!request.priority || !request.created_at) return null;
    
    try {
      const created = new Date(request.created_at);
      const now = new Date();
      const hoursElapsed = (now - created) / (1000 * 60 * 60);
      const slaHours = request.priority.sla_hours || 72; // Default to 72 hours if sla_hours is missing
      
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading request inbox...</p>
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
              <h1 className="text-3xl font-bold text-gray-900">IT Request Inbox</h1>
              <p className="text-gray-600">Manage and respond to IT service requests</p>
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
                      {requests.filter(r => r.status === 'open').length}
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
                      {requests.filter(r => r.status === 'in_progress').length}
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
                      {requests.filter(r => r.status === 'resolved').length}
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
                      {requests.filter(r => {
                        const sla = getSLAStatus(r);
                        return sla && sla.status === 'overdue';
                      }).length}
                    </p>
                    <p className="text-sm text-gray-600">Overdue</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
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
                    <option key={priority.id} value={priority.id}>{priority.name}</option>
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
                    <option key={category.id} value={category.id}>{category.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <Label htmlFor="search-filter">Search</Label>
                <Input
                  id="search-filter"
                  type="text"
                  placeholder="Search requests..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="date-from-filter">From Date</Label>
                <Input
                  id="date-from-filter"
                  type="date"
                  value={filters.date_from}
                  onChange={(e) => setFilters({ ...filters, date_from: e.target.value })}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="date-to-filter">To Date</Label>
                <Input
                  id="date-to-filter"
                  type="date"
                  value={filters.date_to}
                  onChange={(e) => setFilters({ ...filters, date_to: e.target.value })}
                  className="mt-1"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Requests List */}
        <div className="space-y-4">
          {requests.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Inbox className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No requests found</h3>
                <p className="text-gray-600">There are no requests matching your current filters.</p>
              </CardContent>
            </Card>
          ) : (
            requests.map((request) => {
              const sla = getSLAStatus(request);
              return (
                <Card key={request.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-3">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {request.title}
                          </h3>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getPriorityColor(request.priority)}`}>
                            {request.priority?.name || 'Unknown'}
                          </span>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(request.status)}`}>
                            {request.status}
                          </span>
                          {sla && (
                            <span className={`px-2 py-1 text-xs font-medium rounded-full border ${
                              sla.status === 'overdue' ? 'bg-red-100 text-red-800 border-red-200' :
                              sla.status === 'warning' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                              'bg-green-100 text-green-800 border-green-200'
                            }`}>
                              {sla.status === 'overdue' ? `Overdue ${sla.hours}h` :
                               sla.status === 'warning' ? `${sla.hours}h left` :
                               `${sla.hours}h left`}
                            </span>
                          )}
                        </div>
                        
                        <p className="text-gray-600 mb-3 line-clamp-2">{request.description}</p>
                        
                        <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                          <span className="flex items-center space-x-1">
                            <Tag className="w-4 h-4" />
                            {request.category?.name || 'Unknown'}
                          </span>
                          <span className="flex items-center space-x-1">
                            <Calendar className="w-4 h-4" />
                            {formatDate(request.created_at)}
                          </span>
                          <span className="flex items-center space-x-1">
                            <User className="w-4 h-4" />
                            {request.requester?.full_name || 'Unknown'}
                          </span>
                          {request.assigned_to && (
                            <span className="flex items-center space-x-1">
                              <Wrench className="w-4 h-4" />
                              Assigned to {request.assignee?.full_name || 'Unknown'}
                            </span>
                          )}
                        </div>

                        {request.resolution_notes && (
                          <div className="bg-gray-50 p-3 rounded-md mb-3">
                            <p className="text-sm text-gray-700">
                              <strong>Resolution Notes:</strong> {request.resolution_notes}
                            </p>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedRequest(request);
                            setResponseData({
                              response: request.resolution_notes || '',
                              status: request.status,
                              assigned_to: request.assigned_to || ''
                            });
                            setShowResponseForm(true);
                          }}
                        >
                          <Reply className="w-4 h-4 mr-2" />
                          Respond
                        </Button>
                        
                        {request.status === 'open' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAssignRequest(request.id, user.id)}
                          >
                            <Wrench className="w-4 h-4 mr-2" />
                            Assign to Me
                          </Button>
                        )}
                        
                        {request.status === 'in_progress' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleStatusUpdate(request.id, 'resolved')}
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Resolve
                          </Button>
                        )}
                        
                        {request.status === 'resolved' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCloseRequest(request.id)}
                          >
                            <Archive className="w-4 h-4 mr-2" />
                            Close
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        {/* Response Form Modal */}
        <AnimatePresence>
          {showResponseForm && selectedRequest && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-gray-900">Respond to Request</h2>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setShowResponseForm(false);
                        setSelectedRequest(null);
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
                          setSelectedRequest(null);
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

export default RequestInbox;
