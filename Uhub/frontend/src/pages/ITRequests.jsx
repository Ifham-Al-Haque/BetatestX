import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Plus, Search, Filter, FileText, Clock, User, 
  AlertCircle, CheckCircle, XCircle, MoreHorizontal,
  Edit, Trash2, Eye, Calendar, Tag, Building
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { itServicesApi } from '../services/itServicesApi';
import Sidebar from '../components/Sidebar';
import UserDropdown from '../components/UserDropdown';
import DarkModeToggle from '../components/DarkModeToggle';
import { Card, CardContent, CardHeader } from '../components/ui/card';
import Button from '../components/ui/button';
import Input from '../components/ui/input';
import Label from '../components/ui/label';
import Textarea from '../components/ui/textarea';

const ITRequests = () => {
  const { user, userProfile } = useAuth();
  const { success, error: showError } = useToast();
  
  const [requests, setRequests] = useState([]);
  const [categories, setCategories] = useState([]);
  const [priorities, setPriorities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingRequest, setEditingRequest] = useState(null);
  const [filters, setFilters] = useState({
    status: '',
    category_id: '',
    priority_id: '',
    search: ''
  });

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category_id: '',
    priority_id: '',
    request_type: 'it_service',
    estimated_completion_date: ''
  });

  useEffect(() => {
    fetchData();
  }, [filters]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [categoriesData, prioritiesData, requestsData] = await Promise.all([
        itServicesApi.categories.getAll(),
        itServicesApi.priorities.getAll(),
        itServicesApi.requests.getAll(filters)
      ]);

      setCategories(categoriesData);
      setPriorities(prioritiesData);
      setRequests(requestsData.data || []);
    } catch (err) {
      console.error('Error fetching data:', err);
      showError('Error', 'Failed to fetch data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const requestData = {
        ...formData,
        requester_id: user.id,
        estimated_completion_date: formData.estimated_completion_date || null
      };

      if (editingRequest) {
        await itServicesApi.requests.update(editingRequest.id, requestData);
        success('Success', 'Request updated successfully!');
      } else {
        await itServicesApi.requests.create(requestData);
        success('Success', 'Request submitted successfully!');
      }

      setShowForm(false);
      setEditingRequest(null);
      resetForm();
      fetchData();
    } catch (err) {
      console.error('Error submitting request:', err);
      showError('Error', 'Failed to submit request. Please try again.');
    }
  };

  const handleEdit = (request) => {
    setEditingRequest(request);
    setFormData({
      title: request.title,
      description: request.description,
      category_id: request.category_id,
      priority_id: request.priority_id,
      request_type: request.request_type,
      estimated_completion_date: request.estimated_completion_date || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this request?')) {
      try {
        await itServicesApi.requests.delete(id);
        success('Success', 'Request deleted successfully!');
        fetchData();
      } catch (err) {
        console.error('Error deleting request:', err);
        showError('Error', 'Failed to delete request. Please try again.');
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
      estimated_completion_date: ''
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'open': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'pending_approval': return 'bg-orange-100 text-orange-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority) => {
    if (!priority) return 'bg-gray-100 text-gray-800';
    return `bg-[${priority.color}]/10 text-[${priority.color}]`;
  };

  const canEdit = (request) => {
    return user.id === request.requester_id || 
           userProfile?.role === 'admin' || 
           userProfile?.role === 'it_manager';
  };

  const canDelete = (request) => {
    return userProfile?.role === 'admin' || 
           userProfile?.role === 'it_manager';
  };

  if (loading) {
    return (
      <div className="min-h-screen font-sans" style={{ background: "linear-gradient(135deg, #f8fafc 0%, #e0e7ef 100%)" }}>
        <Sidebar />
        <div className="ml-80 p-6">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen font-sans" style={{ background: "linear-gradient(135deg, #f8fafc 0%, #e0e7ef 100%)" }}>
      <Sidebar />
      <div className="ml-80 p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">IT Requests</h1>
            <p className="text-gray-600">Submit and manage IT service requests</p>
          </div>
          <div className="flex items-center space-x-4">
            <DarkModeToggle />
            <UserDropdown />
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <FileText className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Requests</p>
                  <p className="text-2xl font-bold text-gray-900">{requests.length}</p>
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
                  <p className="text-sm text-gray-600">In Progress</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {requests.filter(r => r.status === 'in_progress').length}
                  </p>
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
                  <p className="text-sm text-gray-600">Completed</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {requests.filter(r => r.status === 'completed').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {requests.filter(r => r.status === 'pending_approval').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Actions */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
                <div className="flex items-center space-x-2">
                  <Search className="w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search requests..."
                    value={filters.search}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    className="w-64"
                  />
                </div>
                
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Status</option>
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="pending_approval">Pending Approval</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>

                <select
                  value={filters.category_id}
                  onChange={(e) => setFilters({ ...filters, category_id: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Categories</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>

                <select
                  value={filters.priority_id}
                  onChange={(e) => setFilters({ ...filters, priority_id: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Priorities</option>
                  {priorities.map(priority => (
                    <option key={priority.id} value={priority.id}>
                      {priority.name}
                    </option>
                  ))}
                </select>
              </div>

              <Button
                onClick={() => setShowForm(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Request
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Request Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">
                  {editingRequest ? 'Edit Request' : 'New IT Request'}
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowForm(false);
                    setEditingRequest(null);
                    resetForm();
                  }}
                >
                  <XCircle className="w-5 h-5" />
                </Button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      required
                      placeholder="Brief description of your request"
                    />
                  </div>

                  <div>
                    <Label htmlFor="request_type">Request Type *</Label>
                    <select
                      id="request_type"
                      value={formData.request_type}
                      onChange={(e) => setFormData({ ...formData, request_type: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="asset_request">Asset Request</option>
                      <option value="it_service">IT Service</option>
                      <option value="access_request">Access Request</option>
                      <option value="maintenance">Maintenance</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    required
                    rows={4}
                    placeholder="Detailed description of your request..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="category_id">Category *</Label>
                    <select
                      id="category_id"
                      value={formData.category_id}
                      onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">Select Category</option>
                      {categories.map(category => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="priority_id">Priority *</Label>
                    <select
                      id="priority_id"
                      value={formData.priority_id}
                      onChange={(e) => setFormData({ ...formData, priority_id: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">Select Priority</option>
                      {priorities.map(priority => (
                        <option key={priority.id} value={priority.id}>
                          {priority.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="estimated_completion_date">Estimated Completion</Label>
                    <Input
                      id="estimated_completion_date"
                      type="date"
                      value={formData.estimated_completion_date}
                      onChange={(e) => setFormData({ ...formData, estimated_completion_date: e.target.value })}
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
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
                  <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                    {editingRequest ? 'Update Request' : 'Submit Request'}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* Requests List */}
        <Card>
          <CardHeader>
            <CardHeader>IT Requests</CardHeader>
          </CardHeader>
          <CardContent>
            {requests.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No requests found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {requests.map((request) => (
                  <motion.div
                    key={request.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {request.title}
                          </h3>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(request.status)}`}>
                            {request.status.replace('_', ' ').toUpperCase()}
                          </span>
                          {request.priority && (
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(request.priority)}`}>
                              {request.priority.name}
                            </span>
                          )}
                        </div>

                        <p className="text-gray-600 mb-3">{request.description}</p>

                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                          <div className="flex items-center space-x-1">
                            <Tag className="w-4 h-4" />
                            <span>{request.category?.name || 'No Category'}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <User className="w-4 h-4" />
                            <span>{request.requester?.full_name || 'Unknown'}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-4 h-4" />
                            <span>{new Date(request.created_at).toLocaleDateString()}</span>
                          </div>
                          {request.assigned_to && (
                            <div className="flex items-center space-x-1">
                              <Building className="w-4 h-4" />
                              <span>Assigned to: {request.assignee?.full_name}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        {canEdit(request) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(request)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        )}
                        {canDelete(request) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(request.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ITRequests;
