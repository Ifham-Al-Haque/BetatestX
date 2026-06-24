import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Search, Filter, Lightbulb, CheckCircle, Activity, Zap,
  Loader2, ThumbsUp, Grid, List, RefreshCw, Sparkles, Award, ChevronDown,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { suggestionsApi } from '../services/suggestionsApi';
import PaginationControls from '../components/ui/PaginationControls';
import SuggestionCard from '../components/suggestions/SuggestionCard';
import SuggestionFormModal from '../components/suggestions/SuggestionFormModal';
import SuggestionDetailModal from '../components/suggestions/SuggestionDetailModal';
import {
  SUGGESTION_STATUSES,
  SUGGESTION_PRIORITIES,
} from '../config/hrPanelConfig';
import {
  buildCategoryColorMap,
  canEditSuggestion,
  PRIORITY_SORT_ORDER,
} from '../utils/suggestionHelpers';

const PAGE_SIZE = 12;
const EMPTY_FILTERS = { status: '', priority: '', category: '', suggestion_type: '', search: '' };

const QUICK_FILTERS = [
  { key: 'open', label: 'Open', apply: (setFilters, setSortBy) => { setSortBy('newest'); setFilters({ ...EMPTY_FILTERS, status: 'open' }); } },
  { key: 'top_voted', label: 'Top Voted', apply: (setFilters, setSortBy) => { setSortBy('votes'); setFilters({ ...EMPTY_FILTERS }); } },
  { key: 'my_ideas', label: 'My Ideas', apply: (setFilters, setSortBy) => { setSortBy('newest'); setFilters({ ...EMPTY_FILTERS }); } },
  { key: 'for_me', label: 'For Me', apply: (setFilters, setSortBy) => { setSortBy('newest'); setFilters({ ...EMPTY_FILTERS }); } },
  { key: 'implemented', label: 'Implemented', apply: (setFilters, setSortBy) => { setSortBy('newest'); setFilters({ ...EMPTY_FILTERS, status: 'implemented' }); } },
];

const DEFAULT_FORM = {
  title: '',
  description: '',
  category: '',
  priority: 'medium',
  suggestion_type: 'general',
  target_user_id: '',
  target_user_name: '',
  anonymous: false,
};

const Suggestions = () => {
  const { user, userProfile } = useAuth();
  const { success, error: showError } = useToast();

  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingSuggestion, setEditingSuggestion] = useState(null);
  const [viewMode, setViewMode] = useState('grid');
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [expandedThreadId, setExpandedThreadId] = useState(null);
  const [activeQuickFilter, setActiveQuickFilter] = useState(null);
  const [sortBy, setSortBy] = useState('newest');
  const [page, setPage] = useState(1);
  const [selectedSuggestion, setSelectedSuggestion] = useState(null);
  const [formData, setFormData] = useState(DEFAULT_FORM);
  const [categories, setCategories] = useState([]);
  const [users, setUsers] = useState([]);
  const [userVotes, setUserVotes] = useState({});
  const [votingId, setVotingId] = useState(null);

  const categoryColorMap = useMemo(() => buildCategoryColorMap(categories), [categories]);

  useEffect(() => {
    fetchCategories();
    fetchUsers();
  }, []);

  useEffect(() => {
    if (userProfile) fetchData();
  }, [filters, userProfile]);

  useEffect(() => {
    setPage(1);
  }, [filters, activeQuickFilter, sortBy]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await suggestionsApi.getSuggestionsWithFilters(filters, user?.id, userProfile?.role);
      setSuggestions(data);

      if (user?.id && data.length > 0) {
        const votes = await suggestionsApi.getMyVotesForSuggestions(
          data.map((s) => s.id),
          user.id
        );
        setUserVotes(votes);
      } else {
        setUserVotes({});
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      showError('Failed to fetch suggestions');
    } finally {
      setLoading(false);
    }
  };

  const applyVoteResult = (result) => {
    if (!result?.suggestion_id) return;

    setSuggestions((prev) =>
      prev.map((s) =>
        s.id === result.suggestion_id
          ? { ...s, upvotes: result.upvotes, downvotes: result.downvotes }
          : s
      )
    );

    setUserVotes((prev) => {
      const next = { ...prev };
      if (result.user_vote) {
        next[result.suggestion_id] = result.user_vote;
      } else {
        delete next[result.suggestion_id];
      }
      return next;
    });

    setSelectedSuggestion((prev) =>
      prev?.id === result.suggestion_id
        ? { ...prev, upvotes: result.upvotes, downvotes: result.downvotes }
        : prev
    );
  };

  const fetchCategories = async () => {
    try {
      const data = await suggestionsApi.getSuggestionCategories();
      setCategories(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const data = await suggestionsApi.getUsersForTargeting();
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const processedSuggestions = useMemo(() => {
    let list = [...suggestions];

    if (activeQuickFilter === 'my_ideas') {
      list = list.filter((s) => s.suggester_id === user?.id);
    } else if (activeQuickFilter === 'for_me') {
      list = list.filter((s) => s.target_user_id === user?.id);
    }

    if (sortBy === 'votes') {
      list.sort(
        (a, b) =>
          (b.upvotes || 0) - (a.upvotes || 0) ||
          new Date(b.created_at) - new Date(a.created_at)
      );
    } else if (sortBy === 'priority') {
      list.sort(
        (a, b) =>
          (PRIORITY_SORT_ORDER[a.priority] ?? 99) - (PRIORITY_SORT_ORDER[b.priority] ?? 99) ||
          new Date(b.created_at) - new Date(a.created_at)
      );
    }

    return list;
  }, [suggestions, activeQuickFilter, sortBy, user?.id]);

  const recentlyImplemented = useMemo(
    () =>
      suggestions
        .filter((s) => s.status === 'implemented')
        .sort(
          (a, b) =>
            new Date(b.implemented_at || b.updated_at || b.created_at) -
            new Date(a.implemented_at || a.updated_at || a.created_at)
        )
        .slice(0, 3),
    [suggestions]
  );

  const pagedSuggestions = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return processedSuggestions.slice(start, start + PAGE_SIZE);
  }, [processedSuggestions, page]);

  const totalPages = Math.max(1, Math.ceil(processedSuggestions.length / PAGE_SIZE));

  const stats = useMemo(
    () => ({
      total: suggestions.length,
      implemented: suggestions.filter((s) => s.status === 'implemented').length,
      inProgress: suggestions.filter((s) => s.status === 'in_progress').length,
      highPriority: suggestions.filter((s) => s.priority === 'high' || s.priority === 'urgent').length,
    }),
    [suggestions]
  );

  const hasActiveFilters =
    Object.values(filters).some(Boolean) || activeQuickFilter || sortBy !== 'newest';

  const showSpotlight = !hasActiveFilters && !loading && recentlyImplemented.length > 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const cleanedFormData = {
        ...formData,
        target_user_id: formData.target_user_id?.trim() ? formData.target_user_id : null,
        target_user_name:
          formData.target_user_id?.trim() ? formData.target_user_name : null,
      };

      const suggestionData = {
        ...cleanedFormData,
        suggester_id: user.id,
        suggester_name: userProfile?.full_name || user.email,
      };

      if (editingSuggestion) {
        await suggestionsApi.updateSuggestion(editingSuggestion.id, suggestionData);
        success('Suggestion updated successfully!');
      } else {
        await suggestionsApi.createSuggestion(suggestionData);
        success('Suggestion submitted successfully!');
      }

      closeForm();
      fetchData();
    } catch (error) {
      console.error('Error submitting suggestion:', error);
      showError(error.message || 'Failed to submit suggestion');
    }
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingSuggestion(null);
    setFormData(DEFAULT_FORM);
  };

  const openNewForm = () => {
    setEditingSuggestion(null);
    setFormData(DEFAULT_FORM);
    setShowForm(true);
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
      anonymous: suggestion.anonymous || false,
    });
    setShowForm(true);
  };

  const handleDelete = async (suggestionId) => {
    if (!window.confirm('Are you sure you want to delete this suggestion?')) return;
    try {
      await suggestionsApi.deleteSuggestion(suggestionId);
      success('Suggestion deleted successfully!');
      if (selectedSuggestion?.id === suggestionId) setSelectedSuggestion(null);
      fetchData();
    } catch (error) {
      console.error('Error deleting suggestion:', error);
      showError('Failed to delete suggestion');
    }
  };

  const handleVote = async (suggestionId, voteType) => {
    if (votingId) return;
    setVotingId(suggestionId);
    try {
      const result = await suggestionsApi.castSuggestionVote(suggestionId, voteType);
      applyVoteResult(result);
    } catch (error) {
      console.error('Error voting on suggestion:', error);
      const msg = error.message || '';
      if (msg.includes('cast_suggestion_vote') || msg.includes('Could not find the function')) {
        showError('Voting is not set up yet. Run create_suggestion_votes.sql in Supabase.');
      } else {
        showError(msg || 'Failed to cast vote');
      }
    } finally {
      setVotingId(null);
    }
  };

  const handleSuggestionTypeChange = (type) => {
    setFormData((prev) => ({
      ...prev,
      suggestion_type: type,
      target_user_id: type === 'general' ? '' : prev.target_user_id,
      target_user_name: type === 'general' ? '' : prev.target_user_name,
    }));
  };

  const handleTargetUserChange = (userId) => {
    const targetUser = users.find((u) => u.id === userId);
    setFormData((prev) => ({
      ...prev,
      target_user_id: userId,
      target_user_name: targetUser ? targetUser.full_name : '',
    }));
  };

  const applyQuickFilter = (quick) => {
    if (activeQuickFilter === quick.key) {
      setActiveQuickFilter(null);
      setSortBy('newest');
      setFilters(EMPTY_FILTERS);
      return;
    }
    setActiveQuickFilter(quick.key);
    quick.apply(setFilters, setSortBy);
  };

  const clearAllFilters = () => {
    setFilters(EMPTY_FILTERS);
    setActiveQuickFilter(null);
    setSortBy('newest');
  };

  const toggleThread = (id) => {
    setExpandedThreadId((prev) => (prev === id ? null : id));
  };

  if (!user || !userProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
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
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <div
            className="rounded-2xl p-6 md:p-8 border shadow-xl"
            style={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)' }}
          >
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="flex items-center gap-4">
                <div
                  className="p-4 rounded-2xl shadow-lg"
                  style={{ background: 'linear-gradient(135deg, #a855f7 0%, #6366f1 100%)', boxShadow: '0 4px 14px rgba(168, 85, 247, 0.35)' }}
                >
                  <Lightbulb className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                    Suggestions
                  </h1>
                  <p className="mt-1 text-sm md:text-base" style={{ color: 'var(--text-muted)' }}>
                    Share ideas, vote on improvements, and track what gets implemented
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={openNewForm}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold shadow-lg transition-opacity hover:opacity-90"
                  style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #6366f1 100%)' }}
                >
                  <Plus className="w-5 h-5" />
                  New Suggestion
                </motion.button>
                <button
                  type="button"
                  onClick={fetchData}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border transition-colors"
                  style={{ borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total', value: stats.total, icon: Lightbulb, accent: '#a855f7' },
            { label: 'Implemented', value: stats.implemented, icon: CheckCircle, accent: '#22c55e' },
            { label: 'In Progress', value: stats.inProgress, icon: Activity, accent: '#f59e0b' },
            { label: 'High Priority', value: stats.highPriority, icon: Zap, accent: '#ef4444' },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="rounded-2xl p-4 border"
              style={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)' }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                    {stat.label}
                  </p>
                  <p className="text-2xl font-bold mt-1" style={{ color: 'var(--text-primary)' }}>{stat.value}</p>
                </div>
                <div className="p-2.5 rounded-xl" style={{ background: `${stat.accent}18` }}>
                  <stat.icon className="w-5 h-5" style={{ color: stat.accent }} />
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Recently implemented spotlight */}
        {showSpotlight && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border p-5 mb-6"
            style={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)' }}
          >
            <div className="flex items-center gap-2 mb-4">
              <Award className="w-5 h-5 text-green-500" />
              <h2 className="text-sm font-bold uppercase tracking-wide" style={{ color: 'var(--text-primary)' }}>
                Recently Implemented
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {recentlyImplemented.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSelectedSuggestion(s)}
                  className="text-left rounded-xl p-4 border transition-shadow hover:shadow-md"
                  style={{ borderColor: 'var(--border-primary)', background: 'var(--bg-tertiary)' }}
                >
                  <p className="font-semibold text-sm line-clamp-1 mb-1" style={{ color: 'var(--text-primary)' }}>
                    {s.title}
                  </p>
                  <p className="text-xs line-clamp-2 mb-2" style={{ color: 'var(--text-muted)' }}>
                    {s.description}
                  </p>
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600">
                    <ThumbsUp className="w-3 h-3" />
                    {s.upvotes || 0} votes
                  </span>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Toolbar */}
        <div
          className="rounded-2xl border p-4 mb-4 space-y-4"
          style={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)' }}
        >
          <div className="flex flex-col lg:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Search suggestions..."
                value={filters.search}
                onChange={(e) => {
                  setActiveQuickFilter(null);
                  setFilters({ ...filters, search: e.target.value });
                }}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm"
                style={{ borderColor: 'var(--border-primary)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
              />
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2.5 rounded-xl border text-sm lg:w-44"
              style={{ borderColor: 'var(--border-primary)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
            >
              <option value="newest">Newest first</option>
              <option value="votes">Top voted</option>
              <option value="priority">Highest priority</option>
            </select>
            <div className="inline-flex rounded-xl p-1 self-start" style={{ background: 'var(--bg-tertiary)' }}>
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-purple-500 text-white shadow' : ''}`}
                style={viewMode !== 'grid' ? { color: 'var(--text-muted)' } : undefined}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-purple-500 text-white shadow' : ''}`}
                style={viewMode !== 'list' ? { color: 'var(--text-muted)' } : undefined}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {QUICK_FILTERS.map((q) => (
              <button
                key={q.key}
                type="button"
                onClick={() => applyQuickFilter(q)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                  activeQuickFilter === q.key ? 'bg-purple-500 text-white border-purple-500' : ''
                }`}
                style={activeQuickFilter !== q.key ? { borderColor: 'var(--border-primary)', color: 'var(--text-muted)' } : undefined}
              >
                {q.label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setShowAdvancedFilters((v) => !v)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                showAdvancedFilters ? 'bg-purple-500 text-white border-purple-500' : ''
              }`}
              style={!showAdvancedFilters ? { borderColor: 'var(--border-primary)', color: 'var(--text-muted)' } : undefined}
            >
              <Filter className="w-3 h-3" />
              More filters
              <ChevronDown className={`w-3 h-3 transition-transform ${showAdvancedFilters ? 'rotate-180' : ''}`} />
            </button>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearAllFilters}
                className="px-3 py-1.5 rounded-full text-xs font-semibold text-red-500 hover:text-red-600"
              >
                Clear all
              </button>
            )}
          </div>

          <AnimatePresence>
            {showAdvancedFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t" style={{ borderColor: 'var(--border-primary)' }}>
                  <select
                    value={filters.status}
                    onChange={(e) => { setActiveQuickFilter(null); setFilters({ ...filters, status: e.target.value }); }}
                    className="px-3 py-2.5 rounded-xl border text-sm"
                    style={{ borderColor: 'var(--border-primary)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                  >
                    <option value="">All Statuses</option>
                    {SUGGESTION_STATUSES.map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                  <select
                    value={filters.priority}
                    onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
                    className="px-3 py-2.5 rounded-xl border text-sm"
                    style={{ borderColor: 'var(--border-primary)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                  >
                    <option value="">All Priorities</option>
                    {SUGGESTION_PRIORITIES.map((p) => (
                      <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                  </select>
                  <select
                    value={filters.category}
                    onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                    className="px-3 py-2.5 rounded-xl border text-sm"
                    style={{ borderColor: 'var(--border-primary)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                  >
                    <option value="">All Categories</option>
                    {categories.map((c) => (
                      <option key={c.name} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                  <select
                    value={filters.suggestion_type}
                    onChange={(e) => setFilters({ ...filters, suggestion_type: e.target.value })}
                    className="px-3 py-2.5 rounded-xl border text-sm"
                    style={{ borderColor: 'var(--border-primary)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                  >
                    <option value="">All Types</option>
                    <option value="general">General</option>
                    <option value="user_specific">User Specific</option>
                  </select>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Content */}
        <div
          className="rounded-2xl border overflow-hidden"
          style={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)' }}
        >
          {loading ? (
            <div className="py-20 text-center">
              <Loader2 className="w-10 h-10 animate-spin mx-auto mb-3 text-purple-500" />
              <p style={{ color: 'var(--text-muted)' }}>Loading suggestions...</p>
            </div>
          ) : processedSuggestions.length === 0 ? (
            <div className="py-20 text-center px-4">
              <div className="relative w-20 h-20 mx-auto mb-6">
                <div
                  className="w-full h-full rounded-full flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, rgba(168,85,247,0.15), rgba(99,102,241,0.15))' }}
                >
                  <Lightbulb className="w-10 h-10 text-purple-500" />
                </div>
                <Sparkles className="w-5 h-5 text-amber-400 absolute -top-1 -right-1" />
              </div>
              <h3 className="text-lg font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                No suggestions found
              </h3>
              <p className="text-sm mb-6 max-w-md mx-auto" style={{ color: 'var(--text-muted)' }}>
                {hasActiveFilters
                  ? 'Try adjusting your search or filters.'
                  : 'Be the first to share an idea with the team.'}
              </p>
              {!hasActiveFilters && (
                <button
                  type="button"
                  onClick={openNewForm}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-white text-sm font-semibold shadow-lg"
                  style={{ background: 'linear-gradient(135deg, #7c3aed, #6366f1)' }}
                >
                  <Plus className="w-4 h-4" />
                  Share Your First Idea
                </button>
              )}
            </div>
          ) : (
            <div className="p-4 md:p-6">
              <p className="text-xs font-medium mb-4" style={{ color: 'var(--text-muted)' }}>
                {processedSuggestions.length} suggestion{processedSuggestions.length !== 1 ? 's' : ''}
              </p>
              <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-3'}>
                {pagedSuggestions.map((suggestion, index) => (
                  <SuggestionCard
                    key={suggestion.id}
                    suggestion={suggestion}
                    index={index}
                    viewMode={viewMode}
                    user={user}
                    userProfile={userProfile}
                    categoryColorMap={categoryColorMap}
                    userVote={userVotes[suggestion.id] || null}
                    voting={votingId === suggestion.id}
                    expandedThreadId={expandedThreadId}
                    onToggleThread={toggleThread}
                    onVote={handleVote}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onViewDetail={setSelectedSuggestion}
                  />
                ))}
              </div>
              <PaginationControls
                page={page}
                totalPages={totalPages}
                totalItems={processedSuggestions.length}
                pageSize={PAGE_SIZE}
                onPageChange={setPage}
              />
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showForm && (
          <SuggestionFormModal
            show={showForm}
            editingSuggestion={editingSuggestion}
            formData={formData}
            setFormData={setFormData}
            categories={categories}
            users={users}
            onSubmit={handleSubmit}
            onClose={closeForm}
            onTypeChange={handleSuggestionTypeChange}
            onTargetUserChange={handleTargetUserChange}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedSuggestion && (
          <SuggestionDetailModal
            suggestion={selectedSuggestion}
            user={user}
            userVote={userVotes[selectedSuggestion.id] || null}
            voting={votingId === selectedSuggestion.id}
            onClose={() => setSelectedSuggestion(null)}
            onVote={handleVote}
            onEdit={handleEdit}
            canEdit={canEditSuggestion(selectedSuggestion, user, userProfile)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Suggestions;
