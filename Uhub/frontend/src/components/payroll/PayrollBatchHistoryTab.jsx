import React, { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown, ChevronUp, History, Lock, Send,
  Users, DollarSign, Calendar, Loader2, Search, Download
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { supabase } from '../../supabaseClient';
import { formatPayrollCurrency } from '../../utils/payrollConstants';
import { publishBatchToRecords } from '../../utils/payrollPublish';

export default function PayrollBatchHistoryTab({ refreshKey = 0, onPublished }) {
  const { user, userProfile } = useAuth();
  const { success, error: showError } = useToast();

  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [batchRows, setBatchRows] = useState({});
  const [loadingRows, setLoadingRows] = useState(null);
  const [publishingId, setPublishingId] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const canPublish = ['admin', 'hr_manager'].includes(userProfile?.role);

  const fetchBatches = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('payroll_batches')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBatches(data || []);
    } catch (err) {
      showError('Load failed', err.message || 'Could not load batch history.');
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    fetchBatches();
  }, [fetchBatches, refreshKey]);

  const loadBatchRows = async (batchId) => {
    if (batchRows[batchId]) {
      setExpandedId(expandedId === batchId ? null : batchId);
      return;
    }
    setLoadingRows(batchId);
    try {
      const { data, error } = await supabase
        .from('payroll_batch_rows')
        .select('*')
        .eq('batch_id', batchId)
        .order('full_name');

      if (error) throw error;
      setBatchRows((prev) => ({ ...prev, [batchId]: data || [] }));
      setExpandedId(batchId);
    } catch (err) {
      showError('Load failed', err.message || 'Could not load batch rows.');
    } finally {
      setLoadingRows(null);
    }
  };

  const handlePublish = async (batch) => {
    if (!window.confirm(
      `Publish "${batch.name}" to Payroll Records?\n\nThis creates pending records for ${batch.row_count} employee(s) for ${batch.month} ${batch.year}. Existing records for the same employee/month will be skipped.`
    )) return;

    setPublishingId(batch.id);
    try {
      let rows = batchRows[batch.id];
      if (!rows) {
        const { data, error } = await supabase
          .from('payroll_batch_rows')
          .select('*')
          .eq('batch_id', batch.id);
        if (error) throw error;
        rows = data || [];
        setBatchRows((prev) => ({ ...prev, [batch.id]: rows }));
      }

      const { data: employees, error: empErr } = await supabase
        .from('employees')
        .select('id, full_name, employee_id, department')
        .eq('status', 'active');
      if (empErr) throw empErr;

      const publisherName = userProfile?.full_name || userProfile?.email || null;

      const result = await publishBatchToRecords(
        batch,
        rows,
        employees || [],
        user?.id,
        publisherName
      );

      if (result.published === 0) {
        showError(
          'Nothing published',
          result.skipped > 0
            ? `All ${result.skipped} row(s) already have payroll records for ${batch.month} ${batch.year}.`
            : 'No rows to publish.'
        );
      } else {
        const parts = [`${result.published} record(s) published.`];
        if (result.skipped) parts.push(`${result.skipped} skipped (duplicate).`);
        if (result.unmatched) parts.push(`${result.unmatched} unmatched to employee profile.`);
        success('Published', parts.join(' '));
        onPublished?.();
      }

      await fetchBatches();
    } catch (err) {
      const msg = err.message || 'Failed to publish batch.';
      if (msg.toLowerCase().includes('relation') || msg.toLowerCase().includes('does not exist')) {
        showError('Publish failed', 'Run `alter_payrolls_for_batches.sql` and `create_payrolls_schema.sql` in Supabase.');
      } else {
        showError('Publish failed', msg);
      }
    } finally {
      setPublishingId(null);
    }
  };

  const filteredBatches = batches.filter((b) => {
    if (statusFilter === 'published' && !b.published_at) return false;
    if (statusFilter === 'unpublished' && b.published_at) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      String(b.name || '').toLowerCase().includes(q) ||
      String(b.month || '').toLowerCase().includes(q) ||
      String(b.year || '').includes(q)
    );
  });

  const historyStats = {
    batches: batches.length,
    unpublished: batches.filter((b) => !b.published_at).length,
    net: batches.reduce((sum, b) => sum + (Number(b.totals?.net) || 0), 0),
    employees: batches.reduce((sum, b) => sum + (Number(b.row_count) || 0), 0),
  };

  const exportBatchRows = (batch, rows) => {
    if (!rows?.length) {
      showError('Nothing to export', 'Open the batch rows first, then export.');
      return;
    }
    const headers = ['Employee ID', 'Full Name', 'Department', 'Gross', 'Tax', 'Deductions', 'Net'];
    const escapeCsv = (v) => {
      const s = String(v ?? '');
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const csv = [
      headers.join(','),
      ...rows.map((r) =>
        [r.employee_id, r.full_name, r.department, r.gross_salary, r.tax_amount, r.deductions, r.net_salary]
          .map(escapeCsv)
          .join(',')
      ),
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(batch.name || 'batch').replace(/\s+/g, '-')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    success('Exported', `${rows.length} row(s) exported.`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (batches.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200/70 dark:border-gray-700/60 bg-white/80 dark:bg-gray-900/60 backdrop-blur-md p-12 text-center">
        <History className="w-12 h-12 text-slate-400 mx-auto mb-4" />
        <p className="text-slate-700 dark:text-slate-200 font-medium mb-1">No saved batches yet</p>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Run payroll, save a batch, and it will appear here for review and publishing.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Batches', value: historyStats.batches, icon: History, bg: 'from-blue-500 to-indigo-600' },
          { label: 'Unpublished', value: historyStats.unpublished, icon: Send, bg: 'from-amber-500 to-orange-600' },
          { label: 'Employees in batches', value: historyStats.employees, icon: Users, bg: 'from-violet-500 to-purple-600' },
          { label: 'Combined net', value: formatPayrollCurrency(historyStats.net), icon: DollarSign, bg: 'from-emerald-500 to-teal-600' },
        ].map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-slate-200/70 dark:border-gray-700/60 bg-white/80 dark:bg-gray-900/60 p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl bg-gradient-to-br ${stat.bg} text-white`}>
                <stat.icon className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-slate-500">{stat.label}</p>
                <p className="text-lg font-bold text-slate-900 dark:text-white truncate">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search batch, month, year…"
            className="pl-9 pr-3 py-2 w-64 rounded-xl border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 rounded-xl border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm"
        >
          <option value="all">All batches</option>
          <option value="unpublished">Unpublished</option>
          <option value="published">Published</option>
        </select>
      </div>

      {filteredBatches.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-200 dark:border-gray-700 p-8 text-center text-sm text-slate-500">
          No batches match this search.
        </div>
      )}

      {filteredBatches.map((batch) => {
        const totals = batch.totals || {};
        const isExpanded = expandedId === batch.id;
        const rows = batchRows[batch.id] || [];

        return (
          <motion.div
            key={batch.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-slate-200/70 dark:border-gray-700/60 bg-white/80 dark:bg-gray-900/60 backdrop-blur-md shadow-sm overflow-hidden"
          >
            <div className="p-5">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white truncate">
                      {batch.name}
                    </h3>
                    {batch.is_locked && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-emerald-100 text-emerald-800">
                        <Lock className="w-3 h-3" /> Locked
                      </span>
                    )}
                    {batch.published_at && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                        <Send className="w-3 h-3" /> Published
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-4 text-sm text-slate-500 dark:text-slate-400">
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {batch.month} {batch.year}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {batch.row_count} employees
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <DollarSign className="w-4 h-4" />
                      Net {formatPayrollCurrency(totals.net || 0)}
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 mt-2">
                    Saved by {batch.created_by_name || 'Unknown'}
                    {batch.created_at ? ` · ${new Date(batch.created_at).toLocaleString()}` : ''}
                    {batch.published_at && batch.published_by_name
                      ? ` · Published by ${batch.published_by_name}`
                      : ''}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => loadBatchRows(batch.id)}
                    disabled={loadingRows === batch.id}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200/70 dark:border-gray-700/60 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-gray-800/60 text-sm transition"
                  >
                    {loadingRows === batch.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : isExpanded ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                    {isExpanded ? 'Hide rows' : 'View rows'}
                  </button>
                  {isExpanded && rows.length > 0 && (
                    <button
                      type="button"
                      onClick={() => exportBatchRows(batch, rows)}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-emerald-600/30 text-emerald-700 dark:text-emerald-400 text-sm"
                    >
                      <Download className="w-4 h-4" />
                      Export
                    </button>
                  )}

                  {canPublish && !batch.published_at && (
                    <button
                      type="button"
                      onClick={() => handlePublish(batch)}
                      disabled={publishingId === batch.id}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm transition disabled:opacity-60"
                    >
                      {publishingId === batch.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                      Publish to Records
                    </button>
                  )}
                </div>
              </div>
            </div>

            <AnimatePresence>
              {isExpanded && rows.length > 0 && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="border-t border-slate-200/70 dark:border-gray-700/60 overflow-hidden"
                >
                  <div className="overflow-auto max-h-80">
                    <table className="min-w-full text-sm">
                      <thead className="bg-slate-50/90 dark:bg-gray-900/90 sticky top-0">
                        <tr>
                          {['Employee', 'Department', 'Gross', 'Tax', 'Deductions', 'Net'].map((h) => (
                            <th key={h} className="text-left px-4 py-2 font-semibold text-slate-600 dark:text-slate-300">
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((row) => (
                          <tr key={row.id} className="border-t border-slate-100 dark:border-gray-800">
                            <td className="px-4 py-2 text-slate-800 dark:text-slate-200">
                              <div className="font-medium">{row.full_name}</div>
                              <div className="text-xs text-slate-400">{row.employee_id}</div>
                            </td>
                            <td className="px-4 py-2 text-slate-600 dark:text-slate-400">{row.department || '—'}</td>
                            <td className="px-4 py-2">{formatPayrollCurrency(row.gross_salary)}</td>
                            <td className="px-4 py-2">{formatPayrollCurrency(row.tax_amount)}</td>
                            <td className="px-4 py-2 text-red-600">-{formatPayrollCurrency(row.deductions)}</td>
                            <td className="px-4 py-2 font-semibold text-blue-600">{formatPayrollCurrency(row.net_salary)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}
    </div>
  );
}
