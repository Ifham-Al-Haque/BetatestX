import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Navigate } from 'react-router-dom';
import {
  Inbox, Search, Lightbulb, CheckCircle, Clock, Eye, RefreshCw, Loader2,
  XCircle, List, Table2, Zap, ThumbsUp, ThumbsDown, User, Calendar, Tag,
  Globe, Target, Sparkles, Download, UserCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { suggestionsApi } from '../services/suggestionsApi';
import { hrPanelApi } from '../services/hrPanelApi';
import PaginationControls from '../components/ui/PaginationControls';
import HRCommentThread from '../components/hr/HRCommentThread';
import SuggestionVotePoll from '../components/suggestions/SuggestionVotePoll';
import SuggestionVoteBreakdown from '../components/suggestions/SuggestionVoteBreakdown';
import { downloadCsv, csvFilename } from '../utils/csvExport';
import {
  isHROrAdmin,
  SUGGESTION_STATUSES,
  SUGGESTION_PRIORITIES,
  getSuggestionStatusColor,
  getSuggestionPriorityColor,
  formatStatusLabel,
  getAgingLabel,
  getAgingColor,
  getAssigneeDisplayName,
} from '../config/hrPanelConfig';

const PAGE_SIZE = 12;
const EMPTY_FILTERS = { status: '', priority: '', category: '', suggestion_type: '', assignee: '', search: '' };

const QUICK_FILTERS = [
  { key: 'open', label: 'Open', filter: { status: 'open' } },
  { key: 'in_progress', label: 'In Progress', filter: { status: 'in_progress' } },
  { key: 'high_votes', label: 'Top Voted', filter: { __sort: 'votes' } },
  { key: 'unassigned', label: 'Unassigned', filter: { assignee: '__unassigned__' } },
];

const SuggestionsInbox = () => {
  const { userProfile } = useAuth();
  const { success, error: showError } = useToast();

  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [displayMode, setDisplayMode] = useState('table');
  const [page, setPage] = useState(1);
  const [activeQuickFilter, setActiveQuickFilter] = useState(null);
  const [sortByVotes, setSortByVotes] = useState(false);
  const [hrStaff, setHrStaff] = useState([]);
  const [voteBreakdown, setVoteBreakdown] = useState({ support: [], against: [] });
  const [voteBreakdownLoading, setVoteBreakdownLoading] = useState(false);
  const [voteBreakdownError, setVoteBreakdownError] = useState(null);

  const role = userProfile?.role;
  const canAccess = isHROrAdmin(role);

  useEffect(() => {
    if (userProfile && canAccess) {
      fetchData();
      hrPanelApi.getHRStaff().then(setHrStaff);
    }
  }, [filters, userProfile, canAccess]);

  useEffect(() => {
    if (!selected?.id) {
      setVoteBreakdown({ support: [], against: [] });
      setVoteBreakdownError(null);
      return;
    }

    let cancelled = false;

    const loadBreakdown = async () => {
      setVoteBreakdownLoading(true);
      setVoteBreakdownError(null);
      try {
        const data = await suggestionsApi.getSuggestionVoteBreakdown(selected.id);
        if (!cancelled) setVoteBreakdown(data);
      } catch (error) {
        if (!cancelled) {
          const msg = error.message || '';
          if (msg.includes('get_suggestion_vote_breakdown') || msg.includes('Could not find the function')) {
            setVoteBreakdownError('Vote breakdown requires add_suggestion_vote_breakdown_hr.sql to be run in Supabase.');
          } else {
            setVoteBreakdownError(msg || 'Failed to load vote breakdown');
          }
          setVoteBreakdown({ support: [], against: [] });
        }
      } finally {
        if (!cancelled) setVoteBreakdownLoading(false);
      }
    };

    loadBreakdown();
    return () => { cancelled = true; };
  }, [selected?.id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const { __sort, assignee, ...apiFilters } = filters;
      const data = await suggestionsApi.getAllSuggestionsForInbox(apiFilters);
      setSuggestions(data);
      setSortByVotes(__sort === 'votes');
      setPage(1);
    } catch (error) {
      console.error('Error fetching suggestions inbox:', error);
      showError(error.message || 'Failed to fetch suggestions');
    } finally {
      setLoading(false);
    }
  };

  const sortedSuggestions = useMemo(() => {
    let list = suggestions;
    if (filters.assignee === '__unassigned__') {
      list = list.filter((s) => !s.assigned_to);
    }
    if (!sortByVotes) return list;
    return [...list].sort(
      (a, b) => (b.upvotes || 0) - (a.upvotes || 0) || new Date(b.created_at) - new Date(a.created_at)
    );
  }, [suggestions, sortByVotes, filters.assignee]);

  const pagedSuggestions = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return sortedSuggestions.slice(start, start + PAGE_SIZE);
  }, [sortedSuggestions, page]);

  const totalPages = Math.max(1, Math.ceil(sortedSuggestions.length / PAGE_SIZE));

  const stats = useMemo(() => ({
    total: sortedSuggestions.length,
    open: sortedSuggestions.filter((s) => s.status === 'open').length,
    inProgress: sortedSuggestions.filter((s) => s.status === 'in_progress').length,
    implemented: sortedSuggestions.filter((s) => s.status === 'implemented').length,
  }), [sortedSuggestions]);

  const handleStatusChange = async (id, newStatus) => {
    try {
      const updated = await suggestionsApi.updateSuggestionStatus(id, newStatus);
      setSuggestions((prev) => prev.map((s) => (s.id === id ? updated : s)));
      if (selected?.id === id) setSelected(updated);
      success('Status updated');
    } catch {
      showError('Failed to update status');
    }
  };

  const handleAssignUser = async (suggestionId, userId) => {
    try {
      const staff = hrStaff.find((s) => String(s.id) === String(userId));
      const updated = await suggestionsApi.assignSuggestionToUser(
        suggestionId,
        userId || null,
        staff?.full_name || null
      );
      setSuggestions((prev) => prev.map((s) => (s.id === suggestionId ? updated : s)));
      if (selected?.id === suggestionId) setSelected(updated);
      success(userId ? 'Assignee updated' : 'Assignee cleared');
    } catch {
      showError('Failed to assign HR owner');
    }
  };

  const exportToCsv = () => {
    downloadCsv(csvFilename('suggestions-inbox'), sortedSuggestions, [
      { label: 'Title', key: 'title' },
      { label: 'Status', key: 'status', getValue: (r) => formatStatusLabel(r.status) },
      { label: 'Priority', key: 'priority' },
      { label: 'Category', key: 'category' },
      { label: 'Type', key: 'suggestion_type' },
      { label: 'Submitter', getValue: (r) => (r.anonymous ? 'Anonymous' : r.suggester_name) },
      { label: 'Assigned HR', getValue: (r) => getAssigneeDisplayName(r) || 'Unassigned' },
      { label: 'Upvotes', key: 'upvotes' },
      { label: 'Downvotes', key: 'downvotes' },
      { label: 'Created', getValue: (r) => new Date(r.created_at).toLocaleString() },
      { label: 'Description', key: 'description' },
    ]);
    success('CSV exported');
  };

  const applyQuickFilter = (quick) => {
    if (activeQuickFilter === quick.key) {
      setActiveQuickFilter(null);
      setSortByVotes(false);
      setFilters(EMPTY_FILTERS);
      return;
    }
    setActiveQuickFilter(quick.key);
    if (quick.filter.__sort) {
      setFilters({ ...EMPTY_FILTERS, __sort: 'votes' });
    } else {
      setSortByVotes(false);
      setFilters({ ...EMPTY_FILTERS, ...quick.filter });
    }
  };

  if (!userProfile) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-purple-500" />
      </div>
    );
  }

  if (!canAccess) {
    return <Navigate to="/suggestions" replace />;
  }

  return (
    <div
      className="min-h-screen p-4 md:p-6 transition-colors duration-300"
      style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
    >
      <div className="max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div
                className="p-3.5 rounded-2xl"
                style={{
                  background: 'linear-gradient(135deg, #a855f7 0%, #6366f1 100%)',
                  boxShadow: '0 4px 14px rgba(168, 85, 247, 0.35)',
                }}
              >
                <Inbox className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                  Suggestions Inbox
                </h1>
                <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  Review, prioritize, and implement employee ideas
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={exportToCsv}
                disabled={sortedSuggestions.length === 0}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-colors disabled:opacity-50"
                style={{ borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}
              >
                <Download className="w-4 h-4" />
                Export CSV
              </button>
              <button
                type="button"
                onClick={fetchData}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-colors"
                style={{ borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <div className="inline-flex rounded-xl p-1" style={{ background: 'var(--bg-tertiary)' }}>
                <button
                  type="button"
                  onClick={() => setDisplayMode('table')}
                  className={`p-2 rounded-lg transition-colors ${displayMode === 'table' ? 'bg-purple-500 text-white shadow' : ''}`}
                  style={displayMode !== 'table' ? { color: 'var(--text-muted)' } : undefined}
                >
                  <Table2 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setDisplayMode('list')}
                  className={`p-2 rounded-lg transition-colors ${displayMode === 'list' ? 'bg-purple-500 text-white shadow' : ''}`}
                  style={displayMode !== 'list' ? { color: 'var(--text-muted)' } : undefined}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total', value: stats.total, icon: Lightbulb, accent: '#a855f7' },
            { label: 'Open', value: stats.open, icon: Clock, accent: '#3b82f6' },
            { label: 'In Progress', value: stats.inProgress, icon: Zap, accent: '#f59e0b' },
            { label: 'Implemented', value: stats.implemented, icon: CheckCircle, accent: '#22c55e' },
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
                  <p className="text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>{stat.label}</p>
                  <p className="text-2xl font-bold mt-1" style={{ color: 'var(--text-primary)' }}>{stat.value}</p>
                </div>
                <div className="p-2.5 rounded-xl" style={{ background: `${stat.accent}18` }}>
                  <stat.icon className="w-5 h-5" style={{ color: stat.accent }} />
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Filters */}
        <div
          className="rounded-2xl border p-4 mb-4 space-y-4"
          style={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)' }}
        >
          <div className="flex flex-wrap gap-2">
            {QUICK_FILTERS.map((q) => (
              <button
                key={q.key}
                type="button"
                onClick={() => applyQuickFilter(q)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                  activeQuickFilter === q.key ? 'bg-purple-500 text-white border-purple-500' : 'border-gray-300 dark:border-gray-600'
                }`}
                style={activeQuickFilter !== q.key ? { color: 'var(--text-muted)' } : undefined}
              >
                {q.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="relative lg:col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Search title, description, submitter..."
                value={filters.search}
                onChange={(e) => { setActiveQuickFilter(null); setFilters({ ...filters, search: e.target.value }); }}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm"
                style={{ borderColor: 'var(--border-primary)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
              />
            </div>
            <select
              value={filters.status}
              onChange={(e) => { setActiveQuickFilter(null); setFilters({ ...filters, status: e.target.value }); }}
              className="px-3 py-2.5 rounded-xl border text-sm"
              style={{ borderColor: 'var(--border-primary)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
            >
              <option value="">All Status</option>
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
              <option value="">All Priority</option>
              {SUGGESTION_PRIORITIES.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
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
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => { setFilters(EMPTY_FILTERS); setActiveQuickFilter(null); setSortByVotes(false); }}
              className="text-sm font-medium text-purple-600 hover:text-purple-700"
            >
              Clear filters
            </button>
          </div>
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
          ) : sortedSuggestions.length === 0 ? (
            <div className="py-20 text-center px-4">
              <Sparkles className="w-14 h-14 mx-auto mb-4 opacity-30" />
              <h3 className="text-lg font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>No suggestions yet</h3>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Employee ideas will appear here for review.</p>
            </div>
          ) : displayMode === 'table' ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: 'var(--bg-tertiary)', borderBottom: '1px solid var(--border-primary)' }}>
                    {['Suggestion', 'Status', 'Votes', 'Assignee', 'Submitter', 'Age', ''].map((h) => (
                      <th key={h} className="text-left py-3 px-4 font-semibold" style={{ color: 'var(--text-muted)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pagedSuggestions.map((s) => {
                    const aging = getAgingLabel(s.created_at, s.status);
                    const netVotes = (s.upvotes || 0) - (s.downvotes || 0);
                    return (
                      <tr
                        key={s.id}
                        className="border-b cursor-pointer hover:opacity-90 transition-opacity"
                        style={{ borderColor: 'var(--border-primary)' }}
                        onClick={() => setSelected(s)}
                      >
                        <td className="py-3 px-4 max-w-xs">
                          <p className="font-medium line-clamp-1" style={{ color: 'var(--text-primary)' }}>{s.title}</p>
                          <p className="text-xs line-clamp-1 mt-0.5" style={{ color: 'var(--text-muted)' }}>{s.category}</p>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full border ${getSuggestionStatusColor(s.status)}`}>
                            {formatStatusLabel(s.status)}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center gap-1 text-emerald-600">
                            <ThumbsUp className="w-3 h-3" />{s.upvotes || 0}
                          </span>
                          <span className="mx-1 text-gray-300">/</span>
                          <span className="inline-flex items-center gap-1 text-red-500">
                            <ThumbsDown className="w-3 h-3" />{s.downvotes || 0}
                          </span>
                          {netVotes > 0 && (
                            <span className="ml-2 text-xs text-purple-600 font-medium">+{netVotes}</span>
                          )}
                        </td>
                        <td className="py-3 px-4" style={{ color: 'var(--text-muted)' }}>
                          {getAssigneeDisplayName(s) || '—'}
                        </td>
                        <td className="py-3 px-4" style={{ color: 'var(--text-muted)' }}>
                          {s.anonymous ? 'Anonymous' : s.suggester_name}
                        </td>
                        <td className="py-3 px-4">
                          {aging && (
                            <span className={`px-2 py-0.5 text-xs rounded-full border ${getAgingColor(s.created_at, s.status)}`}>{aging}</span>
                          )}
                        </td>
                        <td className="py-3 px-4"><Eye className="w-4 h-4" style={{ color: 'var(--text-muted)' }} /></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-4 space-y-3">
              {pagedSuggestions.map((s, index) => (
                <motion.div
                  key={s.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="rounded-xl border p-4 cursor-pointer hover:shadow-md transition-shadow"
                  style={{ borderColor: 'var(--border-primary)' }}
                  onClick={() => setSelected(s)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <h3 className="font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{s.title}</h3>
                        <span className={`px-2 py-0.5 text-xs font-semibold rounded-full border ${getSuggestionStatusColor(s.status)}`}>
                          {formatStatusLabel(s.status)}
                        </span>
                      </div>
                      <p className="text-sm line-clamp-2 mb-2" style={{ color: 'var(--text-muted)' }}>{s.description}</p>
                      <div className="flex flex-wrap gap-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                        <span className="inline-flex items-center gap-1"><Tag className="w-3 h-3" />{s.category}</span>
                        <span className="inline-flex items-center gap-1 text-emerald-600"><ThumbsUp className="w-3 h-3" />{s.upvotes || 0}</span>
                        <span className="inline-flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(s.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          <div className="px-4 pb-4">
            <PaginationControls
              page={page}
              totalPages={totalPages}
              totalItems={sortedSuggestions.length}
              pageSize={PAGE_SIZE}
              onPageChange={setPage}
            />
          </div>
        </div>
      </div>

      {/* Detail modal */}
      <AnimatePresence>
        {selected && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto border"
              style={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)' }}
            >
              <div className="p-6 border-b flex items-start justify-between gap-4" style={{ borderColor: 'var(--border-primary)' }}>
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Lightbulb className="w-5 h-5 text-purple-500" />
                    <span className={`px-2 py-0.5 text-xs font-semibold rounded-full border ${getSuggestionStatusColor(selected.status)}`}>
                      {formatStatusLabel(selected.status)}
                    </span>
                    <span className={`px-2 py-0.5 text-xs font-semibold rounded-full border ${getSuggestionPriorityColor(selected.priority)}`}>
                      {selected.priority}
                    </span>
                  </div>
                  <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{selected.title}</h2>
                  <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>{selected.category}</p>
                </div>
                <button type="button" onClick={() => setSelected(null)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                  <XCircle className="w-5 h-5" style={{ color: 'var(--text-muted)' }} />
                </button>
              </div>

              <div className="p-6 space-y-5">
                <div className="rounded-xl p-4" style={{ background: 'var(--bg-tertiary)' }}>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--text-primary)' }}>{selected.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Submitted by</p>
                    <p style={{ color: 'var(--text-primary)' }}>{selected.anonymous ? 'Anonymous' : selected.suggester_name}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Type</p>
                    <p style={{ color: 'var(--text-primary)' }}>
                      {selected.suggestion_type === 'user_specific'
                        ? `For: ${selected.target_user_name || 'Unknown'}`
                        : 'General (organization-wide)'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Submitted</p>
                    <p style={{ color: 'var(--text-primary)' }}>{new Date(selected.created_at).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>HR owner</p>
                    <p style={{ color: 'var(--text-primary)' }}>
                      {getAssigneeDisplayName(selected) || 'Unassigned'}
                    </p>
                  </div>
                </div>

                <SuggestionVotePoll
                  upvotes={selected.upvotes}
                  downvotes={selected.downvotes}
                  readOnly
                />

                <SuggestionVoteBreakdown
                  support={voteBreakdown.support}
                  against={voteBreakdown.against}
                  loading={voteBreakdownLoading}
                  error={voteBreakdownError}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Update status</label>
                    <select
                      value={selected.status}
                      onChange={(e) => handleStatusChange(selected.id, e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border text-sm"
                      style={{ borderColor: 'var(--border-primary)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                    >
                      {SUGGESTION_STATUSES.map((s) => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>
                      <UserCheck className="w-3 h-3 inline mr-1" />
                      Assign HR owner
                    </label>
                    <select
                      value={selected.assigned_to || ''}
                      onChange={(e) => handleAssignUser(selected.id, e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border text-sm"
                      style={{ borderColor: 'var(--border-primary)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                    >
                      <option value="">Unassigned</option>
                      {hrStaff.map((staff) => (
                        <option key={staff.id} value={staff.id}>{staff.full_name} ({staff.role})</option>
                      ))}
                    </select>
                  </div>
                </div>

                <HRCommentThread entityType="suggestion" entityId={selected.id} />

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelected(null)}
                    className="px-4 py-2 rounded-xl border text-sm font-medium"
                    style={{ borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}
                  >
                    Close
                  </button>
                  {selected.status !== 'implemented' && (
                    <button
                      type="button"
                      onClick={() => handleStatusChange(selected.id, 'implemented')}
                      className="px-4 py-2 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-medium"
                    >
                      Mark Implemented
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SuggestionsInbox;
