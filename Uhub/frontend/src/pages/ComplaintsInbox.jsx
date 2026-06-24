import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Navigate } from 'react-router-dom';
import {
  Inbox, Search, AlertTriangle, CheckCircle, Clock, Eye,
  RefreshCw, Loader2, Shield, EyeOff, User, Calendar, Building,
  XCircle, List, Table2, Zap, Download, UserCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { complaintsApi } from '../services/complaintsApi';
import { hrPanelApi } from '../services/hrPanelApi';
import PaginationControls from '../components/ui/PaginationControls';
import HRCommentThread from '../components/hr/HRCommentThread';
import { downloadCsv, csvFilename } from '../utils/csvExport';
import {
  isHROrAdmin,
  COMPLAINT_CATEGORIES,
  CONCERN_CATEGORY_FILTER,
  COMPLAINT_DEPARTMENTS,
  COMPLAINT_PRIORITIES,
  COMPLAINT_STATUSES,
  getComplaintStatusColor,
  getComplaintPriorityColor,
  formatStatusLabel,
  getAgingLabel,
  getAgingColor,
  getAssigneeDisplayName,
} from '../config/hrPanelConfig';

const PAGE_SIZE = 12;
const EMPTY_FILTERS = { status: '', priority: '', category: '', department: '', assignee: '', search: '' };

const QUICK_FILTERS = [
  { key: 'open', label: 'Open', filter: { status: 'open' } },
  { key: 'urgent', label: 'Urgent', filter: { priority: 'urgent' } },
  { key: 'unassigned', label: 'Unassigned', filter: { assignee: '__unassigned__' } },
];

const ComplaintsInbox = () => {
  const { userProfile } = useAuth();
  const { success, error: showError } = useToast();

  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [viewMode, setViewMode] = useState('all_complaints');
  const [displayMode, setDisplayMode] = useState('table');
  const [page, setPage] = useState(1);
  const [activeQuickFilter, setActiveQuickFilter] = useState(null);
  const [hrStaff, setHrStaff] = useState([]);

  const role = userProfile?.role;
  const canAccess = isHROrAdmin(role);

  useEffect(() => {
    if (userProfile && canAccess) {
      fetchData();
      hrPanelApi.getHRStaff().then(setHrStaff);
    }
  }, [filters, viewMode, userProfile, canAccess]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const { department, assignee, ...apiFilters } = filters;
      if (department && department !== '__unassigned__') {
        apiFilters.department = department;
      }
      let data;
      if (viewMode === 'all_complaints') {
        data = await complaintsApi.getAllComplaintsForInbox(apiFilters);
      } else {
        data = await complaintsApi.getComplaintsByCategories(apiFilters, CONCERN_CATEGORY_FILTER);
      }
      setComplaints(data);
      setPage(1);
    } catch (error) {
      console.error('Error fetching complaints inbox:', error);
      showError(error.message || 'Failed to fetch complaints');
    } finally {
      setLoading(false);
    }
  };

  const filteredComplaints = useMemo(() => {
    if (filters.assignee === '__unassigned__') {
      return complaints.filter((c) => !c.assigned_to);
    }
    if (filters.department === '__unassigned__') {
      return complaints.filter((c) => !c.assigned_department);
    }
    return complaints;
  }, [complaints, filters.assignee, filters.department]);

  const pagedComplaints = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredComplaints.slice(start, start + PAGE_SIZE);
  }, [filteredComplaints, page]);

  const totalPages = Math.max(1, Math.ceil(filteredComplaints.length / PAGE_SIZE));

  const stats = useMemo(() => ({
    total: filteredComplaints.length,
    open: filteredComplaints.filter((c) => c.status === 'open').length,
    resolved: filteredComplaints.filter((c) => c.status === 'resolved').length,
    urgent: filteredComplaints.filter((c) => c.priority === 'urgent').length,
  }), [filteredComplaints]);

  const handleStatusChange = async (complaintId, newStatus) => {
    try {
      const updated = await complaintsApi.updateComplaintStatus(complaintId, newStatus);
      setComplaints((prev) => prev.map((c) => (c.id === complaintId ? updated : c)));
      if (selectedComplaint?.id === complaintId) setSelectedComplaint(updated);
      success('Status updated');
    } catch {
      showError('Failed to update status');
    }
  };

  const handlePriorityChange = async (complaintId, newPriority) => {
    try {
      const updated = await complaintsApi.updateComplaintPriority(complaintId, newPriority);
      setComplaints((prev) => prev.map((c) => (c.id === complaintId ? updated : c)));
      if (selectedComplaint?.id === complaintId) setSelectedComplaint(updated);
      success('Priority updated');
    } catch {
      showError('Failed to update priority');
    }
  };

  const handleAssignDepartment = async (complaintId, department) => {
    try {
      const updated = await complaintsApi.assignComplaintToDepartment(complaintId, department);
      setComplaints((prev) => prev.map((c) => (c.id === complaintId ? updated : c)));
      if (selectedComplaint?.id === complaintId) setSelectedComplaint(updated);
      success('Department assigned');
    } catch {
      showError('Failed to assign department');
    }
  };

  const handleAssignUser = async (complaintId, userId) => {
    try {
      const staff = hrStaff.find((s) => String(s.id) === String(userId));
      const updated = await complaintsApi.assignComplaintToUser(
        complaintId,
        userId || null,
        staff?.full_name || null
      );
      setComplaints((prev) => prev.map((c) => (c.id === complaintId ? updated : c)));
      if (selectedComplaint?.id === complaintId) setSelectedComplaint(updated);
      success(userId ? 'Assignee updated' : 'Assignee cleared');
    } catch {
      showError('Failed to assign HR owner');
    }
  };

  const exportToCsv = () => {
    downloadCsv(csvFilename('complaints-inbox'), filteredComplaints, [
      { label: 'Title', key: 'title' },
      { label: 'Status', key: 'status', getValue: (r) => formatStatusLabel(r.status) },
      { label: 'Priority', key: 'priority' },
      { label: 'Category', key: 'category' },
      { label: 'Complainant', getValue: (r) => (r.anonymous ? 'Anonymous' : r.complainant_name) },
      { label: 'Department', key: 'complainant_department' },
      { label: 'Assigned HR', getValue: (r) => getAssigneeDisplayName(r) || 'Unassigned' },
      { label: 'Assigned Dept', key: 'assigned_department' },
      { label: 'Created', getValue: (r) => new Date(r.created_at).toLocaleString() },
      { label: 'Description', key: 'description' },
    ]);
    success('CSV exported');
  };

  const applyQuickFilter = (quick) => {
    if (activeQuickFilter === quick.key) {
      setActiveQuickFilter(null);
      setFilters(EMPTY_FILTERS);
      return;
    }
    setActiveQuickFilter(quick.key);
    setFilters({ ...EMPTY_FILTERS, ...quick.filter });
  };

  if (!userProfile) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-red-500" />
      </div>
    );
  }

  if (!canAccess) {
    return <Navigate to="/complaints" replace />;
  }

  return (
    <div
      className="min-h-screen p-4 md:p-6 transition-colors duration-300"
      style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div
                className="p-3.5 rounded-2xl"
                style={{
                  background: 'linear-gradient(135deg, #ef4444 0%, #ec4899 100%)',
                  boxShadow: '0 4px 14px rgba(239, 68, 68, 0.35)',
                }}
              >
                <Inbox className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                  Complaints Inbox
                </h1>
                <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  Triage and manage all employee complaints
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={exportToCsv}
                disabled={filteredComplaints.length === 0}
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
              <div
                className="inline-flex rounded-xl p-1"
                style={{ background: 'var(--bg-tertiary)' }}
              >
                <button
                  type="button"
                  onClick={() => setDisplayMode('table')}
                  className={`p-2 rounded-lg transition-colors ${displayMode === 'table' ? 'bg-red-500 text-white shadow' : ''}`}
                  style={displayMode !== 'table' ? { color: 'var(--text-muted)' } : undefined}
                  title="Table view"
                >
                  <Table2 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setDisplayMode('list')}
                  className={`p-2 rounded-lg transition-colors ${displayMode === 'list' ? 'bg-red-500 text-white shadow' : ''}`}
                  style={displayMode !== 'list' ? { color: 'var(--text-muted)' } : undefined}
                  title="List view"
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
            { label: viewMode === 'all_complaints' ? 'Total' : 'Concerns', value: stats.total, icon: AlertTriangle, accent: '#ef4444' },
            { label: 'Open', value: stats.open, icon: Clock, accent: '#3b82f6' },
            { label: 'Resolved', value: stats.resolved, icon: CheckCircle, accent: '#22c55e' },
            { label: 'Urgent', value: stats.urgent, icon: Zap, accent: '#f97316' },
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

        {/* View mode + quick filters */}
        <div
          className="rounded-2xl border p-4 mb-4 space-y-4"
          style={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)' }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="inline-flex rounded-xl p-1" style={{ background: 'var(--bg-tertiary)' }}>
              {[
                { id: 'all_complaints', label: 'All Complaints' },
                { id: 'all_concerns', label: 'Sensitive Concerns' },
              ].map((mode) => (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => { setViewMode(mode.id); setActiveQuickFilter(null); setFilters(EMPTY_FILTERS); }}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    viewMode === mode.id ? 'bg-red-500 text-white shadow-md' : ''
                  }`}
                  style={viewMode !== mode.id ? { color: 'var(--text-muted)' } : undefined}
                >
                  {mode.label}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              {QUICK_FILTERS.map((q) => (
                <button
                  key={q.key}
                  type="button"
                  onClick={() => applyQuickFilter(q)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                    activeQuickFilter === q.key
                      ? 'bg-red-500 text-white border-red-500'
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                  style={activeQuickFilter !== q.key ? { color: 'var(--text-muted)' } : undefined}
                >
                  {q.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="relative lg:col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Search title, description, complainant..."
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
              {COMPLAINT_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
            <select
              value={filters.priority}
              onChange={(e) => { setActiveQuickFilter(null); setFilters({ ...filters, priority: e.target.value }); }}
              className="px-3 py-2.5 rounded-xl border text-sm"
              style={{ borderColor: 'var(--border-primary)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
            >
              <option value="">All Priority</option>
              {COMPLAINT_PRIORITIES.map((p) => (
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
              {COMPLAINT_CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => { setFilters(EMPTY_FILTERS); setActiveQuickFilter(null); }}
              className="text-sm font-medium text-red-600 hover:text-red-700"
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
              <Loader2 className="w-10 h-10 animate-spin mx-auto mb-3 text-red-500" />
              <p style={{ color: 'var(--text-muted)' }}>Loading inbox...</p>
            </div>
          ) : filteredComplaints.length === 0 ? (
            <div className="py-20 text-center px-4">
              <Inbox className="w-14 h-14 mx-auto mb-4 opacity-30" />
              <h3 className="text-lg font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>Inbox is clear</h3>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                No complaints match your current filters.
              </p>
            </div>
          ) : displayMode === 'table' ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: 'var(--bg-tertiary)', borderBottom: '1px solid var(--border-primary)' }}>
                    {['Complaint', 'Status', 'Priority', 'Assignee', 'Complainant', 'Age', ''].map((h) => (
                      <th key={h} className="text-left py-3 px-4 font-semibold" style={{ color: 'var(--text-muted)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pagedComplaints.map((complaint) => {
                    const aging = getAgingLabel(complaint.created_at, complaint.status);
                    return (
                      <tr
                        key={complaint.id}
                        className="border-b cursor-pointer hover:opacity-90 transition-opacity"
                        style={{ borderColor: 'var(--border-primary)' }}
                        onClick={() => setSelectedComplaint(complaint)}
                      >
                        <td className="py-3 px-4 max-w-xs">
                          <p className="font-medium line-clamp-1" style={{ color: 'var(--text-primary)' }}>{complaint.title}</p>
                          <p className="text-xs line-clamp-1 mt-0.5" style={{ color: 'var(--text-muted)' }}>{complaint.description}</p>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full border ${getComplaintStatusColor(complaint.status)}`}>
                            {formatStatusLabel(complaint.status)}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full border ${getComplaintPriorityColor(complaint.priority)}`}>
                            {complaint.priority}
                          </span>
                        </td>
                        <td className="py-3 px-4" style={{ color: 'var(--text-muted)' }}>
                          {getAssigneeDisplayName(complaint) || '—'}
                        </td>
                        <td className="py-3 px-4" style={{ color: 'var(--text-muted)' }}>
                          {complaint.anonymous ? 'Anonymous' : complaint.complainant_name}
                        </td>
                        <td className="py-3 px-4">
                          {aging && (
                            <span className={`px-2 py-0.5 text-xs rounded-full border ${getAgingColor(complaint.created_at, complaint.status)}`}>
                              {aging}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <Eye className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-4 space-y-3">
              {pagedComplaints.map((complaint, index) => (
                <motion.div
                  key={complaint.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="rounded-xl border p-4 cursor-pointer hover:shadow-md transition-shadow"
                  style={{ borderColor: 'var(--border-primary)' }}
                  onClick={() => setSelectedComplaint(complaint)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <h3 className="font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{complaint.title}</h3>
                        <span className={`px-2 py-0.5 text-xs font-semibold rounded-full border ${getComplaintStatusColor(complaint.status)}`}>
                          {formatStatusLabel(complaint.status)}
                        </span>
                        <span className={`px-2 py-0.5 text-xs font-semibold rounded-full border ${getComplaintPriorityColor(complaint.priority)}`}>
                          {complaint.priority}
                        </span>
                      </div>
                      <p className="text-sm line-clamp-2 mb-2" style={{ color: 'var(--text-muted)' }}>{complaint.description}</p>
                      <div className="flex flex-wrap gap-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                        <span className="inline-flex items-center gap-1"><Building className="w-3 h-3" />{complaint.category}</span>
                        <span className="inline-flex items-center gap-1">
                          {complaint.anonymous ? <><EyeOff className="w-3 h-3" />Anonymous</> : <><User className="w-3 h-3" />{complaint.complainant_name}</>}
                        </span>
                        <span className="inline-flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(complaint.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <Eye className="w-4 h-4 flex-shrink-0 mt-1" style={{ color: 'var(--text-muted)' }} />
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          <div className="px-4 pb-4">
            <PaginationControls
              page={page}
              totalPages={totalPages}
              totalItems={filteredComplaints.length}
              pageSize={PAGE_SIZE}
              onPageChange={setPage}
            />
          </div>
        </div>
      </div>

      {/* Detail modal */}
      <AnimatePresence>
        {selectedComplaint && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto border"
              style={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b flex items-start justify-between gap-4" style={{ borderColor: 'var(--border-primary)' }}>
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="w-5 h-5 text-red-500" />
                    <span className={`px-2 py-0.5 text-xs font-semibold rounded-full border ${getComplaintStatusColor(selectedComplaint.status)}`}>
                      {formatStatusLabel(selectedComplaint.status)}
                    </span>
                    <span className={`px-2 py-0.5 text-xs font-semibold rounded-full border ${getComplaintPriorityColor(selectedComplaint.priority)}`}>
                      {selectedComplaint.priority}
                    </span>
                  </div>
                  <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{selectedComplaint.title}</h2>
                  <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>{selectedComplaint.category}</p>
                </div>
                <button type="button" onClick={() => setSelectedComplaint(null)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                  <XCircle className="w-5 h-5" style={{ color: 'var(--text-muted)' }} />
                </button>
              </div>

              <div className="p-6 space-y-5">
                <div className="rounded-xl p-4" style={{ background: 'var(--bg-tertiary)' }}>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--text-primary)' }}>{selectedComplaint.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Complainant</p>
                    <p style={{ color: 'var(--text-primary)' }}>
                      {selectedComplaint.anonymous ? 'Anonymous' : selectedComplaint.complainant_name}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Department</p>
                    <p style={{ color: 'var(--text-primary)' }}>{selectedComplaint.complainant_department || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Submitted</p>
                    <p style={{ color: 'var(--text-primary)' }}>{new Date(selectedComplaint.created_at).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>HR owner</p>
                    <p style={{ color: 'var(--text-primary)' }}>
                      {getAssigneeDisplayName(selectedComplaint) || 'Unassigned'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Dept. routing</p>
                    <p style={{ color: 'var(--text-primary)' }}>{selectedComplaint.assigned_department || 'Unassigned'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Status</label>
                    <select
                      value={selectedComplaint.status}
                      onChange={(e) => handleStatusChange(selectedComplaint.id, e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border text-sm"
                      style={{ borderColor: 'var(--border-primary)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                    >
                      {COMPLAINT_STATUSES.map((s) => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Priority</label>
                    <select
                      value={selectedComplaint.priority}
                      onChange={(e) => handlePriorityChange(selectedComplaint.id, e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border text-sm"
                      style={{ borderColor: 'var(--border-primary)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                    >
                      {COMPLAINT_PRIORITIES.map((p) => (
                        <option key={p.value} value={p.value}>{p.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>
                      <UserCheck className="w-3 h-3 inline mr-1" />
                      Assign HR owner
                    </label>
                    <select
                      value={selectedComplaint.assigned_to || ''}
                      onChange={(e) => handleAssignUser(selectedComplaint.id, e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border text-sm"
                      style={{ borderColor: 'var(--border-primary)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                    >
                      <option value="">Unassigned</option>
                      {hrStaff.map((s) => (
                        <option key={s.id} value={s.id}>{s.full_name} ({s.role})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Assign dept.</label>
                    <select
                      value={selectedComplaint.assigned_department || ''}
                      onChange={(e) => handleAssignDepartment(selectedComplaint.id, e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border text-sm"
                      style={{ borderColor: 'var(--border-primary)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                    >
                      <option value="">Unassigned</option>
                      {COMPLAINT_DEPARTMENTS.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <HRCommentThread entityType="complaint" entityId={selectedComplaint.id} />

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedComplaint(null)}
                    className="px-4 py-2 rounded-xl border text-sm font-medium"
                    style={{ borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}
                  >
                    Close
                  </button>
                  {selectedComplaint.status !== 'resolved' && (
                    <button
                      type="button"
                      onClick={() => handleStatusChange(selectedComplaint.id, 'resolved')}
                      className="px-4 py-2 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-medium"
                    >
                      Mark Resolved
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

export default ComplaintsInbox;
