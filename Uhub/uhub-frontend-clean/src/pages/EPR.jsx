import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Plus, Search, Filter, FileText, Clock, User, 
  AlertTriangle, CheckCircle, XCircle, MoreHorizontal,
  Edit, Trash2, Eye, Calendar, Tag, Building, 
  Star, TrendingUp, Award, Target, BarChart3
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

import UserDropdown from '../components/UserDropdown';
import DarkModeToggle from '../components/DarkModeToggle';
import { Card, CardContent, CardHeader } from '../components/ui/card';
import Button from '../components/ui/button';
import Input from '../components/ui/input';
import Label from '../components/ui/label';
import Textarea from '../components/ui/textarea';

const EPR = () => {
  const { user, userProfile } = useAuth();
  const { success, error: showError } = useToast();
  
  const [reviews, setReviews] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingReview, setEditingReview] = useState(null);
  const [filters, setFilters] = useState({
    period: '',
    status: '',
    rating: '',
    search: ''
  });

  const [formData, setFormData] = useState({
    employee_id: '',
    review_period: '',
    review_date: '',
    job_knowledge: '',
    quality_of_work: '',
    quantity_of_work: '',
    dependability: '',
    cooperation: '',
    initiative: '',
    attendance: '',
    overall_rating: '',
    strengths: '',
    areas_for_improvement: '',
    goals: '',
    comments: '',
    reviewer_comments: ''
  });

  const reviewPeriods = [
    'Q1 2024', 'Q2 2024', 'Q3 2024', 'Q4 2024',
    'Q1 2023', 'Q2 2023', 'Q3 2023', 'Q4 2023'
  ];

  const ratingOptions = [
    { value: '5', label: '5 - Outstanding' },
    { value: '4', label: '4 - Exceeds Expectations' },
    { value: '3', label: '3 - Meets Expectations' },
    { value: '2', label: '2 - Below Expectations' },
    { value: '1', label: '1 - Unsatisfactory' }
  ];

  useEffect(() => {
    fetchData();
  }, [filters]);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Mock data for now - replace with actual API calls
      const mockEmployees = [
        { id: '1', name: 'John Doe', department: 'IT', position: 'Developer' },
        { id: '2', name: 'Jane Smith', department: 'HR', position: 'Manager' },
        { id: '3', name: 'Mike Johnson', department: 'Finance', position: 'Analyst' }
      ];

      const mockReviews = [
        {
          id: '1',
          employee_id: '1',
          employee_name: 'John Doe',
          department: 'IT',
          position: 'Developer',
          review_period: 'Q4 2024',
          review_date: '2024-12-15',
          job_knowledge: '4',
          quality_of_work: '4',
          quantity_of_work: '5',
          dependability: '4',
          cooperation: '5',
          initiative: '4',
          attendance: '5',
          overall_rating: '4.4',
          strengths: 'Excellent technical skills, great team player, always meets deadlines',
          areas_for_improvement: 'Could improve documentation skills and take more initiative in project planning',
          goals: 'Complete advanced certification, lead a small project team, improve documentation',
          comments: 'John has shown consistent improvement throughout the year and is ready for more responsibility',
          reviewer_comments: 'Approved for promotion consideration in next cycle',
          status: 'completed',
          reviewer: 'HR Manager',
          reviewed_at: '2024-12-20T10:00:00Z'
        },
        {
          id: '2',
          employee_id: '2',
          employee_name: 'Jane Smith',
          department: 'HR',
          position: 'Manager',
          review_period: 'Q4 2024',
          review_date: '2024-12-10',
          job_knowledge: '5',
          quality_of_work: '5',
          quantity_of_work: '4',
          dependability: '5',
          cooperation: '5',
          initiative: '5',
          attendance: '4',
          overall_rating: '4.7',
          strengths: 'Exceptional leadership, excellent communication, strategic thinking',
          areas_for_improvement: 'Could delegate more tasks to team members',
          goals: 'Develop team members, implement new HR processes, improve efficiency',
          comments: 'Jane continues to excel in her role and is a valuable asset to the organization',
          reviewer_comments: 'Excellent performance, recommend for leadership development program',
          status: 'pending',
          reviewer: 'Director',
          reviewed_at: null
        }
      ];

      setEmployees(mockEmployees);
      setReviews(mockReviews);
    } catch (err) {
      console.error('Error fetching data:', err);
      showError('Error', 'Failed to fetch data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const calculateOverallRating = (data) => {
    const ratings = [
      parseFloat(data.job_knowledge) || 0,
      parseFloat(data.quality_of_work) || 0,
      parseFloat(data.quantity_of_work) || 0,
      parseFloat(data.dependability) || 0,
      parseFloat(data.cooperation) || 0,
      parseFloat(data.initiative) || 0,
      parseFloat(data.attendance) || 0
    ];
    
    const validRatings = ratings.filter(rating => rating > 0);
    return validRatings.length > 0 ? (validRatings.reduce((a, b) => a + b, 0) / validRatings.length).toFixed(1) : '0.0';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const overallRating = calculateOverallRating(formData);
      const employee = employees.find(emp => emp.id === formData.employee_id);
      
      const reviewData = {
        ...formData,
        employee_name: employee?.name || 'Unknown',
        department: employee?.department || 'Unknown',
        position: employee?.position || 'Unknown',
        overall_rating: overallRating,
        status: 'pending',
        reviewer: userProfile?.full_name || 'Unknown',
        created_by: user.id,
        created_at: new Date().toISOString()
      };

      if (editingReview) {
        // Update existing review
        const updatedReviews = reviews.map(review => 
          review.id === editingReview.id ? { ...review, ...reviewData } : review
        );
        setReviews(updatedReviews);
        success('Success', 'Performance review updated successfully!');
      } else {
        // Create new review
        const newReview = {
          ...reviewData,
          id: Date.now().toString()
        };
        setReviews([...reviews, newReview]);
        success('Success', 'Performance review created successfully!');
      }

      setShowForm(false);
      setEditingReview(null);
      resetForm();
    } catch (err) {
      console.error('Error submitting review:', err);
      showError('Error', 'Failed to submit review. Please try again.');
    }
  };

  const handleEdit = (review) => {
    setEditingReview(review);
    setFormData({
      employee_id: review.employee_id,
      review_period: review.review_period,
      review_date: review.review_date,
      job_knowledge: review.job_knowledge,
      quality_of_work: review.quality_of_work,
      quantity_of_work: review.quantity_of_work,
      dependability: review.dependability,
      cooperation: review.cooperation,
      initiative: review.initiative,
      attendance: review.attendance,
      strengths: review.strengths,
      areas_for_improvement: review.areas_for_improvement,
      goals: review.goals,
      comments: review.comments,
      reviewer_comments: review.reviewer_comments
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this performance review?')) {
      try {
        const updatedReviews = reviews.filter(review => review.id !== id);
        setReviews(updatedReviews);
        success('Success', 'Performance review deleted successfully!');
      } catch (err) {
        console.error('Error deleting review:', err);
        showError('Error', 'Failed to delete review. Please try again.');
      }
    }
  };

  const handleStatusChange = async (reviewId, newStatus) => {
    try {
      const updatedReviews = reviews.map(review => 
        review.id === reviewId ? { 
          ...review, 
          status: newStatus,
          reviewed_at: newStatus === 'completed' ? new Date().toISOString() : null
        } : review
      );
      setReviews(updatedReviews);
      success('Success', `Review status updated to ${newStatus}`);
    } catch (err) {
      console.error('Error updating review status:', err);
      showError('Error', 'Failed to update review status. Please try again.');
    }
  };

  const resetForm = () => {
    setFormData({
      employee_id: '',
      review_period: '',
      review_date: '',
      job_knowledge: '',
      quality_of_work: '',
      quantity_of_work: '',
      dependability: '',
      cooperation: '',
      initiative: '',
      attendance: '',
      overall_rating: '',
      strengths: '',
      areas_for_improvement: '',
      goals: '',
      comments: '',
      reviewer_comments: ''
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRatingColor = (rating) => {
    const numRating = parseFloat(rating);
    if (numRating >= 4.5) return 'text-green-600';
    if (numRating >= 4.0) return 'text-blue-600';
    if (numRating >= 3.0) return 'text-yellow-600';
    return 'text-red-600';
  };

  const canEdit = (review) => {
    return userProfile?.role === 'admin' || userProfile?.role === 'hr' || user.id === review.created_by;
  };

  const canDelete = (review) => {
    return userProfile?.role === 'admin' || user.id === review.created_by;
  };

  const canChangeStatus = (review) => {
    return userProfile?.role === 'admin' || userProfile?.role === 'hr';
  };

  const getAverageRating = () => {
    const validReviews = reviews.filter(review => review.status === 'completed');
    if (validReviews.length === 0) return 0;
    const total = validReviews.reduce((sum, review) => sum + parseFloat(review.overall_rating), 0);
    return (total / validReviews.length).toFixed(1);
  };

  const getCompletedReviews = () => {
    return reviews.filter(review => review.status === 'completed').length;
  };

  const getPendingReviews = () => {
    return reviews.filter(review => review.status === 'pending').length;
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
            <h1 className="text-3xl font-bold text-gray-900">Employee Performance Review</h1>
            <p className="text-gray-600">Manage and track employee performance evaluations</p>
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
                  <p className="text-sm text-gray-600">Total Reviews</p>
                  <p className="text-2xl font-bold text-gray-900">{reviews.length}</p>
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
                  <p className="text-2xl font-bold text-gray-900">{getCompletedReviews()}</p>
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
                  <p className="text-sm text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-gray-900">{getPendingReviews()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Star className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Avg Rating</p>
                  <p className="text-2xl font-bold text-gray-900">{getAverageRating()}</p>
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
                    placeholder="Search employees..."
                    value={filters.search}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    className="w-64"
                  />
                </div>
                
                <select
                  value={filters.period}
                  onChange={(e) => setFilters({ ...filters, period: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Periods</option>
                  {reviewPeriods.map(period => (
                    <option key={period} value={period}>{period}</option>
                  ))}
                </select>

                <select
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="completed">Completed</option>
                  <option value="draft">Draft</option>
                </select>

                <select
                  value={filters.rating}
                  onChange={(e) => setFilters({ ...filters, rating: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Ratings</option>
                  <option value="5">5 - Outstanding</option>
                  <option value="4">4 - Exceeds Expectations</option>
                  <option value="3">3 - Meets Expectations</option>
                  <option value="2">2 - Below Expectations</option>
                  <option value="1">1 - Unsatisfactory</option>
                </select>
              </div>

              <Button
                onClick={() => setShowForm(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Review
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Performance Review Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-lg p-6 w-full max-w-6xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">
                  {editingReview ? 'Edit Performance Review' : 'Create New Performance Review'}
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowForm(false);
                    setEditingReview(null);
                    resetForm();
                  }}
                >
                  <XCircle className="w-5 h-5" />
                </Button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="employee_id">Employee *</Label>
                    <select
                      id="employee_id"
                      value={formData.employee_id}
                      onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">Select Employee</option>
                      {employees.map(employee => (
                        <option key={employee.id} value={employee.id}>
                          {employee.name} - {employee.department}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="review_period">Review Period *</Label>
                    <select
                      id="review_period"
                      value={formData.review_period}
                      onChange={(e) => setFormData({ ...formData, review_period: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">Select Period</option>
                      {reviewPeriods.map(period => (
                        <option key={period} value={period}>{period}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="review_date">Review Date *</Label>
                    <Input
                      id="review_date"
                      type="date"
                      value={formData.review_date}
                      onChange={(e) => setFormData({ ...formData, review_date: e.target.value })}
                      required
                    />
                  </div>
                </div>

                {/* Performance Ratings */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Performance Ratings</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="job_knowledge">Job Knowledge *</Label>
                      <select
                        id="job_knowledge"
                        value={formData.job_knowledge}
                        onChange={(e) => setFormData({ ...formData, job_knowledge: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      >
                        <option value="">Select Rating</option>
                        {ratingOptions.map(option => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <Label htmlFor="quality_of_work">Quality of Work *</Label>
                      <select
                        id="quality_of_work"
                        value={formData.quality_of_work}
                        onChange={(e) => setFormData({ ...formData, quality_of_work: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      >
                        <option value="">Select Rating</option>
                        {ratingOptions.map(option => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <Label htmlFor="quantity_of_work">Quantity of Work *</Label>
                      <select
                        id="quantity_of_work"
                        value={formData.quantity_of_work}
                        onChange={(e) => setFormData({ ...formData, quantity_of_work: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      >
                        <option value="">Select Rating</option>
                        {ratingOptions.map(option => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <Label htmlFor="dependability">Dependability *</Label>
                      <select
                        id="dependability"
                        value={formData.dependability}
                        onChange={(e) => setFormData({ ...formData, dependability: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      >
                        <option value="">Select Rating</option>
                        {ratingOptions.map(option => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <Label htmlFor="cooperation">Cooperation *</Label>
                      <select
                        id="cooperation"
                        value={formData.cooperation}
                        onChange={(e) => setFormData({ ...formData, cooperation: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      >
                        <option value="">Select Rating</option>
                        {ratingOptions.map(option => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <Label htmlFor="initiative">Initiative *</Label>
                      <select
                        id="initiative"
                        value={formData.initiative}
                        onChange={(e) => setFormData({ ...formData, initiative: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      >
                        <option value="">Select Rating</option>
                        {ratingOptions.map(option => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <Label htmlFor="attendance">Attendance *</Label>
                      <select
                        id="attendance"
                        value={formData.attendance}
                        onChange={(e) => setFormData({ ...formData, attendance: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      >
                        <option value="">Select Rating</option>
                        {ratingOptions.map(option => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Overall Rating Preview */}
                {formData.job_knowledge && formData.quality_of_work && (
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-2">Overall Rating Preview</h4>
                    <p className="text-2xl font-bold text-blue-600">
                      {calculateOverallRating(formData)} / 5.0
                    </p>
                  </div>
                )}

                {/* Detailed Feedback */}
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="strengths">Key Strengths</Label>
                    <Textarea
                      id="strengths"
                      value={formData.strengths}
                      onChange={(e) => setFormData({ ...formData, strengths: e.target.value })}
                      rows={3}
                      placeholder="List the employee's key strengths and achievements..."
                    />
                  </div>

                  <div>
                    <Label htmlFor="areas_for_improvement">Areas for Improvement</Label>
                    <Textarea
                      id="areas_for_improvement"
                      value={formData.areas_for_improvement}
                      onChange={(e) => setFormData({ ...formData, areas_for_improvement: e.target.value })}
                      rows={3}
                      placeholder="Identify areas where the employee can improve..."
                    />
                  </div>

                  <div>
                    <Label htmlFor="goals">Goals and Objectives</Label>
                    <Textarea
                      id="goals"
                      value={formData.goals}
                      onChange={(e) => setFormData({ ...formData, goals: e.target.value })}
                      rows={3}
                      placeholder="Set specific goals and objectives for the next review period..."
                    />
                  </div>

                  <div>
                    <Label htmlFor="comments">General Comments</Label>
                    <Textarea
                      id="comments"
                      value={formData.comments}
                      onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
                      rows={3}
                      placeholder="Additional comments about the employee's performance..."
                    />
                  </div>

                  <div>
                    <Label htmlFor="reviewer_comments">Reviewer Comments</Label>
                    <Textarea
                      id="reviewer_comments"
                      value={formData.reviewer_comments}
                      onChange={(e) => setFormData({ ...formData, reviewer_comments: e.target.value })}
                      rows={3}
                      placeholder="Internal comments for HR/management..."
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowForm(false);
                      setEditingReview(null);
                      resetForm();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                    {editingReview ? 'Update Review' : 'Create Review'}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* Reviews List */}
        <Card>
          <CardHeader>
            <CardHeader>Performance Reviews</CardHeader>
          </CardHeader>
          <CardContent>
            {reviews.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No performance reviews found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {reviews.map((review) => (
                  <motion.div
                    key={review.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {review.employee_name}
                          </h3>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(review.status)}`}>
                            {review.status.toUpperCase()}
                          </span>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800`}>
                            {review.overall_rating}/5.0
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                          <div className="space-y-2">
                            <div className="flex items-center space-x-1 text-sm text-gray-500">
                              <Building className="w-4 h-4" />
                              <span>{review.department}</span>
                            </div>
                            <div className="flex items-center space-x-1 text-sm text-gray-500">
                              <User className="w-4 h-4" />
                              <span>{review.position}</span>
                            </div>
                            <div className="flex items-center space-x-1 text-sm text-gray-500">
                              <Calendar className="w-4 h-4" />
                              <span>{review.review_period}</span>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-500">Job Knowledge:</span>
                              <span className="font-medium">{review.job_knowledge}/5</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-500">Quality:</span>
                              <span className="font-medium">{review.quality_of_work}/5</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-500">Quantity:</span>
                              <span className="font-medium">{review.quantity_of_work}/5</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-500">Dependability:</span>
                              <span className="font-medium">{review.dependability}/5</span>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-500">Cooperation:</span>
                              <span className="font-medium">{review.cooperation}/5</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-500">Initiative:</span>
                              <span className="font-medium">{review.initiative}/5</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-500">Attendance:</span>
                              <span className="font-medium">{review.attendance}/5</span>
                            </div>
                            <div className="flex justify-between text-sm font-bold">
                              <span className="text-gray-700">Overall:</span>
                              <span className={getRatingColor(review.overall_rating)}>{review.overall_rating}/5</span>
                            </div>
                          </div>
                        </div>

                        {review.strengths && (
                          <div className="mb-3">
                            <h4 className="text-sm font-medium text-gray-700 mb-1">Strengths:</h4>
                            <p className="text-sm text-gray-600">{review.strengths}</p>
                          </div>
                        )}

                        {review.areas_for_improvement && (
                          <div className="mb-3">
                            <h4 className="text-sm font-medium text-gray-700 mb-1">Areas for Improvement:</h4>
                            <p className="text-sm text-gray-600">{review.areas_for_improvement}</p>
                          </div>
                        )}

                        {review.goals && (
                          <div className="mb-3">
                            <h4 className="text-sm font-medium text-gray-700 mb-1">Goals:</h4>
                            <p className="text-sm text-gray-600">{review.goals}</p>
                          </div>
                        )}

                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <span>Review Date: {new Date(review.review_date).toLocaleDateString()}</span>
                          <span>Reviewer: {review.reviewer}</span>
                          {review.reviewed_at && (
                            <span>Completed: {new Date(review.reviewed_at).toLocaleDateString()}</span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        {/* Status Change Controls */}
                        {canChangeStatus(review) && (
                          <select
                            value={review.status}
                            onChange={(e) => handleStatusChange(review.id, e.target.value)}
                            className="px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                          >
                            <option value="draft">Draft</option>
                            <option value="pending">Pending</option>
                            <option value="completed">Completed</option>
                          </select>
                        )}

                        {canEdit(review) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(review)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        )}
                        {canDelete(review) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(review.id)}
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

export default EPR;
