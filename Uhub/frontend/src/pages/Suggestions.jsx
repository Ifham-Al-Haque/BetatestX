import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Search, Filter, FileText, Clock, User, 
  Lightbulb, CheckCircle, XCircle, MoreHorizontal,
  Edit, Trash2, Eye, Calendar, Tag, Building, 
  MessageSquare, Shield, TrendingUp, Activity, Zap,
  BarChart3, Users, CreditCard, AlertCircle, Loader2,
  ThumbsUp, ThumbsDown, Target, Globe, Grid, List,
  ChevronDown, X, Sparkles, Award, Star, Heart,
  RefreshCw, Download, Upload, Settings, Bell
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { suggestionsApi } from '../services/suggestionsApi';
import HRCommentThread from '../components/hr/HRCommentThread';

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
  const [expandedThreadId, setExpandedThreadId] = useState(null);

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
      console.log('Submitting suggestion form...');
      console.log('User:', user);
      console.log('UserProfile:', userProfile);
      console.log('Editing suggestion:', editingSuggestion);
      console.log('Form data:', formData);

      // Clean up form data to handle empty strings for UUID fields
      const cleanedFormData = {
        ...formData,
        // Convert empty strings to null for UUID fields
        target_user_id: formData.target_user_id && formData.target_user_id.trim() !== '' 
          ? formData.target_user_id 
          : null,
        // Ensure target_user_name is null if target_user_id is null
        target_user_name: formData.target_user_id && formData.target_user_id.trim() !== '' 
          ? formData.target_user_name 
          : null
      };

      const suggestionData = {
        ...cleanedFormData,
        suggester_id: user.id,
        suggester_name: userProfile?.full_name || user.email
      };

      console.log('Cleaned suggestion data:', suggestionData);

      if (editingSuggestion) {
        console.log('Updating suggestion with ID:', editingSuggestion.id);
        console.log('Update data:', suggestionData);
        
        await suggestionsApi.updateSuggestion(editingSuggestion.id, suggestionData);
        success('Suggestion updated successfully!');
      } else {
        console.log('Creating new suggestion...');
        await suggestionsApi.createSuggestion(suggestionData);
        success('Suggestion submitted successfully!');
      }

      setShowForm(false);
      setEditingSuggestion(null);
      resetForm();
      fetchData();
    } catch (error) {
      console.error('Error submitting suggestion:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      
      // Provide more specific error messages
      let errorMessage = 'Failed to submit suggestion';
      if (error.message.includes('Suggestion not found')) {
        errorMessage = 'Suggestion not found. It may have been deleted.';
      } else if (error.message.includes('permission')) {
        errorMessage = 'You do not have permission to update this suggestion.';
      } else if (error.message.includes('RLS')) {
        errorMessage = 'Access denied. Please check your permissions.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      showError(errorMessage);
    }
  };

  const handleEdit = (suggestion) => {
    console.log('Edit button clicked for suggestion:', suggestion);
    console.log('Current user:', user);
    console.log('Current user profile:', userProfile);
    console.log('Suggestion suggester_id:', suggestion.suggester_id);
    console.log('User can edit:', suggestion.suggester_id === user?.id || 
      ['admin', 'hr_manager', 'cs_manager'].includes(userProfile?.role));
    
    setEditingSuggestion(suggestion);
    setFormData({
      title: suggestion.title,
      description: suggestion.description,
      category: suggestion.category,
      priority: suggestion.priority,
      suggestion_type: suggestion.suggestion_type,
      // Handle null values properly - use empty string for form display but will be cleaned on submit
      target_user_id: suggestion.target_user_id || '',
      target_user_name: suggestion.target_user_name || '',
      anonymous: suggestion.anonymous || false
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
    <div
      className="min-h-screen p-4 md:p-6 transition-colors duration-300"
      style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="relative mb-6">
          <div
            className="relative rounded-2xl p-6 md:p-8 border shadow-xl"
            style={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)' }}
          >
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-gradient-to-br from-purple-500 to-blue-600 rounded-2xl shadow-lg">
                  <Lightbulb className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
                    Suggestions
                  </h1>
                  <p className="mt-2 text-base" style={{ color: 'var(--text-muted)' }}>
                    Share ideas and vote on improvements
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setShowForm(true);
                    setEditingSuggestion(null);
                    resetForm();
                  }}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-6 py-3 rounded-xl flex items-center gap-3 transition-all duration-200 shadow-lg hover:shadow-xl font-semibold"
                >
                  <Plus className="w-5 h-5" />
                  New Suggestion
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={fetchData}
                  className="inline-flex items-center gap-3 px-6 py-3 rounded-xl text-sm font-semibold border transition-colors"
                  style={{ borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}
                >
                  <RefreshCw className="w-5 h-5" />
                  Refresh
                </motion.button>
              </div>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="pb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                whileHover={{ y: -5, transition: { duration: 0.2 } }}
                className="relative bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-blue-200/50 dark:border-blue-700/50 overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-400/20 to-blue-600/20 rounded-full -translate-y-10 translate-x-10"></div>
                <div className="relative flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-blue-700 dark:text-blue-300 mb-1">Total Suggestions</p>
                    <p className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 dark:from-blue-400 dark:to-blue-600 bg-clip-text text-transparent">{suggestions.length}</p>
                    <p className="text-xs text-blue-600/70 dark:text-blue-400/70 mt-1">All submitted ideas</p>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg">
                    <Lightbulb className="w-7 h-7 text-white" />
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                whileHover={{ y: -5, transition: { duration: 0.2 } }}
                className="relative bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-emerald-200/50 dark:border-emerald-700/50 overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-emerald-400/20 to-emerald-600/20 rounded-full -translate-y-10 translate-x-10"></div>
                <div className="relative flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300 mb-1">Implemented</p>
                    <p className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-emerald-800 dark:from-emerald-400 dark:to-emerald-600 bg-clip-text text-transparent">
                      {suggestions.filter(s => s.status === 'implemented').length}
                    </p>
                    <p className="text-xs text-emerald-600/70 dark:text-emerald-400/70 mt-1">Successfully adopted</p>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl shadow-lg">
                    <CheckCircle className="w-7 h-7 text-white" />
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                whileHover={{ y: -5, transition: { duration: 0.2 } }}
                className="relative bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-amber-200/50 dark:border-amber-700/50 overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-amber-400/20 to-amber-600/20 rounded-full -translate-y-10 translate-x-10"></div>
                <div className="relative flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-amber-700 dark:text-amber-300 mb-1">In Progress</p>
                    <p className="text-4xl font-bold bg-gradient-to-r from-amber-600 to-amber-800 dark:from-amber-400 dark:to-amber-600 bg-clip-text text-transparent">
                      {suggestions.filter(s => s.status === 'in_progress').length}
                    </p>
                    <p className="text-xs text-amber-600/70 dark:text-amber-400/70 mt-1">Currently being worked on</p>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl shadow-lg">
                    <Activity className="w-7 h-7 text-white" />
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                whileHover={{ y: -5, transition: { duration: 0.2 } }}
                className="relative bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-purple-200/50 dark:border-purple-700/50 overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-purple-400/20 to-purple-600/20 rounded-full -translate-y-10 translate-x-10"></div>
                <div className="relative flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-purple-700 dark:text-purple-300 mb-1">High Priority</p>
                    <p className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-purple-800 dark:from-purple-400 dark:to-purple-600 bg-clip-text text-transparent">
                      {suggestions.filter(s => s.priority === 'high' || s.priority === 'urgent').length}
                    </p>
                    <p className="text-xs text-purple-600/70 dark:text-purple-400/70 mt-1">Need immediate attention</p>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl shadow-lg">
                    <Zap className="w-7 h-7 text-white" />
                  </div>
                </div>
              </motion.div>
            </div>
        </div>

        {/* Main Content */}
        <div>
            {/* Enhanced Action Bar */}
            <div className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 mb-8 border border-white/20 dark:border-gray-700/50">
              <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">
                {/* Left side - View toggle and filters */}
                <div className="flex items-center gap-4 flex-1">
                  {/* View Mode Toggle */}
                  <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-xl p-1">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setViewMode('grid')}
                      className={`p-3 rounded-lg transition-all duration-200 ${
                        viewMode === 'grid' 
                          ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg' 
                          : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                      }`}
                    >
                      <Grid className="w-5 h-5" />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setViewMode('list')}
                      className={`p-3 rounded-lg transition-all duration-200 ${
                        viewMode === 'list' 
                          ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg' 
                          : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                      }`}
                    >
                      <List className="w-5 h-5" />
                    </motion.button>
                  </div>

                  {/* Filter Toggle */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowFilters(!showFilters)}
                    className={`flex items-center gap-3 px-6 py-4 rounded-xl transition-all duration-200 font-semibold ${
                      showFilters 
                        ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg' 
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 border-2 border-gray-200 dark:border-gray-600'
                    }`}
                  >
                    <Filter className="w-5 h-5" />
                    Advanced Filters
                    {hasActiveFilters && (
                      <span className="bg-white/20 text-white text-xs px-3 py-1 rounded-full font-bold">
                        {Object.values(filters).filter(Boolean).length}
                      </span>
                    )}
                  </motion.button>

                  {/* Clear Filters */}
                  {hasActiveFilters && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={clearFilters}
                      className="px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all duration-200"
                    >
                      Clear All Filters
                    </motion.button>
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
                    className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-white/20 dark:border-gray-700/50"
                  >
                    <div className="p-8">
                      <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl shadow-lg">
                            <Lightbulb className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-purple-800 to-blue-800 dark:from-white dark:via-purple-200 dark:to-blue-200 bg-clip-text text-transparent">
                              {editingSuggestion ? 'Edit Suggestion' : 'New Suggestion'}
                            </h2>
                            <p className="text-gray-600 dark:text-gray-400 mt-1">
                              {editingSuggestion ? 'Update your suggestion details' : 'Share your innovative ideas with the team'}
                            </p>
                          </div>
                        </div>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => {
                            setShowForm(false);
                            setEditingSuggestion(null);
                            resetForm();
                          }}
                          className="p-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-xl transition-all duration-200"
                        >
                          <X className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                        </motion.button>
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

                        <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200 dark:border-gray-700/50">
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            type="button"
                            onClick={() => {
                              setShowForm(false);
                              setEditingSuggestion(null);
                              resetForm();
                            }}
                            className="px-6 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 font-semibold"
                          >
                            Cancel
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            type="submit" 
                            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl font-semibold"
                          >
                            {editingSuggestion ? 'Update Suggestion' : 'Submit Suggestion'}
                          </motion.button>
                        </div>
                      </form>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Enhanced Suggestions Display */}
            <div className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-white/20 dark:border-gray-700/50">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg">
                    <MessageSquare className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      Suggestions
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                      {suggestions.length} suggestions found
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                  <Sparkles className="w-4 h-4" />
                  <span>Showing {suggestions.length} suggestions</span>
                </div>
              </div>

              {loading ? (
                <div className="text-center py-16">
                  <div className="relative">
                    <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 dark:border-blue-800 mx-auto mb-6"></div>
                    <div className="absolute inset-0 rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto animate-spin"></div>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Loading Suggestions</h3>
                  <p className="text-gray-500 dark:text-gray-400">Please wait while we fetch the latest suggestions...</p>
                </div>
              ) : suggestions.length === 0 ? (
                <div className="text-center py-16">
                  <div className="relative mb-8">
                    <div className="w-24 h-24 bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30 rounded-full mx-auto flex items-center justify-center shadow-lg">
                      <Lightbulb className="w-12 h-12 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center shadow-lg">
                      <Sparkles className="w-4 h-4 text-white" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">No suggestions found</h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
                    {hasActiveFilters 
                      ? "Try adjusting your search criteria or filters to find what you're looking for" 
                      : "Be the first to share an innovative idea with the team"
                    }
                  </p>
                  {!hasActiveFilters && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        setShowForm(true);
                        setEditingSuggestion(null);
                        resetForm();
                      }}
                      className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-3 mx-auto"
                    >
                      <Plus className="w-5 h-5" />
                      Share Your First Idea
                    </motion.button>
                  )}
                </div>
              ) : viewMode === 'grid' ? (
                // Enhanced Grid View
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {suggestions.map((suggestion, index) => (
                    <motion.div
                      key={suggestion.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ y: -8, transition: { duration: 0.2 } }}
                      className="relative bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 border border-gray-200/50 dark:border-gray-700/50 rounded-2xl p-6 hover:shadow-2xl transition-all duration-300 hover:border-blue-300/50 dark:hover:border-blue-600/50 overflow-hidden group"
                    >
                      {/* Decorative gradient background */}
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
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

                      <div className="relative flex items-center justify-between pt-6 border-t border-gray-100 dark:border-gray-700/50">
                        <div className="flex items-center space-x-4">
                          <motion.button
                            type="button"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setExpandedThreadId(
                              expandedThreadId === suggestion.id ? null : suggestion.id
                            )}
                            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-xl border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300"
                          >
                            <MessageSquare className="w-4 h-4" />
                            {expandedThreadId === suggestion.id ? 'Hide responses' : 'HR responses'}
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleVote(suggestion.id, 'upvote')}
                            className="flex items-center space-x-2 px-3 py-2 bg-gradient-to-r from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 text-emerald-600 dark:text-emerald-400 hover:from-emerald-100 hover:to-emerald-200 dark:hover:from-emerald-900/30 dark:hover:to-emerald-800/30 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md"
                          >
                            <ThumbsUp className="w-4 h-4" />
                            <span className="text-sm font-semibold">{suggestion.upvotes || 0}</span>
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleVote(suggestion.id, 'downvote')}
                            className="flex items-center space-x-2 px-3 py-2 bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 text-red-600 dark:text-red-400 hover:from-red-100 hover:to-red-200 dark:hover:from-red-900/30 dark:hover:to-red-800/30 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md"
                          >
                            <ThumbsDown className="w-4 h-4" />
                            <span className="text-sm font-semibold">{suggestion.downvotes || 0}</span>
                          </motion.button>
                        </div>

                        {/* Actions — status managed in Suggestions Inbox (HR) */}
                        <div className="flex items-center space-x-2">
                          {(suggestion.suggester_id === user.id || userProfile.role === 'admin' || userProfile.role === 'hr_manager' || userProfile.role === 'cs_manager') && (
                            <div className="flex items-center space-x-1">
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => handleEdit(suggestion)}
                                className="p-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
                              >
                                <Edit className="w-4 h-4" />
                              </motion.button>
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => handleDelete(suggestion.id)}
                                className="p-2 bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
                              >
                                <Trash2 className="w-4 h-4" />
                              </motion.button>
                            </div>
                          )}
                        </div>
                      </div>

                      {expandedThreadId === suggestion.id && (
                        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700/50">
                          <HRCommentThread
                            entityType="suggestion"
                            entityId={suggestion.id}
                            canReply={suggestion.suggester_id === user.id}
                          />
                        </div>
                      )}
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
  );
};

export default Suggestions;
