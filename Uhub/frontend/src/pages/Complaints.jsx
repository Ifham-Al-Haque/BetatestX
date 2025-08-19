import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Plus, Search, Filter, FileText, Clock, User, 
  AlertTriangle, CheckCircle, XCircle, MoreHorizontal,
  Edit, Trash2, Eye, Calendar, Tag, Building, 
  MessageSquare, Shield
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Sidebar from '../components/Sidebar';
import UserDropdown from '../components/UserDropdown';
import DarkModeToggle from '../components/DarkModeToggle';
import { Card, CardContent, CardHeader } from '../components/ui/card';
import Button from '../components/ui/button';
import Input from '../components/ui/input';
import Label from '../components/ui/label';
import Textarea from '../components/ui/textarea';

const Complaints = () => {
  const { user, userProfile } = useAuth();
  const { success, error: showError } = useToast();
  
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingComplaint, setEditingComplaint] = useState(null);
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    category: '',
    search: ''
  });

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    priority: 'medium',
    anonymous: false
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
    { value: 'low', label: 'Low', color: 'bg-green-100 text-green-800' },
    { value: 'medium', label: 'Medium', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'high', label: 'High', color: 'bg-orange-100 text-orange-800' },
    { value: 'urgent', label: 'Urgent', color: 'bg-red-100 text-red-800' }
  ];

  useEffect(() => {
    fetchData();
  }, [filters]);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Mock data for now - replace with actual API calls
      const mockComplaints = [
        {
          id: '1',
          title: 'Workplace Safety Concern',
          description: 'There is a safety hazard in the warehouse area that needs immediate attention',
          category: 'Safety Concerns',
          priority: 'high',
          status: 'open',
          anonymous: false,
          complainant_id: user?.id || '1',
          complainant_name: 'John Doe',
          created_at: '2024-01-10T10:00:00Z',
          updated_at: '2024-01-10T10:00:00Z'
        },
        {
          id: '2',
          title: 'Payroll Discrepancy',
          description: 'My salary was not credited correctly this month',
          category: 'Pay & Benefits',
          priority: 'medium',
          status: 'in_progress',
          anonymous: false,
          complainant_id: user?.id || '2',
          complainant_name: 'Jane Smith',
          created_at: '2024-01-09T14:00:00Z',
          updated_at: '2024-01-10T09:00:00Z'
        }
      ];

      // Filter complaints based on user role
      let filteredComplaints = mockComplaints;
      if (userProfile?.role === 'employee') {
        // Employees can only see their own complaints
        filteredComplaints = mockComplaints.filter(complaint => 
          complaint.complainant_id === user?.id
        );
      }

      setComplaints(filteredComplaints);
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
      const complaintData = {
        ...formData,
        complainant_id: user.id,
        complainant_name: userProfile?.full_name || 'Anonymous',
        status: 'open',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      if (editingComplaint) {
        // Update existing complaint
        const updatedComplaints = complaints.map(complaint => 
          complaint.id === editingComplaint.id ? { ...complaint, ...complaintData } : complaint
        );
        setComplaints(updatedComplaints);
        success('Success', 'Complaint updated successfully!');
      } else {
        // Create new complaint
        const newComplaint = {
          ...complaintData,
          id: Date.now().toString()
        };
        setComplaints([...complaints, newComplaint]);
        success('Success', 'Complaint submitted successfully!');
      }

      setShowForm(false);
      setEditingComplaint(null);
      resetForm();
    } catch (err) {
      console.error('Error submitting complaint:', err);
      showError('Error', 'Failed to submit complaint. Please try again.');
    }
  };

  const handleEdit = (complaint) => {
    setEditingComplaint(complaint);
    setFormData({
      title: complaint.title,
      description: complaint.description,
      category: complaint.category,
      priority: complaint.priority,
      anonymous: complaint.anonymous
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this complaint?')) {
      try {
        const updatedComplaints = complaints.filter(complaint => complaint.id !== id);
        setComplaints(updatedComplaints);
        success('Success', 'Complaint deleted successfully!');
      } catch (err) {
        console.error('Error deleting complaint:', err);
        showError('Error', 'Failed to delete complaint. Please try again.');
      }
    }
  };

  const handleStatusChange = async (complaintId, newStatus) => {
    try {
      const updatedComplaints = complaints.map(complaint => 
        complaint.id === complaintId ? { ...complaint, status: newStatus, updated_at: new Date().toISOString() } : complaint
      );
      setComplaints(updatedComplaints);
      success('Success', `Complaint status updated to ${newStatus.replace('_', ' ')}`);
    } catch (err) {
      console.error('Error updating complaint status:', err);
      showError('Error', 'Failed to update complaint status. Please try again.');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      category: '',
      priority: 'medium',
      anonymous: false
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'open': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority) => {
    const priorityObj = priorities.find(p => p.value === priority);
    return priorityObj ? priorityObj.color : 'bg-gray-100 text-gray-800';
  };

  const canEdit = (complaint) => {
    return user.id === complaint.complainant_id || userProfile?.role === 'admin' || userProfile?.role === 'hr';
  };

  const canDelete = (complaint) => {
    return user.id === complaint.complainant_id || userProfile?.role === 'admin';
  };

  const canChangeStatus = (complaint) => {
    return userProfile?.role === 'admin' || userProfile?.role === 'hr';
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
            <h1 className="text-3xl font-bold text-gray-900">Complaints Management</h1>
            <p className="text-gray-600">Submit and manage employee complaints and grievances</p>
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
                  <AlertTriangle className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Complaints</p>
                  <p className="text-2xl font-bold text-gray-900">{complaints.length}</p>
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
                  <p className="text-sm text-gray-600">Open</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {complaints.filter(c => c.status === 'open').length}
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
                    {complaints.filter(c => c.status === 'resolved').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <Shield className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Urgent</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {complaints.filter(c => c.priority === 'urgent').length}
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
                    placeholder="Search complaints..."
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
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>

                <select
                  value={filters.category}
                  onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Categories</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>

                <select
                  value={filters.priority}
                  onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Priorities</option>
                  {priorities.map(priority => (
                    <option key={priority.value} value={priority.value}>{priority.label}</option>
                  ))}
                </select>
              </div>

              <Button
                onClick={() => setShowForm(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Complaint
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Complaint Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">
                  {editingComplaint ? 'Edit Complaint' : 'Submit New Complaint'}
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowForm(false);
                    setEditingComplaint(null);
                    resetForm();
                  }}
                >
                  <XCircle className="w-5 h-5" />
                </Button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="title">Complaint Title *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      required
                      placeholder="Brief description of the issue"
                    />
                  </div>

                  <div>
                    <Label htmlFor="category">Category *</Label>
                    <select
                      id="category"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">Select Category</option>
                      {categories.map(category => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Detailed Description *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    required
                    rows={4}
                    placeholder="Please provide detailed information about your complaint..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="priority">Priority *</Label>
                    <select
                      id="priority"
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      {priorities.map(priority => (
                        <option key={priority.value} value={priority.value}>{priority.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center space-x-2 pt-6">
                    <input
                      type="checkbox"
                      id="anonymous"
                      checked={formData.anonymous}
                      onChange={(e) => setFormData({ ...formData, anonymous: e.target.checked })}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <Label htmlFor="anonymous" className="text-sm">Submit anonymously</Label>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowForm(false);
                      setEditingComplaint(null);
                      resetForm();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                    {editingComplaint ? 'Update Complaint' : 'Submit Complaint'}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* Complaints List */}
        <Card>
          <CardHeader>
            <CardHeader>Complaints List</CardHeader>
          </CardHeader>
          <CardContent>
            {complaints.length === 0 ? (
              <div className="text-center py-8">
                <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No complaints found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {complaints.map((complaint) => (
                  <motion.div
                    key={complaint.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {complaint.title}
                          </h3>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(complaint.status)}`}>
                            {complaint.status.replace('_', ' ').toUpperCase()}
                          </span>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(complaint.priority)}`}>
                            {priorities.find(p => p.value === complaint.priority)?.label || complaint.priority}
                          </span>
                        </div>

                        <p className="text-gray-600 mb-3">{complaint.description}</p>

                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                          <div className="flex items-center space-x-1">
                            <Building className="w-4 h-4" />
                            <span>{complaint.category}</span>
                          </div>
                          {!complaint.anonymous && (
                            <div className="flex items-center space-x-1">
                              <User className="w-4 h-4" />
                              <span>By: {complaint.complainant_name}</span>
                            </div>
                          )}
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-4 h-4" />
                            <span>Created: {new Date(complaint.created_at).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-4 h-4" />
                            <span>Updated: {new Date(complaint.updated_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        {/* Status Change Controls */}
                        {canChangeStatus(complaint) && (
                          <select
                            value={complaint.status}
                            onChange={(e) => handleStatusChange(complaint.id, e.target.value)}
                            className="px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                          >
                            <option value="open">Open</option>
                            <option value="in_progress">In Progress</option>
                            <option value="resolved">Resolved</option>
                            <option value="closed">Closed</option>
                          </select>
                        )}

                        {canEdit(complaint) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(complaint)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        )}
                        {canDelete(complaint) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(complaint.id)}
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

export default Complaints;
