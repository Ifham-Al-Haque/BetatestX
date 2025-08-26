import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Plus, Search, Filter, FileText, Clock, User, 
  AlertCircle, CheckCircle, XCircle, MoreHorizontal,
  Edit, Trash2, Eye, Calendar, Tag, Building, Play, Pause, Square,
  Timer, MessageSquare, Link, ArrowRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { itServicesApi } from '../services/itServicesApi';

import UserDropdown from '../components/UserDropdown';
import DarkModeToggle from '../components/DarkModeToggle';
import { Card, CardContent, CardHeader } from '../components/ui/card';
import Button from '../components/ui/button';
import Input from '../components/ui/input';
import Label from '../components/ui/label';
import Textarea from '../components/ui/textarea';

const ITTickets = () => {
  const { user, userProfile } = useAuth();
  const { success, error: showError } = useToast();
  
  const [tickets, setTickets] = useState([]);
  const [requests, setRequests] = useState([]);
  const [priorities, setPriorities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTicket, setEditingTicket] = useState(null);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    priority_id: '',
    assigned_to: '',
    request_id: '',
    search: ''
  });

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    request_id: '',
    priority_id: '',
    assigned_to: '',
    estimated_time_minutes: ''
  });

  const [timeTracking, setTimeTracking] = useState({});

  useEffect(() => {
    fetchData();
  }, [filters]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [prioritiesData, ticketsData, requestsData] = await Promise.all([
        itServicesApi.priorities.getAll(),
        itServicesApi.tickets.getAll(filters),
        itServicesApi.requests.getAll({ status: 'approved' })
      ]);

      setPriorities(prioritiesData);
      setTickets(ticketsData.data || []);
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
      const ticketData = {
        ...formData,
        estimated_time_minutes: formData.estimated_time_minutes ? parseInt(formData.estimated_time_minutes) : null
      };

      if (editingTicket) {
        await itServicesApi.tickets.update(editingTicket.id, ticketData);
        success('Success', 'Ticket updated successfully!');
      } else {
        await itServicesApi.tickets.create(ticketData);
        success('Success', 'Ticket created successfully!');
      }

      setShowForm(false);
      setEditingTicket(null);
      resetForm();
      fetchData();
    } catch (err) {
      console.error('Error submitting ticket:', err);
      showError('Error', 'Failed to submit ticket. Please try again.');
    }
  };

  const handleEdit = (ticket) => {
    setEditingTicket(ticket);
    setFormData({
      title: ticket.title,
      description: ticket.description,
      request_id: ticket.request_id,
      priority_id: ticket.priority_id,
      assigned_to: ticket.assigned_to || '',
      estimated_time_minutes: ticket.estimated_time_minutes ? ticket.estimated_time_minutes.toString() : ''
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this ticket?')) {
      try {
        await itServicesApi.tickets.delete(id);
        success('Success', 'Ticket deleted successfully!');
        fetchData();
      } catch (err) {
        console.error('Error deleting ticket:', err);
        showError('Error', 'Failed to delete ticket. Please try again.');
      }
    }
  };

  const handleStatusChange = async (ticketId, newStatus) => {
    try {
      const updateData = { status: newStatus };
      
      if (newStatus === 'in_progress') {
        updateData.started_at = new Date().toISOString();
      } else if (newStatus === 'resolved') {
        updateData.resolved_at = new Date().toISOString();
      } else if (newStatus === 'closed') {
        updateData.closed_at = new Date().toISOString();
        updateData.closed_by = user.id;
      }

      await itServicesApi.tickets.update(ticketId, updateData);
      success('Success', `Ticket status updated to ${newStatus.replace('_', ' ')}`);
      fetchData();
    } catch (err) {
      console.error('Error updating ticket status:', err);
      showError('Error', 'Failed to update ticket status. Please try again.');
    }
  };

  const startTimeTracking = (ticketId) => {
    setTimeTracking(prev => ({
      ...prev,
      [ticketId]: {
        startTime: Date.now(),
        isRunning: true
      }
    }));
  };

  const pauseTimeTracking = (ticketId) => {
    setTimeTracking(prev => ({
      ...prev,
      [ticketId]: {
        ...prev[ticketId],
        isRunning: false,
        pausedTime: (prev[ticketId]?.pausedTime || 0) + (Date.now() - prev[ticketId]?.startTime)
      }
    }));
  };

  const stopTimeTracking = async (ticketId) => {
    const tracking = timeTracking[ticketId];
    if (!tracking) return;

    const totalTime = tracking.pausedTime + (Date.now() - tracking.startTime);
    const minutesSpent = Math.round(totalTime / 60000);

    try {
      await itServicesApi.tickets.update(ticketId, {
        time_spent_minutes: (tickets.find(t => t.id === ticketId)?.time_spent_minutes || 0) + minutesSpent
      });
      
      setTimeTracking(prev => {
        const newState = { ...prev };
        delete newState[ticketId];
        return newState;
      });
      
      success('Success', `Time tracking stopped. ${minutesSpent} minutes added.`);
      fetchData();
    } catch (err) {
      console.error('Error updating time tracking:', err);
      showError('Error', 'Failed to update time tracking. Please try again.');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      request_id: '',
      priority_id: '',
      assigned_to: '',
      estimated_time_minutes: ''
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'open': return 'bg-blue-100 text-blue-800';
      case 'assigned': return 'bg-purple-100 text-purple-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'waiting_for_user': return 'bg-orange-100 text-orange-800';
      case 'waiting_for_third_party': return 'bg-indigo-100 text-indigo-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority) => {
    if (!priority) return 'bg-gray-100 text-gray-800';
    return `bg-[${priority.color}]/10 text-[${priority.color}]`;
  };

  const canEdit = (ticket) => {
    return user.id === ticket.assigned_to || 
           userProfile?.role === 'admin' || 
           userProfile?.role === 'it_manager';
  };

  const canDelete = (ticket) => {
    return userProfile?.role === 'admin' || 
           userProfile?.role === 'it_manager';
  };

  const formatTime = (minutes) => {
    if (!minutes) return '0m';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  if (loading) {
    return (
      <div className="min-h-screen font-sans" style={{ background: "linear-gradient(135deg, #f8fafc 0%, #e0e7ef 100%)" }}>
        
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
      
      <div className="ml-80 p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">IT Tickets</h1>
            <p className="text-gray-600">Manage IT tickets and track task progress</p>
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
                  <p className="text-sm text-gray-600">Total Tickets</p>
                  <p className="text-2xl font-bold text-gray-900">{tickets.length}</p>
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
                    {tickets.filter(t => t.status === 'in_progress').length}
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
                  <p className="text-sm text-gray-600">Resolved</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {tickets.filter(t => t.status === 'resolved').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <Timer className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Time</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatTime(tickets.reduce((total, t) => total + (t.time_spent_minutes || 0), 0))}
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
                    placeholder="Search tickets..."
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
                  <option value="assigned">Assigned</option>
                  <option value="in_progress">In Progress</option>
                  <option value="waiting_for_user">Waiting for User</option>
                  <option value="waiting_for_third_party">Waiting for Third Party</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
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

                <select
                  value={filters.request_id}
                  onChange={(e) => setFilters({ ...filters, request_id: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Requests</option>
                  {requests.map(request => (
                    <option key={request.id} value={request.id}>
                      {request.request_number} - {request.title}
                    </option>
                  ))}
                </select>
              </div>

              <Button
                onClick={() => setShowForm(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Ticket
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Ticket Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">
                  {editingTicket ? 'Edit Ticket' : 'New IT Ticket'}
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowForm(false);
                    setEditingTicket(null);
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
                      placeholder="Ticket title"
                    />
                  </div>

                  <div>
                    <Label htmlFor="request_id">Related Request</Label>
                    <select
                      id="request_id"
                      value={formData.request_id}
                      onChange={(e) => setFormData({ ...formData, request_id: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Request (Optional)</option>
                      {requests.map(request => (
                        <option key={request.id} value={request.id}>
                          {request.request_number} - {request.title}
                        </option>
                      ))}
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
                    placeholder="Detailed description of the ticket..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                    <Label htmlFor="assigned_to">Assign To</Label>
                    <select
                      id="assigned_to"
                      value={formData.assigned_to}
                      onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Unassigned</option>
                      {/* You would populate this with available IT staff */}
                      <option value={user.id}>Assign to me</option>
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="estimated_time_minutes">Estimated Time (minutes)</Label>
                    <Input
                      id="estimated_time_minutes"
                      type="number"
                      value={formData.estimated_time_minutes}
                      onChange={(e) => setFormData({ ...formData, estimated_time_minutes: e.target.value })}
                      placeholder="120"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowForm(false);
                      setEditingTicket(null);
                      resetForm();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                    {editingTicket ? 'Update Ticket' : 'Create Ticket'}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* Tickets List */}
        <Card>
          <CardHeader>
            <CardHeader>IT Tickets</CardHeader>
          </CardHeader>
          <CardContent>
            {tickets.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No tickets found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {tickets.map((ticket) => (
                  <motion.div
                    key={ticket.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {ticket.title}
                          </h3>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(ticket.status)}`}>
                            {ticket.status.replace('_', ' ').toUpperCase()}
                          </span>
                          {ticket.priority && (
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(ticket.priority)}`}>
                              {ticket.priority.name}
                            </span>
                          )}
                        </div>

                        <p className="text-gray-600 mb-3">{ticket.description}</p>

                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                          {ticket.request && (
                            <div className="flex items-center space-x-1">
                              <Link className="w-4 h-4" />
                              <span>{ticket.request.request_number}</span>
                            </div>
                          )}
                          {ticket.assignee && (
                            <div className="flex items-center space-x-1">
                              <User className="w-4 h-4" />
                              <span>Assigned to: {ticket.assignee?.full_name}</span>
                            </div>
                          )}
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-4 h-4" />
                            <span>{new Date(ticket.created_at).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Timer className="w-4 h-4" />
                            <span>Time: {formatTime(ticket.time_spent_minutes || 0)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        {/* Time Tracking Controls */}
                        {ticket.status === 'in_progress' && (
                          <div className="flex items-center space-x-1">
                            {!timeTracking[ticket.id]?.isRunning ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => startTimeTracking(ticket.id)}
                                className="text-green-600 hover:text-green-700"
                              >
                                <Play className="w-4 h-4" />
                              </Button>
                            ) : (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => pauseTimeTracking(ticket.id)}
                                  className="text-yellow-600 hover:text-yellow-700"
                                >
                                  <Pause className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => stopTimeTracking(ticket.id)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Square className="w-4 h-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        )}

                        {/* Status Change Controls */}
                        {canEdit(ticket) && (
                          <select
                            value={ticket.status}
                            onChange={(e) => handleStatusChange(ticket.id, e.target.value)}
                            className="px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                          >
                            <option value="open">Open</option>
                            <option value="assigned">Assigned</option>
                            <option value="in_progress">In Progress</option>
                            <option value="waiting_for_user">Waiting for User</option>
                            <option value="waiting_for_third_party">Waiting for Third Party</option>
                            <option value="resolved">Resolved</option>
                            <option value="closed">Closed</option>
                          </select>
                        )}

                        {canEdit(ticket) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(ticket)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        )}
                        {canDelete(ticket) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(ticket.id)}
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

export default ITTickets;
