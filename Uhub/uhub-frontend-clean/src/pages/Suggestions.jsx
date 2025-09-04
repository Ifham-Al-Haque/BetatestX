import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Search, Filter, FileText, Clock, User, 
  Lightbulb, CheckCircle, XCircle, MoreHorizontal,
  Edit, Trash2, Eye, Calendar, Tag, Building, 
  MessageSquare, Shield, TrendingUp, Activity, Zap,
  BarChart3, Users, CreditCard, AlertCircle, Loader2,
  ThumbsUp, ThumbsDown, Target, Globe, Grid, List,
  ChevronDown, X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { suggestionsApi } from '../services/suggestionsApi';

const Suggestions = () => {
  const { user, userProfile } = useAuth();
  const { success, error: showError } = useToast();
  
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingSuggestion, setEditingSuggestion] = useState(null);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    category: '',
    suggestion_type: '',
    search: ''
  });
  const [showFilters, setShowFilters] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    priority: 'medium',
    suggestion_type: 'general',
    target_user_id: '',
    target_user_name: '',
    anonymous: false
  });

  const [categories, setCategories] = useState([]);
  const [users, setUsers] = useState([]);

  const priorities = [
    { value: 'low', label: 'Low', color: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-200 dark:border-green-700' },
    { value: 'medium', label: 'Medium', color: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900 dark:text-yellow-200 dark:border-green-700' },
    { value: 'high', label: 'High', color: 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900 dark:text-orange-200 dark:border-orange-700' },
    { value: 'urgent', label: 'Urgent', color: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900 dark:text-red-200 dark:border-red-700' }
  ];

  const statuses = [
    { value: 'open', label: 'Open', color: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900 dark:text-blue-200 dark:border-blue-700' },
    { value: 'in_progress', label: 'In Progress', color: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900 dark:text-yellow-200 dark:border-yellow-700' },
    { value: 'implemented', label: 'Implemented', color: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-200 dark:border-green-700' },
    { value: 'closed', label: 'Closed', color: 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900 dark:text-gray-200 dark:border-gray-700' }
  ];

  useEffect(() => {
    fetchData();
    fetchCategories();
    fetchUsers();
  }, [filters]);

  useEffect(() => {
    if (userProfile) {
      fetchData();
    }
  }, [userProfile]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const realSuggestions = await suggestionsApi.getSuggestionsWithFilters(
        filters, 
        user?.id, 
        userProfile?.role
      );
      
      setSuggestions(realSuggestions);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      showError('Failed to fetch suggestions from database');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const categoriesData = await suggestionsApi.getSuggestionCategories();
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const usersData = await suggestionsApi.getUsersForTargeting();
      setUsers(usersData);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const suggestionData = {
        ...formData,
        suggester_id: user.id,
        suggester_name: userProfile?.full_name || user.email
      };

      if (editingSuggestion) {
        await suggestionsApi.updateSuggestion(editingSuggestion.id, suggestionData);
        success('Suggestion updated successfully!');
      } else {
        await suggestionsApi.createSuggestion(suggestionData);
        success('Suggestion submitted successfully!');
      }

      setShowForm(false);
      setEditingSuggestion(null);
      resetForm();
      fetchData();
    } catch (error) {
      console.error('Error submitting suggestion:', error);
      showError('Failed to submit suggestion');
    }
  };

  const handleEdit = (suggestion) => {
    setEditingSuggestion(suggestion);
    setFormData({
      title: suggestion.title,
      description: suggestion.description,
      category: suggestion.category,
      priority: suggestion.priority,
      suggestion_type: suggestion.suggestion_type,
      target_user_id: suggestion.target_user_id || '',
      target_user_name: suggestion.target_user_name || '',
      anonymous: suggestion.anonymous
    });
    setShowForm(true);
  };

  const handleDelete = async (suggestionId) => {
    if (window.confirm('Are you sure you want to delete this suggestion?')) {
      try {
        await suggestionsApi.deleteSuggestion(suggestionId);
        success('Suggestion deleted successfully!');
        fetchData();
      } catch (error) {
        console.error('Error deleting suggestion:', error);
        showError('Failed to delete suggestion');
      }
    }
  };

  const handleStatusUpdate = async (suggestionId, newStatus) => {
    try {
      await suggestionsApi.updateSuggestionStatus(suggestionId, newStatus);
      success('Suggestion status updated successfully!');
      fetchData();
    } catch (error) {
      console.error('Error updating suggestion status:', error);
      showError('Failed to update suggestion status');
    }
  };

  const handleVote = async (suggestionId, voteType) => {
    try {
      if (voteType === 'upvote') {
        await suggestionsApi.upvoteSuggestion(suggestionId);
      } else {
        await suggestionsApi.downvoteSuggestion(suggestionId);
      }
      fetchData();
    } catch (error) {
      console.error('Error voting on suggestion:', error);
      showError('Failed to vote on suggestion');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      category: '',
      priority: 'medium',
      suggestion_type: 'general',
      target_user_id: '',
      target_user_name: '',
      anonymous: false
    });
  };

  const handleSuggestionTypeChange = (type) => {
    setFormData(prev => ({
      ...prev,
      suggestion_type: type,
      target_user_id: type === 'general' ? '' : prev.target_user_id,
      target_user_name: type === 'general' ? '' : prev.target_user_name
    }));
  };

  const handleTargetUserChange = (userId) => {
    const targetUser = users.find(u => u.id === userId);
    setFormData(prev => ({
      ...prev,
      target_user_id: userId,
      target_user_name: targetUser ? targetUser.full_name : ''
    }));
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

  const getPriorityColor = (priority) => {
    const priorityObj = priorities.find(p => p.value === priority);
    return priorityObj ? priorityObj.color : '';
  };

  const getStatusColor = (status) => {
    const statusObj = statuses.find(s => s.value === status);
    return statusObj ? statusObj.color : '';
  };

  const clearFilters = () => {
    setFilters({
      status: '',
      priority: '',
      category: '',
      suggestion_type: '',
      search: ''
    });
  };

  const hasActiveFilters = Object.values(filters).some(value => value !== '');

  if (!user || !userProfile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-gray-500" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="ml-64">
        {/* Header - Removed duplicate UserDropdown and DarkModeToggle */}
        <div className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
          <div className="flex items-center space-x-3">
            <Lightbulb className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Suggestions</h1>
              <p className="text-gray-600">Share ideas and feedback to improve our organization</p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="p-6">
          <div className="max-w-7xl mx-auto">
            {/* Action Bar - Improved layout similar to calendar view */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
              <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
                {/* Left side - Action button */}
                <div className="flex-shrink-0">
                  <button
                    onClick={() => {
                      setShowForm(true);
                      setEditingSuggestion(null);
                      resetForm();
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center space-x-2 transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    <Plus className="w-5 h-5" />
                    <span>New Suggestion</span>
                  </button>
                </div>

                {/* Right side - View toggle and filters */}
                <div className="flex items-center gap-4 flex-1 justify-end">
                  {/* View Mode Toggle */}
                  <div className="flex items-center bg-gray-100 rounded-lg p-1">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-2 rounded-md transition-all duration-200 ${
                        viewMode === 'grid' 
                          ? 'bg-white text-blue-600 shadow-lg' 
                          : 'text-gray-600 hover:text-gray-800'
                      }`}
                    >
                      <Grid className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-2 rounded-md transition-all duration-200 ${
                        viewMode === 'list' 
                          ? 'bg-white text-blue-600 shadow-lg' 
                          : 'text-gray-600 hover:text-gray-800'
                      }`}
                    >
                      <List className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Filter Toggle */}
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <Filter className="w-4 h-4" />
                    Filters
                    {hasActiveFilters && (
                      <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
                        {Object.values(filters).filter(Boolean).length}
                      </span>
                    )}
                  </button>

                  {/* Clear Filters */}
                  {hasActiveFilters && (
                    <button
                      onClick={clearFilters}
                      className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      Clear All
                    </button>
                  )}
                </div>
              </div>

              {/* Expanded Filters - Similar to calendar view layout */}
              <AnimatePresence>
                {showFilters && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-6 pt-6 border-t border-gray-200"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                      {/* Status Filter */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Status
                        </label>
                        <select
                          value={filters.status}
                          onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="">All Statuses</option>
                          {statuses.map(status => (
                            <option key={status.value} value={status.value}>{status.label}</option>
                          ))}
                        </select>
                      </div>

                      {/* Priority Filter */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Priority
                        </label>
                        <select
                          value={filters.priority}
                          onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="">All Priorities</option>
                          {priorities.map(priority => (
                            <option key={priority.value} value={priority.value}>{priority.label}</option>
                          ))}
                        </select>
                      </div>

                      {/* Category Filter */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Category
                        </label>
                        <select
                          value={filters.category}
                          onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="">All Categories</option>
                          {categories.map(category => (
                            <option key={category.name} value={category.name}>{category.name}</option>
                          ))}
                        </select>
                      </div>

                      {/* Type Filter */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Type
                        </label>
                        <select
                          value={filters.suggestion_type}
                          onChange={(e) => setFilters(prev => ({ ...prev, suggestion_type: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="">All Types</option>
                          <option value="general">General</option>
                          <option value="user_specific">User Specific</option>
                        </select>
                      </div>

                      {/* Search */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Search
                        </label>
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                            type="text"
                            placeholder="Search suggestions..."
                            value={filters.search}
                            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Suggestion Form Modal */}
            <AnimatePresence>
              {showForm && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
                >
                  <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                  >
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold text-gray-900">
                          {editingSuggestion ? 'Edit Suggestion' : 'New Suggestion'}
                        </h2>
                        <button
                          onClick={() => {
                            setShowForm(false);
                            setEditingSuggestion(null);
                            resetForm();
                          }}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <X className="w-6 h-6" />
                        </button>
                      </div>

                      <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
                          <input
                            id="title"
                            type="text"
                            value={formData.title}
                            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                            placeholder="Brief description of your suggestion"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            required
                          />
                        </div>

                        <div>
                          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
                          <textarea
                            id="description"
                            value={formData.description}
                            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                            placeholder="Detailed explanation of your suggestion"
                            rows={4}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            required
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
                            <select
                              id="category"
                              value={formData.category}
                              onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              required
                            >
                              <option value="">Select Category</option>
                              {categories.map(category => (
                                <option key={category.name} value={category.name}>{category.name}</option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                            <select
                              id="priority"
                              value={formData.priority}
                              onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                              {priorities.map(priority => (
                                <option key={priority.value} value={priority.value}>{priority.label}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Suggestion Type</label>
                          <div className="flex space-x-4 mt-2">
                            <label className="flex items-center space-x-2">
                              <input
                                type="radio"
                                value="general"
                                checked={formData.suggestion_type === 'general'}
                                onChange={() => handleSuggestionTypeChange('general')}
                                className="text-blue-600"
                              />
                              <span className="flex items-center space-x-1">
                                <Globe className="w-4 h-4" />
                                <span>General (Visible to all)</span>
                              </span>
                            </label>
                            <label className="flex items-center space-x-2">
                              <input
                                type="radio"
                                value="user_specific"
                                checked={formData.suggestion_type === 'user_specific'}
                                onChange={() => handleSuggestionTypeChange('user_specific')}
                                className="text-blue-600"
                              />
                              <span className="flex items-center space-x-1">
                                <Target className="w-4 h-4" />
                                <span>User Specific</span>
                              </span>
                            </label>
                          </div>
                        </div>

                        {formData.suggestion_type === 'user_specific' && (
                          <div>
                            <label htmlFor="target_user" className="block text-sm font-medium text-gray-700 mb-2">Target User</label>
                            <select
                              id="target_user"
                              value={formData.target_user_id}
                              onChange={(e) => handleTargetUserChange(e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              required
                            >
                              <option value="">Select User</option>
                              {users.map(user => (
                                <option key={user.id} value={user.id}>
                                  {user.full_name} - {user.department} ({user.position})
                                </option>
                              ))}
                            </select>
                          </div>
                        )}

                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="anonymous"
                            checked={formData.anonymous}
                            onChange={(e) => setFormData(prev => ({ ...prev, anonymous: e.target.checked }))}
                            className="text-blue-600"
                          />
                          <label htmlFor="anonymous" className="text-sm font-medium text-gray-700">Submit anonymously</label>
                        </div>

                        <div className="flex justify-end space-x-3 pt-4">
                          <button
                            type="button"
                            onClick={() => {
                              setShowForm(false);
                              setEditingSuggestion(null);
                              resetForm();
                            }}
                            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                          >
                            Cancel
                          </button>
                          <button 
                            type="submit" 
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                          >
                            {editingSuggestion ? 'Update Suggestion' : 'Submit Suggestion'}
                          </button>
                        </div>
                      </form>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Suggestions Display */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  Suggestions ({suggestions.length})
                </h2>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Filter className="w-4 h-4" />
                  Showing {suggestions.length} suggestions
                </div>
              </div>

              {loading ? (
                <div className="text-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-gray-500" />
                  <p className="text-gray-600">Loading suggestions...</p>
                </div>
              ) : suggestions.length === 0 ? (
                <div className="text-center py-12">
                  <Lightbulb className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No suggestions found</h3>
                  <p className="text-gray-600">Be the first to share an idea or adjust your filters.</p>
                </div>
              ) : viewMode === 'grid' ? (
                // Grid View - Similar to calendar card layout
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {suggestions.map((suggestion) => (
                    <motion.div
                      key={suggestion.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-200 hover:border-blue-200"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">{suggestion.title}</h3>
                          <div className="flex flex-wrap gap-2 mb-3">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(suggestion.priority)}`}>
                              {suggestion.priority}
                            </span>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(suggestion.status)}`}>
                              {suggestion.status}
                            </span>
                          </div>
                        </div>
                      </div>

                      <p className="text-gray-600 mb-4 line-clamp-3">{suggestion.description}</p>

                      <div className="space-y-3 mb-4">
                        <div className="flex items-center text-sm text-gray-500">
                          <Tag className="w-4 h-4 mr-2" />
                          <span>{suggestion.category}</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-500">
                          <Calendar className="w-4 h-4 mr-2" />
                          <span>{formatDate(suggestion.created_at)}</span>
                        </div>
                        {!suggestion.anonymous && (
                          <div className="flex items-center text-sm text-gray-500">
                            <User className="w-4 h-4 mr-2" />
                            <span>By: {suggestion.suggester_name}</span>
                          </div>
                        )}
                      </div>

                      {/* Voting */}
                      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                        <div className="flex items-center space-x-4">
                          <button
                            onClick={() => handleVote(suggestion.id, 'upvote')}
                            className="flex items-center space-x-1 text-green-600 hover:text-green-700 transition-colors"
                          >
                            <ThumbsUp className="w-4 h-4" />
                            <span className="text-sm font-medium">{suggestion.upvotes || 0}</span>
                          </button>
                          <button
                            onClick={() => handleVote(suggestion.id, 'downvote')}
                            className="flex items-center space-x-1 text-red-600 hover:text-red-700 transition-colors"
                          >
                            <ThumbsDown className="w-4 h-4" />
                            <span className="text-sm font-medium">{suggestion.downvotes || 0}</span>
                          </button>
                        </div>

                        {/* Action Menu */}
                        <div className="flex items-center space-x-1">
                          {(userProfile.role === 'admin' || userProfile.role === 'hr_manager' || userProfile.role === 'cs_manager') && (
                            <select
                              value={suggestion.status}
                              onChange={(e) => handleStatusUpdate(suggestion.id, e.target.value)}
                              className="px-2 py-1 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                            >
                              {statuses.map(status => (
                                <option key={status.value} value={status.value}>{status.label}</option>
                              ))}
                            </select>
                          )}

                          {(suggestion.suggester_id === user.id || userProfile.role === 'admin' || userProfile.role === 'hr_manager' || userProfile.role === 'cs_manager') && (
                            <div className="flex items-center space-x-1">
                              <button
                                onClick={() => handleEdit(suggestion)}
                                className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                              >
                                <Edit className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => handleDelete(suggestion.id)}
                                className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                // List View - Traditional table layout
                <div className="space-y-4">
                  {suggestions.map((suggestion) => (
                    <div key={suggestion.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-3">
                            <h3 className="text-lg font-semibold text-gray-900">{suggestion.title}</h3>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(suggestion.priority)}`}>
                              {suggestion.priority}
                            </span>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(suggestion.status)}`}>
                              {suggestion.status}
                            </span>
                            {suggestion.suggestion_type === 'user_specific' ? (
                              <span className="flex items-center space-x-1 text-blue-600">
                                <Target className="w-4 h-4" />
                                <span className="text-sm">For: {suggestion.target_user_name}</span>
                              </span>
                            ) : (
                              <span className="flex items-center space-x-1 text-green-600">
                                <Globe className="w-4 h-4" />
                                <span className="text-sm">General</span>
                              </span>
                            )}
                          </div>

                          <p className="text-gray-600 mb-4">{suggestion.description}</p>

                          <div className="flex items-center space-x-6 text-sm text-gray-500">
                            <span className="flex items-center space-x-1">
                              <Tag className="w-4 h-4" />
                              <span>{suggestion.category}</span>
                            </span>
                            <span className="flex items-center space-x-1">
                              <Calendar className="w-4 h-4" />
                              <span>{formatDate(suggestion.created_at)}</span>
                            </span>
                            {!suggestion.anonymous && (
                              <span className="flex items-center space-x-1">
                                <User className="w-4 h-4" />
                                <span>By: {suggestion.suggester_name}</span>
                              </span>
                            )}
                          </div>

                          {/* Voting */}
                          <div className="flex items-center space-x-4 mt-4">
                            <button
                              onClick={() => handleVote(suggestion.id, 'upvote')}
                              className="flex items-center space-x-1 text-green-600 hover:text-green-700"
                            >
                              <ThumbsUp className="w-4 h-4" />
                              <span>{suggestion.upvotes || 0}</span>
                            </button>
                            <button
                              onClick={() => handleVote(suggestion.id, 'downvote')}
                              className="flex items-center space-x-1 text-red-600 hover:text-red-700"
                            >
                              <ThumbsDown className="w-4 h-4" />
                              <span>{suggestion.downvotes || 0}</span>
                            </button>
                          </div>
                        </div>

                        {/* Action Menu */}
                        <div className="flex items-center space-x-2">
                          {(userProfile.role === 'admin' || userProfile.role === 'hr_manager' || userProfile.role === 'cs_manager') && (
                            <select
                              value={suggestion.status}
                              onChange={(e) => handleStatusUpdate(suggestion.id, e.target.value)}
                              className="px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                            >
                              {statuses.map(status => (
                                <option key={status.value} value={status.value}>{status.label}</option>
                              ))}
                            </select>
                          )}

                          {(suggestion.suggester_id === user.id || userProfile.role === 'admin' || userProfile.role === 'hr_manager' || userProfile.role === 'cs_manager') && (
                            <div className="flex items-center space-x-1">
                              <button
                                onClick={() => handleEdit(suggestion)}
                                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(suggestion.id)}
                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Suggestions;
